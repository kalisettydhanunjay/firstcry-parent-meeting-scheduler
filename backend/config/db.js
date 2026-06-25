const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
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
  if (cleanSql.includes('FROM teachers WHERE id = ?')) {
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

  // 12. Check meeting existence/retrieval by ID
  if (cleanSql.includes('FROM meetings WHERE id = ?')) {
    const meetingId = parseInt(params[0], 10);
    const meeting = mockMeetings.find(m => m.id === meetingId);
    
    if (meeting) {
      // Check if it has specific teacher filters (Teacher operations check owner)
      if (cleanSql.includes('AND teacher_id = ?')) {
        const teacherId = parseInt(params[1], 10);
        if (meeting.teacher_id !== teacherId) {
          return [[]];
        }
      }
      // Check if it has specific parent filters
      if (cleanSql.includes('AND parent_id = ?')) {
        const parentId = parseInt(params[1], 10);
        if (meeting.parent_id !== parentId) {
          return [[]];
        }
      }
      return [[meeting]];
    }
    return [[]];
  }

  // 13. Updates (Teacher and Admin)
  if (cleanSql.startsWith('UPDATE meetings SET')) {
    let meetingId = params[params.length - 1];
    const meeting = mockMeetings.find(m => m.id === parseInt(meetingId, 10));

    if (meeting) {
      // Find the SET clause between SET and WHERE
      const setIndex = cleanSql.indexOf('SET');
      const whereIndex = cleanSql.lastIndexOf('WHERE');
      if (setIndex !== -1 && whereIndex !== -1) {
        const setClause = cleanSql.slice(setIndex + 3, whereIndex).trim();
        // Split by commas
        const updates = setClause.split(',').map(s => s.trim());
        
        let paramIdx = 0;
        for (const update of updates) {
          const parts = update.split('=').map(p => p.trim());
          const column = parts[0];
          const valueExpr = parts[1];
          
          if (valueExpr === '?') {
            let val = params[paramIdx++];
            if (column === 'teacher_id') val = parseInt(val, 10);
            meeting[column] = val;
          } else {
            let val = valueExpr.replace(/^'|'$/g, '');
            if (column === 'teacher_id') val = parseInt(val, 10);
            meeting[column] = val;
          }
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

// Automatic Database Migration & Seeding
async function runDatabaseMigration(conn) {
  try {
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('Migration schema file not found at:', schemaPath);
      return;
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split statements by semicolon, filtering out comments
    const statements = schemaSql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // split by semicolon not inside quotes
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('create database') || statement.toLowerCase().startsWith('use')) {
        continue;
      }
      await conn.query(statement);
    }
    console.log('Database schema verified/created successfully.');

    // Seed database users
    const passwordHash = await bcrypt.hash('password123', 10);
    const seedUsers = [
      { name: 'System Admin', email: 'admin@intellitots.com', password: passwordHash, role: 'admin' },
      { name: 'Ms. Shalini Sharma', email: 'shalini@intellitots.com', password: passwordHash, role: 'teacher' },
      { name: 'Ms. Ananya Rao', email: 'ananya@intellitots.com', password: passwordHash, role: 'teacher' },
      { name: 'Ramesh Kumar', email: 'ramesh@gmail.com', password: passwordHash, role: 'parent' },
      { name: 'Priya Patel', email: 'priya@gmail.com', password: passwordHash, role: 'parent' }
    ];

    for (const user of seedUsers) {
      await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
        [user.name, user.email, user.password, user.role]
      );
      
      if (user.role === 'teacher') {
        const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [user.email]);
        const teacherUserId = rows[0].id;
        const specialization = user.email === 'shalini@intellitots.com' 
          ? 'Pre-Nursery & Creative Arts' 
          : 'Nursery & Early Literacy';

        await conn.query(
          'INSERT INTO teachers (id, teacher_name, email, specialization) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE teacher_name=teacher_name',
          [teacherUserId, user.name, user.email, specialization]
        );
      }
    }
    
    // Seed mock meetings if they do not exist
    const [parents] = await conn.query("SELECT id FROM users WHERE role = 'parent' ORDER BY id");
    const [teachers] = await conn.query("SELECT id FROM teachers ORDER BY id");

    if (parents.length >= 2 && teachers.length >= 2) {
      const parent1Id = parents[0].id;
      const parent2Id = parents[1].id;
      const teacher1Id = teachers[0].id;
      const teacher2Id = teachers[1].id;

      // Check if meetings table is empty
      const [mtgCount] = await conn.query("SELECT COUNT(*) as count FROM meetings");
      if (mtgCount[0].count === 0) {
        const mockMeetings = [
          {
            parent_id: parent1Id,
            teacher_id: teacher1Id,
            student_name: 'Aarav Kumar',
            class_name: 'Pre-Nursery A',
            meeting_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meeting_time: '10:00 AM - 10:30 AM',
            reason: 'Discuss classroom behavior and progress in motor skills.',
            status: 'Confirmed',
            notes: 'Looking forward to meeting and discussing developmental goals.'
          },
          {
            parent_id: parent2Id,
            teacher_id: teacher2Id,
            student_name: 'Riya Patel',
            class_name: 'Nursery B',
            meeting_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meeting_time: '11:30 AM - 12:00 PM',
            reason: 'Discussion on language development progress.',
            status: 'Pending',
            notes: null
          },
          {
            parent_id: parent1Id,
            teacher_id: teacher2Id,
            student_name: 'Aarav Kumar',
            class_name: 'Pre-Nursery A',
            meeting_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meeting_time: '09:00 AM - 09:30 AM',
            reason: 'Initial onboarding chat.',
            status: 'Completed',
            notes: 'Aarav is adapting well. Parents are happy with the settling-in progress.'
          }
        ];

        for (const mtg of mockMeetings) {
          await conn.query(
            `INSERT INTO meetings (parent_id, teacher_id, student_name, class_name, meeting_date, meeting_time, reason, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [mtg.parent_id, mtg.teacher_id, mtg.student_name, mtg.class_name, mtg.meeting_date, mtg.meeting_time, mtg.reason, mtg.status, mtg.notes]
          );
        }
      }
    }
    console.log('Database auto-migration & seeding executed successfully.');
  } catch (err) {
    console.error('Error running automatic migrations:', err);
  }
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
    
    // Check if users table exists
    const [tables] = await conn.query(`SHOW TABLES LIKE 'users'`);
    if (tables.length === 0) {
      console.log('Tables do not exist in MySQL. Automatically running setup...');
      await runDatabaseMigration(conn);
    }
    
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
      // If the table doesn't exist, try to run migrations or fall back to mock
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Table not found. Running auto-migrations...');
        try {
          const conn = await pool.getConnection();
          await runDatabaseMigration(conn);
          conn.release();
          // Retry the query once
          return await pool.query(sql, params);
        } catch (migrationErr) {
          console.error('Auto-migration failed, falling back to mock database:', migrationErr);
          useMock = true;
          return executeMockQuery(sql, params);
        }
      }
      throw err;
    }
  }
};
