const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('1. Logging in as Parent (Ramesh)...');
    const parentLogin = await makeRequest('POST', '/api/auth/login', {
      identifier: 'ramesh@gmail.com',
      password: 'password123'
    });
    if (parentLogin.statusCode !== 200) {
      throw new Error(`Parent login failed: ${JSON.stringify(parentLogin.data)}`);
    }
    const parentToken = parentLogin.data.token;
    console.log('Parent login SUCCESS. Token obtained.');

    console.log('\n2. Fetching Parent\'s meetings...');
    const parentMeetings = await makeRequest('GET', '/api/meetings/my', null, {
      'Authorization': `Bearer ${parentToken}`
    });
    console.log('Meetings fetched:', parentMeetings.data.length);
    // Find a Confirmed meeting to reschedule
    const confirmedMtg = parentMeetings.data.find(m => m.status === 'Confirmed');
    if (!confirmedMtg) {
      console.log('No confirmed meeting found to test reschedule.');
    } else {
      console.log(`Found confirmed meeting ID: ${confirmedMtg.id} (Original Slot: ${confirmedMtg.meeting_date} ${confirmedMtg.meeting_time})`);
      
      console.log('\n3. Proposing reschedule as Parent...');
      const rescheduleRes = await makeRequest('PUT', `/api/meetings/reschedule/${confirmedMtg.id}`, {
        meeting_date: '2026-06-30',
        meeting_time: '11:30 AM - 12:00 PM',
        notes: 'Parent dentist appointment conflict.'
      }, {
        'Authorization': `Bearer ${parentToken}`
      });
      console.log('Reschedule proposal response:', rescheduleRes.statusCode, rescheduleRes.data);

      console.log('\n4. Verifying meeting state after reschedule proposal...');
      const verifyMtg = await makeRequest('GET', '/api/meetings/my', null, {
        'Authorization': `Bearer ${parentToken}`
      });
      const updatedMtg = verifyMtg.data.find(m => m.id === confirmedMtg.id);
      console.log('Updated Meeting Status:', updatedMtg.status);
      console.log('Updated Meeting Date/Time (should match original):', updatedMtg.meeting_date, updatedMtg.meeting_time);
      console.log('Notes content (should be JSON string):', updatedMtg.notes);

      console.log('\n5. Logging in as Teacher (Shalini)...');
      const teacherLogin = await makeRequest('POST', '/api/auth/login', {
        identifier: 'shalini@intellitots.com',
        password: 'password123'
      });
      const teacherToken = teacherLogin.data.token;

      console.log('\n6. Teacher approving parent\'s reschedule proposal...');
      const approveRes = await makeRequest('PUT', `/api/teacher/approve/${confirmedMtg.id}`, {
        notes: 'Approved new slot.'
      }, {
        'Authorization': `Bearer ${teacherToken}`
      });
      console.log('Approve response:', approveRes.statusCode, approveRes.data);

      console.log('\n7. Verifying meeting is committed to new slot and status is Confirmed...');
      const finalMtgRes = await makeRequest('GET', '/api/meetings/my', null, {
        'Authorization': `Bearer ${parentToken}`
      });
      const finalMtg = finalMtgRes.data.find(m => m.id === confirmedMtg.id);
      console.log('Final Meeting Status (should be Confirmed):', finalMtg.status);
      console.log('Final Date (should be 2026-06-30):', finalMtg.meeting_date);
      console.log('Final Time (should be 11:30 AM - 12:00 PM):', finalMtg.meeting_time);
      console.log('Final Notes (should be "Approved new slot."):', finalMtg.notes);
    }

    console.log('\n8. Logging in as Admin...');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      identifier: 'admin@intellitots.com',
      password: 'password123'
    });
    const adminToken = adminLogin.data.token;

    // Test a pending request cancellation
    const pendingMtg = parentMeetings.data.find(m => m.status === 'Pending');
    if (pendingMtg) {
      console.log(`\n9. Testing parent Cancel Meeting for ID: ${pendingMtg.id}...`);
      const cancelRes = await makeRequest('DELETE', `/api/meetings/${pendingMtg.id}`, null, {
        'Authorization': `Bearer ${parentToken}`
      });
      console.log('Cancel response:', cancelRes.statusCode, cancelRes.data);
      
      const verifyCancelRes = await makeRequest('GET', '/api/meetings/my', null, {
        'Authorization': `Bearer ${parentToken}`
      });
      const cancelledMtgExists = verifyCancelRes.data.some(m => m.id === pendingMtg.id);
      console.log('Meeting deleted from list? (should be true):', !cancelledMtgExists);
    }

  } catch (err) {
    console.error('Test run failed:', err);
  }
}

test();
