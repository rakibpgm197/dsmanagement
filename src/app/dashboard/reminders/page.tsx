"use client";
import { useEffect, useState } from "react";

interface Reminder {
  id: number;
  customerId: number | null;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    description: "",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    try {
      const [remRes, custRes] = await Promise.all([
        fetch("/api/reminders"),
        fetch("/api/customers"),
      ]);
      const remData = await remRes.json();
      const custData = await custRes.json();
      setReminders(remData.reminders || []);
      setCustomers(custData.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId || null,
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
        }),
      });
      setForm({ customerId: "", title: "", description: "", dueDate: new Date().toISOString().slice(0, 10) });
      setShowModal(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (id: number, current: boolean) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = reminders.filter(r => {
    if (filter === "pending") return !r.isCompleted;
    if (filter === "completed") return r.isCompleted;
    return true;
  });

  const getDueDateStatus = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) return { color: "#059669", bg: "#f0fdf4", label: "সম্পন্ন" };
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { color: "#dc2626", bg: "#fef2f2", label: "মেয়াদ উত্তীর্ণ" };
    if (diff === 0) return { color: "#d97706", bg: "#fffbeb", label: "আজকের মধ্যে" };
    if (diff <= 3) return { color: "#f97316", bg: "#fff7ed", label: `${diff} দিন বাকি` };
    return { color: "#1e40af", bg: "#eff6ff", label: `${diff} দিন বাকি` };
  };

  const pending = reminders.filter(r => !r.isCompleted).length;
  const overdue = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) < new Date()).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 20px rgba(220,38,38,0.25)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">🔔 রিমাইন্ডার ও নোট</h1>
            <p className="text-red-100 text-sm mt-1">কবে পাবো, কাকে জানাবো — সব মনে রাখুন</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {overdue > 0 && (
              <div className="px-4 py-2 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="text-xs text-red-200">মেয়াদ উত্তীর্ণ</div>
                <div className="font-bold text-yellow-300">{overdue}টি</div>
              </div>
            )}
            <div className="px-4 py-2 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-xs text-red-200">পেন্ডিং</div>
              <div className="font-bold">{pending}টি</div>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
              ➕ নতুন রিমাইন্ডার
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: filter === f ? "linear-gradient(135deg, #dc2626, #ef4444)" : "white",
              color: filter === f ? "white" : "#64748b",
              border: `1px solid ${filter === f ? "transparent" : "#e2e8f0"}`,
              boxShadow: filter === f ? "0 4px 12px rgba(220,38,38,0.25)" : "none"
            }}>
            {f === "all" ? "🔍 সব" : f === "pending" ? "⏳ পেন্ডিং" : "✅ সম্পন্ন"}
          </button>
        ))}
      </div>

      {/* Reminders Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">⏳ লোড হচ্ছে...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: "white", border: "1px solid #e8eef5" }}>
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-slate-500 font-medium">কোনো রিমাইন্ডার নেই</p>
          <p className="text-slate-400 text-sm mt-1">নতুন রিমাইন্ডার যোগ করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => {
            const status = getDueDateStatus(r.dueDate, r.isCompleted);
            return (
              <div key={r.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
                style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)", opacity: r.isCompleted ? 0.75 : 1 }}>
                {/* Status bar */}
                <div className="h-1.5" style={{ background: status.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-slate-800 ${r.isCompleted ? "line-through text-slate-400" : ""}`}>
                      {r.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ml-2"
                      style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-slate-500 mb-3">{r.description}</p>
                  )}
                  {r.customerName && (
                    <div className="flex items-center gap-1.5 mb-3 text-sm"
                      style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "6px 10px" }}>
                      <span>👤</span>
                      <span className="font-medium text-blue-700">{r.customerName}</span>
                      {r.customerPhone && <span className="text-blue-500 text-xs">• {r.customerPhone}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>📅 {new Date(r.dueDate).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleComplete(r.id, r.isCompleted)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: r.isCompleted ? "#f1f5f9" : "#f0fdf4",
                        color: r.isCompleted ? "#64748b" : "#059669",
                        border: `1px solid ${r.isCompleted ? "#e2e8f0" : "#bbf7d0"}`
                      }}>
                      {r.isCompleted ? "↩️ আবার চালু" : "✅ সম্পন্ন"}
                    </button>
                    <button onClick={() => handleDelete(r.id)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold"
                      style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">🔔 নতুন রিমাইন্ডার</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">শিরোনাম *</label>
                <input className="input-field" placeholder="রিমাইন্ডারের বিষয়" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">সম্পর্কিত কাস্টমার</label>
                <select className="input-field" value={form.customerId}
                  onChange={e => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">-- কাস্টমার নির্বাচন (ঐচ্ছিক) --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone && `(${c.phone})`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">তারিখ *</label>
                <input type="date" className="input-field" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">বিস্তারিত নোট</label>
                <textarea className="input-field" placeholder="রিমাইন্ডার সম্পর্কে বিস্তারিত..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
                <button type="submit" disabled={saving} className="btn-danger flex-1 py-2.5">
                  {saving ? "সংরক্ষণ হচ্ছে..." : "✅ সংরক্ষণ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
