const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'firstcry_intellitots_meetings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let useMock = false;

// Mock Data Arrays
let mockUsers = [];
let mockTeachers = [];
let mockMeetings = [];

// Seed mock data
async function seedMockData() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  mockUsers = [
    { id: 1, name: 'System Admin', email: 'admin@intellitots.com', password: passwordHash, role: 'admin', created_at: new Date() },
    { id: 2, name: 'Ms. Shalini Sharma', email: 'shalini@intellitots.com', password: passwordHash, role: 'teacher', created_at: new Date() },
    { id: 3, name: 'Ms. Ananya Rao', email: 'ananya@intellitots.com', password: passwordHash, role: 'teacher', created_at: new Date() },
    { id: 4, name: 'Ramesh Kumar', email: 'ramesh@gmail.com', password: passwordHash, role: 'parent', created_at: new Date() },
    { id: 5, name: 'Priya Patel', email: 'priya@gmail.com', password: passwordHash, role: 'parent', created_at: new Date() }
  ];

  mockTeachers = [
    { id: 2, teacher_name: 'Ms. Shalini Sharma', email: 'shalini@intellitots.com', specialization: 'Pre-Nursery & Creative Arts' },
    { id: 3, teacher_name: 'Ms. Ananya Rao', email: 'ananya@intellitots.com', specialization: 'Nursery & Early Literacy' }
  ];

  mockMeetings = [
    {
      id: 1,
      parent_id: 4,
      teacher_id: 2,
      student_name: 'Aarav Kumar',
      class_name: 'Pre-Nursery A',
      meeting_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      meeting_time: '10:00 AM - 10:30 AM',
      reason: 'Discuss classroom behavior and progress in motor skills.',
      status: 'Confirmed',
      notes: 'Looking forward to meeting and discussing developmental goals.',
      created_at: new Date()
    },
    {
      id: 2,
      parent_id: 5,
      teacher_id: 3,
      student_name: 'Riya Patel',
      class_name: 'Nursery B',
      meeting_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
      meeting_time: '11:30 AM - 12:00 PM',
      reason: 'Discussion on language development progress.',
      status: 'Pending',
      notes: null,
      created_at: new Date()
    },
    {
      id: 3,
      parent_id: 4,
      teacher_id: 3,
      student_name: 'Aarav Kumar',
      class_name: 'Pre-Nursery A',
      meeting_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
      meeting_time: '09:00 AM - 09:30 AM',
      reason: 'Initial onboarding chat.',
      status: 'Completed',
      notes: 'Aarav is adapting well. Parents are happy with the settling-in progress.',
      created_at: new Date()
    }
  ];
}

// Intercept and resolve queries using in-memory mock store
async function executeMockQuery(sql, params = []) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  
  // 1. SELECT * FROM users WHERE email = ?
  if (cleanSql.includes('SELECT * FROM users WHERE email = ?')) {
    const email = params[0].trim();
    const result = mockUsers.filter(u => u.email.toLowerCase() === email.toLowerCase());
    return [result];
  }

  // 2. SELECT * FROM users WHERE id = ?
  if (cleanSql.includes('SELECT * FROM users WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    const result = mockUsers.filter(u => u.id === id);
    return [result];
  }

  // 3. SELECT * FROM teachers WHERE id = ?
  if (cleanSql.includes('SELECT * FROM teachers WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    const result = mockTeachers.filter(t => t.id === id);
    return [result];
  }

  // 4. SELECT * FROM teachers ORDER BY teacher_name ASC
  if (cleanSql.includes('SELECT * FROM teachers ORDER BY')) {
    const sorted = [...mockTeachers].sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));
    return [sorted];
  }

  // 5. INSERT INTO meetings
  if (cleanSql.startsWith('INSERT INTO meetings')) {
    const [parent_id, teacher_id, student_name, class_name, meeting_date, meeting_time, reason] = params;
    const newMeeting = {
      id: mockMeetings.length + 1,
      parent_id: parseInt(parent_id, 10),
      teacher_id: parseInt(teacher_id, 10),
      student_name,
      class_name,
      meeting_date,
      meeting_time,
      reason,
      status: params[7] || 'Pending',
      notes: params[8] || null,
      created_at: new Date()
    };
    mockMeetings.push(newMeeting);
    return [{ insertId: newMeeting.id }];
  }

  // 6. GET /api/meetings/my (Get parent's meetings)
  // SELECT m.*, t.teacher_name, t.email as teacher_email, t.specialization FROM meetings m JOIN teachers t ON m.teacher_id = t.id WHERE m.parent_id = ?
  if (cleanSql.includes('FROM meetings m JOIN teachers t') && cleanSql.includes('WHERE m.parent_id = ?')) {
    const parentId = parseInt(params[0], 10);
    const result = mockMeetings
      .filter(m => m.parent_id === parentId)
      .map(m => {
        const teacher = mockTeachers.find(t => t.id === m.teacher_id) || {};
        return {
          ...m,
          teacher_name: teacher.teacher_name || 'Unknown',
          teacher_email: teacher.email || '',
          specialization: teacher.specialization || ''
        };
      })
      .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
    return [result];
  }

  // 7. GET /api/teacher/meetings
  // SELECT m.*, u.name as parent_name, u.email as parent_email FROM meetings m JOIN users u ON m.parent_id = u.id WHERE m.teacher_id = ?
  if (cleanSql.includes('FROM meetings m JOIN users u') && cleanSql.includes('WHERE m.teacher_id = ?')) {
    const teacherId = parseInt(params[0], 10);
    const result = mockMeetings
      .filter(m => m.teacher_id === teacherId)
      .map(m => {
        const parent = mockUsers.find(u => u.id === m.parent_id) || {};
        return {
          ...m,
          parent_name: parent.name || 'Unknown Parent',
          parent_email: parent.email || ''
        };
      })
      .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
    return [result];
  }

  // 8. DELETE FROM meetings WHERE id = ?
  if (cleanSql.startsWith('DELETE FROM meetings WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    mockMeetings = mockMeetings.filter(m => m.id !== id);
    return [{ affectedRows: 1 }];
  }

  // 9. Check status of meeting (used in cancel)
  if (cleanSql.includes('SELECT status FROM meetings WHERE id = ?')) {
    const [meetingId, parentId] = params;
    const meeting = mockMeetings.find(m => m.id === parseInt(meetingId, 10) && m.parent_id === parseInt(parentId, 10));
    return [meeting ? [meeting] : []];
  }

  // 10. Admin: SELECT COUNT(*) as total, SUM(CASE WHEN status...
  if (cleanSql.includes('COUNT(*)') && cleanSql.includes('FROM meetings')) {
    const total = mockMeetings.length;
    const pending = mockMeetings.filter(m => m.status === 'Pending').length;
    const confirmed = mockMeetings.filter(m => m.status === 'Confirmed').length;
    const rejected = mockMeetings.filter(m => m.status === 'Rejected').length;
    const completed = mockMeetings.filter(m => m.status === 'Completed').length;
    const rescheduled = mockMeetings.filter(m => m.status === 'Rescheduled').length;

    return [[{ total, pending, confirmed, rejected, completed, rescheduled }]];
  }

  // 11. Admin: View All Meetings with Filters
  // SELECT m.*, u.name as parent_name, u.email as parent_email, t.teacher_name, t.email as teacher_email, t.specialization FROM meetings m JOIN users u ON m.parent_id = u.id JOIN teachers t ON m.teacher_id = t.id WHERE 1=1
  if (cleanSql.includes('FROM meetings m JOIN users u ON') && cleanSql.includes('JOIN teachers t ON')) {
    let result = mockMeetings.map(m => {
      const parent = mockUsers.find(u => u.id === m.parent_id) || {};
      const teacher = mockTeachers.find(t => t.id === m.teacher_id) || {};
      return {
        ...m,
        parent_name: parent.name || 'Unknown Parent',
        parent_email: parent.email || '',
        teacher_name: teacher.teacher_name || 'Unknown Teacher',
        teacher_email: teacher.email || '',
        specialization: teacher.specialization || ''
      };
    });

    // We need to parse parameters based on the query builder logic in the controller.
    // The query builder appends filters in this order: teacher_id, status, date, search, search
    let paramIdx = 0;
    
    if (cleanSql.includes('AND m.teacher_id = ?')) {
      const tid = parseInt(params[paramIdx++], 10);
      result = result.filter(m => m.teacher_id === tid);
    }
    
    if (cleanSql.includes('AND m.status = ?')) {
      const status = params[paramIdx++];
      result = result.filter(m => m.status === status);
    }

    if (cleanSql.includes('AND m.meeting_date = ?')) {
      const mdate = params[paramIdx++];
      result = result.filter(m => m.meeting_date === mdate);
    }

    if (cleanSql.includes('LIKE ?')) {
      const searchVal = params[paramIdx++].replace(/%/g, '').toLowerCase();
      // Skip the duplicated search parameter
      paramIdx++; 
      result = result.filter(m => 
        m.parent_name.toLowerCase().includes(searchVal) || 
        m.student_name.toLowerCase().includes(searchVal)
      );
    }

    result.sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
    return [result];
  }

  // 12. Check meeting existence
  if (cleanSql.includes('SELECT * FROM meetings WHERE id = ?') || cleanSql.includes('SELECT id FROM meetings WHERE id = ?')) {
    const meetingId = parseInt(params[0], 10);
    const meeting = mockMeetings.find(m => m.id === meetingId);
    
    // Check if it has specific teacher filters (Teacher operations check owner)
    if (cleanSql.includes('AND teacher_id = ?')) {
      const teacherId = parseInt(params[1], 10);
      if (!meeting || meeting.teacher_id !== teacherId) {
        return [[]];
      }
    }
    return [meeting ? [meeting] : []];
  }

  // 13. Updates (Teacher and Admin)
  if (cleanSql.startsWith('UPDATE meetings SET')) {
    let meetingId = params[params.length - 1];
    const meeting = mockMeetings.find(m => m.id === parseInt(meetingId, 10));

    if (meeting) {
      // Parse parameters dynamically
      // Pattern 1: UPDATE meetings SET status = 'Confirmed', notes = ? WHERE id = ?
      // Pattern 2: UPDATE meetings SET status = 'Confirmed' WHERE id = ?
      // Pattern 3: UPDATE meetings SET status = 'Rejected', notes = ? WHERE id = ?
      // Pattern 4: UPDATE meetings SET status = 'Rejected' WHERE id = ?
      // Pattern 5: UPDATE meetings SET meeting_date = ?, meeting_time = ?, status = 'Rescheduled', notes = ? WHERE id = ?
      // Pattern 6: UPDATE meetings SET notes = ?, status = ? WHERE id = ?
      // Pattern 7: Admin dynamic update
      
      if (cleanSql.includes("status = 'Confirmed'")) {
        meeting.status = 'Confirmed';
        if (cleanSql.includes("notes = ?")) {
          meeting.notes = params[0];
        }
      } else if (cleanSql.includes("status = 'Rejected'")) {
        meeting.status = 'Rejected';
        if (cleanSql.includes("notes = ?")) {
          meeting.notes = params[0];
        }
      } else if (cleanSql.includes("status = 'Rescheduled'")) {
        meeting.meeting_date = params[0];
        meeting.meeting_time = params[1];
        meeting.status = 'Rescheduled';
        meeting.notes = params[2];
      } else if (cleanSql.includes("notes = ?") && cleanSql.includes("status = ?")) {
        meeting.notes = params[0];
        meeting.status = params[1];
      } else if (cleanSql.includes("notes = ?") && !cleanSql.includes("status = ?")) {
        meeting.notes = params[0];
      } else {
        // Admin update query builder: e.g. UPDATE meetings SET status = ?, notes = ? WHERE id = ?
        // We can inspect which placeholders exist in SQL and align with params
        let paramIdx = 0;
        
        if (cleanSql.includes('status = ?')) {
          meeting.status = params[paramIdx++];
        }
        if (cleanSql.includes('teacher_id = ?')) {
          meeting.teacher_id = parseInt(params[paramIdx++], 10);
        }
        if (cleanSql.includes('meeting_date = ?')) {
          meeting.meeting_date = params[paramIdx++];
        }
        if (cleanSql.includes('meeting_time = ?')) {
          meeting.meeting_time = params[paramIdx++];
        }
        if (cleanSql.includes('notes = ?')) {
          meeting.notes = params[paramIdx++];
        }
      }
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 14. Helper to insert/update users (dbSetup.js seeding logic)
  if (cleanSql.startsWith('INSERT INTO users')) {
    const [name, email, password, role] = params;
    const exists = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      const newUser = { id: mockUsers.length + 1, name, email, password, role, created_at: new Date() };
      mockUsers.push(newUser);
      return [{ insertId: newUser.id }];
    }
    return [{ affectedRows: 0 }];
  }

  // 15. Helper to insert/update teachers (dbSetup.js seeding logic)
  if (cleanSql.startsWith('INSERT INTO teachers')) {
    const [id, teacher_name, email, specialization] = params;
    const exists = mockTeachers.find(t => t.id === parseInt(id, 10));
    if (!exists) {
      const newTeacher = { id: parseInt(id, 10), teacher_name, email, specialization };
      mockTeachers.push(newTeacher);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  console.log('Unmatched mock SQL query:', cleanSql, 'Params:', params);
  return [[]];
}

// Function to initialize connection
async function initDatabase() {
  await seedMockData();
  
  try {
    const testConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    
    // Check if database exists
    await testConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await testConnection.end();

    // Create pool
    pool = mysql.createPool(dbConfig);
    
    // Validate connection pool works
    const conn = await pool.getConnection();
    conn.release();
    
    console.log('Successfully connected to MySQL Database Server.');
  } catch (error) {
    console.warn('\n================================================================');
    console.warn('⚠️ WARNING: Local MySQL server not running or connection failed.');
    console.warn(`Details: ${error.message}`);
    console.warn('FALLING BACK TO IN-MEMORY DATABASE FOR APPLICATION EXECUTION.');
    console.warn('================================================================\n');
    useMock = true;
  }
}

// Initialize database check immediately
initDatabase();

module.exports = {
  query: async (sql, params) => {
    if (useMock || !pool) {
      return executeMockQuery(sql, params);
    }
    try {
      return await pool.query(sql, params);
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }
};
