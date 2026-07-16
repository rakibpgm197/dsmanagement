"use client";
import { useEffect, useState } from "react";

interface Transaction {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: string;
  transactionDate: string;
  createdAt: string;
}

const INCOME_CATEGORIES = ["ব্যানার/সাইন", "প্রিন্টিং", "ডিজাইন", "নামফলক", "স্টিকার", "ফ্লেক্স", "অন্যান্য"];
const EXPENSE_CATEGORIES = ["কাঁচামাল", "বিদ্যুৎ", "ভাড়া", "বেতন", "যন্ত্রপাতি", "পরিবহন", "অন্যান্য"];

function fmt(n: number) {
  return new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<{ type: string; total: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState({
    type: "income",
    category: "",
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      setTransactions(json.transactions || []);
      setSummary(json.summary || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo, typeFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      setForm({ type: "income", category: "", description: "", amount: "", transactionDate: new Date().toISOString().slice(0, 10) });
      setShowModal(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const totalIncome = parseFloat(summary.find(s => s.type === "income")?.total || "0");
  const totalExpense = parseFloat(summary.find(s => s.type === "expense")?.total || "0");
  const profit = totalIncome - totalExpense;

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📊 আয়-ব্যয় ব্যবস্থাপনা</h1>
            <p className="text-purple-200 text-sm mt-1">দৈনিক আয় ও ব্যয়ের সম্পূর্ণ হিসাব</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <span>➕</span> নতুন এন্ট্রি
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#f0fdf4", border: "2px solid #86efac" }}>
          <div className="text-2xl mb-1">📈</div>
          <div className="text-sm font-medium text-green-700">মোট আয়</div>
          <div className="text-2xl font-bold text-green-600 mt-1">৳{fmt(totalIncome)}</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#fef2f2", border: "2px solid #fca5a5" }}>
          <div className="text-2xl mb-1">📉</div>
          <div className="text-sm font-medium text-red-700">মোট ব্যয়</div>
          <div className="text-2xl font-bold text-red-600 mt-1">৳{fmt(totalExpense)}</div>
        </div>
        <div className="rounded-2xl p-4 text-center"
          style={{ background: profit >= 0 ? "#f0fdf4" : "#fef2f2", border: `2px solid ${profit >= 0 ? "#86efac" : "#fca5a5"}` }}>
          <div className="text-2xl mb-1">💎</div>
          <div className="text-sm font-medium" style={{ color: profit >= 0 ? "#15803d" : "#dc2626" }}>নেট মুনাফা</div>
          <div className="text-2xl font-bold mt-1" style={{ color: profit >= 0 ? "#059669" : "#ef4444" }}>৳{fmt(profit)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.04)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-600">🔍 ফিল্টার:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="input-field" style={{ width: "auto", padding: "6px 12px" }} />
          <span className="text-slate-400 text-sm">থেকে</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="input-field" style={{ width: "auto", padding: "6px 12px" }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="input-field" style={{ width: "auto", padding: "6px 12px" }}>
            <option value="">সব ধরন</option>
            <option value="income">আয়</option>
            <option value="expense">ব্যয়</option>
          </select>
          {(dateFrom || dateTo || typeFilter) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setTypeFilter(""); }}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">✕ রিসেট</button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.04)" }}>
        {/* Desktop Table */}
        <table className="w-full hidden md:table">
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #faf5ff, #f3e8ff)", borderBottom: "2px solid #e8eef5" }}>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">তারিখ</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">ধরন</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">বিবরণ</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">ক্যাটাগরি</th>
              <th className="text-right px-5 py-4 text-sm font-bold text-slate-600">পরিমাণ</th>
              <th className="text-center px-5 py-4 text-sm font-bold text-slate-600">মুছুন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">⏳ লোড হচ্ছে...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">📊</div>
                কোনো লেনদেন নেই
              </td></tr>
            ) : transactions.map(t => (
              <tr key={t.id} className="table-row border-b" style={{ borderColor: "#f1f5f9" }}>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {new Date(t.transactionDate).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td className="px-5 py-4">
                  <span className={t.type === "income" ? "badge-paid" : "badge-unpaid"}>
                    {t.type === "income" ? "📈 আয়" : "📉 ব্যয়"}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium text-slate-800">{t.description}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{t.category || "—"}</td>
                <td className="px-5 py-4 text-right font-bold"
                  style={{ color: t.type === "income" ? "#059669" : "#ef4444" }}>
                  {t.type === "income" ? "+" : "-"}৳{fmt(parseFloat(t.amount))}
                </td>
                <td className="px-5 py-4 text-center">
                  <button onClick={() => setDeleteConfirm(t.id)}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: "#fef2f2", color: "#dc2626" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-400">⏳ লোড হচ্ছে...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📊</div>
              কোনো লেনদেন নেই
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: t.type === "income" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${t.type === "income" ? "#bbf7d0" : "#fecaca"}` }}>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{t.description}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(t.transactionDate).toLocaleDateString("bn-BD")}
                      {t.category && ` • ${t.category}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold" style={{ color: t.type === "income" ? "#059669" : "#ef4444" }}>
                      {t.type === "income" ? "+" : "-"}৳{fmt(parseFloat(t.amount))}
                    </div>
                    <button onClick={() => setDeleteConfirm(t.id)}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{ background: "rgba(255,255,255,0.7)", color: "#dc2626" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">➕ নতুন লেনদেন</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">ধরন *</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, type: "income", category: "" })}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: form.type === "income" ? "#10b981" : "#f1f5f9", color: form.type === "income" ? "white" : "#64748b", border: `2px solid ${form.type === "income" ? "#10b981" : "transparent"}` }}>
                    📈 আয়
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, type: "expense", category: "" })}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: form.type === "expense" ? "#ef4444" : "#f1f5f9", color: form.type === "expense" ? "white" : "#64748b", border: `2px solid ${form.type === "expense" ? "#ef4444" : "transparent"}` }}>
                    📉 ব্যয়
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">ক্যাটাগরি</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">ক্যাটাগরি বেছে নিন</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">বিবরণ *</label>
                <input className="input-field" placeholder="বিস্তারিত বিবরণ..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">পরিমাণ (টাকা) *</label>
                <input className="input-field" type="number" placeholder="0.00" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} min="0.01" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">তারিখ</label>
                <input className="input-field" type="date" value={form.transactionDate}
                  onChange={e => setForm({ ...form, transactionDate: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-white transition-all"
                  style={{ background: form.type === "income" ? "#10b981" : "#ef4444" }}>
                  {saving ? "সংরক্ষণ হচ্ছে..." : "✅ সংরক্ষণ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center animate-fade-in" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">নিশ্চিত করুন</h3>
            <p className="text-slate-500 mb-6">এই এন্ট্রি মুছে ফেলতে চান?</p>
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
