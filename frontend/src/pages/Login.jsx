import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { KeyRound, Mail, UserCheck, ShieldAlert, BookOpen, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('parent'); // default role is parent
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (authAPI.isAuthenticated()) {
      const user = authAPI.getCurrentUser();
      if (user) {
        navigate(`/${user.role}`);
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or Teacher ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(identifier, password);
      const user = response.user;
      
      // Enforce role separation matching the selected tab
      if (user.role !== role) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError(`Access denied. Incorrect credentials for ${role} login.`);
        return;
      }
      
      // Navigate to correct dashboard based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/parent');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierPlaceholder = () => {
    if (role === 'parent') return 'parent@gmail.com';
    if (role === 'teacher') return 'Teacher ID (e.g. TCH2) or email';
    return 'admin@intellitots.com';
  };

  const getIdentifierLabel = () => {
    if (role === 'parent') return 'Parent Email Address';
    if (role === 'teacher') return 'Teacher ID / Email';
    return 'Admin Email Address';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden flex flex-col">
        {/* Soft Decorative Header */}
        <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 px-6 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-sky-300 opacity-20 rounded-full -translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-sky-200 opacity-20 rounded-full translate-x-8 translate-y-8"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="bg-white/15 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-2">FirstCry Intellitots</h1>
            <p className="text-xs text-sky-100 font-medium max-w-xs uppercase tracking-wider">
              Parent-Teacher Meeting Portal
            </p>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 flex-1">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-6">
            Sign In to Your Account
          </h2>

          {/* Role selector buttons */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            {['parent', 'teacher', 'admin'].map((roleType) => (
              <button
                key={roleType}
                type="button"
                onClick={() => {
                  setRole(roleType);
                  setIdentifier('');
                  setPassword('');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-wide capitalize transition-all duration-200 ${
                  role === roleType
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {roleType === 'admin' ? 'Admin' : roleType}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username/Email Identifier Input */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-bold text-slate-600">
                {getIdentifierLabel()}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={getIdentifierPlaceholder()}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm placeholder-slate-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-600">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4.5 w-4.5" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm placeholder-slate-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 rounded-2xl font-bold text-sm tracking-wide shadow-md shadow-sky-100 hover:shadow-lg hover:shadow-sky-100 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* User helper guide (reminds them of seeded data) */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Demo Accounts Guide
            </span>
            <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed text-left space-y-1">
              <div><strong className="text-sky-600">Parent:</strong> ramesh@gmail.com / password123</div>
              <div><strong className="text-sky-600">Teacher:</strong> TCH2 (or shalini@intellitots.com) / password123</div>
              <div><strong className="text-sky-600">Admin:</strong> admin@intellitots.com / password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
