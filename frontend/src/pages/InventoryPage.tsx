import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Boxes, Plus, Flame, Calendar, FileText, ShieldCheck, Truck, Printer, PackageCheck } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { stockIntake, addStockIntake, role, currentUser } = useApp();

  const isAuthorized = (role || '').toUpperCase() === 'OWNER' || (role || '').toUpperCase() === 'GODOWN_KEEPER' || (role || '').toUpperCase() === 'MANAGER';

  // Stock Intake Modal State
  const [showModal, setShowModal] = useState(false);
  const [monthYear, setMonthYear] = useState('August 2026');
  const [intakeDate, setIntakeDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'14.2kg Domestic' | '19kg Commercial' | '5kg Mini'>('14.2kg Domestic');
  const [quantity, setQuantity] = useState('100');
  const [challanNumber, setChallanNumber] = useState('');
  const [supplier, setSupplier] = useState('Indian Oil Peelamedu Bottling Plant');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month filter state
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL');

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      alert('Please enter a valid cylinder quantity.');
      return;
    }

    setIsSubmitting(true);
    const generatedChallan = challanNumber || `IOCL-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await addStockIntake({
        category,
        quantity: Number(quantity),
        monthYear,
        intakeDate: new Date(intakeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        challanNumber: generatedChallan,
        supplier,
      });

      setSuccessMsg(`✅ Recorded shipment of ${quantity} (${category}) cylinders for ${monthYear}!`);
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
        setQuantity('100');
        setChallanNumber('');
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      alert('Failed to save stock intake.');
      setIsSubmitting(false);
    }
  };

  // Filter records by selected month
  const filteredRecords = selectedMonthFilter === 'ALL'
    ? stockIntake
    : stockIntake.filter(r => r.monthYear === selectedMonthFilter);

  // Totals calculations
  const totalStockReceived = filteredRecords.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const domesticTotal = filteredRecords.filter(r => r.category.includes('14.2')).reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const commercialTotal = filteredRecords.filter(r => r.category.includes('19')).reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const miniTotal = filteredRecords.filter(r => r.category.includes('5kg')).reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  // Extract unique month options for filter dropdown
  const uniqueMonths = Array.from(new Set(stockIntake.map(r => r.monthYear)));
  if (!uniqueMonths.includes('August 2026')) uniqueMonths.unshift('August 2026');

  // Print Stock Intake Voucher
  const handlePrintVoucher = (record: any) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Stock Intake Voucher - Vetri Indane</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 13px; color: #64748b; }
            .box { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc; margin: 15px 0; }
            .label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .val { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #0f172a; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">VETRI INDANE LPG DISTRIBUTORSHIP</div>
            <div class="subtitle">Official Stock Arrival & Godown Intake Receipt</div>
            <p style="font-size:11px; color:#64748b;">Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="box">
            <div class="label">Challan / Invoice Reference</div>
            <div class="val">${record.challanNumber || 'N/A'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Intake Details</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Month & Period</td><td><strong>${record.monthYear}</strong></td></tr>
              <tr><td>Intake Date</td><td>${record.intakeDate}</td></tr>
              <tr><td>Cylinder Category</td><td><strong>${record.category}</strong></td></tr>
              <tr><td>Quantity Received</td><td><strong style="color:#059669; font-size:16px;">${record.quantity} Units</strong></td></tr>
              <tr><td>Supplier / Bottling Plant</td><td>${record.supplier}</td></tr>
              <tr><td>Verified & Received By</td><td>${record.receivedBy} (${record.userRole})</td></tr>
            </tbody>
          </table>

          <div style="margin-top: 40px; display:flex; justify-content:space-between; font-size:12px;">
            <div>Godown Inspector: ____________________</div>
            <div>Owner Approval: ____________________</div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Monthly Cylinder Stock Intake Desk</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Record incoming monthly shipments from Indian Oil Bottling Plant & track stock velocity
            </p>
          </div>
        </div>

        {isAuthorized && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer self-start md:self-auto transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> + Record Monthly Stock Intake
          </button>
        )}
      </div>

      {/* Monthly Stock Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Monthly Stock Received</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-extrabold text-3xl text-emerald-600 mt-1">{totalStockReceived} <span className="text-xs font-normal text-slate-500">Cylinders</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded across {filteredRecords.length} shipments</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">14.2kg Domestic Refills</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-display font-extrabold text-3xl text-slate-900 mt-1">{domesticTotal} <span className="text-xs font-normal text-slate-500">Units</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Household domestic refill stock</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">19kg Commercial LPG</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="font-display font-extrabold text-3xl text-blue-600 mt-1">{commercialTotal} <span className="text-xs font-normal text-slate-500">Units</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Hotels, Restaurants & Commercial</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">5kg Mini Chhotu Cylinders</span>
            <Boxes className="w-4 h-4 text-purple-500" />
          </div>
          <p className="font-display font-extrabold text-3xl text-purple-700 mt-1">{miniTotal} <span className="text-xs font-normal text-slate-500">Units</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Portable compact cylinder stock</p>
        </div>
      </div>

      {/* Stock Intake Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Monthly Stock Shipment History & Audit Trail
            </h2>
            <p className="text-xs text-slate-500">Official log of incoming cylinder shipments entered by Owner & Godown Keeper</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Month:
            </span>
            <select
              value={selectedMonthFilter}
              onChange={e => setSelectedMonthFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Months</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Boxes className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No stock intake records entered for {selectedMonthFilter === 'ALL' ? 'the system' : selectedMonthFilter} yet.</p>
            {isAuthorized && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200"
              >
                + Add First Stock Entry Now
              </button>
            )}
          </div>
        ) : (
          <div className="mobile-table-container">
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Month & Year</th>
                  <th>Intake Date</th>
                  <th>Cylinder Category</th>
                  <th>Quantity Received</th>
                  <th>Challan / Invoice No.</th>
                  <th>Bottling Plant / Supplier</th>
                  <th>Received By</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="font-bold text-slate-900">{r.monthYear}</td>
                    <td className="font-mono text-xs text-slate-600">{r.intakeDate}</td>
                    <td>
                      <span className={`badge-status ${
                        r.category.includes('14.2') ? 'badge-amber' :
                        r.category.includes('19') ? 'badge-blue' : 'badge-purple'
                      }`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="font-display font-extrabold text-base text-emerald-600">
                      +{r.quantity} Units
                    </td>
                    <td className="font-mono text-xs font-bold text-slate-700">{r.challanNumber}</td>
                    <td className="text-xs text-slate-600">{r.supplier}</td>
                    <td>
                      <span className="text-xs font-semibold text-slate-800">{r.receivedBy}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">({r.userRole})</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handlePrintVoucher(r)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        title="Print Intake Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" /> Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MONTHLY STOCK INTAKE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Record Monthly Cylinder Stock Intake</h2>
                  <p className="text-[11px] text-slate-400">Entry logged by {currentUser?.name || role}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center animate-bounce">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitIntake} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Target Month & Year</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. August 2026"
                      value={monthYear}
                      onChange={e => setMonthYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Intake Date</label>
                    <input
                      type="date"
                      required
                      value={intakeDate}
                      onChange={e => setIntakeDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Cylinder Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:border-amber-500 outline-none"
                    >
                      <option value="14.2kg Domestic">14.2kg Domestic Refill</option>
                      <option value="19kg Commercial">19kg Commercial LPG</option>
                      <option value="5kg Mini">5kg Chhotu Mini Cylinder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Quantity Received</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="100"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-amber-400 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Challan / Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. IOCL-984012 (Leave blank for auto-gen)"
                    value={challanNumber}
                    onChange={e => setChallanNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Supplier / Bottling Plant</label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" /> Save Monthly Stock Intake
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
