require('dotenv').config();
const jwt = require('jsonwebtoken');

async function main() {
  const token = jwt.sign({ userId: '124f8360-a3b6-4d5c-ab1a-2ed2a138d075' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const res = await fetch('http://localhost:3000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      room_id: "16571fca-7606-429d-89dd-cddae3a30a9b",
      check_in: "2026-07-01",
      check_out: "2026-07-11",
      adults: 1,
      children: 0,
      special_requests: ""
    })
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);

  process.exit(0);
}

main();
