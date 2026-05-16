export const STATUS_BADGE = {
  'Submitted':         'bg-blue-100 text-blue-700 border border-blue-200',
  'Under Review':      'bg-amber-100 text-amber-700 border border-amber-200',
  'Assigned':          'bg-violet-100 text-violet-700 border border-violet-200',
  'Proposal Submitted':'bg-cyan-100 text-cyan-700 border border-cyan-200',
  'Proposal Rejected': 'bg-orange-100 text-orange-700 border border-orange-200',
  'Proposal Approved': 'bg-teal-100 text-teal-700 border border-teal-200',
  'Started':           'bg-indigo-100 text-indigo-700 border border-indigo-200',
  'In Progress':       'bg-purple-100 text-purple-700 border border-purple-200',
  'Completed':         'bg-lime-100 text-lime-800 border border-lime-200',
  'Needs Rework':      'bg-orange-100 text-orange-700 border border-orange-200',
  'Resolved':          'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Invalid / Closed':  'bg-red-100 text-red-700 border border-red-200',
};

export const STATUS_TIMELINE_DOT = {
  'Submitted':         'bg-blue-500',
  'Under Review':      'bg-amber-500',
  'Assigned':          'bg-violet-500',
  'Proposal Submitted':'bg-cyan-500',
  'Proposal Rejected': 'bg-orange-500',
  'Proposal Approved': 'bg-teal-500',
  'Started':           'bg-indigo-500',
  'In Progress':       'bg-purple-500',
  'Completed':         'bg-lime-500',
  'Needs Rework':      'bg-orange-500',
  'Resolved':          'bg-emerald-500',
  'Invalid / Closed':  'bg-red-500',
};

export function statusBadge(status) {
  return STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-700 border border-gray-200';
}

export function statusDot(status) {
  return STATUS_TIMELINE_DOT[status] ?? 'bg-gray-400';
}
