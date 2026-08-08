import { runQuery, fetchOne } from './db';
import { hashPassword } from './crypto';

export async function seedDatabase() {
  try {
    // 1. Employees Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT,
        phone TEXT,
        joiningDate TEXT,
        attendanceStatus TEXT,
        workingHours TEXT,
        todayWorkProgress TEXT,
        performanceScore INTEGER,
        status TEXT,
        hourlyRate REAL
      )
    `);

    // 2. Vehicles / GPS Telemetry Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        registrationNumber TEXT UNIQUE NOT NULL,
        driverName TEXT,
        driverId TEXT,
        status TEXT,
        speed INTEGER,
        ignition INTEGER,
        todayDistanceKm REAL,
        completedDeliveries INTEGER,
        totalDeliveries INTEGER,
        lat REAL,
        lng REAL,
        hasCamera INTEGER,
        cameraStatus TEXT
      )
    `);

    // 3. Vehicle Expenses Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS vehicle_expenses (
        id TEXT PRIMARY KEY,
        vehicleId TEXT,
        driverName TEXT,
        type TEXT,
        amount REAL,
        liters REAL,
        odometerReading INTEGER,
        description TEXT,
        billPhotoUrl TEXT,
        date TEXT,
        status TEXT
      )
    `);

    // 4. Bills & Collections Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        billNumber TEXT UNIQUE NOT NULL,
        customerName TEXT,
        amount REAL,
        paymentMethod TEXT,
        transactionId TEXT,
        driverName TEXT,
        date TEXT,
        status TEXT,
        cylinderCount INTEGER
      )
    `);

    // 5. Deliveries Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        customerName TEXT,
        address TEXT,
        phone TEXT,
        category TEXT,
        status TEXT,
        paymentType TEXT,
        amount REAL,
        assignedDriverId TEXT,
        assignedDriverName TEXT,
        scheduledTime TEXT,
        deliveredTime TEXT
      )
    `);

    // 6. Loading Batches Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS loading_batches (
        id TEXT PRIMARY KEY,
        vehicleRegistration TEXT,
        driverName TEXT,
        filledCylinders INTEGER,
        emptyReturned INTEGER,
        loadmanName TEXT,
        timestamp TEXT,
        status TEXT
      )
    `);

    // 7. Attendance Log Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        employeeId TEXT,
        employeeName TEXT,
        role TEXT,
        date TEXT,
        checkIn TEXT,
        checkOut TEXT,
        workingHours TEXT,
        status TEXT
      )
    `);

    // Seed initial employees if table is empty
    const empCheck = await fetchOne('SELECT COUNT(*) as count FROM employees');
    if (empCheck && empCheck.count === 0) {
      const initialEmployees = [
        ['emp-00', 'Vetri', 'Owner', 'owner@vetriindane.com', 'Vetri@2026', '+91 96008 70814', '01 Jan 2023', 'Present', '9h 00m', '100%', 100, 'Active', 150],
        ['emp-01', 'Arun', 'Driver', 'arun.driver@vetriindane.com', 'Arun@2026', '+91 98765 43210', '12 Jan 2024', 'Present', '8h 42m', '17/24', 95, 'Active', 85],
        ['emp-02', 'Kumar', 'Loadman', 'kumar.loadman@vetriindane.com', 'Kumar@2026', '+91 98765 43211', '05 Mar 2024', 'Present', '9h 05m', '86/100', 94, 'Active', 70],
        ['emp-03', 'Suresh', 'Driver', 'suresh.driver@vetriindane.com', 'Suresh@2026', '+91 98765 43212', '18 Jun 2023', 'Present', '8h 50m', '21/25', 96, 'Active', 90],
        ['emp-04', 'Ramesh', 'Driver', 'ramesh.driver@vetriindane.com', 'Ramesh@2026', '+91 98765 43213', '10 Nov 2023', 'Present', '7h 15m', '14/20', 88, 'Active', 85],
        ['emp-05', 'Vijay', 'Driver', 'vijay.driver@vetriindane.com', 'Vijay@2026', '+91 98765 43214', '01 Feb 2024', 'Late', '4h 30m', '5/18', 82, 'Active', 80],
        ['emp-06', 'Murugan', 'Loadman', 'murugan.loadman@vetriindane.com', 'Murugan@2026', '+91 98765 43215', '22 Aug 2023', 'Present', '8h 40m', '92/100', 97, 'Active', 70],
        ['emp-07', 'Santhosh', 'Manager', 'santhosh.manager@vetriindane.com', 'Santhosh@2026', '+91 98765 00002', '01 Jan 2023', 'Present', '9h 30m', '100%', 99, 'Active', 120],
        ['emp-08', 'Karthik', 'Godown Keeper', 'karthik.godown@vetriindane.com', 'Karthik@2026', '+91 98765 00003', '15 Feb 2024', 'Present', '8h 30m', 'Stock Verified', 96, 'Active', 95],
        ['emp-09', 'Priya', 'Storeroom Staff', 'priya.office@vetriindane.com', 'Priya@2026', '+91 98765 00004', '10 Jan 2024', 'Present', '9h 00m', 'Analytics Sync', 98, 'Active', 110]
      ];

      for (const emp of initialEmployees) {
        const hashedPassword = hashPassword(emp[4] as string);
        const empRecord = [...emp];
        empRecord[4] = hashedPassword;

        await runQuery(
          `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          empRecord
        );
      }
      console.log('✓ Initial Employee data seeded into SQLite Database with PBKDF2 salted password hashing!');
    }

    // Seed initial vehicles if table is empty
    const vehCheck = await fetchOne('SELECT COUNT(*) as count FROM vehicles');
    if (vehCheck && vehCheck.count === 0) {
      const initialVehicles = [
        ['v1', 'TN 38 AU 4821', 'Arun', 'emp-01', 'MOVING', 38, 1, 64.8, 17, 24, 11.0168, 76.9558, 1, 'LIVE'],
        ['v2', 'TN 38 BV 9012', 'Suresh', 'emp-03', 'MOVING', 44, 1, 89.2, 21, 25, 11.0250, 76.9620, 1, 'LIVE'],
        ['v3', 'TN 38 CW 1054', 'Ramesh', 'emp-04', 'STOPPED', 0, 0, 45.1, 14, 20, 11.0080, 76.9450, 1, 'LIVE'],
        ['v4', 'TN 38 DX 6720', 'Vijay', 'emp-05', 'STOPPED', 0, 0, 12.0, 5, 18, 11.0310, 76.9700, 1, 'OFFLINE']
      ];

      for (const v of initialVehicles) {
        await runQuery(
          `INSERT INTO vehicles (id, registrationNumber, driverName, driverId, status, speed, ignition, todayDistanceKm, completedDeliveries, totalDeliveries, lat, lng, hasCamera, cameraStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          v
        );
      }
      console.log('✓ Initial GPS Vehicle data seeded into SQLite Database!');
    }

    // Seed initial deliveries if table is empty
    const delCheck = await fetchOne('SELECT COUNT(*) as count FROM deliveries');
    if (delCheck && delCheck.count === 0) {
      const initialDeliveries = [
        ['del-101', 'Kavitha S.', '14 Avinashi Road, Peelamedu, Coimbatore', '+91 98421 11223', '14.2kg Domestic', 'DELIVERED', 'UPI', 940, 'emp-01', 'Arun', '10:30 AM', '10:28 AM'],
        ['del-102', 'Hotel Anandha Bhavan', '88 Crosscut Road, Gandhipuram', '+91 98421 44556', '19kg Commercial', 'DELIVERED', 'CASH', 1850, 'emp-01', 'Arun', '11:15 AM', '11:10 AM'],
        ['del-103', 'Murugan Bakery', '102 DB Road, RS Puram', '+91 98421 77889', '19kg Commercial', 'PENDING', 'UPI', 1850, 'emp-01', 'Arun', '02:00 PM', '']
      ];

      for (const d of initialDeliveries) {
        await runQuery(
          `INSERT INTO deliveries (id, customerName, address, phone, category, status, paymentType, amount, assignedDriverId, assignedDriverName, scheduledTime, deliveredTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          d
        );
      }
    }

    console.log('✓ Local SQLite Database schema & initial dataset verified successfully!');
  } catch (err) {
    console.error('Error seeding local SQLite database:', err);
  }
}
