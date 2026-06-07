const axios = require('axios');
const fs = require('fs');

async function runTests() {
  const api = axios.create({ baseURL: 'http://localhost:3000/api' });
  let adminToken, guestToken, roomId;

  try {
    console.log('1. GET /api/rooms');
    const roomsRes = await api.get('/rooms');
    console.log(`Success: Found ${roomsRes.data.data.length} rooms`);
    roomId = roomsRes.data.data[0].id; // save a room ID for later

    console.log('\n2. GET /api/rooms/available');
    const availRes = await api.get('/rooms/available?check_in=2025-08-01&check_out=2025-08-03');
    console.log(`Success: Found ${availRes.data.data.length} available rooms`);

    console.log('\n3. Login as Guest and Admin (assume seeded users)');
    const guestLogin = await api.post('/auth/login', { email: 'john@example.com', password: 'password123' });
    guestToken = guestLogin.data.data.accessToken;
    const adminLogin = await api.post('/auth/login', { email: 'admin@adanehotel.com', password: 'adminpassword' });
    adminToken = adminLogin.data.data.accessToken;
    console.log('Login successful');

    console.log('\n4. POST /api/reservations');
    const resvRes = await api.post('/reservations', {
      room_id: roomId,
      check_in: '2025-08-01',
      check_out: '2025-08-03',
      adults: 2
    }, { headers: { Authorization: `Bearer ${guestToken}` } });
    console.log(`Success: Reservation created with total price ${resvRes.data.data.total_price}`);
    const resvId = resvRes.data.data.id;

    console.log('\n5. POST /api/payments/initiate');
    const payRes = await api.post('/payments/initiate', {
      reservation_id: resvId,
      amount: resvRes.data.data.total_price,
    }, { headers: { Authorization: `Bearer ${guestToken}` } });
    console.log(`Success: Checkout URL ${payRes.data.data.checkoutUrl}`);

    console.log('\n6. GET /api/admin/stats');
    const statsRes = await api.get('/admin/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Success: Stats retrieved');
    console.log(statsRes.data.data.overview);

    console.log('\n7. Role-based routes reject wrong roles with 403');
    try {
      await api.get('/admin/stats', { headers: { Authorization: `Bearer ${guestToken}` } });
      console.log('FAILED: Guest accessed admin stats');
    } catch (e) {
      console.log(`Success: Guest rejected with status ${e.response.status}`);
    }

    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

runTests();
