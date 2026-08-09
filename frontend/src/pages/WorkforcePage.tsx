import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Employee } from '../types';
import { Users, Search, X, UserPlus, Trash2, ShieldAlert } from 'lucide-react';
import { calculateProductivityReport } from '../utils/productivityAudit';

export const WorkforcePage: React.FC = () => {
  const { employees, deliveries, role, addEmployee, removeEmployee } = useApp();
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);

  // Add Worker Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Driver' | 'Loadman' | 'Manager' | 'Godown Keeper' | 'Storeroom Staff'>('Driver');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Vetri@2026');
  const [newPhone, setNewPhone] = useState('+91 ');
  const [newHourlyRate, setNewHourlyRate] = useState(75);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !newEmail) return;

    addEmployee({
      name: newName,
      role: newRole,
      email: newEmail,
      password: newPassword,
      phone: newPhone,
      hourlyRate: newHourlyRate,
    });

    // Reset & Close
    setNewName('');
    setNewEmail('');
    setNewPassword('Vetri@2026');
    setNewPhone('+91 ');
    setNewHourlyRate(75);
    setShowAddModal(false);
  };

  const handleConfirmDelete = () => {
    if (empToDelete) {
      removeEmployee(empToDelete.id);
      setEmpToDelete(null);
    }
  };

  const isOwner = (role || '').toUpperCase() === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/40">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Workforce Management</h1>
            <p className="text-xs text-slate-400">
              Active LPG Drivers, Loadmen & Operational Staff
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full bg-slate-950 text-xs border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Add New Worker Button (Owner Privilege Gated) */}
          <button
            onClick={() => setShowAddModal(true)}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isOwner
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
            title={isOwner ? 'Register new worker' : 'Owner privilege required'}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register New Worker</span>
            {!isOwner && <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-400">OWNER ONLY</span>}
          </button>
        </div>
      </div>

      {/* Permission Notification Banner for non-owners */}
      {!isOwner && (
        <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Role Permission Notice:</strong> You are currently logged in as <strong>{role}</strong>. Worker registration and termination privileges are restricted strictly to the <strong>OWNER</strong> role.
            </span>
          </div>
        </div>
      )}

      {/* Workforce Directory Table */}
      <div className="mobile-table-container bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Shift & Net Hours</th>
              <th>Idle Deduction</th>
              <th>Today's Velocity</th>
              <th>Performance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const roleNorm = (emp.role || '').toLowerCase();
              const isOwner = roleNorm.includes('owner');

              // Dynamic cylinders delivered calculation from real deliveries
              let delivered = 0;
              if (roleNorm.includes('driver')) {
                const driverDels = deliveries.filter(d => (d.driverName || '').toLowerCase() === emp.name.toLowerCase() && d.status === 'DELIVERED');
                delivered = driverDels.reduce((sum, d) => sum + (d.cylinderCount || 1), 0);
              } else if (roleNorm.includes('loadman')) {
                const completedDels = deliveries.filter(d => d.status === 'DELIVERED');
                delivered = completedDels.reduce((sum, d) => sum + (d.cylinderCount || 1), 0);
              }

              // Dynamic gross shift hours & audit calculation
              const grossHoursNum = isOwner ? 9.0 : 8.0;
              const idleMins = 0;
              const audit = calculateProductivityReport(emp.id, emp.name, emp.role, grossHoursNum, delivered, idleMins);

              // Dynamic performance score calculation
              const perfScore = isOwner ? 100 : delivered > 0 ? Math.min(100, Math.round(85 + (delivered / Math.max(delivered, 20)) * 15)) : 95;

              return (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{emp.name}</p>
                        <p className="text-[11px] text-slate-500">{emp.email || emp.phone} ({emp.id})</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge-status ${
                        emp.role === 'Driver'
                          ? 'badge-blue'
                          : emp.role === 'Loadman'
                          ? 'badge-amber'
                          : emp.role === 'Godown Keeper' || emp.role === 'Storeroom Staff'
                          ? 'badge-green'
                          : 'badge-purple'
                      }`}
                    >
                      {emp.role}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-mono text-xs font-extrabold text-emerald-700">Net: {audit.netHoursFormatted}</p>
                      <p className="text-[10px] text-slate-500">Gross: {emp.workingHours || (isOwner ? '9h 00m' : '8h 00m')}</p>
                    </div>
                  </td>
                  <td>
                    {audit.unproductiveIdleMinutes > 0 ? (
                      <span className="badge-status badge-red text-[10px] font-mono font-bold">
                        -{audit.deductedHoursFormatted} ({audit.fuelWastedLiters}L Idle)
                      </span>
                    ) : (
                      <span className="badge-status badge-green text-[10px] font-mono font-bold">0m Idle</span>
                    )}
                  </td>
                  <td>
                    <div>
                      <p className="font-mono text-xs font-bold text-blue-700">{audit.deliveryVelocityPerHour} Cyl/Hr</p>
                      <p className="text-[10px] text-slate-500">{audit.cylindersDelivered} Total Units</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-emerald-500 h-full" style={{ width: `${perfScore}%` }}></div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900">{perfScore}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-status badge-green">{emp.status}</span>
                  </td>
                <td>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedEmp(emp)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      Profile
                    </button>
                    {isOwner ? (
                      <button
                        onClick={() => setEmpToDelete(emp)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded transition-colors"
                        title="Remove worker (Owner privilege)"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Locked</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Register New Worker</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isOwner ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border border-rose-800">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg text-white">Owner Authorization Required</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Only the <strong>OWNER</strong> role can register or remove employees on the Vetri Indane platform. Please log in with Owner credentials to perform workforce onboarding.
                </p>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Close Notice
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                    Assigned Role
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Driver">Driver (LPG Delivery Route)</option>
                    <option value="Loadman">Loadman (Depot Cylinder Loading)</option>
                    <option value="Manager">Manager (Operations Controller)</option>
                    <option value="Godown Keeper">Godown Keeper (Depot Stock & Monthly Intake)</option>
                    <option value="Storeroom Staff">Storeroom Staff (Inventory & Dispatch)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                      Gmail / Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="worker@vetriindane.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                      Initial Login Password
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Vetri@2026"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                    Base Hourly Pay Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={newHourlyRate}
                    onChange={e => setNewHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold shadow-lg shadow-amber-500/20"
                  >
                    Register Worker
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Remove Worker Confirmation Modal */}
      {empToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-white text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border border-rose-800">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Confirm Worker Termination</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove worker <strong>{empToDelete.name}</strong> ({empToDelete.role}, {empToDelete.id}) from the active platform directory?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 text-xs">
              <button
                onClick={() => setEmpToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-rose-600/20"
              >
                Remove Worker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                  {selectedEmp.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedEmp.name}</h3>
                  <p className="text-xs text-slate-400">{selectedEmp.role} • Employee ID: {selectedEmp.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px]">Phone</p>
                  <p className="font-semibold text-white mt-0.5">{selectedEmp.phone}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px]">Joining Date</p>
                  <p className="font-semibold text-white mt-0.5">{selectedEmp.joiningDate}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px]">Base Rate</p>
                  <p className="font-semibold text-amber-400 mt-0.5 font-mono">₹{selectedEmp.hourlyRate}/hr</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px]">Performance Score</p>
                  <p className="font-bold text-emerald-400 mt-0.5 font-mono">{selectedEmp.performanceScore} / 100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
