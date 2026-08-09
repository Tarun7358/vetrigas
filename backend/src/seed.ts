import { runQuery, fetchOne } from './db';
import { hashPassword } from './crypto';

export async function seedDatabase() {
  try {
    // 1. Employees Table Schema
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

    // 2. Vehicles / GPS Telemetry Table Schema
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

    // 3. Vehicle Expenses Table Schema
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

    // 4. Bills & Collections Table Schema
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

    // 5. Deliveries Table Schema
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

    // 6. Loading Batches Table Schema
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

    // 7. Attendance Log Table Schema
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

    // 8. Monthly Stock Intake Table Schema
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

    // 9. Payroll Table Schema
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

    // Seed ONLY the master Owner account (emp-00) if no Owner exists
    const ownerCheck = await fetchOne(`SELECT id FROM employees WHERE id = 'emp-00' OR LOWER(email) = 'owner@vetriindane.com'`);
    if (!ownerCheck) {
      const hashedPassword = hashPassword('Vetri@2026');
      await runQuery(
        `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate)
         VALUES ('emp-00', 'Vetri', 'Owner', 'owner@vetriindane.com', ?, '+91 96008 70814', '01 Jan 2023', 'Present', '9h 00m', '100%', 100, 'Active', 150)`,
        [hashedPassword]
      );
      console.log('✓ Master Owner account (emp-00) created in SQLite database.');
    }

    // PURGE DEMO MOCK ACCOUNTS AND MOCK TRUCKS SO NONE RE-APPEAR AUTOMATICALLY
    await runQuery(`DELETE FROM employees WHERE id IN ('emp-01', 'emp-02', 'emp-03', 'emp-04', 'emp-05', 'emp-06', 'emp-07', 'emp-08') OR email LIKE '%@vetriindane.com' AND id != 'emp-00'`);
    await runQuery(`DELETE FROM vehicles WHERE id IN ('v1', 'v2', 'v3', 'v4') OR registrationNumber IN ('TN 38 AU 4821', 'TN 38 BV 9012', 'TN 38 CW 1054', 'TN 38 DX 6720')`);
    await runQuery(`DELETE FROM payroll WHERE id IN ('pay-01', 'pay-02', 'pay-03', 'pay-04', 'pay-05')`);
    
    console.log('✓ Database clean! Zero mock users or trucks automatically created.');
  } catch (err) {
    console.error('Error verifying database schema:', err);
  }
}
