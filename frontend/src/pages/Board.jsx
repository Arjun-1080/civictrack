import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { statusBadge } from '../utils/status';
import { Clock, MapPin, AlertCircle, Filter, X } from 'lucide-react';

const CATEGORIES = ['All', 'Pothole', 'Garbage', 'Streetlight', 'Water Leakage', 'Sewage', 'Tree Fall', 'Other'];
const STATUSES   = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Completed', 'Resolved', 'Invalid / Closed'];

const CATEGORY_ICON = {
  Pothole:        '🕳️',
  Garbage:        '🗑️',
  Streetlight:    '💡',
  'Water Leakage':'💧',
  Sewage:         '🚰',
  'Tree Fall':    '🌳',
  Other:          '📋',
};

function Skeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
        <div className="h-5 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Board() {
  const [issues,  setIssues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter,  setCatFilter]  = useState('All');
  const [statFilter, setStatFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/issues')
      .then(r => setIssues(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return issues.filter(issue => {
      const matchCat  = catFilter  === 'All' || issue.category === catFilter;
      const matchStat = statFilter === 'All' || issue.status   === statFilter;
      const matchSearch = !search.trim() ||
        issue.title.toLowerCase().includes(search.toLowerCase()) ||
        issue.location?.area?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStat && matchSearch;
    });
  }, [issues, catFilter, statFilter, search]);

  const hasActiveFilters = catFilter !== 'All' || statFilter !== 'All' || search;

  const clearFilters = () => {
    setCatFilter('All');
    setStatFilter('All');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Public Issues Board</h1>
              <p className="mt-1 text-sm text-gray-500">
                {loading ? 'Loading…' : `${filtered.length} issue${filtered.length !== 1 ? 's' : ''}${hasActiveFilters ? ' matching filters' : ' reported'}`}
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by title or area…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pr-8 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Filter size={13} />
              Filter:
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                    catFilter === c
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {c !== 'All' && CATEGORY_ICON[c] ? `${CATEGORY_ICON[c]} ` : ''}{c}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-gray-200 hidden sm:block" />

            {/* Status pills */}
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatFilter(s)}
                  className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                    statFilter === s
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 ml-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold">No issues found</p>
            <p className="text-gray-400 text-sm mt-1">
              {hasActiveFilters ? 'Try clearing some filters.' : 'No civic issues have been reported yet.'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 btn-secondary text-sm">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(issue => (
              <Link
                to={`/issues/${issue._id}`}
                key={issue._id}
                data-testid="issue-card"
                className="card hover:shadow-card-hover transition-shadow group cursor-pointer flex flex-col h-full"
              >
                {/* Image */}
                {issue.photos?.length > 0 ? (
                  <div className="h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={issue.photos[0]}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-3xl select-none">
                    {CATEGORY_ICON[issue.category] || '📋'}
                  </div>
                )}

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-medium text-gray-400">{issue.issue_number}</span>
                    <span className={`badge text-[10px] shrink-0 ${statusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">
                    {issue.title}
                  </h3>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{issue.location?.area || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock size={12} />
                      {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">
                      {CATEGORY_ICON[issue.category]} {issue.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
