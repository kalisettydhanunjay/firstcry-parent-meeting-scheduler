import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { parentAPI, authAPI } from '../services/api';
import { Calendar, Clock, User, BookOpen, AlertCircle, ArrowLeft, Send, Loader2 } from 'lucide-react';

const BookMeeting = () => {
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser() || { name: '' };
  
  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [reason, setReason] = useState('');

  // States
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-configured time slots matching preschool hours
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

  // Load teachers list on mount
  useEffect(() => {
    const loadTeachers = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await parentAPI.getTeachersList();
        setTeachers(list);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch the list of teachers. Please reload.');
      } finally {
        setLoading(false);
      }
    };
    loadTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!studentName.trim()) {
      setError('Please enter the student name.');
      return;
    }
    if (!className.trim()) {
      setError('Please enter the class name.');
      return;
    }
    if (!teacherId) {
      setError('Please select a teacher.');
      return;
    }
    if (!meetingDate) {
      setError('Please select a meeting date.');
      return;
    }
    if (!meetingTime) {
      setError('Please select a time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for the meeting.');
      return;
    }

    // Date validation: must be future date
    const selectedDate = new Date(meetingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Meeting date cannot be in the past.');
      return;
    }

    setSubmitting(true);

    try {
      await parentAPI.bookMeeting({
        teacher_id: parseInt(teacherId, 10),
        student_name: studentName.trim(),
        class_name: className.trim(),
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        reason: reason.trim()
      });

      setSuccess('Meeting request submitted successfully! Redirecting to dashboard...');
      
      // Clear form
      setStudentName('');
      setClassName('');
      setTeacherId('');
      setMeetingDate('');
      setMeetingTime('');
      setReason('');

      setTimeout(() => {
        navigate('/parent');
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to submit the meeting request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get current date string for input 'min' attribute to prevent past dates
  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <Link 
          to="/parent" 
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Book Parent-Teacher Meeting</h1>
          <p className="text-xs text-slate-500 mt-0.5">Fill in the details to request a discussion session.</p>
        </div>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex items-center gap-2">
            <Loader2 className="h-4.5 w-4.5 animate-spin flex-shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Parent Name (Read Only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Parent Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={user.name}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Student & Class Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="studentName" className="text-xs font-bold text-slate-600">Student Name</label>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Aarav Kumar"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm placeholder-slate-400 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="className" className="text-xs font-bold text-slate-600">Class / Grade</label>
              <input
                id="className"
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Pre-Nursery A"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm placeholder-slate-400 transition-all"
                required
              />
            </div>
          </div>

          {/* Teacher Selection */}
          <div className="space-y-1.5">
            <label htmlFor="teacher" className="text-xs font-bold text-slate-600">Select Teacher</label>
            <div className="relative">
              <select
                id="teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white transition-all appearance-none"
                disabled={loading}
                required
              >
                <option value="">-- Choose a Teacher --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teacher_name} ({t.specialization})
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                ▼
              </span>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="date" className="text-xs font-bold text-slate-600">Meeting Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  id="date"
                  type="date"
                  value={meetingDate}
                  min={getMinDate()}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="timeSlot" className="text-xs font-bold text-slate-600">Time Slot</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Clock className="h-4 w-4" />
                </span>
                <select
                  id="timeSlot"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white transition-all appearance-none"
                  required
                >
                  <option value="">-- Select Time Slot --</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Reason for Meeting */}
          <div className="space-y-1.5">
            <label htmlFor="reason" className="text-xs font-bold text-slate-600">Reason for Meeting</label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <BookOpen className="h-4.5 w-4.5" />
              </span>
              <textarea
                id="reason"
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Discussing the student's adaptation, literacy milestones, or any behavioral improvements needed..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm placeholder-slate-400 transition-all resize-y"
                required
              />
            </div>
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-sky-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Meeting Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookMeeting;
