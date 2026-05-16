import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { statusBadge, statusDot } from '../utils/status';
import { MapPin, Clock, ArrowLeft, ImageIcon, Tag, IndianRupee } from 'lucide-react';

export default function IssueDetail() {
  const { id } = useParams();
  const [issue,    setIssue]    = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/issues/${id}`),
      api.get(`/issues/${id}/timeline`),
    ])
      .then(([issueRes, tlRes]) => {
        setIssue(issueRes.data);
        setTimeline(tlRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="card p-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 font-medium">Issue not found.</p>
          <Link to="/board" className="mt-4 inline-block btn-secondary text-sm">← Back to Board</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

        {/* Back link */}
        <Link
          to="/board"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Board
        </Link>

        {/* Issue card */}
        <div className="card p-6 md:p-8 mb-8">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                  {issue.issue_number}
                </span>
                <span className={`badge text-xs ${statusBadge(issue.status)}`}>
                  {issue.status}
                </span>
                <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                  {issue.category}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                {issue.title}
              </h1>
            </div>

            {issue.estimated_budget != null && (
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-center shrink-0">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-0.5">
                  Approved Budget
                </div>
                <div className="flex items-center justify-center gap-0.5 text-xl font-bold text-emerald-700">
                  <IndianRupee size={18} />
                  {issue.estimated_budget.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-5 mb-5 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              {issue.location?.area}
              {issue.location?.landmark && ` · ${issue.location.landmark}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              {new Date(issue.created_at).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 leading-relaxed mb-6">
            {issue.description}
          </p>

          {/* Photos */}
          {issue.photos?.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                <ImageIcon size={15} className="text-gray-400" /> Evidence Photos
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {issue.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Evidence ${i + 1}`}
                    className="h-40 w-auto rounded-lg object-cover border border-gray-100 shrink-0 cursor-zoom-in"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-6">Progress Timeline</h2>

          {timeline.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">
              No timeline entries yet.
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-200 -z-0" />

              <div className="space-y-4">
                {timeline.map((entry, idx) => (
                  <div key={entry._id ?? idx} className="relative flex gap-4">
                    {/* Dot */}
                    <div className={`relative z-10 h-9 w-9 rounded-full border-4 border-white shadow-sm shrink-0 flex items-center justify-center ${statusDot(entry.status_to)}`}>
                      <span className="text-white text-xs font-bold">{idx + 1}</span>
                    </div>

                    {/* Content */}
                    <div className="card p-4 flex-1 mb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{entry.stage}</span>
                        <time className="text-xs text-gray-400 shrink-0">
                          {new Date(entry.timestamp).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </time>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-700 font-medium">{entry.actor_name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                          {entry.actor_role}
                        </span>
                      </div>

                      {entry.note && (
                        <div className="mt-2 bg-gray-50 border-l-2 border-gray-300 pl-3 py-1.5 pr-3 rounded-r text-sm text-gray-600">
                          {entry.note}
                        </div>
                      )}

                      {entry.photos?.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {entry.photos.map((photo, i) => (
                            <img
                              key={i}
                              src={photo}
                              alt="Update"
                              className="h-20 w-auto rounded-lg object-cover border border-gray-100 shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
