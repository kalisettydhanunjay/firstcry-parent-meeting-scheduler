import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
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
  FileEdit,
  ClipboardList
} from 'lucide-react';

const TeacherMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal / Action States
  const [activeMtg, setActiveMtg] = useState(null);
  const [actionType, setActionType] = useState(''); // 'reschedule', 'reject', 'notes'
  const [actionNotes, setActionNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [notesStatus, setNotesStatus] = useState('Completed'); // 'Completed' or keep current
  const [submittingAction, setSubmittingAction] = useState(false);

  // Time slots matching preschool hours
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
      const data = await teacherAPI.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch meeting records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleQuickApprove = async (meetingId) => {
    if (!window.confirm('Confirm and approve this meeting?')) return;
    try {
      await teacherAPI.approveMeeting(meetingId);
      await fetchMeetings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error approving meeting');
    }
  };

  const openActionModal = (meeting, type) => {
    setActiveMtg(meeting);
    setActionType(type);
    setActionNotes(meeting.notes || '');

    if (type === 'reschedule') {
      const dateVal = meeting.meeting_date || '';
      setRescheduleDate(dateVal.includes('T') ? dateVal.split('T')[0] : dateVal);
      setRescheduleTime(meeting.meeting_time || '');
    } else if (type === 'notes') {
      setNotesStatus('Completed');
    }
  };

  const closeActionModal = () => {
    setActiveMtg(null);
    setActionType('');
    setActionNotes('');
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!activeMtg) return;

    setSubmittingAction(true);
    try {
      if (actionType === 'reschedule') {
        await teacherAPI.rescheduleMeeting(
          activeMtg.id,
          rescheduleDate,
          rescheduleTime,
          actionNotes
        );
      } else if (actionType === 'reject') {
        await teacherAPI.rejectMeeting(activeMtg.id, actionNotes);
      } else if (actionType === 'notes') {
        await teacherAPI.addNotes(activeMtg.id, actionNotes, notesStatus);
      }

      closeActionModal();
      await fetchMeetings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const normalizeDate = (dStr) => {
    if (!dStr) return '';
    return dStr.includes('T') ? dStr.split('T')[0] : dStr;
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

  // Filter logic on the client side
  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = filterSearch.trim() === '' || 
      (m.student_name || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
      (m.parent_name || '').toLowerCase().includes(filterSearch.toLowerCase());
      
    const matchesStatus = filterStatus === '' || m.status === filterStatus;
    
    const matchesDate = filterDate === '' || normalizeDate(m.meeting_date) === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Meeting Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View, approve, reject, reschedule, and log notes for meetings assigned to you.
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
          <span className="font-bold text-slate-800 text-sm">Meetings List</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Matches: {filteredMeetings.length}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">Loading data...</div>
        ) : filteredMeetings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">No meetings match search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase bg-slate-50/20">
                  <th className="py-3 px-4">Parent details</th>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Meeting Notes</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMeetings.map((m) => {
                  let isProposal = false;
                  let proposalDate = '';
                  let proposalTime = '';
                  let parentNotes = '';
                  
                  if (m.status === 'Rescheduled' && m.notes) {
                    try {
                      const parsed = JSON.parse(m.notes);
                      if (parsed.proposed_date && parsed.proposed_time) {
                        isProposal = true;
                        proposalDate = parsed.proposed_date;
                        proposalTime = parsed.proposed_time;
                        parentNotes = parsed.parent_notes;
                      }
                    } catch (e) {
                      // Notes is plain text
                    }
                  }

                  return (
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
                        {isProposal ? (
                          <div className="space-y-1">
                            <div className="text-slate-400 text-[10px] line-through">
                              {formatDate(m.meeting_date)} ({m.meeting_time})
                            </div>
                            <div className="font-bold text-sky-600">
                              Proposed: {formatDate(proposalDate)}
                              <div className="text-[10px] text-sky-500 font-normal">{proposalTime}</div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-700">{formatDate(m.meeting_date)}</div>
                            <div className="text-[10px] text-slate-400">{m.meeting_time}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(m.status)}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate" title={isProposal ? parentNotes : m.notes}>
                        <span className="text-slate-500 italic text-[11px]">
                          {isProposal 
                            ? (parentNotes ? `Proposed: "${parentNotes}"` : '-') 
                            : (m.notes ? `"${m.notes}"` : '-')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[10px]">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap max-w-[200px]">
                          {(m.status === 'Pending' || m.status === 'Rescheduled') && (
                            <>
                              <button
                                onClick={() => handleQuickApprove(m.id)}
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                                title="Approve"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openActionModal(m, 'reject')}
                                className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                                title="Reject"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {m.status === 'Confirmed' && (
                            <button
                              onClick={() => openActionModal(m, 'notes')}
                              className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
                              title="Add Notes & Complete"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => openActionModal(m, 'reschedule')}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Reschedule (Counter Propose)"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  {actionType === 'reschedule' && 'Teacher: Counter Propose Reschedule'}
                  {actionType === 'reject' && 'Teacher: Reject Meeting'}
                  {actionType === 'notes' && 'Teacher: Add Notes & Complete'}
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
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">New Date</label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">New Time Slot</label>
                      <select
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
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

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Rescheduling Note for Parent</label>
                    <textarea
                      rows="3"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="e.g. Apologies, I have classroom duties. Can we meet at this rescheduled slot instead?"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none placeholder-slate-400"
                      required
                    />
                  </div>
                </>
              )}

              {actionType === 'reject' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Reason for Rejection</label>
                  <textarea
                    rows="3"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Duplicate request or details can be shared via email."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none placeholder-slate-400"
                    required
                  />
                </div>
              )}

              {actionType === 'notes' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Meeting Notes / Discussion Summary</label>
                    <textarea
                      rows="4"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Discussed child's fine motor skills progress and settling-in patterns..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none placeholder-slate-400"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Update Meeting Status</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="notesStatus"
                          value="Completed"
                          checked={notesStatus === 'Completed'}
                          onChange={() => setNotesStatus('Completed')}
                          className="h-4 w-4 text-sky-500 focus:ring-sky-400"
                        />
                        Mark as Completed
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="notesStatus"
                          value=""
                          checked={notesStatus === ''}
                          onChange={() => setNotesStatus('')}
                          className="h-4 w-4 text-sky-500 focus:ring-sky-400"
                        />
                        Keep Current Status (Update Notes Only)
                      </label>
                    </div>
                  </div>
                </>
              )}

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
                  className={`flex-1 py-2 text-white rounded-xl text-xs font-bold shadow-md transition-colors ${
                    actionType === 'reject' 
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' 
                      : 'bg-sky-500 hover:bg-sky-600 shadow-sky-100'
                  }`}
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

export default TeacherMeetings;
