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

    // Ensure columns exist for existing SQLite databases
    try { await runQuery(`ALTER TABLE employees ADD COLUMN hourlyRate REAL`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN phone TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN password TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN joiningDate TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN attendanceStatus TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN workingHours TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN todayWorkProgress TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN performanceScore INTEGER`); } catch (e) {}
    try { await runQuery(`ALTER TABLE employees ADD COLUMN status TEXT`); } catch (e) {}

    // 2. Vehicles / GPS Telemetry Table Schema
    await runQuery(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        registrationNumber TEXT UNIQUE NOT NULL,
        driverName TEXT,
        driverId TEXT,
        gpsDeviceId TEXT,
        simCardNumber TEXT,
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

    // Ensure columns exist for existing databases
    try { await runQuery(`ALTER TABLE vehicles ADD COLUMN gpsDeviceId TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE vehicles ADD COLUMN simCardNumber TEXT`); } catch (e) {}

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
        checkIn TEXT,
        checkOut TEXT,
        workingHours TEXT,
        status TEXT,
        date TEXT
      )
    `);

    try { await runQuery(`ALTER TABLE attendance ADD COLUMN checkIn TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE attendance ADD COLUMN checkOut TEXT`); } catch (e) {}
    try { await runQuery(`ALTER TABLE attendance ADD COLUMN date TEXT`); } catch (e) {}

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

    // Seed default existing employees if missing
    const defaultEmps = [
      { id: 'emp-00', name: 'Vetri', role: 'Owner', email: 'owner@vetriindane.com', phone: '+91 96008 70814', att: 'Not Scanned' },
      { id: 'emp-08', name: 'Santhosh', role: 'Manager', email: 'manager@vetriindane.com', phone: '+91 98421 00002', att: 'Not Scanned' },
      { id: 'emp-01', name: 'Arun', role: 'Driver', email: 'arun@vetriindane.com', phone: '+91 98421 12345', att: 'Not Scanned' },
      { id: 'emp-02', name: 'Suresh', role: 'Driver', email: 'suresh@vetriindane.com', phone: '+91 98421 23456', att: 'Not Scanned' },
      { id: 'emp-03', name: 'Ramesh', role: 'Driver', email: 'ramesh@vetriindane.com', phone: '+91 98421 34567', att: 'Not Scanned' },
      { id: 'emp-04', name: 'Vijay', role: 'Driver', email: 'vijay@vetriindane.com', phone: '+91 98421 45678', att: 'Not Scanned' },
      { id: 'emp-05', name: 'Kumar', role: 'Loadman', email: 'kumar@vetriindane.com', phone: '+91 98421 56789', att: 'Not Scanned' },
      { id: 'emp-06', name: 'Priya', role: 'Storeroom Staff', email: 'priya@vetriindane.com', phone: '+91 98421 67890', att: 'Not Scanned' },
      { id: 'emp-07', name: 'Karthik', role: 'Godown Keeper', email: 'karthik@vetriindane.com', phone: '+91 98421 78901', att: 'Not Scanned' },
    ];

    const hashedPassword = hashPassword('Vetri@2026');
    for (const emp of defaultEmps) {
      const exists = await fetchOne('SELECT id FROM employees WHERE id = ? OR LOWER(email) = ?', [emp.id, emp.email.toLowerCase()]);
      if (!exists) {
        await runQuery(
          `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate)
           VALUES (?, ?, ?, ?, ?, ?, '01 Jan 2024', ?, '--', '0/0', 92, 'Active', 85)`,
          [emp.id, emp.name, emp.role, emp.email.toLowerCase(), hashedPassword, emp.phone, emp.att]
        );
      }
    }

    // Seed default vehicles if missing
    const defaultVehicles = [
      { id: 'v1', reg: 'TN 38 AU 4821', driver: 'Arun', driverId: 'emp-01', lat: 11.0168, lng: 76.9558, speed: 0, status: 'STOPPED' },
      { id: 'v2', reg: 'TN 38 BV 9012', driver: 'Suresh', driverId: 'emp-02', lat: 11.0250, lng: 76.9620, speed: 0, status: 'STOPPED' },
      { id: 'v3', reg: 'TN 38 CW 1054', driver: 'Ramesh', driverId: 'emp-03', lat: 11.0080, lng: 76.9450, speed: 0, status: 'STOPPED' },
      { id: 'v4', reg: 'TN 38 DX 6720', driver: 'Vijay', driverId: 'emp-04', lat: 11.0310, lng: 76.9700, speed: 0, status: 'STOPPED' },
    ];

    for (const veh of defaultVehicles) {
      const vExists = await fetchOne('SELECT id FROM vehicles WHERE id = ? OR registrationNumber = ?', [veh.id, veh.reg]);
      if (!vExists) {
        await runQuery(
          `INSERT INTO vehicles (id, registrationNumber, driverName, driverId, gpsDeviceId, simCardNumber, status, speed, ignition, todayDistanceKm, completedDeliveries, totalDeliveries, lat, lng, hasCamera, cameraStatus)
           VALUES (?, ?, ?, ?, ?, '+91 96008 70814', ?, ?, 1, 24.5, 12, 18, ?, ?, 1, 'LIVE')`,
          [veh.id, veh.reg, veh.driver, veh.driverId, `GPS-EH21-${veh.id.toUpperCase()}`, veh.status, veh.speed, veh.lat, veh.lng]
        );
      }
    }

    console.log('✓ Default employees & fleet vehicles verified in SQLite database.');
  } catch (err) {
    console.error('Error verifying database schema:', err);
  }
}

