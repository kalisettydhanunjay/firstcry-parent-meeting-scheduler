const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const meetingsRouter = require('./routes/meetings');
const teachersRouter = require('./routes/teachers');
const adminRouter = require('./routes/admin');

app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/teacher', teachersRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'FirstCry Intellitots Meeting Scheduler API is healthy.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

// Start Server
const startServer = async () => {
  try {
    await db.ready;
    if (db.isUsingMock()) {
      console.log('\n================================================================');
      console.log('🤖 MOCK DATABASE MODE ACTIVE');
      console.log('Use the following test credentials to log in:');
      console.log('1. Admin:   admin@intellitots.com   / password123');
      console.log('2. Teacher: shalini@intellitots.com / password123');
      console.log('3. Teacher: ananya@intellitots.com  / password123');
      console.log('4. Parent:  ramesh@gmail.com        / password123');
      console.log('5. Parent:  priya@gmail.com         / password123');
      console.log('================================================================\n');
    }
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

startServer();
