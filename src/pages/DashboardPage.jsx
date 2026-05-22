import { useAuthStore } from '../store/authStore';
import { useSeriesStore } from '../store/seriesStore';
import { useChapterStore } from '../store/chapterStore';
import { useVotingStore } from '../store/votingStore';
import { useNotificationStore } from '../store/notificationStore';
import { useRankingStore } from '../store/rankingStore';
import { ROLES } from '../utils/constants';
import { calculateChapterCompletion, calculateEarnings, formatCurrency } from '../utils/calculations';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, FileText, Vote, BarChart3, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore(s => s.currentUser);
  const { series, proposals } = useSeriesStore();
  const { chapters, tasks } = useChapterStore();
  const { decisions } = useVotingStore();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount(user.id);

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

  const stats = [];

  if (isMangaka) {
    stats.push(
      { label: 'My Active Series', value: myActiveSeries.length, icon: BookOpen, color: 'text-cyan-400', link: '/series' },
      { label: 'Active Chapters', value: chapters.filter(c => mySeries.some(s => s.id === c.seriesId) && ['In Progress', 'Draft'].includes(c.status)).length, icon: Layers, color: 'text-violet-400', link: '/chapters' },
      { label: 'Pending Review', value: tasks.filter(t => t.status === 'Submitted' && chapters.some(c => c.id === t.chapterId && mySeries.some(s => s.id === c.seriesId))).length, icon: Clock, color: 'text-amber-400', link: '/chapters' },
      { label: 'Active Proposals', value: proposals.filter(p => p.mangakaId === user.id && ['Pending Review', 'Under Review'].includes(p.status)).length, icon: FileText, color: 'text-emerald-400', link: '/series' },
    );
  }
  if (isAssistant) {
    stats.push(
      { label: 'Active Tasks', value: myPendingTasks.length, icon: Layers, color: 'text-cyan-400', link: '/chapters' },
      { label: 'Completed Tasks', value: myApprovedTasks.length, icon: CheckCircle, color: 'text-emerald-400', link: '/chapters' },
      { label: 'Overdue Tasks', value: myTasks.filter(t => t.status === 'Overdue').length, icon: AlertTriangle, color: 'text-rose-400', link: '/chapters' },
      { label: 'Est. Earnings', value: formatCurrency(calculateEarnings(myApprovedTasks.reduce((sum, t) => sum + (t.pageEnd - t.pageStart + 1), 0))), icon: TrendingUp, color: 'text-amber-400', link: null },
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
      { label: 'Pending Votes', value: openDecisions.filter(d => !d.votes.some(v => v.voterId === user.id)).length, icon: Clock, color: 'text-amber-400', link: '/voting' },
      { label: 'Active Series', value: series.filter(s => s.status === 'Active').length, icon: BookOpen, color: 'text-emerald-400', link: '/ranking' },
    );
  }


  // Recent chapters for Mangaka
  const recentChapters = isMangaka
    ? chapters.filter(c => mySeries.some(s => s.id === c.seriesId)).slice(0, 5)
    : isEditor
      ? chapters.filter(c => editorSeries.some(s => s.id === c.seriesId)).slice(0, 5)
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
        </p>
      </div>

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
                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent chapters */}
        {recentChapters.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-4">Recent Chapters</h2>
            <div className="space-y-3">
              {recentChapters.map(ch => {
                const chTasks = tasks.filter(t => t.chapterId === ch.id);
                const completion = calculateChapterCompletion(chTasks);
                const s = series.find(s => s.id === ch.seriesId);
                return (
                  <Link key={ch.id} to={`/chapters/${ch.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">Ch.{ch.chapterNo} — {ch.title}</p>
                      <p className="text-xs text-text-muted">{s?.title}</p>
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
            <h2 className="text-sm font-bold mb-4">My Tasks</h2>
            <div className="space-y-3">
              {myTasks.filter(t => !['Approved', 'Suspended'].includes(t.status)).slice(0, 6).map(task => {
                const ch = chapters.find(c => c.id === task.chapterId);
                const s = ch ? series.find(s => s.id === ch.seriesId) : null;
                return (
                  <Link key={task.id} to={`/chapters/${task.chapterId}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">Pages {task.pageStart}-{task.pageEnd} ({task.taskType})</p>
                      <p className="text-xs text-text-muted">{s?.title} — Ch.{ch?.chapterNo}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Open decisions for Board */}
        {isBoard && openDecisions.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-4">Open Decisions</h2>
            <div className="space-y-3">
              {openDecisions.map(d => {
                const s = series.find(s => s.id === d.seriesId);
                const hasVoted = d.votes.some(v => v.voterId === user.id);
                return (
                  <Link key={d.id} to={d.decisionType === 'Series Approval' ? `/voting/${d.id}` : `/decisions/${d.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{d.decisionType}</p>
                      <p className="text-xs text-text-muted">{s?.title || d.proposalTitle || 'Unknown'}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-text-muted">{d.votes.length}/3 votes</span>
                    </div>
                    {hasVoted
                      ? <span className="badge bg-emerald-500/20 text-emerald-400">Voted</span>
                      : <span className="badge bg-amber-500/20 text-amber-400">Vote Now</span>
                    }
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick series overview */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold mb-4">Series Overview</h2>
          <div className="space-y-3">
            {series.filter(s => s.status === 'Active').slice(0, 5).map(s => (
              <Link key={s.id} to={`/series/${s.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                  <p className="text-xs text-text-muted">{s.genre} · {s.publicationType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{s.rankingScore}%</p>
                  <p className="text-[10px] text-text-muted">Score</p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
