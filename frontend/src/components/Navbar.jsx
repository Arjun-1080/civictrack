import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Globe } from 'lucide-react';

const ROLE_COLORS = {
  auditor: 'bg-violet-100 text-violet-700',
  worker:  'bg-amber-100 text-amber-700',
  citizen: 'bg-blue-100 text-blue-700',
};

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label, Icon) => {
    const active = pathname === to || pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
          active
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        {Icon && <Icon size={15} />}
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Left: Logo + nav links */}
          <div className="flex items-center gap-6">
            <Link
              to="/board"
              className="flex items-center gap-2 font-bold text-gray-900 text-lg tracking-tight"
            >
              <span className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <Globe size={15} className="text-white" />
              </span>
              CivicTrack
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLink('/board', 'Public Board', null)}
              {user && navLink('/dashboard', 'Dashboard', null)}
            </div>
          </div>

          {/* Right: User info + actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {user.role}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{user.readable_id}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm px-3 py-1.5">
                  Get started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
