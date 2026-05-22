import { useState, useEffect } from 'react';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useVotingStore } from '../../store/votingStore';
import StatusBadge from '../../components/StatusBadge';
import { Users, AlertTriangle, CheckCircle, Clock, Calendar, Mail, FileText, X } from 'lucide-react';
import { PROPOSAL_INTAKE_STATUS, STATUS_COLORS } from '../../utils/constants';
import { showToast as toast } from '../../components/Toast';

export default function OfficeAdminProposalsPage() {
  const { proposals, assignEditorToProposal, markProposalInfoComplete, addToMeetingAgenda, sendEditorReminder, escalateProposal, checkOverdueAssignments, rejectProposalAdmin, editorApproveProposal } = useSeriesStore();
  const { users, currentUser, getBoardMembers } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { createDecision } = useVotingStore();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedEditorId, setSelectedEditorId] = useState('');
  const [deadline, setDeadline] = useState('');

  // Check for overdue assignments when the page loads
  useEffect(() => {
    checkOverdueAssignments();
  }, [checkOverdueAssignments]);

  // Only Admin or Tantou Editor can access
  if (!currentUser?.roles?.includes('Admin') && !currentUser?.roles?.includes('Tantou Editor')) {
    return (
      <div className="text-center py-20 animate-in fade-in duration-300">
        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3 animate-bounce" />
        <p className="text-text-muted font-semibold text-lg">Access Denied</p>
        <p className="text-text-muted text-sm mt-1">Only Admins or Tantou Editors can access Proposal Reviews.</p>
      </div>
    );
  }

  const activeProposals = proposals.filter(p => {
    if (['Approved', 'Rejected'].includes(p.status)) return false;
    if (currentUser?.roles?.includes('Tantou Editor')) {
      return p.assignedEditorId === currentUser.id;
    }
    return true;
  });
  const tantouEditors = users.filter(u => u.roles.includes('Tantou Editor') && u.status === 'Active');

  const handleAssignClick = (proposal) => {
    setSelectedProposal(proposal);
    setSelectedEditorId(proposal.assignedEditorId || '');
    setDeadline(proposal.deadline || '');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedEditorId || !deadline) return;
    
    assignEditorToProposal(selectedProposal.id, selectedEditorId, deadline);
    toast('Editor assigned successfully', 'success');
    setShowAssignModal(false);
    setSelectedProposal(null);
  };

  const handleReviewClick = (proposal) => {
    setSelectedProposal(proposal);
    setShowReviewModal(true);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleApproveProposal = () => {
    // 1. Update proposal + series status to 'Under Review'
    editorApproveProposal(selectedProposal.id);

    // 2. Create an Editorial Board decision for voting
    const decision = createDecision({
      decisionType: 'Series Approval',
      seriesId: selectedProposal.seriesId,
      proposalId: selectedProposal.id,
      proposalTitle: selectedProposal.title,
    });

    // 3. Notify all Editorial Board members
    const boardMembers = getBoardMembers();
    boardMembers.forEach(member => {
      addNotification({
        recipientId: member.id,
        title: '📋 New Proposal for Board Vote',
        message: `Proposal "${selectedProposal.title}" has been reviewed and approved by the editor. Please cast your vote at /voting/${decision.id}.`,
        type: 'info',
        link: `/voting/${decision.id}`,
      });
    });

    toast('Proposal forwarded to Editorial Board for voting!', 'success');
    setShowReviewModal(false);
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      toast('Please provide a reason for rejection', 'error');
      return;
    }
    rejectProposalAdmin(selectedProposal.id, rejectReason);
    
    // Notify Mangaka
    addNotification({
      recipientId: selectedProposal.mangakaId,
      title: 'Proposal Rejected by Editor',
      message: `Your proposal "${selectedProposal.title}" was rejected by your assigned editor because: ${rejectReason}. Please submit a new proposal.`,
      type: 'warning',
      link: '/series'
    });

    toast('Proposal rejected and author notified', 'success');
    setShowReviewModal(false);
  };

  const handleToggleInfo = (proposalId, currentStatus) => {
    markProposalInfoComplete(proposalId, !currentStatus);
    toast(`Information marked as ${!currentStatus ? 'complete' : 'incomplete'}`, 'success');
  };

  const handleSendReminder = (proposalId) => {
    sendEditorReminder(proposalId);
    toast('Reminder sent to editor', 'success');
  };

  const handleEscalate = (proposalId) => {
    escalateProposal(proposalId);
    toast('Proposal escalated to Editor-in-Chief', 'error');
  };

  const handleAddAgenda = (proposalId) => {
    addToMeetingAgenda(proposalId);
    toast('Added to Serialization Meeting Agenda', 'success');
  };

  const getIntakeStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' };
    return (
      <span className={`badge ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proposal Reviews</h1>
        <p className="text-sm text-text-secondary mt-1">
          {currentUser?.roles?.includes('Tantou Editor') 
            ? 'Review and approve series proposals submitted by your assigned Mangakas.' 
            : 'Manage series proposals, assign editors, and monitor deadlines.'}
        </p>
      </div>

      <div className="space-y-4">
        {activeProposals.length === 0 ? (
          <div className="glass-card p-8 text-center text-text-muted">No active proposals to manage.</div>
        ) : (
          activeProposals.map(proposal => {
            const editor = users.find(u => u.id === proposal.assignedEditorId);
            const author = users.find(u => u.id === proposal.mangakaId);

            return (
              <div key={proposal.id} className="glass-card p-5 border-l-4 border-l-primary flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-text-primary text-lg">{proposal.title}</h3>
                    {getIntakeStatusBadge(proposal.intakeStatus)}
                    {proposal.escalated && (
                      <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertTriangle size={12} className="mr-1" /> Escalated
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-text-secondary flex flex-wrap gap-4">
                    <span className="flex items-center gap-1">
                      <Users size={14} /> Author: {author?.displayName || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> Submitted: {new Date(proposal.submittedAt || proposal.createdAt).toLocaleDateString()}
                    </span>
                    {proposal.assignedEditorId && (
                      <span className="flex items-center gap-1">
                        <Users size={14} className="text-primary" /> Editor: {editor?.displayName}
                      </span>
                    )}
                    {proposal.deadline && (
                      <span className={`flex items-center gap-1 ${proposal.isOverdue ? 'text-red-400' : ''}`}>
                        <Clock size={14} /> Deadline: {proposal.deadline}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs flex gap-3">
                    <button 
                      onClick={() => handleReviewClick(proposal)}
                      className="flex items-center gap-1 px-2 py-1 rounded transition-colors bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <FileText size={12} />
                      Review Details
                    </button>
                    {proposal.informationComplete && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                        <CheckCircle size={12} /> Info Complete
                      </span>
                    )}
                    {proposal.meetingAgenda && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                        <Calendar size={12} /> On Agenda
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {currentUser?.roles?.includes('Admin') && (
                    <button
                      onClick={() => handleAssignClick(proposal)}
                      className="btn btn-secondary text-sm"
                    >
                      {proposal.assignedEditorId ? 'Change Editor' : 'Assign Editor'}
                    </button>
                  )}
                  
                  {currentUser?.roles?.includes('Admin') && proposal.assignedEditorId && !proposal.isOverdue && (
                    <button
                      onClick={() => handleSendReminder(proposal.id)}
                      className="btn bg-bg-tertiary hover:bg-bg-hover text-text-primary text-sm flex items-center gap-2"
                    >
                      <Mail size={16} /> Reminder
                    </button>
                  )}

                  {currentUser?.roles?.includes('Admin') && proposal.isOverdue && !proposal.escalated && (
                    <button
                      onClick={() => handleEscalate(proposal.id)}
                      className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm flex items-center gap-2 border border-red-500/50"
                    >
                      <AlertTriangle size={16} /> Escalate
                    </button>
                  )}

                  {currentUser?.roles?.includes('Admin') && !proposal.meetingAgenda && proposal.intakeStatus === 'Assigned' && (
                    <button
                      onClick={() => handleAddAgenda(proposal.id)}
                      className="btn btn-primary text-sm"
                    >
                      Add to Agenda
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Editor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">Assign Intake Editor</h2>
            <p className="text-sm text-text-secondary mb-4">
              Assign an editor to review the proposal: <strong className="text-text-primary">{selectedProposal?.title}</strong>
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Select Editor</label>
                <select
                  value={selectedEditorId}
                  onChange={(e) => setSelectedEditorId(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">-- Choose an Editor --</option>
                  {tantouEditors.map(ed => (
                    <option key={ed.id} value={ed.id}>{ed.displayName} ({ed.activeTasks || 0} tasks)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Review Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input w-full"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Review & Reject Modal */}
      {showReviewModal && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Review Proposal Details</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 sidebar-scroll">
              <div className="space-y-1">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Title</p>
                <p className="text-lg font-bold text-text-primary">{selectedProposal.title}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-3 bg-bg-tertiary/50">
                  <p className="text-[10px] text-text-muted uppercase mb-2">Genre</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedProposal.genre.split(',').map(g => (
                      <span key={g} className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-semibold whitespace-nowrap">
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-3 bg-bg-tertiary/50">
                  <p className="text-[10px] text-text-muted uppercase mb-1">Publication</p>
                  <p className="font-semibold text-sm">{selectedProposal.publicationType}</p>
                </div>
                <div className="glass-card p-3 bg-bg-tertiary/50">
                  <p className="text-[10px] text-text-muted uppercase mb-1">Sample Pages</p>
                  <p className="font-semibold text-sm">{selectedProposal.samplePages} pages</p>
                </div>
                <div className="glass-card p-3 bg-bg-tertiary/50">
                  <p className="text-[10px] text-text-muted uppercase mb-1">Author</p>
                  <p className="font-semibold text-sm truncate">{users.find(u => u.id === selectedProposal.mangakaId)?.displayName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Synopsis</p>
                <div className="p-4 rounded-lg bg-bg-tertiary text-sm text-text-secondary leading-relaxed whitespace-pre-wrap border border-border break-words">
                  {selectedProposal.synopsis}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Sample Pages Preview</p>
                  <span className="text-xs text-text-muted">{selectedProposal.samplePages} pages total</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {Array.from({ length: Math.min(selectedProposal.samplePages, 5) }).map((_, idx) => (
                    <div key={idx} className="w-32 h-44 flex-shrink-0 rounded-lg bg-bg-tertiary border border-border flex flex-col items-center justify-center gap-2 group hover:border-primary transition-colors cursor-pointer relative overflow-hidden">
                      {/* Mock Image Content */}
                      <div className="w-20 h-24 border-2 border-dashed border-border/50 group-hover:border-primary/50 transition-colors" />
                      <span className="text-xs font-medium text-text-muted group-hover:text-primary transition-colors">Page {idx + 1}</span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">Preview</span>
                      </div>
                    </div>
                  ))}
                  {selectedProposal.samplePages > 5 && (
                    <div className="w-32 h-44 flex-shrink-0 rounded-lg bg-bg-tertiary/50 border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                      <span className="text-sm font-medium">+{selectedProposal.samplePages - 5} more</span>
                    </div>
                  )}
                </div>
              </div>

              {showRejectInput && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-3 animate-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this proposal is being rejected... (This will be sent to the Mangaka)"
                    className="input w-full min-h-[100px] text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRejectInput(false)} className="btn btn-secondary text-xs py-1.5">Cancel</button>
                    <button onClick={handleRejectSubmit} className="btn bg-red-500 hover:bg-red-600 text-white text-xs py-1.5">Confirm Rejection</button>
                  </div>
                </div>
              )}
            </div>

            {!showRejectInput && (
              <div className="p-5 border-t border-border flex justify-between bg-bg-secondary/50 rounded-b-xl">
                <button 
                  onClick={() => setShowRejectInput(true)} 
                  className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
                >
                  Reject Proposal
                </button>
                <button 
                  onClick={handleApproveProposal} 
                  className="btn btn-primary animate-pulse"
                >
                  Approve Proposal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
