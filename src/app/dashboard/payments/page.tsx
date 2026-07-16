"use client";
import { useEffect, useState } from "react";

interface Payment {
  id: number;
  customerId: number;
  amount: string;
  note: string;
  paymentDate: string;
  customerName: string;
  customerPhone: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/payments");
      const json = await res.json();
      setPayments(json.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = payments.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);

  // Group by date
  const grouped: Record<string, Payment[]> = {};
  payments.forEach(p => {
    const date = new Date(p.paymentDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(p);
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 20px rgba(5,150,105,0.25)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">💳 পেমেন্ট ইতিহাস</h1>
            <p className="text-green-100 text-sm mt-1">সকল পরিশোধের তালিকা</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-xs text-green-100">মোট এন্ট্রি</div>
              <div className="font-bold">{payments.length}</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="text-xs text-green-100">মোট সংগ্রহ</div>
              <div className="font-bold">৳{fmt(total)}</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-2">⏳</div>
          <p>লোড হচ্ছে...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: "white", border: "1px solid #e8eef5" }}>
          <div className="text-5xl mb-3">💸</div>
          <p className="text-slate-500 font-medium">এখনো কোনো পেমেন্ট নেই</p>
          <p className="text-slate-400 text-sm mt-1">বাকির তালিকা থেকে পেমেন্ট গ্রহণ করুন</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, pays]) => {
            const dayTotal = pays.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h3 className="font-bold text-slate-700">{date}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{ background: "#f0fdf4", color: "#15803d" }}>
                    মোট: ৳{fmt(dayTotal)}
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.04)" }}>
                  {/* Desktop */}
                  <table className="w-full hidden md:table">
                    <thead>
                      <tr style={{ background: "#f8fffe", borderBottom: "1px solid #e8eef5" }}>
                        <th className="text-left px-5 py-3 text-sm font-bold text-slate-600">কাস্টমার</th>
                        <th className="text-left px-5 py-3 text-sm font-bold text-slate-600">ফোন</th>
                        <th className="text-left px-5 py-3 text-sm font-bold text-slate-600">নোট</th>
                        <th className="text-right px-5 py-3 text-sm font-bold text-slate-600">পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pays.map(p => (
                        <tr key={p.id} className="table-row border-b" style={{ borderColor: "#f1f5f9" }}>
                          <td className="px-5 py-3 font-semibold text-slate-800">{p.customerName}</td>
                          <td className="px-5 py-3 text-sm text-blue-600">{p.customerPhone || "—"}</td>
                          <td className="px-5 py-3 text-sm text-slate-500">{p.note || "—"}</td>
                          <td className="px-5 py-3 text-right font-bold text-green-600">৳{fmt(parseFloat(p.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Mobile */}
                  <div className="md:hidden space-y-2 p-3">
                    {pays.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: "#f8fffe", border: "1px solid #bbf7d0" }}>
                        <div>
                          <div className="font-semibold text-slate-800">{p.customerName}</div>
                          {p.customerPhone && <div className="text-xs text-blue-600">{p.customerPhone}</div>}
                          {p.note && <div className="text-xs text-slate-400">{p.note}</div>}
                        </div>
                        <div className="font-bold text-green-600">৳{fmt(parseFloat(p.amount))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "2px solid #86efac" }}>
            <div className="font-bold text-green-800 flex items-center gap-2">
              <span className="text-xl">🏆</span> সর্বমোট সংগৃহীত
            </div>
            <div className="text-2xl font-bold text-green-700">৳{fmt(total)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
