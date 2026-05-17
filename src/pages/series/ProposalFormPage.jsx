import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useVotingStore } from '../../store/votingStore';
import { useNotificationStore } from '../../store/notificationStore';
import { GENRES, PUBLICATION_TYPES, CONFIG } from '../../utils/constants';
import { validateProposal, validateUniqueTitle, validateSingleActiveProposal } from '../../utils/validators';
import { showToast } from '../../components/Toast';
import { Send, Save, AlertTriangle } from 'lucide-react';

// BR-15: Proposal Validation, BR-16: Edit Restriction, BR-17: Unique Title, BR-19: Single Active Proposal
export default function ProposalFormPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.currentUser);
  const { getBoardMembers } = useAuthStore();
  const { series, proposals, addProposal, submitProposal, updateProposal } = useSeriesStore();
  const { createDecision } = useVotingStore();
  const { addNotification } = useNotificationStore();
  const [form, setForm] = useState({ title: '', genre: '', publicationType: '', synopsis: '', samplePages: 5 });
  const [errors, setErrors] = useState({});

  // BR-19: Check if mangaka already has an active proposal
  const activeProposalError = validateSingleActiveProposal(user.id, proposals);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSaveDraft = () => {
    const proposal = addProposal({ ...form, mangakaId: user.id });
    showToast('Proposal saved as draft', 'success');
    navigate('/series');
  };

  const handleSubmit = () => {
    // BR-15: Validate all fields
    const validationErrors = validateProposal(form);
    // BR-17: Check unique title
    const titleError = validateUniqueTitle(form.title, series);
    if (titleError) validationErrors.title = titleError;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix validation errors', 'error');
      return;
    }

    const proposal = addProposal({ ...form, mangakaId: user.id });
    submitProposal(proposal.id);
    // Issue #4: Set proposal to Under Review since a decision is being created
    updateProposal(proposal.id, { status: 'Under Review' });

    // Create a corresponding series entry with Under Review status
    const { addSeries } = useSeriesStore.getState();
    const newSeries = addSeries({
      title: proposal.title,
      genre: proposal.genre || form.genre,
      publicationType: proposal.publicationType || form.publicationType,
      synopsis: proposal.synopsis || form.synopsis,
      mangakaId: user.id,
      editorId: null,
      status: 'Under Review',
      assistantIds: [],
      activatedAt: null,
    });

    // Update proposal with series reference
    updateProposal(proposal.id, { seriesId: newSeries.id });

    // Create decision for board voting — link to the series, not the proposal
    createDecision({
      seriesId: newSeries.id,
      decisionType: 'Series Approval',
      proposalTitle: proposal.title,
      proposalId: proposal.id,
    });

    // Notify all board members
    const boardMembers = getBoardMembers();
    boardMembers.forEach(board => {
      addNotification({
        recipientId: board.id,
        title: 'New Series Proposal',
        message: `A new proposal "${proposal.title}" has been submitted by ${user.displayName} for review.`,
        type: 'alert',
        link: '/voting',
      });
    });

    showToast('Proposal submitted for board review!', 'success');
    navigate('/series');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Series Proposal</h1>
        <p className="text-sm text-text-secondary mt-1">Submit a new series for Editorial Board review</p>
      </div>

      {/* BR-19: Active proposal warning */}
      {activeProposalError && (
        <div className="glass-card p-4 border-amber-500/30 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">BR-19: Single Active Proposal Limit</p>
            <p className="text-xs text-text-secondary mt-1">{activeProposalError}</p>
          </div>
        </div>
      )}

      <div className="glass-card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Title <span className="text-danger">*</span>
            <span className="text-text-muted text-xs ml-2">({form.title.length}/{CONFIG.TITLE_MAX_LENGTH})</span>
          </label>
          <input
            type="text" className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="Enter series title..." maxLength={CONFIG.TITLE_MAX_LENGTH}
            value={form.title} onChange={e => handleChange('title', e.target.value)}
          />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Genre <span className="text-danger">*</span></label>
          <select className={`form-input ${errors.genre ? 'error' : ''}`} value={form.genre} onChange={e => handleChange('genre', e.target.value)}>
            <option value="">Select genre...</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {errors.genre && <p className="text-xs text-danger mt-1">{errors.genre}</p>}
        </div>

        {/* Publication Type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Publication Type <span className="text-danger">*</span></label>
          <select className={`form-input ${errors.publicationType ? 'error' : ''}`} value={form.publicationType} onChange={e => handleChange('publicationType', e.target.value)}>
            <option value="">Select type...</option>
            {PUBLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.publicationType && <p className="text-xs text-danger mt-1">{errors.publicationType}</p>}
        </div>

        {/* Synopsis */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Synopsis <span className="text-danger">*</span>
            <span className="text-text-muted text-xs ml-2">({form.synopsis.length}/{CONFIG.SYNOPSIS_MAX_LENGTH}, min {CONFIG.SYNOPSIS_MIN_LENGTH})</span>
          </label>
          <textarea
            className={`form-input h-40 resize-none ${errors.synopsis ? 'error' : ''}`}
            placeholder="Write a compelling synopsis (200-2000 characters)..."
            maxLength={CONFIG.SYNOPSIS_MAX_LENGTH}
            value={form.synopsis} onChange={e => handleChange('synopsis', e.target.value)}
          />
          {errors.synopsis && <p className="text-xs text-danger mt-1">{errors.synopsis}</p>}
          <div className="h-1 mt-1 rounded bg-bg-tertiary overflow-hidden">
            <div className={`h-full transition-all rounded ${form.synopsis.length >= CONFIG.SYNOPSIS_MIN_LENGTH ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (form.synopsis.length / CONFIG.SYNOPSIS_MIN_LENGTH) * 100)}%` }} />
          </div>
        </div>

        {/* Sample Pages */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Sample Pages <span className="text-danger">*</span> <span className="text-text-muted text-xs">(min 5)</span>
          </label>
          <input
            type="number" className={`form-input w-32 ${errors.samplePages ? 'error' : ''}`}
            min={1} value={form.samplePages} onChange={e => handleChange('samplePages', parseInt(e.target.value) || 0)}
          />
          {errors.samplePages && <p className="text-xs text-danger mt-1">{errors.samplePages}</p>}
        </div>

        {/* BR info */}
        <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border">
          <p className="text-xs text-text-muted">
            <strong>Business Rules enforced:</strong> BR-15 (Validation), BR-17 (Unique Title), BR-19 (Single Active Proposal)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSaveDraft} className="btn btn-ghost flex-1" disabled={!!activeProposalError}>
            <Save size={16} /> Save Draft
          </button>
          <button onClick={handleSubmit} className="btn btn-primary flex-1" disabled={!!activeProposalError}>
            <Send size={16} /> Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}
