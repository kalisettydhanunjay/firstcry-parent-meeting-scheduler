const db = require('../config/db');

// GET /api/admin/dashboard (Get dashboard metrics)
exports.getDashboardMetrics = async (req, res) => {
  try {
    const [counts] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Rescheduled' THEN 1 ELSE 0 END) as rescheduled
      FROM meetings
    `);

    const metrics = {
      total: counts[0].total || 0,
      pending: parseInt(counts[0].pending || 0, 10),
      confirmed: parseInt(counts[0].confirmed || 0, 10),
      rejected: parseInt(counts[0].rejected || 0, 10),
      completed: parseInt(counts[0].completed || 0, 10),
      rescheduled: parseInt(counts[0].rescheduled || 0, 10)
    };

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Admin dashboard metrics error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching dashboard metrics.' });
  }
};

// GET /api/admin/meetings (Get all meetings with filters & search)
exports.getAllMeetings = async (req, res) => {
  try {
    const { teacher_id, status, date, search } = req.query;

    let query = `
      SELECT 
        m.*, 
        u.name as parent_name, 
        u.email as parent_email,
        t.teacher_name, 
        t.email as teacher_email,
        t.specialization
      FROM meetings m
      JOIN users u ON m.parent_id = u.id
      JOIN teachers t ON m.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (teacher_id) {
      query += " AND m.teacher_id = ?";
      params.push(teacher_id);
    }

    if (status) {
      query += " AND m.status = ?";
      params.push(status);
    }

    if (date) {
      query += " AND m.meeting_date = ?";
      params.push(date);
    }

    if (search) {
      query += " AND (u.name LIKE ? OR m.student_name LIKE ?)";
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard);
    }

    query += " ORDER BY m.meeting_date DESC, m.created_at DESC";

    const [rows] = await db.query(query, params);
    return res.status(200).json(rows);

  } catch (error) {
    console.error('Admin get all meetings error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching meetings.' });
  }
};

// PUT /api/admin/meeting/:id (Update meeting - Approve/Reject/Reschedule/Mark Completed/Assign Teacher)
exports.updateMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { status, teacher_id, meeting_date, meeting_time, notes } = req.body;

    // Verify meeting exists
    const [rows] = await db.query('SELECT * FROM meetings WHERE id = ?', [meetingId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Meeting not found.' });
    }

    const currentMeeting = rows[0];

    // Check if we are approving a parent's reschedule request
    if (status === 'Confirmed' && currentMeeting.status === 'Rescheduled' && currentMeeting.notes) {
      try {
        const proposal = JSON.parse(currentMeeting.notes);
        if (proposal.proposed_date && proposal.proposed_time) {
          await db.query(
            "UPDATE meetings SET meeting_date = ?, meeting_time = ?, status = 'Confirmed', notes = ? WHERE id = ?",
            [proposal.proposed_date, proposal.proposed_time, notes || proposal.parent_notes || 'Reschedule approved by Admin.', meetingId]
          );
          return res.status(200).json({ message: 'Reschedule request approved by Admin.' });
        }
      } catch (e) {
        // Fallback
      }
    }

    // Check if we are rejecting a parent's reschedule request
    if (status === 'Rejected' && currentMeeting.status === 'Rescheduled') {
      let rejectionNote = 'Reschedule request declined by Admin. Original slot remains.';
      if (notes) {
        rejectionNote = notes;
      } else {
        try {
          const proposal = JSON.parse(currentMeeting.notes);
          if (proposal.parent_notes) {
            rejectionNote = `Reschedule request declined by Admin: "${proposal.parent_notes}". Original slot remains.`;
          }
        } catch (e) {}
      }

      await db.query(
        "UPDATE meetings SET status = 'Confirmed', notes = ? WHERE id = ?",
        [rejectionNote, meetingId]
      );
      return res.status(200).json({ message: 'Reschedule request rejected. Meeting remains confirmed at original time.' });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (teacher_id !== undefined) {
      // Validate that the teacher exists
      const [tchRows] = await db.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
      if (tchRows.length === 0) {
        return res.status(400).json({ message: 'Invalid teacher ID.' });
      }
      updateFields.push('teacher_id = ?');
      params.push(teacher_id);
    }

    if (meeting_date !== undefined) {
      updateFields.push('meeting_date = ?');
      params.push(meeting_date);
    }

    if (meeting_time !== undefined) {
      updateFields.push('meeting_time = ?');
      params.push(meeting_time);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields provided to update.' });
    }

    params.push(meetingId);
    const updateQuery = `UPDATE meetings SET ${updateFields.join(', ')} WHERE id = ?`;

    await db.query(updateQuery, params);

    return res.status(200).json({ message: 'Meeting updated successfully.' });

  } catch (error) {
    console.error('Admin update meeting error:', error);
    return res.status(500).json({ message: 'Internal server error while updating meeting.' });
  }
};

// GET /api/admin/teachers (Helper to get list of teachers for selector drop-downs)
exports.getAllTeachers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM teachers ORDER BY teacher_name ASC');
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Admin get teachers error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching teachers.' });
  }
};
