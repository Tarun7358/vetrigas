import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Fuel, Wrench, Plus, CheckCircle2, XCircle, Clock, FileText, Upload, Filter, DollarSign } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, vehicles, currentUser, role, addExpense, approveExpense, rejectExpense } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [expType, setExpType] = useState<'FUEL' | 'MAINTENANCE'>('FUEL');
  const [vehicleNumber, setVehicleNumber] = useState<string>(vehicles[0]?.registrationNumber || 'TN 38 AU 4821');
  const [amount, setAmount] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [odometerReading, setOdometerReading] = useState<string>('');
  const [litersFilled, setLitersFilled] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [billFileName, setBillFileName] = useState<string>('');

  const isManagement = role === 'OWNER' || role === 'MANAGER';

  // Visible expenses based on role
  const visibleExpenses = isManagement
    ? expenses
    : expenses.filter(e => e.driverName.toLowerCase() === (currentUser?.name || '').toLowerCase() || e.driverId === 'emp-01');

  const filtered = visibleExpenses.filter(e => {
    if (filterType === 'ALL') return true;
    if (filterType === 'FUEL') return e.type === 'FUEL';
    if (filterType === 'MAINTENANCE') return e.type === 'MAINTENANCE';
    if (filterType === 'PENDING') return e.status === 'PENDING';
    if (filterType === 'APPROVED') return e.status === 'APPROVED';
    return true;
  });

  const totalFuelCost = visibleExpenses.filter(e => e.type === 'FUEL' && e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);
  const totalMaintCost = visibleExpenses.filter(e => e.type === 'MAINTENANCE' && e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);
  const pendingApprovalsCount = visibleExpenses.filter(e => e.status === 'PENDING').length;

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !vendorName) {
      alert('Please fill in the expense amount and fuel station / garage name.');
      return;
    }

    addExpense({
      type: expType,
      vehicleNumber,
      driverName: currentUser?.name || 'Arun',
      driverId: 'emp-01',
      amount: Number(amount),
      vendorName,
      odometerReading: odometerReading ? Number(odometerReading) : undefined,
      litersFilled: litersFilled ? Number(litersFilled) : undefined,
      description: description || `${expType} expense logged by driver`,
      billNumber: billNumber || `BILL-${Math.floor(100000 + Math.random() * 900000)}`,
      receiptImage: billFileName || 'fuel_bill_receipt.jpg',
    });

    // Reset Form
    setAmount('');
    setVendorName('');
    setOdometerReading('');
    setLitersFilled('');
    setDescription('');
    setBillNumber('');
    setBillFileName('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Vehicle Expenses & Fuel Logs</h1>
            <p className="text-xs text-slate-400">
              Fuel Filling Records, Maintenance Bills & Driver Payout Approvals
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="mt-3 md:mt-0 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Submit Fuel / Repair Bill</span>
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Fuel Expenses</span>
            <p className="font-display font-bold text-xl text-slate-900 mt-1">₹{totalFuelCost.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Maintenance</span>
            <p className="font-display font-bold text-xl text-slate-900 mt-1">₹{totalMaintCost.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payout Approvals</span>
            <p className="font-display font-bold text-xl text-amber-600 mt-1">{pendingApprovalsCount} Bills</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        {['ALL', 'FUEL', 'MAINTENANCE', 'PENDING', 'APPROVED'].map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterType === f
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Expense Records List */}
      <div className="mobile-table-container bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Type</th>
              <th>Vehicle & Driver</th>
              <th>Vendor / Station</th>
              <th>Details (Litres / Odo)</th>
              <th>Amount</th>
              <th>Bill Copy</th>
              <th>Status</th>
              {isManagement && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <span
                      className={`badge-status flex items-center gap-1 w-fit ${
                        exp.type === 'FUEL' ? 'badge-amber' : 'badge-blue'
                      }`}
                    >
                      {exp.type === 'FUEL' ? <Fuel className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                      {exp.type}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-slate-900 font-mono">{exp.vehicleNumber}</div>
                    <div className="text-[11px] text-slate-500">Driver: {exp.driverName}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-800">{exp.vendorName}</div>
                    <div className="text-[11px] text-slate-400">{exp.date}</div>
                  </td>
                  <td>
                    {exp.type === 'FUEL' ? (
                      <div className="text-xs text-slate-700">
                        <span>{exp.litersFilled || '--'} Liters</span>
                        {exp.odometerReading && (
                          <span className="text-[11px] text-slate-500 block font-mono">Odo: {exp.odometerReading} km</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-700 max-w-xs truncate" title={exp.description}>
                        {exp.description || 'Maintenance check'}
                      </div>
                    )}
                  </td>
                  <td className="font-display font-bold text-slate-900 text-sm">₹{exp.amount.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{exp.billNumber || 'View Bill'}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge-status ${
                        exp.status === 'APPROVED'
                          ? 'badge-green'
                          : exp.status === 'REJECTED'
                          ? 'badge-red'
                          : 'badge-amber'
                      }`}
                    >
                      ● {exp.status}
                    </span>
                  </td>
                  {isManagement && (
                    <td>
                      {exp.status === 'PENDING' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => approveExpense(exp.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-xs font-bold transition-colors"
                            title="Approve Payout"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectExpense(exp.id)}
                            className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-lg text-xs font-bold transition-colors"
                            title="Reject Expense"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {exp.approvedBy ? `Approved by ${exp.approvedBy}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400 text-xs italic">
                  No vehicle fuel or maintenance expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Driver Submit Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950">
                  <Fuel className="w-5 h-5" />
                </div>
                <h2 className="font-display font-bold text-lg text-white">Log Vehicle Expense & Bill</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExpType('FUEL')}
                  className={`py-2 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                    expType === 'FUEL'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Fuel className="w-4 h-4" /> Petrol / Diesel Refill
                </button>

                <button
                  type="button"
                  onClick={() => setExpType('MAINTENANCE')}
                  className={`py-2 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                    expType === 'MAINTENANCE'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Wrench className="w-4 h-4" /> Vehicle Maintenance
                </button>
              </div>

              {/* Vehicle & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Select Vehicle</label>
                  <select
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold focus:border-amber-500 outline-none"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.registrationNumber}>
                        {v.registrationNumber} ({v.driverName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {expType === 'FUEL' ? 'Fuel Station Name' : 'Garage / Mechanic Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={expType === 'FUEL' ? 'e.g. HP Bunk Peelamedu' : 'e.g. Sri Ram Auto Garage'}
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Amount & Odometer/Liters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total Bill Amount (₹)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="2850"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pl-7 text-white font-bold focus:border-amber-500 outline-none"
                    />
                    <DollarSign className="w-4 h-4 text-amber-500 absolute left-2 top-3" />
                  </div>
                </div>

                {expType === 'FUEL' ? (
                  <>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Liters Filled</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="29.5"
                        value={litersFilled}
                        onChange={e => setLitersFilled(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Odometer (km)</label>
                      <input
                        type="number"
                        placeholder="64820"
                        value={odometerReading}
                        onChange={e => setOdometerReading(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Invoice / Bill Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SRM-88192"
                      value={billNumber}
                      onChange={e => setBillNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Service / Expense Description</label>
                <textarea
                  rows={2}
                  placeholder={expType === 'FUEL' ? 'Full tank diesel top-up' : 'Oil change, brake pad replacement'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Simulated Bill Attachment */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Upload Bill Photo / Receipt Copy</label>
                <div className="border-2 border-dashed border-slate-800 bg-slate-950 rounded-xl p-3 text-center cursor-pointer hover:border-amber-500 transition-colors">
                  <Upload className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {billFileName ? `Attached: ${billFileName}` : 'Click to select bill photo (JPEG/PNG/PDF)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => setBillFileName(e.target.files?.[0]?.name || 'bill_photo_receipt.jpg')}
                    className="hidden"
                    id="bill-upload-input"
                  />
                  <label htmlFor="bill-upload-input" className="mt-1 inline-block text-[10px] text-amber-400 font-bold hover:underline cursor-pointer">
                    Browse File
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Bill for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
