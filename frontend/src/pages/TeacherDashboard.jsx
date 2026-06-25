import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../services/api';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail,
  AlertCircle, 
  Check, 
  X, 
  CalendarClock, 
  FileEdit,
  ClipboardList,
  Sparkles,
  BookOpen,
  RefreshCw,
  Eye
} from 'lucide-react';

const TeacherDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Action States
  const [activeActionMtg, setActiveActionMtg] = useState(null); // Meeting currently being edited
  const [actionType, setActionType] = useState(''); // 'reschedule', 'notes', 'reject'
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [notesStatus, setNotesStatus] = useState('Completed'); // For notes update: complete or just save
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

  const handleApprove = async (meetingId) => {
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
    setActiveActionMtg(meeting);
    setActionType(type);
    setActionNotes(meeting.notes || '');
    
    if (type === 'reschedule') {
      setRescheduleDate(meeting.meeting_date ? (meeting.meeting_date.includes('T') ? meeting.meeting_date.split('T')[0] : meeting.meeting_date) : '');
      setRescheduleTime(meeting.meeting_time);
    }
  };

  const closeActionModal = () => {
    setActiveActionMtg(null);
    setActionType('');
    setActionNotes('');
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionMtg) return;

    setSubmittingAction(true);
    try {
      if (actionType === 'reschedule') {
        await teacherAPI.rescheduleMeeting(
          activeActionMtg.id,
          rescheduleDate,
          rescheduleTime,
          actionNotes
        );
      } else if (actionType === 'reject') {
        await teacherAPI.rejectMeeting(activeActionMtg.id, actionNotes);
      } else if (actionType === 'notes') {
        // Update notes and optionally set status to Completed
        await teacherAPI.addNotes(activeActionMtg.id, actionNotes, notesStatus);
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
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Grouping logic
  const todayStr = new Date().toISOString().split('T')[0];
  
  const normalizeDate = (dStr) => {
    if (!dStr) return '';
    return dStr.includes('T') ? dStr.split('T')[0] : dStr;
  };
  
  const todayMeetings = meetings.filter(m => 
    normalizeDate(m.meeting_date) === todayStr && 
    m.status === 'Confirmed'
  );

  const pendingMeetings = meetings.filter(m => m.status === 'Pending' || m.status === 'Rescheduled');

  const upcomingMeetings = meetings.filter(m => 
    normalizeDate(m.meeting_date) > todayStr && 
    m.status === 'Confirmed'
  );

  const completedOrRejectedMeetings = meetings.filter(m => 
    m.status === 'Completed' || m.status === 'Rejected' || (normalizeDate(m.meeting_date) < todayStr && m.status !== 'Pending' && m.status !== 'Rescheduled')
  );

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Teacher Control Panel</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review booked appointments, record progress notes, and connect with parents.
          </p>
        </div>
        <button
          onClick={fetchMeetings}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Lists
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Today's Meetings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <h2 className="font-bold text-slate-800 text-sm">Today's Schedule</h2>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs font-bold">
              {todayMeetings.length}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading...</div>
          ) : todayMeetings.length === 0 ? (
            <p className="py-8 text-slate-400 text-xs text-center">No meetings scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {todayMeetings.map(m => (
                <div key={m.id} className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-100/50 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{m.student_name}</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Class: {m.class_name}</p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 bg-white/60 p-2.5 rounded-lg border border-slate-100/50">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-sky-500" /> <strong>{m.meeting_time}</strong></div>
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> {m.parent_name}</div>
                    <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {m.parent_email}</div>
                  </div>
                  <div className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-lg border border-slate-100/50 italic">
                    "{m.reason}"
                  </div>
                  
                  {m.notes && (
                    <div className="text-xs bg-slate-50 p-2 rounded-lg text-slate-500">
                      <strong>Notes:</strong> {m.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openActionModal(m, 'notes')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      Add Notes / Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Pending Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-slate-800 text-sm">Pending Requests</h2>
            </div>
            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-lg text-xs font-bold">
              {pendingMeetings.length}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading...</div>
          ) : pendingMeetings.length === 0 ? (
            <p className="py-8 text-slate-400 text-xs text-center">No pending requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingMeetings.map(m => {
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
                    // Notes is plain text (original note or teacher/admin reschedule info)
                  }
                }

                return (
                  <div key={m.id} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{m.student_name}</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Class: {m.class_name}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.status === 'Rescheduled' 
                          ? 'bg-sky-50 text-sky-700 border-sky-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {m.status === 'Rescheduled' ? 'Reschedule Requested' : 'Pending Request'}
                      </span>
                    </div>

                    {isProposal ? (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="font-bold block text-[10px] uppercase text-slate-400">Original Confirmed Slot:</span>
                          <div className="flex items-center gap-1.5 mt-0.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(m.meeting_date)}</div>
                          <div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-3.5 w-3.5" /> {m.meeting_time}</div>
                        </div>
                        <div className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-lg border border-sky-100 font-medium">
                          <span className="font-bold block text-[10px] uppercase text-sky-500">Proposed New Slot:</span>
                          <div className="flex items-center gap-1.5 mt-0.5"><Calendar className="h-3.5 w-3.5 text-sky-500" /> {formatDate(proposalDate)}</div>
                          <div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-3.5 w-3.5 text-sky-500" /> {proposalTime}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(m.meeting_date)}</div>
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> {m.meeting_time}</div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> {m.parent_name} ({m.parent_email})</div>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      <strong>Reason:</strong> "{m.reason}"
                    </div>

                    {isProposal && parentNotes && (
                      <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                        <strong>Parent's Reschedule Note:</strong> "{parentNotes}"
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="flex items-center justify-center gap-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => openActionModal(m, 'reject')}
                        className="flex items-center justify-center gap-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-100 transition-all cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => openActionModal(m, 'reschedule')}
                        className="col-span-2 flex items-center justify-center gap-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> Counter Propose Reschedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Upcoming Meetings & History */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-500" />
              <h2 className="font-bold text-slate-800 text-sm">Upcoming Schedules</h2>
            </div>
            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-lg text-xs font-bold">
              {upcomingMeetings.length}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading...</div>
          ) : upcomingMeetings.length === 0 ? (
            <p className="py-8 text-slate-400 text-xs text-center">No upcoming schedules.</p>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {upcomingMeetings.map(m => (
                <div key={m.id} className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/60 hover:bg-slate-50 transition-all space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs">{m.student_name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Class: {m.class_name}</p>
                    </div>
                    {getStatusBadge(m.status)}
                  </div>
                  
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div>Date: <strong>{formatDate(m.meeting_date)}</strong></div>
                    <div>Time: <strong>{m.meeting_time}</strong></div>
                    <div>Parent: {m.parent_name}</div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-2">
                    <button
                      onClick={() => openActionModal(m, 'notes')}
                      className="flex-1 text-center py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg text-[10px] font-bold border border-sky-100 transition-all flex items-center justify-center gap-1"
                    >
                      <FileEdit className="h-3 w-3" /> Update Notes
                    </button>
                    <button
                      onClick={() => openActionModal(m, 'reschedule')}
                      className="flex-1 text-center py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <CalendarClock className="h-3 w-3" /> Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* History Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <BookOpen className="h-5 w-5 text-slate-500" />
          <h2 className="font-bold text-slate-800 text-sm">Meeting Logs (Completed & Rejected)</h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading...</div>
        ) : completedOrRejectedMeetings.length === 0 ? (
          <p className="py-4 text-slate-400 text-xs text-center">No logged histories found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Parent details</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {completedOrRejectedMeetings.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{m.student_name}</div>
                      <div className="text-[10px] text-slate-400">{m.class_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{m.parent_name}</div>
                      <div className="text-[10px] text-slate-400">{m.parent_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{formatDate(m.meeting_date)}</div>
                      <div className="text-[10px] text-slate-400">{m.meeting_time}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(m.status)}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={m.notes}>
                      <span className="text-slate-500 italic">
                        {m.notes ? `"${m.notes}"` : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Overlay Modal (Reschedule / Notes / Reject) */}
      {activeActionMtg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div 
            className="absolute inset-0" 
            onClick={closeActionModal}
          />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]">
            
            {/* Modal Title */}
            <div className="px-6 py-4 border-b border-slate-100 bg-sky-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {actionType === 'reschedule' && 'Reschedule Meeting'}
                  {actionType === 'reject' && 'Reject Meeting Request'}
                  {actionType === 'notes' && 'Meeting Notes & Completion'}
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Student: {activeActionMtg.student_name} ({activeActionMtg.class_name})
                </span>
              </div>
              <button onClick={closeActionModal} className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Form contents based on active action */}
              {actionType === 'reschedule' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">New Date</label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">New Time Slot</label>
                      <select
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none bg-white"
                        required
                      >
                        <option value="">-- Select Slot --</option>
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none placeholder-slate-400"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none placeholder-slate-400"
                    required
                  />
                </div>
              )}

              {actionType === 'notes' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Meeting Notes / Discussion Summary</label>
                    <textarea
                      rows="5"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Discussed child's fine motor skills progress and settling-in patterns..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none placeholder-slate-400"
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

              {/* Submit Buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                    actionType === 'reject' 
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' 
                      : 'bg-sky-500 hover:bg-sky-600 shadow-sky-100'
                  }`}
                >
                  {submittingAction ? 'Saving...' : 'Confirm Action'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
