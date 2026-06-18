const db = require('../config/db');

// --- PARENTS ---

// POST /api/meetings (Book Meeting Request)
exports.createMeeting = async (req, res) => {
  try {
    const parent_id = req.user.id;
    const { teacher_id, student_name, class_name, meeting_date, meeting_time, reason } = req.body;

    if (!teacher_id || !student_name || !class_name || !meeting_date || !meeting_time || !reason) {
      return res.status(400).json({ message: 'All booking fields are required.' });
    }

    // Insert meeting with default 'Pending' status
    const [result] = await db.query(
      `INSERT INTO meetings (parent_id, teacher_id, student_name, class_name, meeting_date, meeting_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [parent_id, teacher_id, student_name, class_name, meeting_date, meeting_time, reason]
    );

    return res.status(201).json({
      message: 'Meeting request created successfully.',
      meetingId: result.insertId
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    return res.status(500).json({ message: 'Internal server error while creating meeting request.' });
  }
};

// GET /api/meetings/my (Get parent's meetings)
exports.getMyMeetings = async (req, res) => {
  try {
    const parent_id = req.user.id;

    // Fetch parent's meetings joined with teacher details
    const [rows] = await db.query(
      `SELECT m.*, t.teacher_name, t.email as teacher_email, t.specialization 
       FROM meetings m
       JOIN teachers t ON m.teacher_id = t.id
       WHERE m.parent_id = ?
       ORDER BY m.meeting_date DESC, m.created_at DESC`,
      [parent_id]
    );

    return res.status(200).json(rows);

  } catch (error) {
    console.error('Get my meetings error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching meetings.' });
  }
};

// DELETE /api/meetings/:id (Cancel request - only if pending)
exports.cancelMeeting = async (req, res) => {
  try {
    const parent_id = req.user.id;
    const meetingId = req.params.id;

    // Check if meeting exists, belongs to user, and is pending
    const [rows] = await db.query(
      'SELECT status FROM meetings WHERE id = ? AND parent_id = ?',
      [meetingId, parent_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (rows[0].status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending meeting requests can be cancelled.' });
    }

    await db.query('DELETE FROM meetings WHERE id = ?', [meetingId]);

    return res.status(200).json({ message: 'Meeting request cancelled successfully.' });

  } catch (error) {
    console.error('Cancel meeting error:', error);
    return res.status(500).json({ message: 'Internal server error while cancelling meeting.' });
  }
};


// --- TEACHERS ---

// GET /api/teacher/meetings (Get teacher's meetings)
exports.getTeacherMeetings = async (req, res) => {
  try {
    const teacher_id = req.user.id;

    // Fetch teacher's meetings joined with parent user details
    const [rows] = await db.query(
      `SELECT m.*, u.name as parent_name, u.email as parent_email
       FROM meetings m
       JOIN users u ON m.parent_id = u.id
       WHERE m.teacher_id = ?
       ORDER BY m.meeting_date DESC, m.created_at DESC`,
      [teacher_id]
    );

    return res.status(200).json(rows);

  } catch (error) {
    console.error('Get teacher meetings error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching teacher meetings.' });
  }
};

// PUT /api/teacher/approve/:id (Approve meeting)
exports.approveMeeting = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const meetingId = req.params.id;
    const { notes } = req.body; // Optional notes

    // Verify ownership
    const [rows] = await db.query('SELECT id FROM meetings WHERE id = ? AND teacher_id = ?', [meetingId, teacher_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Meeting not found or unauthorized.' });
    }

    // Update status and optional notes
    if (notes !== undefined) {
      await db.query(
        "UPDATE meetings SET status = 'Confirmed', notes = ? WHERE id = ?",
        [notes, meetingId]
      );
    } else {
      await db.query(
        "UPDATE meetings SET status = 'Confirmed' WHERE id = ?",
        [meetingId]
      );
    }

    return res.status(200).json({ message: 'Meeting approved and confirmed successfully.' });

  } catch (error) {
    console.error('Approve meeting error:', error);
    return res.status(500).json({ message: 'Internal server error while approving meeting.' });
  }
};

// PUT /api/teacher/reject/:id (Reject meeting)
exports.rejectMeeting = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const meetingId = req.params.id;
    const { notes } = req.body; // Optional notes/reason

    // Verify ownership
    const [rows] = await db.query('SELECT id FROM meetings WHERE id = ? AND teacher_id = ?', [meetingId, teacher_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Meeting not found or unauthorized.' });
    }

    // Update status and optional notes
    if (notes !== undefined) {
      await db.query(
        "UPDATE meetings SET status = 'Rejected', notes = ? WHERE id = ?",
        [notes, meetingId]
      );
    } else {
      await db.query(
        "UPDATE meetings SET status = 'Rejected' WHERE id = ?",
        [meetingId]
      );
    }

    return res.status(200).json({ message: 'Meeting request rejected.' });

  } catch (error) {
    console.error('Reject meeting error:', error);
    return res.status(500).json({ message: 'Internal server error while rejecting meeting.' });
  }
};

// PUT /api/teacher/reschedule/:id (Reschedule meeting)
exports.rescheduleMeeting = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const meetingId = req.params.id;
    const { meeting_date, meeting_time, notes } = req.body;

    if (!meeting_date || !meeting_time) {
      return res.status(400).json({ message: 'New meeting date and time slot are required to reschedule.' });
    }

    // Verify ownership
    const [rows] = await db.query('SELECT id FROM meetings WHERE id = ? AND teacher_id = ?', [meetingId, teacher_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Meeting not found or unauthorized.' });
    }

    // Update date, time, notes, and set status to Rescheduled
    await db.query(
      `UPDATE meetings 
       SET meeting_date = ?, meeting_time = ?, status = 'Rescheduled', notes = ? 
       WHERE id = ?`,
      [meeting_date, meeting_time, notes || null, meetingId]
    );

    return res.status(200).json({ message: 'Meeting rescheduled successfully.' });

  } catch (error) {
    console.error('Reschedule meeting error:', error);
    return res.status(500).json({ message: 'Internal server error while rescheduling meeting.' });
  }
};

// PUT /api/teacher/notes/:id (Add meeting notes or complete meeting)
exports.addMeetingNotes = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    const meetingId = req.params.id;
    const { notes, status } = req.body; // status could be 'Completed' or leave unchanged

    if (notes === undefined) {
      return res.status(400).json({ message: 'Notes field is required.' });
    }

    // Verify ownership
    const [rows] = await db.query('SELECT id FROM meetings WHERE id = ? AND teacher_id = ?', [meetingId, teacher_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Meeting not found or unauthorized.' });
    }

    let query = "UPDATE meetings SET notes = ?";
    const params = [notes];

    if (status) {
      query += ", status = ?";
      params.push(status);
    }
    
    query += " WHERE id = ?";
    params.push(meetingId);

    await db.query(query, params);

    return res.status(200).json({ message: 'Meeting notes updated successfully.' });

  } catch (error) {
    console.error('Add meeting notes error:', error);
    return res.status(500).json({ message: 'Internal server error while updating notes.' });
  }
};
