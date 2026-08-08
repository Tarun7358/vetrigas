-- =============================================================================
-- VETRI INDANE — LPG Distribution Management Platform Database Schema
-- Technology Partner: RDK Technologies
-- Database System: PostgreSQL 14+
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & USERS
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- OWNER, MANAGER, DRIVER, LOADMAN
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMPLOYEES
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Driver, Loadman, Manager, Owner
    phone VARCHAR(20) NOT NULL,
    joining_date DATE NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BIOMETRIC ATTENDANCE (Easy Time Pro Integration)
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    working_hours DECIMAL(5,2),
    status VARCHAR(20) NOT NULL, -- Present, Late, Absent
    source VARCHAR(50) NOT NULL DEFAULT 'Easy Time Pro', -- Hardware requirement
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PAYROLL & SALARY RULES
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_month VARCHAR(20) NOT NULL, -- e.g. "August 2026"
    status VARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft, Review, Approved, Locked, Paid
    total_estimated DECIMAL(12,2) NOT NULL,
    total_approved DECIMAL(12,2) DEFAULT 0.00,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID REFERENCES payroll(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    regular_hours DECIMAL(6,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    ot_hours DECIMAL(6,2) DEFAULT 0.00,
    ot_rate DECIMAL(10,2) NOT NULL,
    bonus DECIMAL(10,2) DEFAULT 0.00,
    deduction DECIMAL(10,2) DEFAULT 0.00,
    net_salary DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. FLEET & GPS TELEMETRY (Fleettrack Integration)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(20) UNIQUE NOT NULL, -- e.g. "TN XX 1234"
    assigned_driver_id UUID REFERENCES employees(id),
    status VARCHAR(20) DEFAULT 'STOPPED', -- MOVING, STOPPED, OFFLINE
    speed DECIMAL(5,2) DEFAULT 0.00,
    ignition BOOLEAN DEFAULT FALSE,
    today_distance_km DECIMAL(8,2) DEFAULT 0.00,
    has_camera BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    speed DECIMAL(5,2) NOT NULL,
    ignition BOOLEAN NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. LOADING BATCHES
CREATE TABLE loading_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(30) UNIQUE NOT NULL, -- e.g. "BATCH LB1021"
    driver_id UUID REFERENCES employees(id),
    vehicle_id UUID REFERENCES vehicles(id),
    loadman_id UUID REFERENCES employees(id),
    required_count INT NOT NULL,
    loaded_count INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- COMPLETED, DISCREPANCY
    discrepancy_reason TEXT,
    discrepancy_diff INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CUSTOMERS & DELIVERIES
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_number VARCHAR(30) UNIQUE NOT NULL, -- e.g. "VI10251"
    customer_id UUID REFERENCES customers(id),
    driver_id UUID REFERENCES employees(id),
    vehicle_id UUID REFERENCES vehicles(id),
    cylinder_count INT NOT NULL DEFAULT 1,
    amount DECIMAL(10,2) NOT NULL DEFAULT 940.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED', -- ASSIGNED, READY, OUT FOR DELIVERY, DELIVERED, FAILED, RETURNED
    distance_km DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BILLING & RECONCILIATION
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(40) UNIQUE NOT NULL, -- e.g. "VI-2026-001025"
    delivery_id UUID REFERENCES deliveries(id),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- UPI, CASH
    transaction_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    expected_total DECIMAL(12,2) NOT NULL,
    upi_received DECIMAL(12,2) NOT NULL,
    cash_expected DECIMAL(12,2) NOT NULL,
    cash_submitted DECIMAL(12,2) NOT NULL,
    difference DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'BALANCED',
    reconciled_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CYLINDER INVENTORY
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    available INT NOT NULL,
    loaded INT NOT NULL,
    with_drivers INT NOT NULL,
    delivered INT NOT NULL,
    returned INT NOT NULL,
    damaged INT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    username VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    module VARCHAR(50) NOT NULL,
    record VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SEED DATA — TEMPORARY PRODUCTION USERS
-- Owner Name: Vetri
-- Default Password for All Seed Accounts: admin123
-- =============================================================================

INSERT INTO roles (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'OWNER', 'Full System Control & Financial Approvals'),
('22222222-2222-2222-2222-222222222222', 'MANAGER', 'Operations, Dispatch & Live Fleet Management'),
('33333333-3333-3333-3333-333333333333', 'DRIVER', 'Field Delivery & Customer Payment Collection'),
('44444444-4444-4444-4444-444444444444', 'LOADMAN', 'Depot Loading & Discrepancy Audits'),
('55555555-5555-5555-5555-555555555555', 'GODOWN_KEEPER', 'Godown Stock Entry & Client Order Bookings'),
('66666666-6666-6666-6666-666666666666', 'STOREROOM_STAFF', 'Office Operations & Briefing Analytics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, role_id) VALUES
('a1111111-1111-1111-1111-111111111111', 'vetri_owner', 'owner@vetri.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '11111111-1111-1111-1111-111111111111'),
('b2222222-2222-2222-2222-222222222222', 'santhosh_manager', 'manager@vetri.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '22222222-2222-2222-2222-222222222222'),
('c3333333-3333-3333-3333-333333333333', 'arun_driver', 'arun@vetri.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '33333333-3333-3333-3333-333333333333'),
('d4444444-4444-4444-4444-444444444444', 'kumar_loadman', 'kumar@vetri.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '44444444-4444-4444-4444-444444444444'),
('e5555555-5555-5555-5555-555555555555', 'karthik_godown', 'karthik.godown@vetriindane.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '55555555-5555-5555-5555-555555555555'),
('f6666666-6666-6666-6666-666666666666', 'priya_storeroom', 'priya.office@vetriindane.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '66666666-6666-6666-6666-666666666666')
ON CONFLICT (username) DO NOTHING;

INSERT INTO employees (user_id, employee_code, name, role, phone, joining_date, hourly_rate) VALUES
('a1111111-1111-1111-1111-111111111111', 'EMP-OWNER-01', 'Vetri', 'Owner', '+91 98765 00001', '2024-01-01', 200.00),
('b2222222-2222-2222-2222-222222222222', 'EMP-MGR-01', 'Santhosh', 'Manager', '+91 98765 00002', '2024-02-01', 120.00),
('c3333333-3333-3333-3333-333333333333', 'EMP-DRV-01', 'Arun', 'Driver', '+91 98765 43210', '2024-01-12', 75.00),
('d4444444-4444-4444-4444-444444444444', 'EMP-LDM-01', 'Kumar', 'Loadman', '+91 98765 43211', '2024-03-05', 65.00),
('e5555555-5555-5555-5555-555555555555', 'EMP-GDN-01', 'Karthik', 'Godown Keeper', '+91 98765 00003', '2024-02-15', 95.00),
('f6666666-6666-6666-6666-666666666666', 'EMP-STR-01', 'Priya', 'Storeroom Staff', '+91 98765 00004', '2024-01-10', 110.00)
ON CONFLICT (employee_code) DO NOTHING;
