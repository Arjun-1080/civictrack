import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Camera, Upload } from 'lucide-react';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <div className="p-8 text-center">Please log in to view the dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="mt-1 text-gray-600">Your role: <span className="font-semibold capitalize text-primary-600">{user.role}</span> | ID: {user.readable_id}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-8">
            {user.role === 'worker' && <WorkerQueue />}
            {user.role === 'auditor' && <AuditorQueue />}
            
            {(user.role === 'citizen') && <SubmitIssueForm />}
            {(user.role !== 'citizen') && (
              <details className="card p-6 cursor-pointer">
                <summary className="text-lg font-bold text-gray-700">Want to report an issue yourself?</summary>
                <div className="mt-4 cursor-default">
                  <SubmitIssueForm />
                </div>
              </details>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <MyIssuesList />
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitIssueForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [area, setArea] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/issues', {
        title,
        description,
        category,
        location: { area, landmark: '' },
        photos: photoBase64 ? [photoBase64] : []
      });
      alert('Issue submitted successfully!');
      setTitle(''); setDescription(''); setArea(''); setPhotoBase64('');
      if(fileInputRef.current) fileInputRef.current.value = '';
      window.location.reload(); // Quick refresh for demo
    } catch (error) {
      alert('Error submitting issue');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6 border-t-4 border-t-primary-500">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Report a New Issue</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
            <input required type="text" className="input-field" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Deep pothole on Main St." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="input-field bg-white" value={category} onChange={e=>setCategory(e.target.value)}>
              <option>Pothole</option>
              <option>Garbage</option>
              <option>Streetlight</option>
              <option>Water Leakage</option>
              <option>Sewage</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area / Landmark</label>
          <input required type="text" className="input-field" value={area} onChange={e=>setArea(e.target.value)} placeholder="e.g. Near Central Park" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea required rows="3" className="input-field" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the severity and exact location..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
          <div className="flex items-center space-x-4">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center">
              <Camera size={18} className="mr-2" /> Select Photo
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            {photoBase64 && <span className="text-sm text-green-600 font-medium">✓ Photo attached</span>}
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={submitting} className="btn-primary w-full md:w-auto">
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </div>
      </form>
    </div>
  );
}

function WorkerQueue() {
  const [issues, setIssues] = useState([]);
  
  useEffect(() => {
    api.get('/worker/issues').then(res => setIssues(res.data)).catch(console.error);
  }, []);

  const submitProposal = async (issueId) => {
    const desc = prompt("Enter proposal description:");
    const days = prompt("Estimated days:");
    const budget = prompt("Estimated budget (₹):");
    if(desc && days && budget) {
      try {
        await api.post(`/worker/issues/${issueId}/proposal`, {
          description: desc,
          estimated_timeline_days: parseInt(days),
          estimated_budget: parseFloat(budget)
        });
        alert('Proposal submitted');
        window.location.reload();
      } catch (e) { alert(e.response?.data?.detail || 'Error'); }
    }
  };

  const updateStatus = async (issueId) => {
    const status = prompt("Enter status (Started, In Progress, Completed):");
    const note = prompt("Any notes?");
    if(status) {
      try {
        await api.patch(`/worker/issues/${issueId}/status`, { status, note, photos: [] });
        alert('Status updated');
        window.location.reload();
      } catch (e) { alert(e.response?.data?.detail || 'Error'); }
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">Assigned Tasks (Worker Queue)</h2>
      {issues.length === 0 ? <p className="text-gray-500">No issues assigned to you.</p> : (
        <div className="space-y-4">
          {issues.map(issue => (
            <div key={issue._id} className="border p-4 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-bold">{issue.issue_number} - {issue.title}</div>
                <div className="text-sm text-gray-500">Status: {issue.status}</div>
              </div>
              <div className="space-x-2">
                {(issue.status === 'Assigned' || issue.status === 'Proposal Rejected') && (
                  <button onClick={() => submitProposal(issue._id)} className="btn-secondary text-sm">Submit Proposal</button>
                )}
                {(['Proposal Approved', 'Started', 'In Progress', 'Needs Rework'].includes(issue.status)) && (
                  <button onClick={() => updateStatus(issue._id)} className="btn-primary text-sm">Update Status</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditorQueue() {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assigningIssueId, setAssigningIssueId] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  useEffect(() => {
    api.get('/auditor/issues').then(res => setIssues(res.data)).catch(console.error);
    api.get('/auditor/workers').then(res => setWorkers(res.data)).catch(console.error);
  }, []);

  const reviewIssue = async (issueId, valid) => {
    const actionName = valid ? "Validation" : "Closure";
    const reason = prompt(`Please enter a note/reason for ${actionName}:`);
    if (reason === null) return; // User clicked Cancel
    if (!valid && !reason.trim()) {
      alert("A reason is required to close an issue.");
      return;
    }
    try {
      await api.patch(`/auditor/issues/${issueId}/review`, { valid, reason });
      window.location.reload();
    } catch(e) { alert('Error'); }
  };

  const confirmAssign = async (issueId) => {
    if(!selectedWorkerId) return alert('Please select a worker from the dropdown.');
    try {
      await api.patch(`/auditor/issues/${issueId}/assign`, { worker_id: selectedWorkerId });
      window.location.reload();
    } catch(e) { alert('Error'); }
  };

  const reviewProposal = async (issueId, approved) => {
    const note = prompt("Any notes?");
    try {
      await api.patch(`/auditor/issues/${issueId}/proposal/review`, { approved, note });
      window.location.reload();
    } catch(e) { alert('Error'); }
  };

  const finalReview = async (issueId, resolved) => {
    const note = prompt("Any notes?");
    try {
      await api.patch(`/auditor/issues/${issueId}/final-review`, { resolved, note });
      window.location.reload();
    } catch(e) { alert('Error'); }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">All Issues (Auditor Queue)</h2>
      <div className="space-y-4">
        {issues.map(issue => (
          <div key={issue._id} className="border p-4 rounded-lg flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="font-bold">{issue.issue_number} - {issue.title}</div>
              <div className="text-sm text-gray-500 mb-1">Status: <span className="font-semibold text-primary-600">{issue.status}</span></div>
              <Link to={`/issues/${issue._id}`} className="text-sm text-blue-600 hover:underline">View Issue Details & Evidence &rarr;</Link>
            </div>
            
            <div className="space-x-2 flex flex-wrap gap-2 items-center">
              {issue.status === 'Submitted' && (
                <>
                  <button onClick={() => reviewIssue(issue._id, true)} className="btn-primary text-sm bg-green-600 border-0">Mark Valid</button>
                  <button onClick={() => reviewIssue(issue._id, false)} className="btn-secondary text-sm text-red-600">Close Issue</button>
                </>
              )}
              {issue.status === 'Under Review' && (
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                  <select 
                    className="input-field py-1 px-2 text-sm" 
                    value={assigningIssueId === issue._id ? selectedWorkerId : ''} 
                    onChange={(e) => { setAssigningIssueId(issue._id); setSelectedWorkerId(e.target.value); }}
                  >
                    <option value="">-- Select Worker --</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.readable_id})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => confirmAssign(issue._id)} 
                    disabled={assigningIssueId !== issue._id || !selectedWorkerId}
                    className="btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              )}
              {issue.status === 'Proposal Submitted' && (
                <>
                  <button onClick={() => reviewProposal(issue._id, true)} className="btn-primary text-sm bg-green-600 border-0">Approve Proposal</button>
                  <button onClick={() => reviewProposal(issue._id, false)} className="btn-secondary text-sm text-red-600">Reject Proposal</button>
                </>
              )}
              {issue.status === 'Completed' && (
                <>
                  <button onClick={() => finalReview(issue._id, true)} className="btn-primary text-sm bg-green-600 border-0">Resolve Issue</button>
                  <button onClick={() => finalReview(issue._id, false)} className="btn-secondary text-sm text-yellow-600">Needs Rework</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyIssuesList() {
  const [issues, setIssues] = useState([]);
  useEffect(() => {
    api.get('/issues/my').then(res => setIssues(res.data)).catch(console.error);
  }, []);
  
  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">My Submitted Issues</h2>
      {issues.length === 0 ? <p className="text-gray-500">No issues reported yet.</p> : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div key={issue._id} className="border-b pb-2">
              <div className="font-semibold text-gray-800 line-clamp-1">{issue.title}</div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{issue.issue_number}</span>
                <span className="text-xs font-medium text-primary-600">{issue.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
