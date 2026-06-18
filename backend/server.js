const express = require('express');
const cors = require('cors');
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
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
