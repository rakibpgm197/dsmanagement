"use client";
import { useEffect, useState, useCallback } from "react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  totalDue: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Payment {
  id: number;
  amount: string;
  note: string;
  paymentDate: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{ customer: Customer; payments: Payment[] } | null>(null);

  // Add form
  const [addForm, setAddForm] = useState({ name: "", phone: "", totalDue: "", notes: "" });
  // Pay form
  const [payForm, setPayForm] = useState({ amount: "", note: "", paymentDate: new Date().toISOString().slice(0, 10) });
  // Edit form
  const [editForm, setEditForm] = useState({ name: "", phone: "", totalDue: "", notes: "" });

  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      setCustomers(json.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const loadDetail = async (customer: Customer) => {
    setSelected(customer);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      const json = await res.json();
      setCustomerDetail(json);
    } catch (e) {
      console.error(e);
    }
    setShowDetailModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          phone: addForm.phone,
          totalDue: parseFloat(addForm.totalDue) || 0,
          notes: addForm.notes,
        }),
      });
      setAddForm({ name: "", phone: "", totalDue: "", notes: "" });
      setShowAddModal(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selected.id,
          amount: parseFloat(payForm.amount),
          note: payForm.note,
          paymentDate: payForm.paymentDate,
        }),
      });
      setPayForm({ amount: "", note: "", paymentDate: new Date().toISOString().slice(0, 10) });
      setShowPayModal(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/customers/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          totalDue: parseFloat(editForm.totalDue) || 0,
          notes: editForm.notes,
          isActive: selected.isActive,
        }),
      });
      setShowEditModal(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const totalDue = customers.reduce((s, c) => s + parseFloat(c.totalDue || "0"), 0);

  const dueTiers = (due: number) => {
    if (due === 0) return { color: "#10b981", bg: "#f0fdf4", label: "পরিষ্কার" };
    if (due < 1000) return { color: "#f59e0b", bg: "#fffbeb", label: "কম" };
    if (due < 5000) return { color: "#f97316", bg: "#fff7ed", label: "মাঝারি" };
    return { color: "#ef4444", bg: "#fef2f2", label: "বেশি" };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)", boxShadow: "0 4px 20px rgba(30,64,175,0.25)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">👥 বাকির তালিকা</h1>
            <p className="text-blue-200 text-sm mt-1">সকল কাস্টমার ও পাওনার হিসাব</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <div className="text-xs text-blue-200">মোট কাস্টমার</div>
              <div className="font-bold">{customers.length}</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center"
              style={{ background: "rgba(239,68,68,0.25)", backdropFilter: "blur(8px)" }}>
              <div className="text-xs text-red-200">মোট বাকি</div>
              <div className="font-bold text-red-200">৳{fmt(totalDue)}</div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}>
              <span>➕</span> নতুন যোগ
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: 44, borderRadius: 12, fontSize: 14 }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #f8faff, #eff6ff)", borderBottom: "2px solid #e8eef5" }}>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">#</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">নাম</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">ফোন</th>
              <th className="text-right px-5 py-4 text-sm font-bold text-slate-600">বাকির পরিমাণ</th>
              <th className="text-center px-5 py-4 text-sm font-bold text-slate-600">অবস্থা</th>
              <th className="text-center px-5 py-4 text-sm font-bold text-slate-600">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16 text-slate-400">⏳ লোড হচ্ছে...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                <div className="text-4xl mb-2">🔍</div>
                কোনো কাস্টমার পাওয়া যায়নি
              </td></tr>
            ) : customers.map((c, i) => {
              const due = parseFloat(c.totalDue || "0");
              const tier = dueTiers(due);
              return (
                <tr key={c.id} className="table-row border-b" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-4 text-sm text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    {c.notes && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-48">{c.notes}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <a href={`tel:${c.phone}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">{c.phone || "—"}</a>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-lg" style={{ color: tier.color }}>৳{fmt(due)}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: tier.bg, color: tier.color }}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => loadDetail(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-md"
                        style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                        📋 বিস্তারিত
                      </button>
                      <button onClick={() => {
                        setSelected(c);
                        setPayForm({ amount: "", note: "", paymentDate: new Date().toISOString().slice(0, 10) });
                        setShowPayModal(true);
                      }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-md"
                        style={{ background: "#f0fdf4", color: "#15803d" }}>
                        💳 পেমেন্ট
                      </button>
                      <button onClick={() => {
                        setSelected(c);
                        setEditForm({ name: c.name, phone: c.phone, totalDue: c.totalDue, notes: c.notes || "" });
                        setShowEditModal(true);
                      }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-md"
                        style={{ background: "#fffbeb", color: "#d97706" }}>
                        ✏️
                      </button>
                      <button onClick={() => setDeleteConfirm(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-md"
                        style={{ background: "#fef2f2", color: "#dc2626" }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {customers.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f8faff", borderTop: "2px solid #e8eef5" }}>
                <td colSpan={3} className="px-5 py-4 font-bold text-slate-700">
                  মোট ({customers.length} জন)
                </td>
                <td className="px-5 py-4 text-right font-bold text-xl text-red-600">৳{fmt(totalDue)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-16 text-slate-400">⏳ লোড হচ্ছে...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-2">🔍</div>
            কোনো কাস্টমার পাওয়া যায়নি
          </div>
        ) : customers.map((c, i) => {
          const due = parseFloat(c.totalDue || "0");
          const tier = dueTiers(due);
          return (
            <div key={c.id} className="rounded-2xl p-4"
              style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 8px rgba(30,64,175,0.05)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <a href={`tel:${c.phone}`} className="text-blue-600 text-sm">{c.phone || "—"}</a>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: tier.bg, color: tier.color }}>
                  {tier.label}
                </span>
              </div>
              {c.notes && <div className="text-xs text-slate-400 mb-3 bg-slate-50 rounded-lg p-2">{c.notes}</div>}
              <div className="flex items-center justify-between mb-3 p-2 rounded-xl"
                style={{ background: tier.bg }}>
                <span className="text-sm font-medium" style={{ color: tier.color }}>বাকির পরিমাণ</span>
                <span className="font-bold text-lg" style={{ color: tier.color }}>৳{fmt(due)}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => loadDetail(c)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-center"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}>📋 বিস্তারিত</button>
                <button onClick={() => {
                  setSelected(c);
                  setPayForm({ amount: "", note: "", paymentDate: new Date().toISOString().slice(0, 10) });
                  setShowPayModal(true);
                }}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-center"
                  style={{ background: "#f0fdf4", color: "#15803d" }}>💳 পেমেন্ট</button>
                <button onClick={() => {
                  setSelected(c);
                  setEditForm({ name: c.name, phone: c.phone, totalDue: c.totalDue, notes: c.notes || "" });
                  setShowEditModal(true);
                }}
                  className="py-2 px-3 rounded-xl text-xs font-medium"
                  style={{ background: "#fffbeb", color: "#d97706" }}>✏️</button>
                <button onClick={() => setDeleteConfirm(c.id)}
                  className="py-2 px-3 rounded-xl text-xs font-medium"
                  style={{ background: "#fef2f2", color: "#dc2626" }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">➕ নতুন কাস্টমার যোগ</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">নাম *</label>
                <input className="input-field" placeholder="কাস্টমারের নাম" value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">মোবাইল নম্বর</label>
                <input className="input-field" placeholder="01XXXXXXXXX" value={addForm.phone}
                  onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">বাকির পরিমাণ (টাকা)</label>
                <input className="input-field" type="number" placeholder="0.00" value={addForm.totalDue}
                  onChange={e => setAddForm({ ...addForm, totalDue: e.target.value })} min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">নোট / মন্তব্য</label>
                <textarea className="input-field" placeholder="বিস্তারিত নোট..." value={addForm.notes}
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })} rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? "সংরক্ষণ হচ্ছে..." : "✅ যোগ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY MODAL */}
      {showPayModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">💳 পেমেন্ট গ্রহণ</h2>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="rounded-xl p-3 mb-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div className="font-bold text-slate-800">{selected.name}</div>
              <div className="text-sm text-red-600">বর্তমান বাকি: ৳{fmt(parseFloat(selected.totalDue))}</div>
            </div>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">পরিশোধের পরিমাণ (টাকা) *</label>
                <input className="input-field" type="number" placeholder="0.00" value={payForm.amount}
                  onChange={e => setPayForm({ ...payForm, amount: e.target.value })} min="0.01" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">তারিখ</label>
                <input className="input-field" type="date" value={payForm.paymentDate}
                  onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">নোট</label>
                <input className="input-field" placeholder="কীভাবে পরিশোধ করেছে..." value={payForm.note}
                  onChange={e => setPayForm({ ...payForm, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
                <button type="submit" disabled={saving} className="btn-success flex-1 py-2.5">
                  {saving ? "সংরক্ষণ হচ্ছে..." : "✅ পেমেন্ট নিন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">✏️ তথ্য সংশোধন</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">নাম *</label>
                <input className="input-field" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">মোবাইল নম্বর</label>
                <input className="input-field" value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">বাকির পরিমাণ (টাকা)</label>
                <input className="input-field" type="number" value={editForm.totalDue}
                  onChange={e => setEditForm({ ...editForm, totalDue: e.target.value })} min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">নোট</label>
                <textarea className="input-field" value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? "সংরক্ষণ হচ্ছে..." : "✅ সংরক্ষণ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && customerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in"
            style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh" }}>
            <div className="p-5 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{customerDetail.customer.name}</h2>
                  <p className="text-blue-200 text-sm">{customerDetail.customer.phone}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-white opacity-70 hover:opacity-100 text-xl">✕</button>
              </div>
              <div className="mt-3 flex gap-4">
                <div className="text-center">
                  <div className="text-blue-200 text-xs">বর্তমান বাকি</div>
                  <div className="font-bold text-red-300">৳{fmt(parseFloat(customerDetail.customer.totalDue))}</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-200 text-xs">পেমেন্ট সংখ্যা</div>
                  <div className="font-bold">{customerDetail.payments.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-200 text-xs">মোট পরিশোধ</div>
                  <div className="font-bold text-green-300">
                    ৳{fmt(customerDetail.payments.reduce((s, p) => s + parseFloat(p.amount), 0))}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(90vh - 180px)" }}>
              {customerDetail.customer.notes && (
                <div className="p-4 m-4 rounded-xl" style={{ background: "#f8faff", border: "1px solid #e8eef5" }}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">📝 নোট</div>
                  <div className="text-sm text-slate-700">{customerDetail.customer.notes}</div>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-slate-700 mb-3">💳 পেমেন্ট ইতিহাস</h3>
                {customerDetail.payments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-3xl mb-2">💸</div>
                    <p>এখনো কোনো পেমেন্ট নেই</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerDetail.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                        <div>
                          <div className="text-sm font-medium text-slate-700">
                            {new Date(p.paymentDate).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
                          </div>
                          {p.note && <div className="text-xs text-slate-400">{p.note}</div>}
                        </div>
                        <div className="font-bold text-green-600">৳{fmt(parseFloat(p.amount))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">নিশ্চিত করুন</h3>
            <p className="text-slate-500 mb-6">এই কাস্টমার মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1 py-2.5">
                🗑️ মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
