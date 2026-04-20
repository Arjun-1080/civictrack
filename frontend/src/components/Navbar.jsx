import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, MapPin } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/board" className="flex items-center space-x-2 text-primary-600 font-bold text-xl">
              <MapPin />
              <span>CivicTrack</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link to="/board" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium">Public Board</Link>
              {user && (
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium">Dashboard</Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                  <span className="capitalize">{user.role}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>{user.name}</span>
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition p-2">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
