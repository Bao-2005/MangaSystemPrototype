import { useAuthStore } from '../store/authStore';
import { useSeriesStore } from '../store/seriesStore';
import { useChapterStore } from '../store/chapterStore';
import { useVotingStore } from '../store/votingStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEscalationStore } from '../store/escalationStore';
import { ROLES } from '../utils/constants';
import { calculateChapterCompletion, calculateEarnings, formatCurrency } from '../utils/calculations';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, FileText, Vote, AlertTriangle, Clock, CheckCircle, TrendingUp, Crown, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import { showToast } from '../utils/toast';

export default function DashboardPage() {
  const user = useAuthStore(s => s.currentUser);
  const { series, proposals } = useSeriesStore();
  const { chapters, tasks } = useChapterStore();
  const { decisions } = useVotingStore();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount(user.id);
  const { escalations, submitEditorResponse } = useEscalationStore();

  // Explanation Modal states for Editor
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedEscId, setSelectedEscId] = useState(null);
  const [explanationText, setExplanationText] = useState('');

  // Stats based on role
  const isMangaka = user.roles.includes(ROLES.MANGAKA);
  const isAssistant = user.roles.includes(ROLES.ASSISTANT);
  const isEditor = user.roles.includes(ROLES.TANTOU_EDITOR);
  const isBoard = user.roles.includes(ROLES.EDITORIAL_BOARD);



  const mySeries = series.filter(s => s.mangakaId === user.id);
  const myActiveSeries = mySeries.filter(s => s.status === 'Active');
  const editorSeries = series.filter(s => s.editorId === user.id);
  const myTasks = tasks.filter(t => t.assistantId === user.id);
  const myPendingTasks = myTasks.filter(t => ['Pending', 'In Progress'].includes(t.status));
  const myApprovedTasks = myTasks.filter(t => t.status === 'Approved');
  const openDecisions = decisions.filter(d => d.status === 'Open');

  // Escalations for Mangaka
  const myEscalations = escalations.filter(e => e.requestedBy === user.id || mySeries.some(s => s.id === e.seriesId));

  // Escalations/Disputes involving current Editor
  const editorEscalations = escalations.filter(e => 
    e.currentEditorId === user.id || 
    e.disputeParties?.editorId === user.id ||
    (e.type === 'No Review Response' && e.relatedUserId === user.id)
  );

  // Board Required Votes
  const requiredVotes = openDecisions.filter(d => 
    d.requiredVoters?.includes(user.id) && 
    !d.votes.some(v => v.voterId === user.id)
  );

  const isChief = user.roles.includes(ROLES.EDITOR_IN_CHIEF);

  const pendingEscalations = escalations.filter(e => e.status === 'Pending' || e.status === 'In Progress');

  const stats = [];

  if (isMangaka) {
    stats.push(
      { label: 'Active Series', value: myActiveSeries.length, icon: BookOpen, color: 'text-cyan-400', link: '/series' },
      { label: 'Chapters In Progress', value: chapters.filter(c => mySeries.some(s => s.id === c.seriesId) && ['In Progress', 'Draft'].includes(c.status)).length, icon: Layers, color: 'text-violet-400', link: '/chapters' },
      { label: 'Manuscripts Pending', value: tasks.filter(t => t.status === 'Submitted' && chapters.some(c => c.id === t.chapterId && mySeries.some(s => s.id === c.seriesId))).length, icon: Clock, color: 'text-amber-400', link: '/chapters' },
      { label: 'Proposals In Review', value: proposals.filter(p => p.mangakaId === user.id && ['Pending Review', 'Under Review'].includes(p.status)).length, icon: FileText, color: 'text-emerald-400', link: '/series' },
    );
  }
  if (isAssistant) {
    stats.push(
      { label: 'Active Tasks', value: myPendingTasks.length, icon: Layers, color: 'text-cyan-400', link: '/chapters' },
      { label: 'Completed Tasks', value: myApprovedTasks.length, icon: CheckCircle, color: 'text-emerald-400', link: '/chapters' },
      { label: 'Overdue Tasks', value: myTasks.filter(t => t.status === 'Overdue').length, icon: AlertTriangle, color: 'text-rose-400', link: '/chapters' },
      { label: 'Estimated Earnings', value: formatCurrency(calculateEarnings(myApprovedTasks.reduce((sum, t) => sum + (t.pageEnd - t.pageStart + 1), 0))), icon: TrendingUp, color: 'text-amber-400', link: null },
    );
  }
  if (isEditor) {
    stats.push(
      { label: 'My Series', value: editorSeries.length, icon: BookOpen, color: 'text-cyan-400', link: '/series' },
      { label: 'Pending Reviews', value: 2, icon: FileText, color: 'text-amber-400', link: '/manuscripts' },
      { label: 'Proposal Reviews', value: proposals.filter(p => p.assignedEditorId === user.id && !['Approved', 'Rejected'].includes(p.status)).length, icon: FileText, color: 'text-emerald-400', link: '/office/proposals' }
    );
  }
  if (isBoard) {
    stats.push(
      { label: 'Open Decisions', value: openDecisions.length, icon: Vote, color: 'text-cyan-400', link: '/voting' },
      { label: 'My Pending Votes', value: openDecisions.filter(d => !d.votes.some(v => v.voterId === user.id)).length, icon: Clock, color: 'text-amber-400', link: '/voting' },
      { label: 'Active Series Total', value: series.filter(s => s.status === 'Active').length, icon: BookOpen, color: 'text-emerald-400', link: '/ranking' },
    );
  }
  if (isChief) {
    stats.push(
      { label: 'Pending Escalations', value: pendingEscalations.length, icon: AlertTriangle, color: 'text-amber-400', link: '/chief' },
      { label: 'Open Decisions', value: openDecisions.length, icon: Vote, color: 'text-cyan-400', link: '/voting' },
      { label: 'Overdue Decisions', value: decisions.filter(d => d.status === 'Open' && new Date(d.votingDeadline + 'T23:59:59') < new Date()).length, icon: Clock, color: 'text-rose-400', link: '/voting' },
      { label: 'Actions Taken', value: 0, icon: CheckCircle, color: 'text-emerald-400', link: '/chief' },
    );
  }



  // Recent chapters for Mangaka
  const recentChapters = isMangaka
    ? chapters.filter(c => mySeries.some(s => s.id === c.seriesId)).slice(0, 5)
    : isEditor
      ? chapters.filter(c => editorSeries.some(s => s.id === c.seriesId)).slice(0, 5)
      : [];

  const handleExplanationSubmit = () => {
    if (!explanationText.trim()) {
      showToast('Please enter your explanation text', 'error');
      return;
    }
    submitEditorResponse(selectedEscId, explanationText);
    showToast('Response sent to the Editor-in-Chief successfully', 'success');
    setShowExplanationModal(false);
    setSelectedEscId(null);
    setExplanationText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No new notifications!'}
        </p>
      </div>

      {/* Chief-in-Chief urgent escalations banner */}
      {isChief && pendingEscalations.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-3">
            <Crown size={24} className="text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-amber-400">👑 {pendingEscalations.length} Pending Escalation{pendingEscalations.length > 1 ? 's' : ''} Require Your Attention</h3>
              <p className="text-xs text-text-secondary mt-1">
                There are <strong>{pendingEscalations.length}</strong> unresolved escalations waiting for your executive decision. Review them in the Chief Dashboard.
              </p>
            </div>
          </div>
          <Link to="/chief" className="btn btn-primary text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-bg-primary font-bold border-none flex-shrink-0">
            Go to Chief Dashboard →
          </Link>
        </div>
      )}

      {/* Required Voting Directive Alert for Board members */}
      {isBoard && requiredVotes.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-3">
            <Crown size={24} className="text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h3 className="text-sm font-bold text-amber-400">👑 Chief Directive — Mandatory Vote Required</h3>
              <p className="text-xs text-text-secondary mt-1">
                You have been designated as a required voter for <strong>{requiredVotes.length}</strong> decision{requiredVotes.length > 1 ? 's' : ''} to meet the quorum threshold.
              </p>
            </div>
          </div>
          <Link to="/voting" className="btn btn-primary text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-bg-primary font-bold border-none flex-shrink-0">
            Cast Your Vote →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={i} to={stat.link || '#'} className="glass-card p-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-bg-tertiary ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary mt-0.5">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent chapters */}
        {recentChapters.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-4">Chương truyện mới nhất</h2>
            <div className="space-y-3">
              {recentChapters.map(ch => {
                const chTasks = tasks.filter(t => t.chapterId === ch.id);
                const completion = calculateChapterCompletion(chTasks);
                const s = series.find(s => s.id === ch.seriesId);
                return (
                  <Link key={ch.id} to={`/chapters/${ch.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">Ch.{ch.chapterNo} — {ch.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{s?.title}</p>
                    </div>
                    <StatusBadge status={ch.status} />
                    {chTasks.length > 0 && (
                      <div className="w-24">
                        <ProgressBar value={completion} showPercent={true} color={completion === 100 ? 'success' : 'primary'} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* My tasks for Assistant */}
        {isAssistant && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-4">Nhiệm vụ của tôi</h2>
            <div className="space-y-3">
              {myTasks.filter(t => !['Approved', 'Suspended'].includes(t.status)).slice(0, 6).map(task => {
                const ch = chapters.find(c => c.id === task.chapterId);
                const s = ch ? series.find(s => s.id === ch.seriesId) : null;
                return (
                  <Link key={task.id} to={`/chapters/${task.chapterId}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">Trang {task.pageStart}-{task.pageEnd} ({task.taskType})</p>
                      <p className="text-xs text-text-muted mt-0.5">{s?.title} — Ch.{ch?.chapterNo}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Open decisions for Board members */}
        {isBoard && openDecisions.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-4 flex items-center justify-between">
              <span>Đề xuất biểu quyết</span>
              {requiredVotes.length > 0 && (
                <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded animate-pulse">
                  {requiredVotes.length} Bắt buộc!
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {openDecisions.map(d => {
                const s = series.find(s => s.id === d.seriesId);
                const hasVoted = d.votes.some(v => v.voterId === user.id);
                const isRequired = d.requiredVoters?.includes(user.id);
                return (
                  <Link 
                    key={d.id} 
                    to={d.decisionType === 'Series Approval' ? `/voting/${d.id}` : `/decisions/${d.id}`} 
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors border ${isRequired && !hasVoted ? 'border-amber-500/30 bg-amber-500/5' : 'border-transparent'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{d.decisionType}</p>
                        {isRequired && !hasVoted && (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded">BẮT BUỘC 👑</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{s?.title || d.proposalTitle || 'Chưa xác định'}</p>
                    </div>
                    <div className="text-xs text-text-secondary">
                      <span>{d.votes.filter(v => !v.isConflict).length}/3 votes</span>
                    </div>
                    {hasVoted
                      ? <span className="badge bg-emerald-500/20 text-emerald-400">Đã vote</span>
                      : <span className={`badge ${isRequired ? 'bg-rose-500/25 text-rose-300 font-bold animate-pulse' : 'bg-amber-500/20 text-amber-400'}`}>Vote ngay</span>
                    }
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Mangaka Escalations & Disputes Tracking */}
        {isMangaka && myEscalations.length > 0 && (
          <div className="glass-card p-5 border-rose-500/20 bg-rose-500/5">
            <h2 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> Khiếu nại & Tranh chấp của tôi ({myEscalations.filter(e => e.status === 'Pending' || e.status === 'In Progress').length})
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {myEscalations.map(esc => (
                <div key={esc.id} className="p-3 rounded-lg bg-bg-tertiary/40 border border-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                      {esc.type}
                    </span>
                    <StatusBadge status={esc.status} />
                  </div>
                  <p className="text-xs font-semibold text-text-primary leading-tight">{esc.title}</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{esc.description}</p>
                  
                  {esc.status === 'Resolved' && (
                    <div className="mt-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                      <strong>Phán quyết của Tổng biên tập:</strong> {esc.resolution}
                    </div>
                  )}
                  {esc.status === 'Dismissed' && (
                    <div className="mt-1 p-2 rounded bg-gray-500/10 border border-gray-500/20 text-[11px] text-text-muted">
                      <strong>Tổng biên tập bác bỏ:</strong> {esc.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor Escalated Disputes & Response Requests */}
        {isEditor && editorEscalations.length > 0 && (
          <div className="glass-card p-5 border-amber-500/20 bg-amber-500/5">
            <h2 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> Khiếu nại & Yêu cầu giải trình ({editorEscalations.filter(e => e.status === 'Pending' || e.status === 'In Progress').length})
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {editorEscalations.map(esc => (
                <div key={esc.id} className="p-3 rounded-lg bg-bg-tertiary/40 border border-border flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {esc.type}
                    </span>
                    <StatusBadge status={esc.status} />
                  </div>
                  <p className="text-xs font-semibold text-text-primary leading-tight">{esc.title}</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{esc.description}</p>
                  
                  {esc.editorResponse ? (
                    <div className="mt-1 p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-[11px]">
                      <span className="text-cyan-400 font-bold">Giải trình của bạn:</span>
                      <p className="text-text-secondary italic mt-0.5">"{esc.editorResponse}"</p>
                      <p className="text-[9px] text-text-muted mt-1 text-right">— Đã gửi: {new Date(esc.editorResponseAt).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    (esc.status === 'Pending' || esc.status === 'In Progress') && (
                      <button
                        onClick={() => {
                          setSelectedEscId(esc.id);
                          setExplanationText('');
                          setShowExplanationModal(true);
                        }}
                        className="btn btn-ghost text-[10px] py-1 px-2 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 self-end mt-1 cursor-pointer"
                      >
                        <MessageSquare size={12} className="inline mr-1" /> Gửi phản hồi giải trình
                      </button>
                    )
                  )}
                  
                  {esc.status === 'Resolved' && (
                    <div className="mt-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                      <strong>Phán quyết của Tổng biên tập:</strong> {esc.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick series overview */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold mb-4">Danh sách tác phẩm tiêu biểu</h2>
          <div className="space-y-3">
            {series.filter(s => s.status === 'Active').slice(0, 5).map(s => (
              <Link key={s.id} to={`/series/${s.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.genre} · {s.publicationType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{s.rankingScore}%</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Thứ hạng</p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Editor Explanation Modal */}
      <Modal 
        isOpen={showExplanationModal} 
        onClose={() => { setShowExplanationModal(false); setSelectedEscId(null); setExplanationText(''); }} 
        title="💬 Gửi giải trình lên Tổng biên tập" 
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
            <strong>Bảo vệ ý kiến:</strong> Bạn đang gửi văn bản phản hồi/giải trình về vấn đề khiếu nại này trực tiếp đến Tổng biên tập.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Nội dung giải trình & Minh chứng chi tiết <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-input h-32 resize-none text-xs"
              value={explanationText}
              onChange={e => setExplanationText(e.target.value)}
              placeholder="Giải trình rõ lý do chậm trễ hay bất đồng quan điểm chuyên môn của bạn..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowExplanationModal(false); setSelectedEscId(null); setExplanationText(''); }} className="btn btn-ghost flex-1">Hủy</button>
            <button onClick={handleExplanationSubmit} disabled={!explanationText.trim()} className="btn btn-primary flex-1 shadow shadow-cyan-500/15">
              Gửi giải trình
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
