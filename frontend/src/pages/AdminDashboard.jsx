import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  Check, 
  X, 
  CalendarClock, 
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  BookmarkCheck,
  RefreshCw,
  TrendingUp,
  Sliders,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    rejected: 0,
    completed: 0,
    rescheduled: 0
  });

  const [meetings, setMeetings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedMetrics = await adminAPI.getDashboard();
      setMetrics(fetchedMetrics);

      const fetchedTeachers = await adminAPI.getTeachersList();
      setTeachers(fetchedTeachers);

      // Fetch all meetings to compile dashboard views
      const allMeetings = await adminAPI.getMeetings();
      setMeetings(allMeetings);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Rescheduled: 'bg-sky-50 text-sky-700 border-sky-200',
      Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
      Completed: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  // Compile stats
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Today's meetings
  const todayMeetings = meetings.filter(m => 
    m.meeting_date === todayStr && 
    (m.status === 'Confirmed' || m.status === 'Rescheduled')
  );

  // 2. Urgent pending requests
  const pendingRequests = meetings.filter(m => m.status === 'Pending');

  // 3. Teacher Load calculations
  const teacherLoadMap = {};
  teachers.forEach(t => {
    teacherLoadMap[t.id] = {
      name: t.teacher_name,
      spec: t.specialization,
      count: 0
    };
  });
  
  meetings.forEach(m => {
    if (m.status !== 'Completed' && m.status !== 'Rejected' && teacherLoadMap[m.teacher_id]) {
      teacherLoadMap[m.teacher_id].count += 1;
    }
  });

  const teacherLoads = Object.values(teacherLoadMap).sort((a, b) => b.count - a.count);

  // Status Distribution percentages
  const total = metrics.total || 1;
  const getPercent = (val) => Math.round((val / total) * 100);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Analytics & School Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visual statistics, active schedules, and workload analysis for Centre Heads.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sessions</span>
            <span className="text-lg font-extrabold text-slate-800 block">{metrics.total}</span>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
            <span className="text-lg font-extrabold text-slate-800 block">{metrics.pending}</span>
          </div>
        </div>

        {/* Confirmed Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirmed</span>
            <span className="text-lg font-extrabold text-slate-800 block">{metrics.confirmed}</span>
          </div>
        </div>

        {/* Rescheduled Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rescheduled</span>
            <span className="text-lg font-extrabold text-slate-800 block">{metrics.rescheduled}</span>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
            <BookmarkCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
            <span className="text-lg font-extrabold text-slate-800 block">{metrics.completed}</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected</span>
            <span className="text-lg font-extrabold text-slate-800 block">{metrics.rejected}</span>
          </div>
        </div>

      </div>

      {/* Grid: Charts vs Teacher Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Distribution Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingUp className="h-5 w-5 text-sky-500" />
            <h2 className="font-bold text-slate-800 text-sm">Meeting Status Distribution</h2>
          </div>

          <div className="space-y-4">
            {/* Confirmed Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Confirmed Meetings</span>
                <span>{metrics.confirmed} ({getPercent(metrics.confirmed)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercent(metrics.confirmed)}%` }}
                />
              </div>
            </div>

            {/* Pending Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Pending Review</span>
                <span>{metrics.pending} ({getPercent(metrics.pending)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercent(metrics.pending)}%` }}
                />
              </div>
            </div>

            {/* Completed Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Completed Sessions</span>
                <span>{metrics.completed} ({getPercent(metrics.completed)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercent(metrics.completed)}%` }}
                />
              </div>
            </div>

            {/* Rescheduled Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Rescheduled Slots</span>
                <span>{metrics.rescheduled} ({getPercent(metrics.rescheduled)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercent(metrics.rescheduled)}%` }}
                />
              </div>
            </div>

            {/* Rejected Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Rejected Requests</span>
                <span>{metrics.rejected} ({getPercent(metrics.rejected)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercent(metrics.rejected)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Workload Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="h-5 w-5 text-sky-500" />
            <h2 className="font-bold text-slate-800 text-sm">Active Teacher Load</h2>
          </div>

          {loading ? (
            <div className="text-center text-xs text-slate-400 py-6">Loading load stats...</div>
          ) : teacherLoads.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6">No load statistics.</div>
          ) : (
            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {teacherLoads.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{t.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[170px]">{t.spec}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                    t.count >= 4 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}>
                    {t.count} Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Grid: Today's Schedule vs Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Today's Meetings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <h2 className="font-bold text-slate-800 text-sm">Today's Scheduled Meetings</h2>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-md">
              {todayMeetings.length}
            </span>
          </div>

          {loading ? (
            <div className="text-center text-xs text-slate-400 py-6">Loading...</div>
          ) : todayMeetings.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">
              No meetings confirmed for today.
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {todayMeetings.map(m => (
                <div key={m.id} className="p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">{m.student_name}</span>
                    <span className="text-[10px] text-slate-400 block">Parent: {m.parent_name} | Class: {m.class_name}</span>
                    <span className="text-[10px] text-slate-500 block">Teacher: {m.teacher_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 block">{m.meeting_time}</span>
                    {getStatusBadge(m.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-slate-800 text-sm">Pending Actions (Needs Confirmation)</h2>
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md">
              {pendingRequests.length}
            </span>
          </div>

          {loading ? (
            <div className="text-center text-xs text-slate-400 py-6">Loading...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">
              All bookings processed. No actions pending.
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {pendingRequests.map(m => (
                <div key={m.id} className="p-3 bg-amber-50/10 border border-amber-100/40 rounded-xl flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">{m.student_name} ({m.class_name})</span>
                    <span className="text-[10px] text-slate-400 block">Date: {formatDate(m.meeting_date)} | Time: {m.meeting_time}</span>
                    <span className="text-[10px] text-slate-500 block">Assigned to: {m.teacher_name}</span>
                  </div>
                  <Link 
                    to="/admin/meetings" 
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors flex items-center justify-center"
                    title="Review Request"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
