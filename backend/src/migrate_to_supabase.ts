import { fetchAll } from './db';
import { getSupabase, isSupabaseConfigured } from './supabase';

async function migrateData() {
  console.log('====================================================');
  console.log('  VETRI INDANE - SQLITE TO SUPABASE CLOUD MIGRATION ');
  console.log('====================================================\n');

  if (!isSupabaseConfigured()) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_KEY environment variables are missing in backend/.env!');
    console.error('Please create backend/.env with your Supabase credentials first.');
    process.exit(1);
  }

  const supabase = getSupabase()!;

  try {
    // 1. Employees Migration
    console.log('1. Migrating Employees from SQLite to Supabase...');
    const employees = await fetchAll('SELECT * FROM employees');
    if (employees.length > 0) {
      const mapped = employees.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role,
        email: e.email,
        password: e.password,
        phone: e.phone,
        joining_date: e.joiningDate,
        attendance_status: e.attendanceStatus,
        working_hours: e.workingHours,
        today_work_progress: e.todayWorkProgress,
        performance_score: e.performanceScore,
        status: e.status,
        hourly_rate: e.hourlyRate,
      }));
      const { error } = await supabase.from('employees').upsert(mapped, { onConflict: 'id' });
      if (error) console.error('   ❌ Employees Migration Error:', error.message);
      else console.log(`   ✓ Successfully migrated ${employees.length} employee records.`);
    }

    // 2. Vehicles Migration
    console.log('2. Migrating Vehicles from SQLite to Supabase...');
    const vehicles = await fetchAll('SELECT * FROM vehicles');
    if (vehicles.length > 0) {
      const mapped = vehicles.map(v => ({
        id: v.id,
        registration_number: v.registrationNumber,
        driver_name: v.driverName,
        driver_id: v.driverId,
        status: v.status,
        speed: v.speed,
        ignition: v.ignition,
        today_distance_km: v.todayDistanceKm,
        completed_deliveries: v.completedDeliveries,
        total_deliveries: v.totalDeliveries,
        lat: v.lat,
        lng: v.lng,
        has_camera: v.hasCamera,
        camera_status: v.cameraStatus,
      }));
      const { error } = await supabase.from('vehicles').upsert(mapped, { onConflict: 'id' });
      if (error) console.error('   ❌ Vehicles Migration Error:', error.message);
      else console.log(`   ✓ Successfully migrated ${vehicles.length} vehicle records.`);
    }

    // 3. Deliveries Migration
    console.log('3. Migrating Deliveries from SQLite to Supabase...');
    const deliveries = await fetchAll('SELECT * FROM deliveries');
    if (deliveries.length > 0) {
      const mapped = deliveries.map(d => ({
        id: d.id,
        customer_name: d.customerName,
        address: d.address,
        phone: d.phone,
        category: d.category,
        status: d.status,
        payment_type: d.paymentType,
        amount: d.amount,
        assigned_driver_id: d.assignedDriverId,
        assigned_driver_name: d.assignedDriverName,
        scheduled_time: d.scheduledTime,
        delivered_time: d.deliveredTime,
      }));
      const { error } = await supabase.from('deliveries').upsert(mapped, { onConflict: 'id' });
      if (error) console.error('   ❌ Deliveries Migration Error:', error.message);
      else console.log(`   ✓ Successfully migrated ${deliveries.length} delivery records.`);
    }

    // 4. Loading Batches Migration
    console.log('4. Migrating Loading Batches from SQLite to Supabase...');
    const batches = await fetchAll('SELECT * FROM loading_batches');
    if (batches.length > 0) {
      const mapped = batches.map(b => ({
        id: b.id,
        vehicle_registration: b.vehicleRegistration,
        driver_name: b.driverName,
        filled_cylinders: b.filledCylinders,
        empty_returned: b.emptyReturned,
        loadman_name: b.loadmanName,
        timestamp: b.timestamp,
        status: b.status,
      }));
      const { error } = await supabase.from('loading_batches').upsert(mapped, { onConflict: 'id' });
      if (error) console.error('   ❌ Loading Batches Migration Error:', error.message);
      else console.log(`   ✓ Successfully migrated ${batches.length} loading batch records.`);
    }

    // 5. Vehicle Expenses Migration
    console.log('5. Migrating Expenses from SQLite to Supabase...');
    const expenses = await fetchAll('SELECT * FROM vehicle_expenses');
    if (expenses.length > 0) {
      const mapped = expenses.map(e => ({
        id: e.id,
        vehicle_id: e.vehicleId,
        driver_name: e.driverName,
        type: e.type,
        amount: e.amount,
        liters: e.liters,
        odometer_reading: e.odometerReading,
        description: e.description,
        bill_photo_url: e.billPhotoUrl,
        date: e.date,
        status: e.status,
      }));
      const { error } = await supabase.from('vehicle_expenses').upsert(mapped, { onConflict: 'id' });
      if (error) console.error('   ❌ Expenses Migration Error:', error.message);
      else console.log(`   ✓ Successfully migrated ${expenses.length} expense records.`);
    }

    // 6. Bills Migration
    console.log('6. Migrating Bills from SQLite to Supabase...');
    const bills = await fetchAll('SELECT * FROM bills');
    if (bills.length > 0) {
      const mapped = bills.map(b => ({
        id: b.id,
        bill_number: b.billNumber,
        customer_name: b.customerName,
        amount: b.amount,
        payment_method: b.paymentMethod,
        transaction_id: b.transactionId,
        driver_name: b.driverName,
        date: b.date,
        status: b.status,
        cylinder_count: b.cylinderCount,
      }));
      const { error } = await supabase.from('bills').upsert(mapped, { onConflict: 'id' });
      if (error) console.error('   ❌ Bills Migration Error:', error.message);
      else console.log(`   ✓ Successfully migrated ${bills.length} bill records.`);
    }

    console.log('\n====================================================');
    console.log('  ✓ SUPABASE DATA MIGRATION COMPLETE SUCCESSFULLY!  ');
    console.log('====================================================');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateData();
