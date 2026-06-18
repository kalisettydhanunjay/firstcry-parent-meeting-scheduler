const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'firstcry_intellitots_meetings';

async function runSetup() {
  console.log('Starting FirstCry Intellitots database setup...');
  let connection;

  try {
    // 1. Connect to MySQL server
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server successfully.');

    // 2. Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" verified/created.`);

    // 3. Connect to the specific database
    await connection.query(`USE \`${dbName}\``);

    // 4. Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons, filtering out comments and empty lines
    const statements = schemaSql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // split by semicolon not inside quotes
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} schema statements...`);
    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('create database') || statement.toLowerCase().startsWith('use')) {
        continue; // Already handled
      }
      await connection.query(statement);
    }
    console.log('Schema created successfully.');

    // 5. Seed initial data
    console.log('Seeding database...');
    const passwordHash = await bcrypt.hash('password123', 10);

    // Insert Users
    const seedUsers = [
      { name: 'System Admin', email: 'admin@intellitots.com', password: passwordHash, role: 'admin' },
      { name: 'Ms. Shalini Sharma', email: 'shalini@intellitots.com', password: passwordHash, role: 'teacher' },
      { name: 'Ms. Ananya Rao', email: 'ananya@intellitots.com', password: passwordHash, role: 'teacher' },
      { name: 'Ramesh Kumar', email: 'ramesh@gmail.com', password: passwordHash, role: 'parent' },
      { name: 'Priya Patel', email: 'priya@gmail.com', password: passwordHash, role: 'parent' }
    ];

    for (const user of seedUsers) {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
        [user.name, user.email, user.password, user.role]
      );
      
      // If it's a teacher, we also need to seed the teachers table
      if (user.role === 'teacher') {
        // Find user ID
        const [rows] = await connection.query('SELECT id FROM users WHERE email = ?', [user.email]);
        const teacherUserId = rows[0].id;

        const specialization = user.email === 'shalini@intellitots.com' 
          ? 'Pre-Nursery & Creative Arts' 
          : 'Nursery & Early Literacy';

        await connection.query(
          'INSERT INTO teachers (id, teacher_name, email, specialization) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE teacher_name=teacher_name',
          [teacherUserId, user.name, user.email, specialization]
        );
      }
    }
    console.log('Seed users and teachers created successfully.');

    // 6. Seed mock meetings
    // Find parent IDs and teacher IDs
    const [parents] = await connection.query("SELECT id FROM users WHERE role = 'parent' ORDER BY id");
    const [teachers] = await connection.query("SELECT id FROM teachers ORDER BY id");

    if (parents.length >= 2 && teachers.length >= 2) {
      const parent1Id = parents[0].id;
      const parent2Id = parents[1].id;
      const teacher1Id = teachers[0].id;
      const teacher2Id = teachers[1].id;

      const mockMeetings = [
        {
          parent_id: parent1Id,
          teacher_id: teacher1Id,
          student_name: 'Aarav Kumar',
          class_name: 'Pre-Nursery A',
          meeting_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
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
          meeting_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
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
          meeting_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
          meeting_time: '09:00 AM - 09:30 AM',
          reason: 'Initial onboarding chat.',
          status: 'Completed',
          notes: 'Aarav is adapting well. Parents are happy with the settling-in progress.'
        }
      ];

      for (const mtg of mockMeetings) {
        await connection.query(
          `INSERT INTO meetings (parent_id, teacher_id, student_name, class_name, meeting_date, meeting_time, reason, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [mtg.parent_id, mtg.teacher_id, mtg.student_name, mtg.class_name, mtg.meeting_date, mtg.meeting_time, mtg.reason, mtg.status, mtg.notes]
        );
      }
      console.log('Seed mock meetings created successfully.');
    }

    console.log('Database setup completed successfully!');
    console.log('\nUse these credentials for testing:');
    console.log('--------------------------------------------------');
    console.log('Role       | Email                   | Password');
    console.log('--------------------------------------------------');
    console.log('Admin      | admin@intellitots.com   | password123');
    console.log('Teacher 1  | shalini@intellitots.com | password123');
    console.log('Teacher 2  | ananya@intellitots.com  | password123');
    console.log('Parent 1   | ramesh@gmail.com        | password123');
    console.log('Parent 2   | priya@gmail.com         | password123');
    console.log('--------------------------------------------------\n');

  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSetup();
