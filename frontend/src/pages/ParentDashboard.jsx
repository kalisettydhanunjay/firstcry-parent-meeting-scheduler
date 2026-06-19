import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentAPI } from '../services/api';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock3, 
  HelpCircle,
  FileText,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';

const ParentDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await parentAPI.getMyMeetings();
      setMeetings(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load meetings. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this meeting request?')) {
      return;
    }
    setCancelLoadingId(meetingId);
    try {
      await parentAPI.cancelMeeting(meetingId);
      // Refresh list
      await fetchMeetings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel the meeting.');
    } finally {
      setCancelLoadingId(null);
    }
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  // Grouping Meetings
  const pendingMeetings = meetings.filter(m => m.status === 'Pending' || m.status === 'Rescheduled');
  const upcomingMeetings = meetings.filter(m => m.status === 'Confirmed');
  const pastMeetings = meetings.filter(m => m.status === 'Completed' || m.status === 'Rejected');

  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome back, Parent!</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Book and manage your parent-teacher meetings for your child's progress.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/parent/book"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-100 hover:shadow-lg transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            Book a Meeting
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout for Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Upcoming & Pending */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Upcoming Meetings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CalendarCheck className="h-5 w-5 text-sky-500" />
              <h2 className="font-bold text-slate-800 text-base">Upcoming & Confirmed Meetings</h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading meetings...</div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl p-6">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-medium">No upcoming confirmed meetings.</p>
                <Link to="/parent/book" className="text-sky-500 hover:underline text-[11px] font-semibold mt-1 inline-block">
                  Book one now &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((mtg) => (
                  <div 
                    key={mtg.id} 
                    className="p-4 rounded-2xl bg-sky-50/35 border border-sky-100/50 hover:border-sky-100 transition-all flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(mtg.status)}
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Class: {mtg.class_name}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          Meeting regarding {mtg.student_name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <User className="h-3.5 w-3.5 text-slate-400" /> 
                          Teacher: <strong className="text-slate-700">{mtg.teacher_name}</strong>
                          <span className="text-slate-400">({mtg.specialization})</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100/50">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-sky-500" />
                          {formatDate(mtg.meeting_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-500" />
                          {mtg.meeting_time}
                        </span>
                      </div>

                      {mtg.reason && (
                        <div className="text-xs text-slate-600 pl-3 border-l-2 border-slate-200">
                          <strong className="text-slate-700 block font-semibold mb-0.5">Reason:</strong>
                          {mtg.reason}
                        </div>
                      )}

                      {mtg.notes && (
                        <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                          <strong className="text-sky-600 font-bold block mb-1">Teacher's Note:</strong>
                          {mtg.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Pending / Rescheduled Requests */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock3 className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-slate-800 text-base">Pending & Rescheduled Requests</h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading meetings...</div>
            ) : pendingMeetings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
                No active requests pending teacher review.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMeetings.map((mtg) => (
                  <div 
                    key={mtg.id} 
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(mtg.status)}
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Student: {mtg.student_name} | {mtg.class_name}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 font-semibold">
                        Teacher: {mtg.teacher_name} ({mtg.specialization})
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(mtg.meeting_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {mtg.meeting_time}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong className="text-slate-700 block font-semibold mb-0.5">Reason for Meeting:</strong>
                        {mtg.reason}
                      </div>

                      {mtg.notes && (
                        <div className="text-xs bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 text-slate-600">
                          <strong className="text-sky-600 font-bold block mb-1">Teacher's Note (Reschedule Info):</strong>
                          {mtg.notes}
                        </div>
                      )}
                    </div>

                    {mtg.status === 'Pending' && (
                      <button
                        onClick={() => handleCancelMeeting(mtg.id)}
                        disabled={cancelLoadingId === mtg.id}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 hover:border-red-200 px-3 py-2 rounded-xl transition-all cursor-pointer w-full md:w-auto justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - History Timeline */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="h-5 w-5 text-slate-500" />
              <h2 className="font-bold text-slate-800 text-base">Meeting History</h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading history...</div>
            ) : pastMeetings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
                No past meeting history.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {pastMeetings.map((mtg) => (
                  <div key={mtg.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs space-y-2 hover:bg-slate-50 transition-all">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-800">{mtg.student_name}</span>
                      {getStatusBadge(mtg.status)}
                    </div>
                    
                    <div className="text-slate-500 space-y-1">
                      <div>Teacher: {mtg.teacher_name}</div>
                      <div>Date: {formatDate(mtg.meeting_date)}</div>
                      <div>Time: {mtg.meeting_time}</div>
                    </div>

                    {mtg.notes && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200/60 mt-1.5 text-slate-600 italic">
                        <strong className="text-slate-700 block font-semibold not-italic">Notes:</strong>
                        "{mtg.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParentDashboard;
