import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Clock, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [issue, setIssue] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        const [issueRes, timelineRes] = await Promise.all([
          api.get(`/issues/${id}`),
          api.get(`/issues/${id}/timeline`)
        ]);
        setIssue(issueRes.data);
        setTimeline(timelineRes.data);
      } catch (error) {
        console.error("Failed to load issue", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssueDetails();
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!issue) return <div className="p-12 text-center text-red-500">Issue not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/board" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back to Board
        </Link>
        
        <div className="card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{issue.issue_number}</span>
                <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800">{issue.status}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{issue.title}</h1>
            </div>
            {issue.estimated_budget && (
              <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-lg text-center shrink-0">
                <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Approved Budget</div>
                <div className="text-xl font-bold text-green-700">₹{issue.estimated_budget.toLocaleString()}</div>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center"><MapPin size={16} className="mr-1 text-gray-400" /> {issue.location?.area}</div>
            <div className="flex items-center"><Clock size={16} className="mr-1 text-gray-400" /> {new Date(issue.created_at).toLocaleString()}</div>
            <div className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{issue.category}</div>
          </div>
          
          <div className="prose max-w-none text-gray-800 mb-8">
            <p>{issue.description}</p>
          </div>

          {issue.photos && issue.photos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><ImageIcon size={16} className="mr-2"/> Evidence Photos</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {issue.photos.map((photo, i) => (
                  <img key={i} src={photo} alt="Evidence" className="h-48 rounded-lg object-cover border border-gray-200" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Progress Timeline</h2>
          <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
            {timeline.map((entry, idx) => (
              <div key={entry._id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute -left-2 top-1.5 h-4 w-4 rounded-full bg-primary-500 border-4 border-white shadow-sm"></div>
                
                <div className="card p-5">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{entry.stage}</h3>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <span className="font-medium">{entry.actor_name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{entry.actor_role}</span>
                  </div>
                  
                  {entry.note && (
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 border-l-2 border-gray-300">
                      {entry.note}
                    </div>
                  )}

                  {entry.photos && entry.photos.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {entry.photos.map((photo, i) => (
                        <img key={i} src={photo} alt="Update" className="h-24 rounded object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
