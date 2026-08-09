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
        workingHours TEXT,
        status TEXT
      )
    `);

    // 8. Monthly Stock Intake Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS stock_intake (
        id TEXT PRIMARY KEY,
        intakeDate TEXT NOT NULL,
        monthYear TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        challanNumber TEXT,
        supplier TEXT,
        receivedBy TEXT,
        userRole TEXT,
        timestamp TEXT
      )
    `);

    // 9. Payroll Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS payroll (
        id TEXT PRIMARY KEY,
        employeeId TEXT,
        employeeName TEXT,
        role TEXT,
        regularHours REAL,
        hourlyRate REAL,
        otHours REAL,
        otRate REAL,
        cylinderIncentive REAL,
        bonus REAL,
        deduction REAL,
        netSalary REAL,
        ownerAdjustedSalary REAL,
        ownerNotes TEXT,
        approvedByOwner INTEGER,
        status TEXT,
        month TEXT
      )
    `);

    // Seed initial employees
    const empCheck = await fetchOne('SELECT COUNT(*) as count FROM employees');
    if (!empCheck || empCheck.count === 0) {
      const initialEmployees = [
        ['emp-00', 'Vetri', 'Owner', 'owner@vetriindane.com', 'Vetri@2026', '+91 96008 70814', '01 Jan 2023', 'Present', '9h 00m', '100%', 100, 'Active', 150],
        ['emp-01', 'Arun', 'Driver', 'driver.arun@vetriindane.com', 'Vetri@2026', '+91 98765 43210', '12 Jan 2024', 'Present', '8h 42m', '17/24', 95, 'Active', 85],
        ['emp-02', 'Kumar', 'Loadman', 'loadman.kumar@vetriindane.com', 'Vetri@2026', '+91 98765 43211', '05 Mar 2024', 'Present', '9h 05m', '86/100', 94, 'Active', 70],
        ['emp-03', 'Suresh', 'Driver', 'driver.suresh@vetriindane.com', 'Vetri@2026', '+91 98765 43212', '18 Jun 2023', 'Present', '8h 50m', '21/25', 96, 'Active', 90],
        ['emp-04', 'Ramesh', 'Driver', 'driver.ramesh@vetriindane.com', 'Vetri@2026', '+91 98765 43213', '10 Nov 2023', 'Present', '7h 15m', '14/20', 88, 'Active', 85],
        ['emp-05', 'Vijay', 'Driver', 'driver.vijay@vetriindane.com', 'Vetri@2026', '+91 98765 43214', '01 Feb 2024', 'Late', '4h 30m', '5/18', 82, 'Active', 80],
        ['emp-06', 'Murugan', 'Loadman', 'loadman.murugan@vetriindane.com', 'Vetri@2026', '+91 98765 43215', '22 Aug 2023', 'Present', '8h 40m', '92/100', 97, 'Active', 70],
        ['emp-07', 'Santhosh', 'Manager', 'manager@vetriindane.com', 'Vetri@2026', '+91 98765 00002', '01 Jan 2023', 'Present', '9h 30m', '100%', 99, 'Active', 120],
        ['emp-08', 'Karthik', 'Godown Keeper', 'storeroom@vetriindane.com', 'Vetri@2026', '+91 98765 00003', '15 Feb 2023', 'Present', '8h 00m', '100%', 95, 'Active', 100],
      ];

      for (const emp of initialEmployees) {
        const hashedPassword = hashPassword(emp[4] as string);
        const empRecord = [...emp];
        empRecord[4] = hashedPassword;

        await runQuery(
          `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO NOTHING`,
          empRecord
        );
      }
      console.log('✓ Employees seeded into SQLite Database with PBKDF2 salted password hashing!');
    }

    // Seed Payroll Table
    const payCheck = await fetchOne('SELECT COUNT(*) as count FROM payroll');
    if (!payCheck || payCheck.count === 0) {
      const initialPayroll = [
        ['pay-01', 'emp-01', 'Arun', 'Driver', 172.5, 85, 14, 127.5, 450, 600, 200, 16847.5, 16847.5, 'Validated by Owner', 1, 'Approved', 'August 2026'],
        ['pay-02', 'emp-02', 'Kumar', 'Loadman', 180.0, 70, 18, 105.0, 320, 500, 150, 14840.0, 14840.0, 'Validated by Owner', 1, 'Approved', 'August 2026'],
        ['pay-03', 'emp-03', 'Suresh', 'Driver', 176.0, 90, 20, 135.0, 520, 750, 0, 19290.0, 19290.0, 'Pending Final Signoff', 0, 'Review', 'August 2026'],
        ['pay-04', 'emp-04', 'Ramesh', 'Driver', 160.0, 85, 10, 127.5, 380, 400, 100, 15555.0, 15555.0, 'Validated by Owner', 1, 'Approved', 'August 2026'],
        ['pay-05', 'emp-06', 'Murugan', 'Loadman', 175.0, 70, 15, 105.0, 300, 450, 0, 14575.0, 14575.0, 'Validated by Owner', 1, 'Approved', 'August 2026'],
      ];

      for (const p of initialPayroll) {
        await runQuery(
          `INSERT INTO payroll (id, employeeId, employeeName, role, regularHours, hourlyRate, otHours, otRate, cylinderIncentive, bonus, deduction, netSalary, ownerAdjustedSalary, ownerNotes, approvedByOwner, status, month)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          p
        );
      }
      console.log('✓ Payroll records seeded into SQLite Database!');
    }

    // Seed Vehicles Table
    const vehCheck = await fetchOne('SELECT COUNT(*) as count FROM vehicles');
    if (!vehCheck || vehCheck.count === 0) {
      const initialVehicles = [
        ['v1', 'TN 38 AU 4821', 'Arun', 'emp-01', 'MOVING', 38, 1, 67.4, 17, 24, 11.0168, 76.9558, 1, 'LIVE'],
        ['v2', 'TN 38 BV 9012', 'Suresh', 'emp-03', 'MOVING', 44, 1, 89.2, 21, 25, 11.0250, 76.9620, 1, 'LIVE'],
        ['v3', 'TN 38 CW 1054', 'Ramesh', 'emp-04', 'STOPPED', 0, 0, 45.1, 14, 20, 11.0080, 76.9450, 1, 'LIVE'],
        ['v4', 'TN 38 DX 6720', 'Vijay', 'emp-05', 'STOPPED', 0, 0, 12.0, 5, 18, 11.0310, 76.9700, 1, 'OFFLINE'],
      ];

      for (const v of initialVehicles) {
        await runQuery(
          `INSERT INTO vehicles (id, registrationNumber, driverName, driverId, status, speed, ignition, todayDistanceKm, completedDeliveries, totalDeliveries, lat, lng, hasCamera, cameraStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(registrationNumber) DO NOTHING`,
          v
        );
      }
      console.log('✓ Vehicle fleet telemetry records seeded into SQLite Database!');
    }

    console.log('✓ Local SQLite Database schema & seed data verified successfully!');
  } catch (err) {
    console.error('Error seeding local SQLite database:', err);
  }
}
