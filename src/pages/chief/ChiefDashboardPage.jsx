import { useState } from 'react';
import { useEscalationStore } from '../../store/escalationStore';
import { useVotingStore } from '../../store/votingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ROLES } from '../../utils/constants';
import Modal from '../../components/Modal';
import { showToast } from '../../utils/toast';
import {
  AlertTriangle, Vote, Clock, CheckCircle, Crown,
  UserPlus, Send, CalendarPlus, Users, Gavel, Shield,
  XCircle, History, AlertCircle, UserCheck, Plus, Eye
} from 'lucide-react';

export default function ChiefDashboardPage() {
  const user = useAuthStore(s => s.currentUser);
  const allUsers = useAuthStore(s => s.users);
  const { getUserById, getBoardMembers } = useAuthStore();
  const {
    escalations, chiefActions,
    resolveEscalation, dismissEscalation, addChiefAction, createEscalation,
    getResolvedEscalations,
  } = useEscalationStore();
  const { decisions, extendVotingDeadline, assignRequiredVoter, chiefFinalizeDecision } = useVotingStore();
  const { series: allSeries, proposals: allProposals, reassignEditor, updateSeriesStatus, addSeries, updateProposal } = useSeriesStore();
  const { addNotification } = useNotificationStore();

  const editors = allUsers.filter(u => u.roles.includes(ROLES.TANTOU_EDITOR) && u.status === 'Active');
  const boardMembers = getBoardMembers ? getBoardMembers() : [];

  // Stats
  const pendingEscalations = escalations.filter(e => e.status === 'Pending' || e.status === 'In Progress');
  const resolvedEscalations = getResolvedEscalations();
  const openDecisions = decisions.filter(d => d.status === 'Open');
  const overdueItems = decisions.filter(d => {
    if (d.status !== 'Open') return false;
    return new Date(d.votingDeadline + 'T23:59:59') < new Date();
  });
  const actionsTaken = chiefActions.length;

  const stats = [
    { label: 'Pending Escalations', value: pendingEscalations.length, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Active Decisions', value: openDecisions.length, icon: Vote, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Overdue Items', value: overdueItems.length, icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    { label: 'Actions Taken', value: actionsTaken, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  // Tabs
  const [activeTab, setActiveTab] = useState('ALL');
  const [showResolved, setShowResolved] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEditorId, setSelectedEditorId] = useState('');
  const [selectedVoterId, setSelectedVoterId] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [overrideChoice, setOverrideChoice] = useState('');
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState('');

  // Manual escalation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEscType, setNewEscType] = useState('');
  const [newEscTitle, setNewEscTitle] = useState('');
  const [newEscDesc, setNewEscDesc] = useState('');
  const [newEscPriority, setNewEscPriority] = useState('Medium');

  const resetModal = () => {
    setActiveModal(null);
    setSelectedEditorId('');
    setSelectedVoterId('');
    setExtendDate('');
    setOverrideChoice('');
    setReason('');
    setResolution('');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'High': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Medium': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'No Editor Assigned': return 'bg-violet-500/20 text-violet-400 border border-violet-500/20';
      case 'No Review Response': return 'bg-orange-500/20 text-orange-400 border border-orange-500/20';
      case 'Insufficient Votes': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20';
      case 'Editor Change Request': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20';
      case 'Dispute': return 'bg-rose-500/20 text-rose-400 border border-rose-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'No Editor Assigned': return <UserPlus size={16} className="text-violet-400" />;
      case 'No Review Response': return <Clock size={16} className="text-orange-400" />;
      case 'Insufficient Votes': return <Vote size={16} className="text-cyan-400" />;
      case 'Editor Change Request': return <UserCheck size={16} className="text-indigo-400" />;
      case 'Dispute': return <Shield size={16} className="text-rose-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  // ── Helper: run full proposal approval/rejection flow after chief override ──
  const runChiefOverrideFlow = (decisionId, result, reason) => {
    chiefFinalizeDecision(decisionId, result, reason);
    const decision = decisions.find(d => d.id === decisionId);
    if (!decision) return;

    const linkedProposal = allProposals.find(p =>
      p.id === decision.proposalId ||
      p.id === decision.seriesId ||
      p.seriesId === decision.seriesId
    );
    const linkedSeries = allSeries.find(s => s.id === decision.seriesId);
    const seriesTitle = linkedSeries?.title || linkedProposal?.title || 'Unknown';
    const mangakaId = linkedProposal?.mangakaId || linkedSeries?.mangakaId;

    if (result === 'Approved') {
      if (linkedProposal) updateProposal(linkedProposal.id, { status: 'Approved' });
      if (linkedSeries) {
        updateSeriesStatus(linkedSeries.id, 'Approved');
      } else if (linkedProposal?.seriesId) {
        const existing = useSeriesStore.getState().series.find(s => s.id === linkedProposal.seriesId);
        if (existing) {
          useSeriesStore.getState().updateSeriesStatus(linkedProposal.seriesId, 'Approved');
        } else {
          addSeries({
            title: linkedProposal.title,
            genre: linkedProposal.genre,
            publicationType: linkedProposal.publicationType,
            synopsis: linkedProposal.synopsis,
            mangakaId: linkedProposal.mangakaId,
            editorId: null,
            status: 'Approved',
            assistantIds: [],
            activatedAt: null,
          });
        }
      }
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '🎉 Proposal Approved!',
          message: `Your proposal "${seriesTitle}" has been approved by the Editor-in-Chief.`,
          type: 'success',
          link: '/series',
        });
      }
    } else {
      if (linkedProposal) updateProposal(linkedProposal.id, { status: 'Rejected' });
      if (linkedSeries) updateSeriesStatus(linkedSeries.id, 'Rejected');
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '❌ Proposal Rejected',
          message: `Your proposal "${seriesTitle}" has been rejected by the Editor-in-Chief. Reason: ${reason}`,
          type: 'alert',
          link: '/series',
        });
      }
    }
  };

  // ── Action Handlers ──
  const handleAssignEditor = (esc) => {
    if (!selectedEditorId) { showToast('Please select an editor', 'error'); return; }
    const editor = getUserById(selectedEditorId);
    const s = allSeries.find(s => s.id === esc.seriesId);
    reassignEditor(esc.seriesId, selectedEditorId);
    resolveEscalation(esc.id, `Assigned editor ${editor?.displayName} to series "${s?.title}"`);
    addChiefAction({
      type: 'Editor Assignment',
      entityType: 'Series',
      entityId: esc.seriesId,
      description: `Assigned editor ${editor?.displayName} to series "${s?.title}"`,
      reason: 'Chief override — no editor assigned (BR-No-Response-Escalation)',
    });
    if (s?.mangakaId) {
      addNotification({
        recipientId: s.mangakaId,
        title: '📋 Editor Assigned',
        message: `Editor ${editor?.displayName} has been assigned to your series "${s?.title}" by the Editor-in-Chief.`,
        type: 'info',
        link: `/series/${esc.seriesId}`,
      });
    }
    addNotification({
      recipientId: selectedEditorId,
      title: '👑 New Series Assignment',
      message: `The Editor-in-Chief has assigned you as Tantou Editor for series "${s?.title}".`,
      type: 'info',
      link: `/series/${esc.seriesId}`,
    });
    showToast(`Editor ${editor?.displayName} assigned successfully`, 'success');
    resetModal();
  };

  const handleSendReminder = (esc) => {
    const s = allSeries.find(s => s.id === esc.seriesId);
    // Use relatedUserId first, fall back to series editor
    const targetUserId = esc.relatedUserId || s?.editorId;
    if (targetUserId) {
      addNotification({
        recipientId: targetUserId,
        title: '⏰ Urgent Review Reminder',
        message: `The Editor-in-Chief has sent an urgent reminder: Please review pending manuscripts for series "${s?.title || esc.title}" immediately.`,
        type: 'warning',
        link: '/manuscripts',
      });
    }
    addChiefAction({
      type: 'Send Reminder',
      entityType: esc.entityType,
      entityId: esc.entityId,
      description: `Sent urgent review reminder for "${esc.title}"`,
      reason: 'Editor not responding to manuscript review',
    });
    showToast('Reminder sent to the assigned editor', 'success');
  };

  const handleReassignEditor = (esc) => {
    if (!selectedEditorId) { showToast('Please select an editor', 'error'); return; }
    const editor = getUserById(selectedEditorId);
    const s = allSeries.find(s => s.id === esc.seriesId);
    const oldEditorId = s?.editorId || esc.relatedUserId || esc.currentEditorId;

    reassignEditor(esc.seriesId, selectedEditorId);
    resolveEscalation(esc.id, `Reassigned editor to ${editor?.displayName}`);
    addChiefAction({
      type: 'Editor Reassignment',
      entityType: 'Series',
      entityId: esc.seriesId,
      description: `Reassigned editor from ${oldEditorId ? getUserById(oldEditorId)?.displayName : 'None'} to ${editor?.displayName} for series "${s?.title}"`,
      reason: reason || 'No review response from previous editor',
    });

    if (s?.mangakaId) {
      addNotification({
        recipientId: s.mangakaId,
        title: '📋 Tantou Editor Reassigned',
        message: `Your Tantou Editor for series "${s?.title}" has been reassigned to ${editor?.displayName} by the Editor-in-Chief.`,
        type: 'info',
        link: `/series/${esc.seriesId}`,
      });
    }
    if (oldEditorId) {
      addNotification({
        recipientId: oldEditorId,
        title: '🔄 Series Reassigned',
        message: `The Editor-in-Chief has reassigned series "${s?.title}" to another editor due to unresponsiveness.`,
        type: 'warning',
        link: '/series',
      });
    }
    addNotification({
      recipientId: selectedEditorId,
      title: '👑 New Series Assignment',
      message: `The Editor-in-Chief has assigned you as Tantou Editor for series "${s?.title}".`,
      type: 'info',
      link: `/series/${esc.seriesId}`,
    });

    showToast(`Editor reassigned to ${editor?.displayName}`, 'success');
    resetModal();
  };

  const handleExtendDeadline = (esc) => {
    if (!extendDate) { showToast('Please select a new deadline', 'error'); return; }
    const decisionId = esc.decisionId || esc.entityId;
    extendVotingDeadline(decisionId, extendDate);
    resolveEscalation(esc.id, `Extended voting deadline to ${extendDate}`);
    addChiefAction({
      type: 'Extend Deadline',
      entityType: 'BoardDecision',
      entityId: decisionId,
      description: `Extended voting deadline for ${decisionId} to ${extendDate}`,
      reason: reason || 'Insufficient votes before deadline (BR-Chief-Editor-Override)',
    });
    showToast(`Deadline extended to ${extendDate}`, 'success');
    resetModal();
  };

  const handleForceAssignVoter = (esc) => {
    if (!selectedVoterId) { showToast('Please select a board member', 'error'); return; }
    const voter = getUserById(selectedVoterId);
    const decisionId = esc.decisionId || esc.entityId;
    assignRequiredVoter(decisionId, selectedVoterId);
    addChiefAction({
      type: 'Assign Required Voter',
      entityType: 'BoardDecision',
      entityId: decisionId,
      description: `Assigned ${voter?.displayName} as required voter for ${decisionId}`,
      reason: reason || 'Quorum not met (BR-Chief-Editor-Override)',
    });
    addNotification({
      recipientId: selectedVoterId,
      title: '👑 Mandatory Vote Required',
      message: `The Editor-in-Chief requires your vote on board decision ${decisionId}. Please cast your vote promptly to meet quorum.`,
      type: 'warning',
      link: '/voting',
    });
    showToast(`${voter?.displayName} assigned as required voter`, 'success');
    resetModal();
  };

  const handleChiefOverride = (esc) => {
    if (!overrideChoice) { showToast('Please select Approve or Reject', 'error'); return; }
    if (!reason) { showToast('Please provide a reason for override', 'error'); return; }
    const decisionId = esc.decisionId || esc.entityId;
    const finalResult = overrideChoice === 'approve' ? 'Approved' : 'Rejected';

    // Run full approval flow (fix: was just calling chiefFinalizeDecision before)
    runChiefOverrideFlow(decisionId, finalResult, reason);
    resolveEscalation(esc.id, `Chief override: ${finalResult} — ${reason}`);
    addChiefAction({
      type: 'Chief Override Finalize',
      entityType: 'BoardDecision',
      entityId: decisionId,
      description: `Chief override finalized ${decisionId} as ${finalResult}`,
      reason,
    });
    showToast(`Decision ${decisionId} finalized via Chief override: ${finalResult}`, 'success');
    resetModal();
  };

  const handleApproveChange = (esc) => {
    if (!selectedEditorId) { showToast('Please select a new editor', 'error'); return; }
    const editor = getUserById(selectedEditorId);
    const s = allSeries.find(s => s.id === esc.seriesId);
    const oldEditorId = s?.editorId || esc.currentEditorId;

    reassignEditor(esc.seriesId, selectedEditorId);
    resolveEscalation(esc.id, `Approved change — New editor: ${editor?.displayName}`);
    addChiefAction({
      type: 'Approve Editor Change',
      entityType: 'Series',
      entityId: esc.seriesId,
      description: `Approved editor change for "${s?.title}". New editor: ${editor?.displayName}`,
      reason: reason || 'Editor change request approved by Chief',
    });

    if (esc.requestedBy) {
      addNotification({
        recipientId: esc.requestedBy,
        title: '✅ Editor Change Approved',
        message: `Your request to change the editor for "${s?.title}" has been approved. New editor: ${editor?.displayName}`,
        type: 'success',
        link: `/series/${esc.seriesId}`,
      });
    }
    if (oldEditorId) {
      addNotification({
        recipientId: oldEditorId,
        title: '🔄 Series Reassigned',
        message: `The mangaka's request to change the editor for series "${s?.title}" has been approved by the Editor-in-Chief. You have been removed from this series.`,
        type: 'warning',
        link: '/series',
      });
    }
    addNotification({
      recipientId: selectedEditorId,
      title: '👑 New Series Assignment',
      message: `The Editor-in-Chief has assigned you as Tantou Editor for series "${s?.title}".`,
      type: 'info',
      link: `/series/${esc.seriesId}`,
    });

    showToast(`Editor change approved — ${editor?.displayName} assigned`, 'success');
    resetModal();
  };

  const handleDismiss = (esc) => {
    dismissEscalation(esc.id, 'Dismissed by Editor-in-Chief — no action required');
    addChiefAction({
      type: 'Dismiss Escalation',
      entityType: esc.entityType,
      entityId: esc.entityId,
      description: `Dismissed escalation: "${esc.title}"`,
      reason: 'No action required after review',
    });
    showToast('Escalation dismissed', 'info');
  };

  const handleResolveDispute = (esc) => {
    if (!resolution) { showToast('Please provide a resolution', 'error'); return; }
    resolveEscalation(esc.id, resolution);
    addChiefAction({
      type: 'Resolve Dispute',
      entityType: esc.entityType,
      entityId: esc.entityId,
      description: `Resolved dispute: "${esc.title}"`,
      reason: resolution,
    });
    if (esc.disputeParties) {
      [esc.disputeParties.mangakaId, esc.disputeParties.editorId].filter(Boolean).forEach(uid => {
        addNotification({
          recipientId: uid,
          title: '⚖️ Dispute Resolved',
          message: `The Editor-in-Chief has resolved the dispute: "${esc.title}". Resolution: ${resolution}`,
          type: 'info',
          link: `/series/${esc.seriesId}`,
        });
      });
    }
    showToast('Dispute resolved', 'success');
    resetModal();
  };

  const handleCreateManualEscalation = () => {
    if (!newEscType || !newEscTitle || !newEscDesc) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    createEscalation({
      type: newEscType,
      entityType: 'Manual',
      entityId: 'MANUAL',
      seriesId: null,
      title: newEscTitle,
      description: newEscDesc,
      priority: newEscPriority,
      relatedUserId: null,
      decisionId: null,
    });
    addChiefAction({
      type: 'Create Escalation',
      entityType: 'Manual',
      entityId: 'MANUAL',
      description: `Created manual escalation: "${newEscTitle}"`,
      reason: newEscDesc,
    });
    showToast('Escalation created', 'success');
    setShowCreateModal(false);
    setNewEscType('');
    setNewEscTitle('');
    setNewEscDesc('');
    setNewEscPriority('Medium');
  };

  // Filter escalations
  const getFilteredList = () => {
    const list = showResolved ? resolvedEscalations : pendingEscalations;
    if (activeTab === 'ALL') return list;
    if (activeTab === 'NO_EDITOR') return list.filter(e => e.type === 'No Editor Assigned');
    if (activeTab === 'NO_REVIEW') return list.filter(e => e.type === 'No Review Response');
    if (activeTab === 'NO_VOTE') return list.filter(e => e.type === 'Insufficient Votes');
    if (activeTab === 'CHANGE_REQ') return list.filter(e => e.type === 'Editor Change Request');
    if (activeTab === 'DISPUTE') return list.filter(e => e.type === 'Dispute');
    return list;
  };
  const filteredEscalations = getFilteredList();

  // ── Action Buttons per type ──
  const renderActions = (esc) => {
    if (esc.status !== 'Pending' && esc.status !== 'In Progress') return null;
    return (
      <div className="mt-4 pt-3 border-t border-border/60">
        <p className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80 mb-2.5 flex items-center gap-1">
          <Crown size={12} /> Chief Executive Action Area
        </p>
        {(() => {
          switch (esc.type) {
            case 'No Editor Assigned':
              return (
                <div className="flex gap-2">
                  <button onClick={() => setActiveModal({ type: 'assignEditor', escalation: esc })} className="btn btn-primary text-xs py-1.5 px-3">
                    <UserPlus size={14} /> Assign Editor
                  </button>
                </div>
              );
            case 'No Review Response':
              return (
                <div className="flex gap-2">
                  <button onClick={() => handleSendReminder(esc)} className="btn btn-ghost text-xs py-1.5 px-3 text-amber-400 border-amber-500/20 hover:bg-amber-500/10">
                    <Send size={14} /> Send Reminder
                  </button>
                  <button onClick={() => setActiveModal({ type: 'reassignEditor', escalation: esc })} className="btn btn-primary text-xs py-1.5 px-3">
                    <UserPlus size={14} /> Reassign Editor
                  </button>
                </div>
              );
            case 'Insufficient Votes':
              return (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setActiveModal({ type: 'extendDeadline', escalation: esc })} className="btn btn-ghost text-xs py-1.5 px-3 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/10">
                    <CalendarPlus size={14} /> Extend Deadline
                  </button>
                  <button onClick={() => setActiveModal({ type: 'forceAssignVoter', escalation: esc })} className="btn btn-ghost text-xs py-1.5 px-3 text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
                    <Users size={14} /> Force Assign Voter
                  </button>
                  <button onClick={() => setActiveModal({ type: 'chiefOverride', escalation: esc })} className="btn btn-ghost text-xs py-1.5 px-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20">
                    <Gavel size={14} /> Override Finalize
                  </button>
                </div>
              );
            case 'Editor Change Request':
              return (
                <div className="flex gap-2">
                  <button onClick={() => setActiveModal({ type: 'approveChange', escalation: esc })} className="btn btn-success text-xs py-1.5 px-3">
                    <CheckCircle size={14} /> Approve Change
                  </button>
                  <button onClick={() => handleDismiss(esc)} className="btn btn-ghost text-xs py-1.5 px-3 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
                    <XCircle size={14} /> Dismiss Request
                  </button>
                </div>
              );
            case 'Dispute':
              return (
                <div className="flex gap-2">
                  <button onClick={() => setActiveModal({ type: 'resolveDispute', escalation: esc })} className="btn btn-primary text-xs py-1.5 px-3">
                    <Shield size={14} /> Resolve Dispute
                  </button>
                  <button onClick={() => handleDismiss(esc)} className="btn btn-ghost text-xs py-1.5 px-3 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
                    <XCircle size={14} /> Dismiss
                  </button>
                </div>
              );
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  const getActionIcon = (type) => {
    const map = {
      'Editor Assignment': <div className="p-2 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30"><UserPlus size={16} /></div>,
      'Editor Reassignment': <div className="p-2 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30"><UserPlus size={16} /></div>,
      'Approve Editor Change': <div className="p-2 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30"><UserCheck size={16} /></div>,
      'Extend Deadline': <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"><CalendarPlus size={16} /></div>,
      'Assign Required Voter': <div className="p-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"><Users size={16} /></div>,
      'Chief Override Finalize': <div className="p-2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30"><Gavel size={16} /></div>,
      'Send Reminder': <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"><Send size={16} /></div>,
      'Resolve Dispute': <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><Shield size={16} /></div>,
      'Dismiss Escalation': <div className="p-2 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30"><XCircle size={16} /></div>,
      'Create Escalation': <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"><Plus size={16} /></div>,
    };
    return map[type] || <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle size={16} /></div>;
  };

  return (
    <div className="space-y-8 page-enter">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-bg-secondary to-bg-primary p-6 md:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Crown size={32} className="text-amber-400" />
              <div className="absolute -inset-0.5 rounded-xl border border-amber-400/30 blur opacity-30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  Chief Executive
                </span>
                {pendingEscalations.length > 0 && (
                  <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {pendingEscalations.length} URGENT
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
                Editor-in-Chief <span className="gradient-text bg-gradient-to-r from-amber-400 to-yellow-500">Workspace</span>
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                👑 Welcome back, <span className="font-bold text-text-primary">{user?.displayName}</span> — Resolve escalations and override blocked processes.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-ghost text-sm border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex-shrink-0"
          >
            <Plus size={16} /> Create Escalation
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 border border-border hover:border-amber-500/20">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">{stat.label}</p>
                <p className="text-2xl font-black text-text-primary mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Escalation Queue — Left 2/3 */}
        <div className="xl:col-span-2 space-y-6">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                <AlertTriangle size={20} className="text-amber-400" />
                Escalation Queue
              </h2>
              {pendingEscalations.length > 0 && !showResolved && (
                <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                  {pendingEscalations.length} Pending
                </span>
              )}
              {/* Toggle resolved */}
              <button
                onClick={() => setShowResolved(!showResolved)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  showResolved
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'text-text-muted border-border hover:text-text-primary hover:border-border'
                }`}
              >
                <Eye size={12} />
                {showResolved ? 'Showing Resolved' : 'View Resolved'}
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border/80">
              {[
                { id: 'ALL', label: 'All', icon: '📋' },
                { id: 'NO_EDITOR', label: 'No Editor', icon: '👤' },
                { id: 'NO_REVIEW', label: 'No Review', icon: '⏳' },
                { id: 'NO_VOTE', label: 'Votes', icon: '🗳️' },
                { id: 'CHANGE_REQ', label: 'Change', icon: '🔄' },
                { id: 'DISPUTE', label: 'Disputes', icon: '⚖️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-bg-primary font-bold shadow-md shadow-amber-500/20 scale-105'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredEscalations.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-2 border-border flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
                <CheckCircle size={36} />
              </div>
              <h3 className="text-base font-bold text-text-primary">
                {showResolved ? 'No resolved escalations' : 'System operational, Chief!'}
              </h3>
              <p className="text-sm text-text-muted max-w-sm mt-1">
                {showResolved
                  ? 'No escalations have been resolved yet.'
                  : 'No pending blockages found matching the active filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEscalations.map(esc => {
                const s = allSeries.find(s => s.id === esc.seriesId);
                const borderColor = esc.priority === 'Critical' ? '#f43f5e' : esc.priority === 'High' ? '#f59e0b' : '#3b82f6';
                return (
                  <div
                    key={esc.id}
                    className="glass-card p-5 border-l-4 bg-bg-secondary hover:scale-[1.01] duration-300 relative overflow-hidden flex flex-col justify-between"
                    style={{ borderLeftColor: borderColor }}
                  >
                    <div>
                      {/* Status overlay for resolved */}
                      {(esc.status === 'Resolved' || esc.status === 'Dismissed') && (
                        <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          esc.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {esc.status}
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`badge ${getPriorityColor(esc.priority)} text-[9px]`}>{esc.priority}</span>
                          <span className={`badge ${getTypeColor(esc.type)} text-[9px] flex items-center gap-1`}>
                            {getTypeIcon(esc.type)}
                            {esc.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted font-bold tracking-wider">{esc.id}</span>
                      </div>

                      {/* Main Info */}
                      <h3 className="text-sm font-bold text-text-primary mb-1.5 leading-snug">{esc.title}</h3>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-2">{esc.description}</p>

                      {/* Editor Response */}
                      {esc.editorResponse && (
                        <div className="mb-3 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs">
                          <p className="text-cyan-400 font-bold mb-1 flex items-center gap-1">
                            <span>💬</span> Editor Response:
                          </p>
                          <p className="text-text-secondary italic leading-relaxed">"{esc.editorResponse}"</p>
                          <p className="text-[9px] text-text-muted mt-1.5 text-right">
                            — {new Date(esc.editorResponseAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Resolution (for resolved escalations) */}
                      {esc.resolution && (esc.status === 'Resolved' || esc.status === 'Dismissed') && (
                        <div className="mb-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                          <p className="text-emerald-400 font-bold mb-1">Resolution:</p>
                          <p className="text-text-secondary italic">{esc.resolution}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto">
                      {s && (
                        <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded bg-bg-primary/50 text-[10px] text-text-muted mb-3 w-fit">
                          <span className="font-semibold text-text-secondary">📚</span>
                          <span className="text-text-primary truncate max-w-[150px]">{s.title}</span>
                          <span className="text-text-muted">({esc.seriesId})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-text-muted pt-2 border-t border-border/30">
                        <span>Escalated: {new Date(esc.createdAt).toLocaleDateString()}</span>
                        <span>
                          {Math.max(1, Math.ceil((new Date() - new Date(esc.createdAt)) / (1000 * 60 * 60 * 24)))} day(s) ago
                        </span>
                      </div>

                      {renderActions(esc)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action History — Right 1/3 */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
            <History size={20} className="text-amber-400" />
            Executive Log
          </h2>

          <div className="glass-card p-5 relative overflow-hidden bg-bg-secondary/60">
            <div className="absolute left-9 top-6 bottom-6 w-0.5 border-l border-dashed border-border" />

            {chiefActions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-text-muted">No executive actions registered yet.</p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {[...chiefActions]
                  .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))
                  .map(action => (
                    <div key={action.id} className="flex gap-4 items-start relative group">
                      <div className="z-10 bg-bg-secondary flex-shrink-0">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex-1 min-w-0 bg-bg-primary/30 p-3 rounded-xl border border-border/40 group-hover:border-amber-500/10 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] tracking-wide">
                            {action.type}
                          </span>
                          <span className="text-[9px] text-text-muted font-bold">{action.id}</span>
                        </div>
                        <p className="text-xs font-semibold text-text-primary leading-snug">{action.description}</p>
                        {action.reason && (
                          <p className="text-[10px] text-text-muted mt-1.5 p-1.5 rounded bg-bg-secondary/40 italic">
                            " {action.reason} "
                          </p>
                        )}
                        <p className="text-[9px] text-text-muted mt-2 font-mono text-right">
                          {new Date(action.performedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Assign Editor */}
      <Modal isOpen={activeModal?.type === 'assignEditor'} onClose={resetModal} title="👑 Assign Tantou Editor" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <strong>BR-Chief-Editor-Override:</strong> Forcefully assigning a Tantou Editor to unblock the pipeline.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Select Tantou Editor <span className="text-danger">*</span>
            </label>
            <select className="form-input" value={selectedEditorId} onChange={e => setSelectedEditorId(e.target.value)}>
              <option value="">Select an editor...</option>
              {editors.map(e => (
                <option key={e.id} value={e.id}>{e.avatar} {e.displayName}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleAssignEditor(activeModal.escalation)} disabled={!selectedEditorId} className="btn btn-primary flex-1">
              <UserPlus size={16} /> Assign Editor
            </button>
          </div>
        </div>
      </Modal>

      {/* Reassign Editor */}
      <Modal isOpen={activeModal?.type === 'reassignEditor'} onClose={resetModal} title="👑 Reassign Tantou Editor" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <strong>BR-Chief-Editor-Override:</strong> Reassigning the Tantou Editor due to unresponsiveness.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Select New Editor <span className="text-danger">*</span>
            </label>
            <select className="form-input" value={selectedEditorId} onChange={e => setSelectedEditorId(e.target.value)}>
              <option value="">Select an editor...</option>
              {editors.map(e => (
                <option key={e.id} value={e.id}>{e.avatar} {e.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Reason for Override</label>
            <textarea className="form-input h-20 resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for reassignment..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleReassignEditor(activeModal.escalation)} disabled={!selectedEditorId} className="btn btn-primary flex-1">
              <UserPlus size={16} /> Reassign Editor
            </button>
          </div>
        </div>
      </Modal>

      {/* Extend Deadline */}
      <Modal isOpen={activeModal?.type === 'extendDeadline'} onClose={resetModal} title="👑 Extend Voting Deadline" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
            <strong>BR-Chief-Editor-Override:</strong> Extending the voting deadline allows more time for quorum.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              New Deadline <span className="text-danger">*</span>
            </label>
            <input type="date" className="form-input" value={extendDate} onChange={e => setExtendDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Reason for Extension</label>
            <textarea className="form-input h-20 resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for extension..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleExtendDeadline(activeModal.escalation)} disabled={!extendDate} className="btn btn-primary flex-1">
              <CalendarPlus size={16} /> Extend Deadline
            </button>
          </div>
        </div>
      </Modal>

      {/* Force Assign Voter */}
      <Modal isOpen={activeModal?.type === 'forceAssignVoter'} onClose={resetModal} title="👑 Force Assign Required Voter" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            <strong>Mandatory Directive:</strong> Forcing a Board Member to vote to meet quorum requirements (BR-Chief-Editor-Override).
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Select Board Member <span className="text-danger">*</span>
            </label>
            <select className="form-input" value={selectedVoterId} onChange={e => setSelectedVoterId(e.target.value)}>
              <option value="">Select a board member...</option>
              {boardMembers.map(m => (
                <option key={m.id} value={m.id}>{m.avatar} {m.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Reason (optional)</label>
            <textarea className="form-input h-20 resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for assignment..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleForceAssignVoter(activeModal.escalation)} disabled={!selectedVoterId} className="btn btn-primary flex-1">
              <Users size={16} /> Assign Required Voter
            </button>
          </div>
        </div>
      </Modal>

      {/* Chief Override Finalize */}
      <Modal isOpen={activeModal?.type === 'chiefOverride'} onClose={resetModal} title="👑 Chief Override Finalize" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <strong>Extreme Authority — BR-Chief-Editor-Override:</strong> This bypasses all vote quorums and closes the proposal immediately under Chief authority. The Mangaka will be notified of the final decision.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Final Executive Decision</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOverrideChoice('approve')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer ${overrideChoice === 'approve' ? 'bg-emerald-500 text-bg-primary shadow-lg shadow-emerald-500/20' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
              >
                <CheckCircle size={16} className="inline mr-1" /> Approve Proposal
              </button>
              <button
                type="button"
                onClick={() => setOverrideChoice('reject')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer ${overrideChoice === 'reject' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
              >
                <XCircle size={16} className="inline mr-1" /> Reject Proposal
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Executive Justification <span className="text-danger">*</span>
            </label>
            <textarea className="form-input h-24 resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide detailed executive reason for override..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleChiefOverride(activeModal.escalation)} disabled={!overrideChoice || !reason} className="btn btn-danger flex-1 shadow shadow-rose-500/25">
              <Gavel size={16} /> Override Finalize
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve Editor Change */}
      <Modal isOpen={activeModal?.type === 'approveChange'} onClose={resetModal} title="👑 Approve Editor Change Request" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <strong>Request Approval:</strong> Approving the Mangaka's formal request to assign a new Tantou Editor. Both the old and new editors will be notified.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Select New Editor <span className="text-danger">*</span>
            </label>
            <select className="form-input" value={selectedEditorId} onChange={e => setSelectedEditorId(e.target.value)}>
              <option value="">Select an editor...</option>
              {editors.map(e => (
                <option key={e.id} value={e.id}>{e.avatar} {e.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Notes</label>
            <textarea className="form-input h-20 resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Any notes regarding this approval..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleApproveChange(activeModal.escalation)} disabled={!selectedEditorId} className="btn btn-success flex-1">
              <CheckCircle size={16} /> Approve & Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Resolve Dispute */}
      <Modal isOpen={activeModal?.type === 'resolveDispute'} onClose={resetModal} title="👑 Resolve Dispute" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <strong>Executive Arbitration:</strong> Issue a binding ruling to resolve the dispute between Mangaka and Editor. Both parties will be notified of the decision.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Arbitration Ruling <span className="text-danger">*</span>
            </label>
            <textarea className="form-input h-32 resize-none" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe the binding resolution and actions to be taken..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={resetModal} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={() => handleResolveDispute(activeModal.escalation)} disabled={!resolution} className="btn btn-primary flex-1">
              <Shield size={16} /> Submit Resolution
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Manual Escalation */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="👑 Create Manual Escalation" size="md">
        <div className="space-y-4 border-t-2 border-amber-500/30 pt-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Escalation Type <span className="text-danger">*</span>
            </label>
            <select className="form-input" value={newEscType} onChange={e => setNewEscType(e.target.value)}>
              <option value="">Select type...</option>
              <option value="No Editor Assigned">No Editor Assigned</option>
              <option value="No Review Response">No Review Response</option>
              <option value="Insufficient Votes">Insufficient Votes</option>
              <option value="Editor Change Request">Editor Change Request</option>
              <option value="Dispute">Dispute</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewEscPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${newEscPriority === p ? 'bg-amber-500 text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Title <span className="text-danger">*</span>
            </label>
            <input className="form-input" value={newEscTitle} onChange={e => setNewEscTitle(e.target.value)} placeholder="Escalation title..." />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea className="form-input h-24 resize-none" value={newEscDesc} onChange={e => setNewEscDesc(e.target.value)} placeholder="Describe the issue in detail..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleCreateManualEscalation} disabled={!newEscType || !newEscTitle || !newEscDesc} className="btn btn-primary flex-1">
              <Plus size={16} /> Create Escalation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
