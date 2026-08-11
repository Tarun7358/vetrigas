-- Vetri Indane LPG Distribution Platform - Supabase PostgreSQL Schema
-- Direct SQL Editor Script for Project momjtslfcuetwjwcnyfb
-- Paste and Run in Supabase SQL Editor: https://supabase.com/dashboard/project/momjtslfcuetwjwcnyfb/sql/new

DROP TABLE IF EXISTS public.vehicle_expenses CASCADE;
DROP TABLE IF EXISTS public.loading_batches CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;

-- 1. Employees Table
CREATE TABLE public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    password TEXT,
    phone TEXT,
    joining_date TEXT,
    attendance_status TEXT DEFAULT 'Not Scanned',
    working_hours TEXT DEFAULT '--',
    today_work_progress TEXT DEFAULT '0/0',
    performance_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    hourly_rate NUMERIC DEFAULT 85,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vehicles Table
CREATE TABLE public.vehicles (
    id TEXT PRIMARY KEY,
    registration_number TEXT NOT NULL,
    driver_name TEXT,
    driver_id TEXT,
    status TEXT DEFAULT 'STOPPED',
    speed INTEGER DEFAULT 0,
    ignition INTEGER DEFAULT 0,
    today_distance_km NUMERIC DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    lat NUMERIC DEFAULT 11.0168,
    lng NUMERIC DEFAULT 76.9558,
    has_camera INTEGER DEFAULT 1,
    camera_status TEXT DEFAULT 'LIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vehicle Expenses Table
CREATE TABLE public.vehicle_expenses (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT,
    driver_name TEXT,
    type TEXT,
    amount NUMERIC NOT NULL,
    liters NUMERIC DEFAULT 0,
    odometer_reading INTEGER DEFAULT 0,
    description TEXT,
    bill_photo_url TEXT,
    date TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bills Table
CREATE TABLE public.bills (
    id TEXT PRIMARY KEY,
    bill_number TEXT NOT NULL,
    customer_name TEXT,
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'UPI',
    transaction_id TEXT,
    driver_name TEXT,
    date TEXT,
    status TEXT DEFAULT 'PAID',
    cylinder_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deliveries Table
CREATE TABLE public.deliveries (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    address TEXT,
    phone TEXT,
    category TEXT DEFAULT 'COMMERCIAL',
    status TEXT DEFAULT 'PENDING',
    payment_type TEXT DEFAULT 'UPI',
    amount NUMERIC DEFAULT 940,
    assigned_driver_id TEXT,
    assigned_driver_name TEXT,
    scheduled_time TEXT,
    delivered_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Loading Batches Table
CREATE TABLE public.loading_batches (
    id TEXT PRIMARY KEY,
    batch_number TEXT,
    vehicle_registration TEXT,
    driver_name TEXT,
    filled_cylinders INTEGER DEFAULT 0,
    required_count INTEGER DEFAULT 25,
    loaded_count INTEGER DEFAULT 0,
    empty_returned INTEGER DEFAULT 0,
    loadman_name TEXT DEFAULT 'Kumar',
    timestamp TEXT,
    status TEXT DEFAULT 'IN_PROGRESS',
    discrepancy_reason TEXT,
    discrepancy_diff INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Attendance Table
CREATE TABLE public.attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    employee_name TEXT,
    role TEXT,
    date TEXT,
    check_in TEXT,
    check_out TEXT,
    working_hours TEXT,
    status TEXT DEFAULT 'Present',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Monthly Stock Intake Table
CREATE TABLE public.stock_intake (
    id TEXT PRIMARY KEY,
    intake_date TEXT NOT NULL,
    month_year TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    challan_number TEXT,
    supplier TEXT DEFAULT 'Indian Oil Peelamedu Bottling Plant',
    received_by TEXT,
    user_role TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row-Level Security for direct REST/API sync
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intake DISABLE ROW LEVEL SECURITY;
