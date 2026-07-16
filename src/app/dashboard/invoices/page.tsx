"use client";
import { useEffect, useState, useRef } from "react";

interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  items: string;
  subtotal: string;
  discount: string;
  total: string;
  paid: string;
  due: string;
  status: string;
  notes: string;
  invoiceDate: string;
  createdAt: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const EMPTY_ITEM: InvoiceItem = { description: "", qty: 1, rate: 0, amount: 0 };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    items: [{ ...EMPTY_ITEM }],
    discount: "0",
    paid: "0",
    notes: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, custRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/customers"),
      ]);
      const invData = await invRes.json();
      const custData = await custRes.json();
      setInvoices(invData.invoices || []);
      setCustomers(custData.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    const items = [...form.items];
    (items[idx] as Record<string, unknown>)[field] = val;
    if (field === "qty" || field === "rate") {
      items[idx].amount = parseFloat(String(items[idx].qty)) * parseFloat(String(items[idx].rate)) || 0;
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (idx: number) => {
    if (form.items.length === 1) return;
    const items = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((s, i) => s + (i.amount || 0), 0);
  const discount = parseFloat(form.discount) || 0;
  const total = subtotal - discount;
  const paid = parseFloat(form.paid) || 0;
  const due = total - paid;

  const handleCustomerSelect = (id: string) => {
    const cust = customers.find(c => c.id === parseInt(id));
    if (cust) {
      setForm({ ...form, customerId: id, customerName: cust.name, customerPhone: cust.phone });
    } else {
      setForm({ ...form, customerId: "", customerName: "", customerPhone: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId || null,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          items: form.items,
          subtotal,
          discount,
          total,
          paid,
          notes: form.notes,
          invoiceDate: form.invoiceDate,
        }),
      });
      setForm({
        customerId: "", customerName: "", customerPhone: "",
        items: [{ ...EMPTY_ITEM }],
        discount: "0", paid: "0", notes: "",
        invoiceDate: new Date().toISOString().slice(0, 10),
      });
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
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Invoice - দুরন্ত ডিজিটাল সাইন</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; font-size: 24px; margin: 0; }
        .header p { color: #64748b; font-size: 13px; margin: 4px 0; }
        .inv-meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .inv-meta div { font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #1e40af; color: white; padding: 8px 12px; text-align: left; font-size: 13px; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .total-row { font-weight: bold; background: #f8faff; }
        .footer { text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
        .status-paid { color: #059669; font-weight: bold; }
        .status-partial { color: #d97706; font-weight: bold; }
        .status-unpaid { color: #dc2626; font-weight: bold; }
      </style></head><body>${content}</body></html>
    `);
    w.document.close();
    w.print();
  };

  const statusBadge = (status: string) => {
    if (status === "paid") return <span className="badge-paid">✅ পরিশোধিত</span>;
    if (status === "partial") return <span className="badge-partial">⚠️ আংশিক</span>;
    return <span className="badge-unpaid">❌ অপরিশোধিত</span>;
  };

  const totals = invoices.reduce((acc, inv) => {
    acc.total += parseFloat(inv.total || "0");
    acc.paid += parseFloat(inv.paid || "0");
    acc.due += parseFloat(inv.due || "0");
    return acc;
  }, { total: 0, paid: 0, due: 0 });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", boxShadow: "0 4px 20px rgba(217,119,6,0.25)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">🧾 ইনভয়েস ব্যবস্থাপনা</h1>
            <p className="text-amber-100 text-sm mt-1">বিক্রয় ইনভয়েস তৈরি ও পরিচালনা</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <span>➕</span> নতুন ইনভয়েস
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <div className="text-2xl mb-1">🧾</div>
          <div className="text-xs text-slate-500">মোট ইনভয়েস</div>
          <div className="text-xl font-bold text-blue-700">৳{fmt(totals.total)}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-xs text-slate-500">পরিশোধিত</div>
          <div className="text-xl font-bold text-green-600">৳{fmt(totals.paid)}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-xs text-slate-500">বাকি</div>
          <div className="text-xl font-bold text-red-600">৳{fmt(totals.due)}</div>
        </div>
      </div>

      {/* Invoices Table Desktop */}
      <div className="hidden md:block rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.04)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", borderBottom: "2px solid #e8eef5" }}>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">ইনভয়েস নং</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">কাস্টমার</th>
              <th className="text-left px-5 py-4 text-sm font-bold text-slate-600">তারিখ</th>
              <th className="text-right px-5 py-4 text-sm font-bold text-slate-600">মোট</th>
              <th className="text-right px-5 py-4 text-sm font-bold text-slate-600">বাকি</th>
              <th className="text-center px-5 py-4 text-sm font-bold text-slate-600">অবস্থা</th>
              <th className="text-center px-5 py-4 text-sm font-bold text-slate-600">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">⏳ লোড হচ্ছে...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">🧾</div>
                কোনো ইনভয়েস নেই
              </td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="table-row border-b" style={{ borderColor: "#f1f5f9" }}>
                <td className="px-5 py-4 font-mono font-bold text-blue-600 text-sm">{inv.invoiceNumber}</td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-800">{inv.customerName}</div>
                  {inv.customerPhone && <div className="text-xs text-slate-400">{inv.customerPhone}</div>}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {new Date(inv.invoiceDate).toLocaleDateString("bn-BD")}
                </td>
                <td className="px-5 py-4 text-right font-bold text-slate-800">৳{fmt(parseFloat(inv.total))}</td>
                <td className="px-5 py-4 text-right font-bold text-red-600">৳{fmt(parseFloat(inv.due || "0"))}</td>
                <td className="px-5 py-4 text-center">{statusBadge(inv.status)}</td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setViewInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "#eff6ff", color: "#1d4ed8" }}>👁️ দেখুন</button>
                    <button onClick={() => setDeleteConfirm(inv.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "#fef2f2", color: "#dc2626" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {invoices.map(inv => (
          <div key={inv.id} className="rounded-2xl p-4"
            style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 8px rgba(30,64,175,0.05)" }}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-mono font-bold text-blue-600 text-sm">{inv.invoiceNumber}</div>
              {statusBadge(inv.status)}
            </div>
            <div className="font-bold text-slate-800">{inv.customerName}</div>
            <div className="text-xs text-slate-400 mt-0.5">{new Date(inv.invoiceDate).toLocaleDateString("bn-BD")}</div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <div className="text-xs text-slate-500">মোট</div>
                <div className="font-bold">৳{fmt(parseFloat(inv.total))}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">বাকি</div>
                <div className="font-bold text-red-600">৳{fmt(parseFloat(inv.due || "0"))}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewInvoice(inv)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}>👁️</button>
                <button onClick={() => setDeleteConfirm(inv.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "#fef2f2", color: "#dc2626" }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE INVOICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="flex min-h-full items-start justify-center p-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in"
              style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div className="p-5 text-white" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">🧾 নতুন ইনভয়েস তৈরি</h2>
                  <button onClick={() => setShowModal(false)} className="text-white opacity-70 hover:opacity-100 text-xl">✕</button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">কাস্টমার (বিদ্যমান)</label>
                    <select className="input-field" value={form.customerId} onChange={e => handleCustomerSelect(e.target.value)}>
                      <option value="">-- কাস্টমার বেছে নিন --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">তারিখ</label>
                    <input type="date" className="input-field" value={form.invoiceDate}
                      onChange={e => setForm({ ...form, invoiceDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">কাস্টমারের নাম *</label>
                    <input className="input-field" placeholder="নাম" value={form.customerName}
                      onChange={e => setForm({ ...form, customerName: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">ফোন</label>
                    <input className="input-field" placeholder="01XXXXXXXXX" value={form.customerPhone}
                      onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-600">পণ্য / সেবার তালিকা</label>
                    <button type="button" onClick={addItem}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: "#eff6ff", color: "#1d4ed8" }}>+ আইটেম যোগ</button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "#f8faff" }}>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600">বিবরণ</th>
                          <th className="text-center px-2 py-2 font-semibold text-slate-600 w-16">পরিমাণ</th>
                          <th className="text-right px-2 py-2 font-semibold text-slate-600 w-20">রেট (৳)</th>
                          <th className="text-right px-2 py-2 font-semibold text-slate-600 w-24">মোট (৳)</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx} className="border-t" style={{ borderColor: "#f1f5f9" }}>
                            <td className="px-2 py-2">
                              <input className="input-field" style={{ padding: "6px 10px", fontSize: 13 }}
                                placeholder="পণ্য/সেবার নাম" value={item.description}
                                onChange={e => updateItem(idx, "description", e.target.value)} />
                            </td>
                            <td className="px-2 py-2">
                              <input type="number" min="1" className="input-field text-center" style={{ padding: "6px 4px", fontSize: 13 }}
                                value={item.qty} onChange={e => updateItem(idx, "qty", parseFloat(e.target.value) || 0)} />
                            </td>
                            <td className="px-2 py-2">
                              <input type="number" min="0" className="input-field text-right" style={{ padding: "6px 8px", fontSize: 13 }}
                                value={item.rate} onChange={e => updateItem(idx, "rate", parseFloat(e.target.value) || 0)} />
                            </td>
                            <td className="px-2 py-2 text-right font-semibold text-slate-700">
                              {fmt(item.amount)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button type="button" onClick={() => removeItem(idx)}
                                className="text-red-400 hover:text-red-600 text-lg">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">ছাড় (টাকা)</label>
                    <input type="number" min="0" className="input-field" value={form.discount}
                      onChange={e => setForm({ ...form, discount: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">পরিশোধিত (টাকা)</label>
                    <input type="number" min="0" className="input-field" value={form.paid}
                      onChange={e => setForm({ ...form, paid: e.target.value })} />
                  </div>
                  <div className="rounded-xl p-3 text-sm" style={{ background: "#f8faff", border: "1px solid #e8eef5" }}>
                    <div className="flex justify-between"><span className="text-slate-500">সাবটোটাল:</span><span className="font-semibold">৳{fmt(subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">ছাড়:</span><span className="font-semibold text-red-500">-৳{fmt(discount)}</span></div>
                    <div className="flex justify-between border-t mt-1 pt-1" style={{ borderColor: "#e2e8f0" }}>
                      <span className="font-bold">মোট:</span><span className="font-bold text-blue-700">৳{fmt(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">বাকি:</span>
                      <span className="font-bold text-red-600">৳{fmt(due > 0 ? due : 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">নোট</label>
                  <textarea className="input-field" placeholder="বিশেষ নোট..." value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                    style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                    {saving ? "সংরক্ষণ হচ্ছে..." : "✅ ইনভয়েস তৈরি"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / PRINT INVOICE */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="flex min-h-full items-start justify-center p-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in"
              style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div className="flex items-center justify-between p-4"
                style={{ background: "#f8faff", borderBottom: "1px solid #e2e8f0" }}>
                <h3 className="font-bold text-slate-800">ইনভয়েস প্রিভিউ</h3>
                <div className="flex gap-2">
                  <button onClick={handlePrint}
                    className="px-4 py-2 rounded-xl font-semibold text-sm text-white flex items-center gap-1"
                    style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}>
                    🖨️ প্রিন্ট
                  </button>
                  <button onClick={() => setViewInvoice(null)} className="text-slate-400 hover:text-slate-600 text-xl px-2">✕</button>
                </div>
              </div>
              <div ref={printRef} className="p-8">
                {/* Invoice Header */}
                <div className="header text-center border-b-2 pb-4 mb-6" style={{ borderColor: "#1e40af" }}>
                  <h1 style={{ color: "#1e40af", fontSize: 22, fontWeight: "bold", margin: 0 }}>🖨️ দুরন্ত ডিজিটাল সাইন</h1>
                  <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0" }}>ডিজাইনে দুরন্ত, মানে অনন্য</p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0" }}>📍 হোটেল সাদিকের নিচতলা, বড় মসজিদের সামনে, পাটগ্রাম, লালমনিরহাট</p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0" }}>📞 01710513624</p>
                </div>
                <div className="flex justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">প্রেরক</div>
                    <div className="font-bold text-slate-800">{viewInvoice.customerName}</div>
                    {viewInvoice.customerPhone && <div className="text-sm text-slate-600">{viewInvoice.customerPhone}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-blue-600">{viewInvoice.invoiceNumber}</div>
                    <div className="text-sm text-slate-600">{new Date(viewInvoice.invoiceDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}</div>
                    <div className="mt-1">{viewInvoice.status === "paid" ? <span style={{ color: "#059669", fontWeight: "bold" }}>✅ পরিশোধিত</span> : viewInvoice.status === "partial" ? <span style={{ color: "#d97706", fontWeight: "bold" }}>⚠️ আংশিক</span> : <span style={{ color: "#dc2626", fontWeight: "bold" }}>❌ অপরিশোধিত</span>}</div>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                  <thead>
                    <tr style={{ background: "#1e40af", color: "white" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 13 }}>বিবরণ</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 13 }}>পরিমাণ</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 13 }}>রেট</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 13 }}>মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {JSON.parse(viewInvoice.items || "[]").map((item: InvoiceItem, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px 12px", fontSize: 13 }}>{item.description}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 13 }}>{item.qty}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 13 }}>৳{fmt(item.rate)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "bold", fontSize: 13 }}>৳{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                      <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>সাবটোটাল:</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>৳{fmt(parseFloat(viewInvoice.subtotal))}</td>
                    </tr>
                    {parseFloat(viewInvoice.discount || "0") > 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: "4px 12px", textAlign: "right", color: "#dc2626" }}>ছাড়:</td>
                        <td style={{ padding: "4px 12px", textAlign: "right", color: "#dc2626" }}>-৳{fmt(parseFloat(viewInvoice.discount || "0"))}</td>
                      </tr>
                    )}
                    <tr style={{ background: "#eff6ff" }}>
                      <td colSpan={3} style={{ padding: "10px 12px", textAlign: "right", fontWeight: "bold", fontSize: 15 }}>মোট:</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "bold", fontSize: 15, color: "#1e40af" }}>৳{fmt(parseFloat(viewInvoice.total))}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: "4px 12px", textAlign: "right", color: "#059669" }}>পরিশোধিত:</td>
                      <td style={{ padding: "4px 12px", textAlign: "right", color: "#059669", fontWeight: "bold" }}>৳{fmt(parseFloat(viewInvoice.paid || "0"))}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: "4px 12px", textAlign: "right", color: "#dc2626", fontWeight: "bold" }}>বাকি:</td>
                      <td style={{ padding: "4px 12px", textAlign: "right", color: "#dc2626", fontWeight: "bold" }}>৳{fmt(parseFloat(viewInvoice.due || "0"))}</td>
                    </tr>
                  </tfoot>
                </table>
                {viewInvoice.notes && (
                  <div style={{ background: "#f8faff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>📝 নোট</div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{viewInvoice.notes}</div>
                  </div>
                )}
                <div className="footer text-center" style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, color: "#64748b", fontSize: 12 }}>
                  <p>ধন্যবাদ আপনার ব্যবসায়িক সহযোগিতার জন্য!</p>
                  <p>দুরন্ত ডিজিটাল সাইন | পাটগ্রাম, লালমনিরহাট | 01710513624</p>
                </div>
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">মুছে ফেলবেন?</h3>
            <p className="text-slate-500 mb-6">এই ইনভয়েস স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600"
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>বাতিল</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1 py-2.5">🗑️ মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
