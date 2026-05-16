import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { statusBadge } from '../utils/status';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
  Camera, ChevronDown, ChevronUp, Loader2,
  CheckCircle, XCircle, UserCheck, ArrowRight,
  ClipboardList, Briefcase, PlusCircle,
} from 'lucide-react';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(status)}`}>
      {status}
    </span>
  );
}

function Spinner({ size = 15 }) {
  return <Loader2 size={size} className="animate-spin" />;
}

// ─── Submit Issue Form ──────────────────────────────────────────────────────────

function SubmitIssueForm({ onSuccess }) {
  const toast = useToast();
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('Pothole');
  const [area,        setArea]        = useState('');
  const [landmark,    setLandmark]    = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const fileInputRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ type: 'error', message: 'Photo must be under 5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/issues', {
        title, description, category,
        location: { area, landmark },
        photos: photoBase64 ? [photoBase64] : [],
      });
      toast({ type: 'success', message: 'Issue submitted successfully!' });
      setTitle(''); setDescription(''); setArea(''); setLandmark(''); setPhotoBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.detail || 'Failed to submit issue.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Issue Title</label>
          <input
            required
            type="text"
            className="input-field"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Deep pothole near bus stop"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select className="input-field bg-white" value={category} onChange={e => setCategory(e.target.value)}>
            {['Pothole','Garbage','Streetlight','Water Leakage','Sewage','Tree Fall','Other'].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Area</label>
          <input
            required
            type="text"
            className="input-field"
            value={area}
            onChange={e => setArea(e.target.value)}
            placeholder="e.g. Ranchi, Main Road"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Landmark <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            className="input-field"
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
            placeholder="e.g. Near Central Park"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          required
          rows={3}
          className="input-field resize-none"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the issue and its severity…"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          <Camera size={15} /> Attach Photo
        </button>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhoto} />
        {photoBase64 && (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle size={14} /> Photo attached
          </span>
        )}
      </div>

      <div className="pt-1">
        <button type="submit" disabled={submitting} className="btn-primary gap-2">
          {submitting ? <><Spinner /> Submitting…</> : 'Submit Issue'}
        </button>
      </div>
    </form>
  );
}

// ─── Worker Queue ───────────────────────────────────────────────────────────────

const WORKER_STATUSES = ['Started', 'In Progress', 'Completed'];

function WorkerQueue() {
  const toast = useToast();
  const [issues,  setIssues]  = useState([]);
  const [loading, setLoading] = useState(true);

  // Proposal form state (one per issue, keyed by id)
  const [proposalForm, setProposalForm] = useState(null); // { issueId, desc, days, budget }
  const [statusForm,   setStatusForm]   = useState(null); // { issueId, status, note }
  const [busy, setBusy] = useState(false);

  const fetchIssues = useCallback(() => {
    api.get('/worker/issues')
      .then(r => setIssues(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const openProposalForm = (issue) => {
    setStatusForm(null);
    setProposalForm({
      issueId: issue._id,
      isUpdate: issue.status === 'Proposal Rejected',
      desc: '', days: '', budget: '',
    });
  };

  const openStatusForm = (issue) => {
    setProposalForm(null);
    setStatusForm({
      issueId: issue._id,
      status: 'Started',
      note: '',
    });
  };

  const submitProposal = async () => {
    if (!proposalForm.desc || !proposalForm.days || !proposalForm.budget) {
      toast({ type: 'error', message: 'All proposal fields are required.' });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        description: proposalForm.desc,
        estimated_timeline_days: parseInt(proposalForm.days, 10),
        estimated_budget: parseFloat(proposalForm.budget),
      };
      if (proposalForm.isUpdate) {
        await api.put(`/worker/issues/${proposalForm.issueId}/proposal`, payload);
      } else {
        await api.post(`/worker/issues/${proposalForm.issueId}/proposal`, payload);
      }
      toast({ type: 'success', message: 'Proposal submitted successfully.' });
      setProposalForm(null);
      fetchIssues();
    } catch (e) {
      toast({ type: 'error', message: e.response?.data?.detail || 'Failed to submit proposal.' });
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async () => {
    setBusy(true);
    try {
      await api.patch(`/worker/issues/${statusForm.issueId}/status`, {
        status: statusForm.status,
        note: statusForm.note,
        photos: [],
      });
      toast({ type: 'success', message: `Status updated to "${statusForm.status}".` });
      setStatusForm(null);
      fetchIssues();
    } catch (e) {
      toast({ type: 'error', message: e.response?.data?.detail || 'Failed to update status.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Spinner /> Loading assigned tasks…
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Briefcase size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Assigned Tasks</h2>
        {issues.length > 0 && (
          <span className="ml-auto text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {issues.length}
          </span>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          No issues assigned to you yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {issues.map(issue => (
            <div key={issue._id} data-testid="worker-issue-row">
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{issue.issue_number}</span>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="font-medium text-gray-900 text-sm line-clamp-1">{issue.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{issue.location?.area}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {(issue.status === 'Assigned' || issue.status === 'Proposal Rejected') && (
                    <button
                      onClick={() => proposalForm?.issueId === issue._id ? setProposalForm(null) : openProposalForm(issue)}
                      className="btn-secondary text-xs gap-1.5"
                    >
                      <ClipboardList size={13} />
                      {proposalForm?.issueId === issue._id ? 'Cancel' : issue.status === 'Proposal Rejected' ? 'Revise Proposal' : 'Submit Proposal'}
                    </button>
                  )}
                  {['Proposal Approved','Started','In Progress','Needs Rework'].includes(issue.status) && (
                    <button
                      onClick={() => statusForm?.issueId === issue._id ? setStatusForm(null) : openStatusForm(issue)}
                      className="btn-primary text-xs gap-1.5"
                    >
                      <ArrowRight size={13} />
                      {statusForm?.issueId === issue._id ? 'Cancel' : 'Update Status'}
                    </button>
                  )}
                  <Link to={`/issues/${issue._id}`} className="btn-secondary text-xs">
                    View
                  </Link>
                </div>
              </div>

              {/* Inline proposal form */}
              {proposalForm?.issueId === issue._id && (
                <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 pt-4 mb-3">
                    {proposalForm.isUpdate ? 'Revise Proposal' : 'New Proposal'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Estimated Days</label>
                      <input
                        type="number" min="1"
                        className="input-field text-sm"
                        placeholder="e.g. 7"
                        value={proposalForm.days}
                        onChange={e => setProposalForm(p => ({ ...p, days: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Estimated Budget (₹)</label>
                      <input
                        type="number" min="0" step="100"
                        className="input-field text-sm"
                        placeholder="e.g. 5000"
                        value={proposalForm.budget}
                        onChange={e => setProposalForm(p => ({ ...p, budget: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <label className="text-xs font-medium text-gray-600">Description</label>
                    <textarea
                      rows={3}
                      className="input-field text-sm resize-none"
                      placeholder="Describe your resolution approach…"
                      value={proposalForm.desc}
                      onChange={e => setProposalForm(p => ({ ...p, desc: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={submitProposal} disabled={busy} className="btn-primary text-sm gap-1.5">
                      {busy ? <Spinner size={13} /> : <CheckCircle size={13} />}
                      Submit Proposal
                    </button>
                    <button onClick={() => setProposalForm(null)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Inline status update form */}
              {statusForm?.issueId === issue._id && (
                <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 pt-4 mb-3">Update Work Status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">New Status</label>
                      <select
                        className="input-field text-sm bg-white"
                        value={statusForm.status}
                        onChange={e => setStatusForm(s => ({ ...s, status: e.target.value }))}
                      >
                        {WORKER_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <label className="text-xs font-medium text-gray-600">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea
                      rows={2}
                      className="input-field text-sm resize-none"
                      placeholder="Any field observations…"
                      value={statusForm.note}
                      onChange={e => setStatusForm(s => ({ ...s, note: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={updateStatus} disabled={busy} className="btn-primary text-sm gap-1.5">
                      {busy ? <Spinner size={13} /> : <CheckCircle size={13} />}
                      Save Update
                    </button>
                    <button onClick={() => setStatusForm(null)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Auditor Queue ──────────────────────────────────────────────────────────────

function AuditorQueue() {
  const toast = useToast();
  const [issues,  setIssues]  = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // { type, issueId, note, workerId }
  const [modal, setModal] = useState(null);
  const [assignMap, setAssignMap] = useState({}); // issueId → workerId

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get('/auditor/issues'),
      api.get('/auditor/workers'),
    ])
      .then(([issRes, wkRes]) => {
        setIssues(issRes.data);
        setWorkers(wkRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = (type, issueId) => setModal({ type, issueId, note: '' });
  const closeModal = () => setModal(null);

  const confirmAction = async () => {
    if (!modal) return;
    const actionCfg = MODAL_CONFIG[modal.type];
    if (actionCfg?.required && !modal.note.trim()) {
      toast({ type: 'error', message: 'A note is required for this action.' });
      return;
    }
    setBusy(true);
    try {
      switch (modal.type) {
        case 'validate':
          await api.patch(`/auditor/issues/${modal.issueId}/review`, { valid: true, reason: modal.note });
          toast({ type: 'success', message: 'Issue marked as valid.' });
          break;
        case 'close':
          await api.patch(`/auditor/issues/${modal.issueId}/review`, { valid: false, reason: modal.note });
          toast({ type: 'success', message: 'Issue closed.' });
          break;
        case 'approve-proposal':
          await api.patch(`/auditor/issues/${modal.issueId}/proposal/review`, { approved: true, note: modal.note });
          toast({ type: 'success', message: 'Proposal approved.' });
          break;
        case 'reject-proposal':
          await api.patch(`/auditor/issues/${modal.issueId}/proposal/review`, { approved: false, note: modal.note });
          toast({ type: 'success', message: 'Proposal sent back to worker.' });
          break;
        case 'resolve':
          await api.patch(`/auditor/issues/${modal.issueId}/final-review`, { resolved: true, note: modal.note });
          toast({ type: 'success', message: 'Issue resolved. 🎉' });
          break;
        case 'rework':
          await api.patch(`/auditor/issues/${modal.issueId}/final-review`, { resolved: false, note: modal.note });
          toast({ type: 'info', message: 'Issue sent back for rework.' });
          break;
        default:
          break;
      }
      closeModal();
      fetchAll();
    } catch (e) {
      toast({ type: 'error', message: e.response?.data?.detail || 'Action failed.' });
    } finally {
      setBusy(false);
    }
  };

  const assignWorker = async (issueId) => {
    const workerId = assignMap[issueId];
    if (!workerId) {
      toast({ type: 'error', message: 'Please select a worker first.' });
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/auditor/issues/${issueId}/assign`, { worker_id: workerId });
      toast({ type: 'success', message: 'Worker assigned successfully.' });
      setAssignMap(m => ({ ...m, [issueId]: '' }));
      fetchAll();
    } catch (e) {
      toast({ type: 'error', message: e.response?.data?.detail || 'Assignment failed.' });
    } finally {
      setBusy(false);
    }
  };

  const MODAL_CONFIG = {
    'validate':         { title: 'Mark Issue as Valid', confirmLabel: 'Confirm Valid',     confirmClass: 'btn-primary',  noteLabel: 'Validation note (optional)', required: false },
    'close':            { title: 'Close Issue',         confirmLabel: 'Close Issue',        confirmClass: 'btn-danger',   noteLabel: 'Reason for closure *',       required: true  },
    'approve-proposal': { title: 'Approve Proposal',    confirmLabel: 'Approve',            confirmClass: 'btn-primary',  noteLabel: 'Note to worker (optional)',  required: false },
    'reject-proposal':  { title: 'Reject Proposal',     confirmLabel: 'Reject Proposal',    confirmClass: 'btn-danger',   noteLabel: 'Feedback for worker *',      required: true  },
    'resolve':          { title: 'Resolve Issue',        confirmLabel: 'Mark Resolved',      confirmClass: 'btn-primary',  noteLabel: 'Closing note (optional)',    required: false },
    'rework':           { title: 'Request Rework',       confirmLabel: 'Send Back',          confirmClass: 'btn-danger',   noteLabel: 'What needs to be redone? *', required: true  },
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Spinner /> Loading issue queue…
        </div>
      </div>
    );
  }

  const cfg = modal ? MODAL_CONFIG[modal.type] : null;

  return (
    <>
      <div className="card">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <ClipboardList size={18} className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Issue Queue</h2>
          {issues.length > 0 && (
            <span className="ml-auto text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
              {issues.length}
            </span>
          )}
        </div>

        {issues.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">No issues in queue.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {issues.map(issue => (
              <div key={issue._id} className="px-6 py-4" data-testid="auditor-issue-row">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{issue.issue_number}</span>
                      <StatusBadge status={issue.status} />
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{issue.location?.area} · {issue.category}</p>
                    <Link to={`/issues/${issue._id}`} className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block">
                      View details →
                    </Link>
                  </div>

                  <div className="shrink-0 flex flex-wrap items-center gap-2">
                    {issue.status === 'Submitted' && (
                      <>
                        <button onClick={() => openModal('validate', issue._id)} className="btn-primary text-xs gap-1">
                          <CheckCircle size={12} /> Mark Valid
                        </button>
                        <button onClick={() => openModal('close', issue._id)} className="btn-danger text-xs gap-1">
                          <XCircle size={12} /> Close
                        </button>
                      </>
                    )}

                    {issue.status === 'Under Review' && (
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
                        <select
                          className="input-field py-1 px-2 text-xs bg-white"
                          value={assignMap[issue._id] || ''}
                          onChange={e => setAssignMap(m => ({ ...m, [issue._id]: e.target.value }))}
                        >
                          <option value="">— Select worker —</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.readable_id})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignWorker(issue._id)}
                          disabled={busy || !assignMap[issue._id]}
                          className="btn-primary text-xs gap-1 disabled:opacity-50 whitespace-nowrap"
                        >
                          <UserCheck size={12} /> Assign
                        </button>
                      </div>
                    )}

                    {issue.status === 'Proposal Submitted' && (
                      <>
                        <button onClick={() => openModal('approve-proposal', issue._id)} className="btn-primary text-xs gap-1">
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => openModal('reject-proposal', issue._id)} className="btn-danger text-xs gap-1">
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}

                    {issue.status === 'Completed' && (
                      <>
                        <button onClick={() => openModal('resolve', issue._id)} className="btn-primary text-xs gap-1">
                          <CheckCircle size={12} /> Resolve
                        </button>
                        <button onClick={() => openModal('rework', issue._id)} className="btn-danger text-xs gap-1">
                          <XCircle size={12} /> Needs Rework
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action modal */}
      <Modal open={!!modal} onClose={closeModal} title={cfg?.title ?? ''}>
        {cfg && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{cfg.noteLabel}</label>
              <textarea
                rows={3}
                autoFocus
                className="input-field text-sm resize-none"
                placeholder="Type here…"
                value={modal.note}
                onChange={e => setModal(m => ({ ...m, note: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={confirmAction} disabled={busy} data-testid="modal-confirm-btn" className={`${cfg.confirmClass} text-sm gap-2`}>
                {busy ? <Spinner size={14} /> : null}
                {cfg.confirmLabel}
              </button>
              <button onClick={closeModal} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── My Issues sidebar ─────────────────────────────────────────────────────────

function MyIssuesList({ refreshKey }) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    api.get('/issues/my').then(r => setIssues(r.data)).catch(console.error);
  }, [refreshKey]);

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">My Reported Issues</h2>
      </div>
      {issues.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-400 text-center">Nothing reported yet.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {issues.map(issue => (
            <Link
              key={issue._id}
              to={`/issues/${issue._id}`}
              data-testid="my-issue-item"
              className="flex items-start justify-between gap-2 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{issue.title}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{issue.issue_number}</p>
              </div>
              <StatusBadge status={issue.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard (main) ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [showIssueForm, setShowIssueForm] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Please sign in to view the dashboard.
        </div>
      </div>
    );
  }

  const onIssueSubmitted = () => {
    setRefreshKey(k => k + 1);
    if (user.role !== 'citizen') setShowIssueForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as{' '}
            <span className="font-semibold capitalize text-gray-700">{user.role}</span>
            {' '}·{' '}
            <span className="font-mono text-gray-400">{user.readable_id}</span>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {user.role === 'worker'  && <WorkerQueue />}
            {user.role === 'auditor' && <AuditorQueue />}

            {/* Issue submit — always shown for citizens, collapsible for others */}
            {user.role === 'citizen' ? (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <PlusCircle size={18} className="text-primary-600" /> Report a New Issue
                </h2>
                <SubmitIssueForm onSuccess={onIssueSubmitted} />
              </div>
            ) : (
              <div className="card overflow-hidden">
                <button
                  onClick={() => setShowIssueForm(v => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle size={16} className="text-primary-600" />
                    Report a civic issue yourself
                  </span>
                  {showIssueForm ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {showIssueForm && (
                  <div className="px-6 pb-6 border-t border-gray-50 pt-5">
                    <SubmitIssueForm onSuccess={onIssueSubmitted} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <MyIssuesList refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
