import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  Check, 
  X, 
  CalendarClock, 
  Search,
  Filter,
  RefreshCw,
  UserPlus
} from 'lucide-react';

const AdminMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal / Action States
  const [activeMtg, setActiveMtg] = useState(null);
  const [actionType, setActionType] = useState(''); // 'reschedule', 'assign_teacher'
  const [actionNotes, setActionNotes] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionTime, setActionTime] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Time slots
  const timeSlots = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM'
  ];

  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedTeachers = await adminAPI.getTeachersList();
      setTeachers(fetchedTeachers);

      const fetchedMeetings = await adminAPI.getMeetings({
        teacher_id: filterTeacher,
        status: filterStatus,
        date: filterDate,
        search: filterSearch
      });
      setMeetings(fetchedMeetings);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch meeting records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [filterTeacher, filterStatus, filterDate, filterSearch]);

  const handleQuickStatus = async (meetingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this meeting as ${newStatus}?`)) return;
    try {
      await adminAPI.updateMeeting(meetingId, { status: newStatus });
      await fetchMeetings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const openActionModal = (meeting, type) => {
    setActiveMtg(meeting);
    setActionType(type);
    setActionNotes(meeting.notes || '');

    if (type === 'reschedule') {
      setActionDate(meeting.meeting_date);
      setActionTime(meeting.meeting_time);
    } else if (type === 'assign_teacher') {
      setSelectedTeacherId(meeting.teacher_id);
    }
  };

  const closeActionModal = () => {
    setActiveMtg(null);
    setActionType('');
    setActionNotes('');
    setSelectedTeacherId('');
    setActionDate('');
    setActionTime('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!activeMtg) return;

    setSubmittingAction(true);
    try {
      const updateData = {};
      
      if (actionType === 'reschedule') {
        updateData.meeting_date = actionDate;
        updateData.meeting_time = actionTime;
        updateData.notes = actionNotes;
        updateData.status = 'Rescheduled';
      } else if (actionType === 'assign_teacher') {
        updateData.teacher_id = parseInt(selectedTeacherId, 10);
        updateData.notes = actionNotes || `Assigned to teacher by Admin.`;
      }

      await adminAPI.updateMeeting(activeMtg.id, updateData);
      closeActionModal();
      await fetchMeetings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manage Parent-Teacher Meetings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter, assign teachers, and reschedule meeting slots for FirstCry Intellitots.
          </p>
        </div>
        <button
          onClick={fetchMeetings}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search parent or child name..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3.5">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Teacher Filter */}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
          >
            <option value="">All Teachers</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.teacher_name}</option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
          />
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="font-bold text-slate-800 text-sm">Meeting Records List</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Matches: {meetings.length}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">Loading data...</div>
        ) : meetings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">No meetings match search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase bg-slate-50/20">
                  <th className="py-3 px-4">Parent details</th>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Assigned Teacher</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Meeting Notes</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{m.parent_name}</div>
                      <div className="text-[10px] text-slate-400">{m.parent_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{m.student_name}</div>
                      <div className="text-[10px] text-slate-400">{m.class_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">{m.teacher_name}</div>
                      <div className="text-[10px] text-slate-400">{m.specialization}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700">{formatDate(m.meeting_date)}</div>
                      <div className="text-[10px] text-slate-400">{m.meeting_time}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(m.status)}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate" title={m.notes}>
                      <span className="text-slate-500 italic text-[11px]">
                        {m.notes ? `"${m.notes}"` : '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[10px]">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap max-w-[200px]">
                        {m.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleQuickStatus(m.id, 'Confirmed')}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickStatus(m.id, 'Rejected')}
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {(m.status === 'Confirmed' || m.status === 'Rescheduled') && (
                          <button
                            onClick={() => handleQuickStatus(m.id, 'Completed')}
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
                            title="Complete"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => openActionModal(m, 'reschedule')}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Reschedule"
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openActionModal(m, 'assign_teacher')}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Assign Teacher"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {activeMtg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={closeActionModal} />
          
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-sky-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {actionType === 'reschedule' ? 'Admin: Reschedule' : 'Admin: Assign/Reassign Teacher'}
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                  Student: {activeMtg.student_name}
                </span>
              </div>
              <button onClick={closeActionModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              {actionType === 'reschedule' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">New Date</label>
                    <input
                      type="date"
                      value={actionDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setActionDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">New Time Slot</label>
                    <select
                      value={actionTime}
                      onChange={(e) => setActionTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                      required
                    >
                      <option value="">-- Choose Slot --</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {actionType === 'assign_teacher' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Choose Teacher</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                    required
                  >
                    <option value="">-- Choose --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.teacher_name} ({t.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Admin Notes / Remarks</label>
                <textarea
                  rows="3"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Notes to notify parents/teachers..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-100 transition-colors"
                >
                  {submittingAction ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMeetings;
