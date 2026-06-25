import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  Home, 
  Calendar, 
  BookOpen, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Shield, 
  FileText,
  PlusCircle
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authAPI.getCurrentUser() || { name: 'Guest', role: 'parent', email: '' };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    authAPI.logout();
  };

  const getNavigationLinks = () => {
    switch (user.role) {
      case 'parent':
        return [
          { name: 'Dashboard', path: '/parent', icon: Home },
          { name: 'Book Meeting', path: '/parent/book', icon: PlusCircle }
        ];
      case 'teacher':
        return [
          { name: 'My Dashboard', path: '/teacher', icon: Home },
          { name: 'Manage Meetings', path: '/teacher/meetings', icon: Calendar }
        ];
      case 'admin':
        return [
          { name: 'Analytics Dashboard', path: '/admin', icon: Home },
          { name: 'Manage Meetings', path: '/admin/meetings', icon: Calendar }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavigationLinks();

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Centre Head / Admin',
      teacher: 'Teacher Dashboard',
      parent: 'Parent Dashboard'
    };
    return labels[role] || role;
  };

  const getRoleBadgeStyle = (role) => {
    const styles = {
      admin: 'bg-red-50 text-red-600 border border-red-200',
      teacher: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      parent: 'bg-sky-50 text-sky-600 border border-sky-200'
    };
    return styles[role] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-700 md:hidden p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center gap-2">
              {/* Premium FirstCry Branding logo */}
              <div className="bg-gradient-to-r from-sky-400 to-sky-600 p-2 rounded-xl text-white shadow-md shadow-sky-100 flex items-center justify-center font-bold text-sm tracking-wide">
                FC
              </div>
              <div>
                <span className="font-bold text-slate-800 text-base sm:text-lg tracking-tight block">
                  FirstCry <span className="text-sky-500">Intellitots</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block -mt-1">
                  Meeting Scheduler
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User details capsule */}
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <span className="font-semibold text-slate-800 text-sm block">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {user.email}
                </span>
              </div>
              <div className="h-9 w-9 bg-sky-100 text-sky-700 flex items-center justify-center rounded-full font-bold text-sm border border-sky-200">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0">
          <div className="p-4 flex-1 flex flex-col gap-6">
            {/* User identity dashboard section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Logged in as</span>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getRoleBadgeStyle(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              {user.role === 'teacher' && user.teacherDetails && (
                <div className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-200/60 pt-1">
                  Spec: {user.teacherDetails.specialization}
                </div>
              )}
            </div>

            {/* Menu Links */}
            <nav className="flex-1 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-sky-50 text-sky-600 shadow-sm shadow-sky-50/50' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
            FirstCry Intellitots © 2026
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
              onClick={() => setSidebarOpen(false)}
            />
            {/* Menu container */}
            <div className="relative flex flex-col w-4/5 max-w-xs bg-white h-full shadow-2xl transition-transform duration-300">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-lg">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-6 w-6 text-slate-500" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-1.5">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">User Profile</span>
                  <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                  <div className="mt-1 flex">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRoleBadgeStyle(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive 
                            ? 'bg-sky-50 text-sky-600' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
