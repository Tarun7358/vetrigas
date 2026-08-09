# ⛽ Vetri Indane LPG Distribution & Operations Platform

> **Production-Ready Commercial Logistics & LPG Enterprise Platform**  
> Designed for **Vetri Indane LPG Distributors** (Peelamedu, Coimbatore, Tamil Nadu).

---

## 🌟 Platform Overview

The **Vetri Indane Platform** is an end-to-end, multi-role LPG agency management system designed for desktop web, mobile browsers (PWA), and native Android APK devices. It streamlines cylinder inventory, customer order dispatching, driver vehicle tracking, loadman batch verification, WhatsApp e-billing, and biometric shift payroll.

---

## 🔑 Default Login Credentials (Production Seed)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@vetriindane.com` | `Vetri@2026` | Full Control (Stock Intake, Dynamic Fleet CRUD, Worker Payroll Validation, System Audit Logs, Hardware Telemetry) |
| **Manager** | `manager@vetriindane.com` | `Vetri@2026` | Operations, Order Dispatching, Expense Approvals, Attendance Overviews |
| **Driver** | `driver.arun@vetriindane.com` | `Vetri@2026` | Assigned Order Navigation, Camera Monitor, Customer E-Bill Dispatch, Payment Proof Upload |
| **Loadman** | `loadman.kumar@vetriindane.com` | `Vetri@2026` | Loading Batch Acceptance, Cylinder Inventory Verification, Stock Discrepancy Flagging |
| **Storeroom** | `storeroom@vetriindane.com` | `Vetri@2026` | Stock Intake Registration, New Order Registration, Cylinder Inventory Counter |

---

## 🚀 Key Modules & Operational Workflows

### 1. 📦 Start-of-Month Stock Refill & Inventory Tracking
- **Authorized Roles**: Owner & Godown Keeper / Storeroom Staff.
- **Function**: Record bulk refill cylinder arrivals from IOCL Peelamedu Bottling Plant with invoice/challan numbers, cylinder categories (14.2kg Domestic / 19kg Commercial), and received quantity.
- **Persistence**: Persists directly to backend database (`/api/stock-intake`).

### 2. 💵 Automated Driver Payroll & Incentive Engine
- **Function**: Automatically calculates monthly salary slips based on:
  - **Shift Working Hours**: Logged via biometric fingerprint punch scanner (Easy Time Pro / ZKTeco).
  - **Per-Cylinder Incentive**: Commission earned per completed delivery (e.g. ₹5/domestic, ₹12/commercial cylinder).
- **Owner Month-End Validation**: Includes an interactive modal for the Owner to manually adjust final payouts, add bonuses/deductions, enter notes, and issue final approvals.

### 3. 📱 WhatsApp Order Dispatcher & Instant E-Bill
- Automatically dispatches WhatsApp alerts to customers upon order assignment:  
  `"Your Indane Refill #ORD-84920 is out for delivery with driver Arun (+91 96008 70814)."`
- Dispatches GST Tax Invoice download links upon delivery completion.

### 4. ⚡ Real-Time IoT Hardware Telemetry & Biometric Station
- **Hardware Integration**:
  - **Fleettrack IoT GPS Tracker**: Monitoring vehicle locations, ignition status, speed, and overspeed alerts.
  - **Easy Time Pro Biometric Scanner**: Syncing fingerprint clock-ins directly to workforce attendance.
- **Live Status Display**: Dynamically displays node connectivity (`CONNECTED` vs `DISCONNECTED / STANDBY`), packet latency, and heartbeat interval. Includes manual toggle controls for socket testing.

### 5. 🚚 Dynamic Fleet Vehicle Management
- **Owner Controlled**: Owners can add new vehicles (`+ Add New Fleet Vehicle`) or delete existing trucks in real-time.
- **Camera Viewport Lock**: Drivers are strictly locked to their assigned vehicle's camera stream. Displays a clean empty state (`🚫 NO FLEET TRUCK REGISTERED OR ASSIGNED`) when no vehicle is configured.

---

## 🏗️ Technical Architecture & Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (Vanilla CSS system), Lucide Icons, WebSockets / SSE.
- **Backend API**: Node.js, Express, TypeScript, JWT Security, Helmet, Express Rate Limiter.
- **Database**: Dual-engine architecture:
  - **Local/Offline**: SQLite (`database/vetri_indane.db`).
  - **Cloud Scale**: Supabase PostgreSQL DB.
- **Mobile Native**: Flutter SDK (Compiles to Android `.apk`).

---

## 🌐 Live URLs & Production Deployment

- **Live Web Application (PWA)**: [https://lovely-sunburst-74bfc0.netlify.app](https://lovely-sunburst-74bfc0.netlify.app)
- **Backend API Server**: Hosted on Render (`https://vetrigas.onrender.com` / `http://localhost:5000`)
- **Android APK Bundles**:
  - `VetriIndane_Universal_v2.5.apk` (All Devices)
  - `VetriIndane_Worker_v2.5.apk` (ARM64 Optimized)

---

## 🛠️ Local Development Setup

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Start Development Servers
```bash
# Start Backend API (Port 5000)
cd backend
npm run dev

# Start Frontend (Port 5173)
cd frontend
npm run dev
```

### 3. Build Production Bundles
```bash
# Build Frontend
cd frontend
npm run build

# Build Backend
cd backend
npm run build
```

---

> **Vetri Indane Enterprise Platform** — Developed for commercial operations by RDK Technologies.
