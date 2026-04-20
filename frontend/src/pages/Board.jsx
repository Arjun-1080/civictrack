import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Clock, MapPin, AlertCircle } from 'lucide-react';

export default function Board() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await api.get('/issues');
        setIssues(response.data);
      } catch (error) {
        console.error('Failed to fetch issues', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Invalid / Closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Public Issues Board</h1>
            <p className="mt-2 text-gray-600">Track and monitor civic issues reported in your area.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map(issue => (
              <Link to={`/issues/${issue._id}`} key={issue._id} className="card hover:shadow-md transition-shadow group cursor-pointer flex flex-col h-full">
                {issue.photos && issue.photos.length > 0 ? (
                  <div className="h-48 w-full bg-gray-200 overflow-hidden">
                    <img src={issue.photos[0]} alt="Issue" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <AlertCircle size={48} />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{issue.issue_number}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{issue.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-4 mt-auto">
                    <MapPin size={16} className="mr-1.5" />
                    <span className="truncate">{issue.location?.area || 'Unknown Location'}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400 pt-4 border-t border-gray-100">
                    <Clock size={14} className="mr-1" />
                    <span>Reported {new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
            
            {issues.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                No issues reported yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
