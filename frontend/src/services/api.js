const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject token into headers on request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !error.config.url.includes('/auth/login')) {
      // Clear token and user details if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const parentAPI = {
  bookMeeting: async (meetingData) => {
    const response = await api.post('/meetings', meetingData);
    return response.data;
  },
  getMyMeetings: async () => {
    const response = await api.get('/meetings/my');
    return response.data;
  },
  cancelMeeting: async (id) => {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
  },
  rescheduleMeeting: async (id, date, time, notes) => {
    const response = await api.put(`/meetings/reschedule/${id}`, {
      meeting_date: date,
      meeting_time: time,
      notes
    });
    return response.data;
  },
  getTeachersList: async () => {
    const response = await api.get('/admin/teachers');
    return response.data;
  }
};

export const teacherAPI = {
  getMeetings: async () => {
    const response = await api.get('/teacher/meetings');
    return response.data;
  },
  approveMeeting: async (id, notes) => {
    const response = await api.put(`/teacher/approve/${id}`, { notes });
    return response.data;
  },
  rejectMeeting: async (id, notes) => {
    const response = await api.put(`/teacher/reject/${id}`, { notes });
    return response.data;
  },
  rescheduleMeeting: async (id, date, time, notes) => {
    const response = await api.put(`/teacher/reschedule/${id}`, {
      meeting_date: date,
      meeting_time: time,
      notes
    });
    return response.data;
  },
  addNotes: async (id, notes, status) => {
    const response = await api.put(`/teacher/notes/${id}`, { notes, status });
    return response.data;
  }
};

export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  getMeetings: async (filters = {}) => {
    const { teacher_id, status, date, search } = filters;
    const response = await api.get('/admin/meetings', {
      params: { teacher_id, status, date, search }
    });
    return response.data;
  },
  updateMeeting: async (id, updateData) => {
    const response = await api.put(`/admin/meeting/${id}`, updateData);
    return response.data;
  },
  getTeachersList: async () => {
    const response = await api.get('/admin/teachers');
    return response.data;
  }
};

export default api;
