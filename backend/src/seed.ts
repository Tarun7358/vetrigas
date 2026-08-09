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

    // 8. Monthly Stock Intake Table (Owner & Godown Keeper Stock Entries)
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

    // 9. Payroll Table (Automated Incentives & Owner Month-End Validation)
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

    // Seed initial employee (Owner ONLY)
    const empCheck = await fetchOne('SELECT COUNT(*) as count FROM employees');
    if (empCheck && empCheck.count === 0) {
      const initialEmployees = [
        ['emp-00', 'Vetri', 'Owner', 'owner@vetriindane.com', 'Vetri@2026', '+91 96008 70814', '01 Jan 2023', 'Present', '9h 00m', '100%', 100, 'Active', 150]
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
      console.log('✓ Owner Employee account seeded into SQLite Database with PBKDF2 salted password hashing!');
    }

    // Explicitly delete any legacy demo worker accounts except Owner (emp-00)
    await runQuery(`DELETE FROM employees WHERE id != 'emp-00' AND role != 'Owner'`);
    console.log('✓ Purged all employee accounts from SQLite database except Owner (emp-00).');

    console.log('✓ Local SQLite Database schema verified successfully!');
  } catch (err) {
    console.error('Error seeding local SQLite database:', err);
  }
}
