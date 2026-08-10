/**
 * Standalone Real-Time Mock GPS Telemetry & Biometric Attendance Simulator
 * Runs continuously and dispatches live HTTP POST requests to Vetri Indane Express API.
 * Usage: node run_mock_simulator.js [https://vetrigas.onrender.com]
 */

const http = require('http');
const https = require('https');

const TARGET_BASE = process.argv[2] || 'https://vetrigas.onrender.com';
console.log(`\n======================================================`);
console.log(`🚀 VETRI INDANE MOCK GPS & BIOMETRIC SIMULATOR ENGINE`);
console.log(`Targeting API: ${TARGET_BASE}`);
console.log(`======================================================\n`);

const postJson = (urlPath, data) => {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, TARGET_BASE);
    const client = fullUrl.protocol === 'https:' ? https : http;
    const bodyStr = JSON.stringify(data);

    const req = client.request(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resBody));
        } catch (e) {
          resolve({ raw: resBody });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.write(bodyStr);
    req.end();
  });
};

// Existing Users for Biometric Attendance Punching
const EXISTING_USERS = [
  { id: 'emp-00', name: 'Vetri', email: 'owner@vetriindane.com' },
  { id: 'emp-01', name: 'Arun', email: 'arun@vetriindane.com' },
  { id: 'emp-02', name: 'Suresh', email: 'suresh@vetriindane.com' },
  { id: 'emp-03', name: 'Ramesh', email: 'ramesh@vetriindane.com' },
  { id: 'emp-04', name: 'Vijay', email: 'vijay@vetriindane.com' },
  { id: 'emp-05', name: 'Kumar', email: 'kumar@vetriindane.com' },
  { id: 'emp-06', name: 'Priya', email: 'priya@vetriindane.com' },
  { id: 'emp-07', name: 'Karthik', email: 'karthik@vetriindane.com' },
];

// Start automated loop
let gpsTickCount = 0;
let bioTickCount = 0;

setInterval(async () => {
  gpsTickCount++;
  const res = await postJson('/api/simulator/gps-step', {});
  if (res.success) {
    console.log(`[GPS TICK #${gpsTickCount}] Real-time vehicle coordinates updated on Peelamedu routes.`);
  } else {
    console.log(`[GPS TICK #${gpsTickCount}] Attempted GPS update...`);
  }
}, 2500);

setInterval(async () => {
  bioTickCount++;
  const targetUser = EXISTING_USERS[Math.floor(Math.random() * EXISTING_USERS.length)];
  const res = await postJson('/api/simulator/biometric-punch', {
    employeeId: targetUser.id,
    employeeName: targetUser.name,
  });

  if (res.success) {
    console.log(`[BIOMETRIC SCAN #${bioTickCount}] 🖐️ Scan verified for ${targetUser.name} (${targetUser.id}) at ${res.punchTime || 'now'}`);
  }
}, 12000);
