"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DashboardData {
  totalCustomers: number;
  totalDue: number;
  totalPaid: number;
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  pendingInvoices: number;
  recentPayments: Array<{ id: number; amount: string; note: string; paymentDate: string; customerName: string }>;
  topDebtors: Array<{ id: number; name: string; phone: string; totalDue: string }>;
  chartData: Array<{ date: string; income: number; expense: number }>;
}

function fmt(n: number) {
  return new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function StatCard({
  icon, label, value, sub, color, bgColor
}: { icon: string; label: string; value: string; sub?: string; color: string; bgColor: string }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: bgColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-slate-500 font-medium">ডেটা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const profit = data.monthIncome - data.monthExpense;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="rounded-2xl p-5 text-white shine-border"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)", boxShadow: "0 4px 20px rgba(30,64,175,0.3)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">🏠 ড্যাশবোর্ড</h1>
            <p className="text-blue-200 text-sm mt-1">দুরন্ত ডিজিটাল সাইন-এর সার্বিক অবস্থা</p>
          </div>
          <div className="text-right">
            <div className="text-blue-200 text-sm">আজকের তারিখ</div>
            <div className="text-white font-bold">
              {new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="মোট কাস্টমার"
          value={fmt(data.totalCustomers)}
          sub="সক্রিয় অ্যাকাউন্ট"
          color="#1e40af"
          bgColor="#eff6ff"
        />
        <StatCard
          icon="💰"
          label="মোট বাকি"
          value={`৳${fmt(data.totalDue)}`}
          sub="পাওনা পরিমাণ"
          color="#dc2626"
          bgColor="#fef2f2"
        />
        <StatCard
          icon="✅"
          label="মোট পেমেন্ট"
          value={`৳${fmt(data.totalPaid)}`}
          sub="সংগৃহীত"
          color="#059669"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon="🧾"
          label="পেন্ডিং ইনভয়েস"
          value={fmt(data.pendingInvoices)}
          sub="অপরিশোধিত"
          color="#d97706"
          bgColor="#fffbeb"
        />
      </div>

      {/* Today & Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)" }}>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-lg">📅</span> আজকের হিসাব
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span className="text-sm font-medium text-slate-600">আয়</span>
              </div>
              <span className="font-bold text-green-600">৳{fmt(data.todayIncome)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#fef2f2" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">📉</span>
                <span className="text-sm font-medium text-slate-600">ব্যয়</span>
              </div>
              <span className="font-bold text-red-600">৳{fmt(data.todayExpense)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: data.todayIncome >= data.todayExpense ? "#f0fdf4" : "#fef2f2" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">💎</span>
                <span className="text-sm font-medium text-slate-600">নেট লাভ</span>
              </div>
              <span className={`font-bold ${data.todayIncome >= data.todayExpense ? "text-green-600" : "text-red-600"}`}>
                ৳{fmt(data.todayIncome - data.todayExpense)}
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)" }}>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-lg">📆</span> এই মাসের হিসাব
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span className="text-sm font-medium text-slate-600">মোট আয়</span>
              </div>
              <span className="font-bold text-green-600">৳{fmt(data.monthIncome)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#fef2f2" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">📉</span>
                <span className="text-sm font-medium text-slate-600">মোট ব্যয়</span>
              </div>
              <span className="font-bold text-red-600">৳{fmt(data.monthExpense)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: profit >= 0 ? "#f0fdf4" : "#fef2f2" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">💎</span>
                <span className="text-sm font-medium text-slate-600">নেট মুনাফা</span>
              </div>
              <span className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ৳{fmt(profit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)" }}>
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="text-lg">📊</span> গত ৭ দিনের আয়-ব্যয় চার্ট
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip
              formatter={(value) => [`৳${fmt(Number(value))}`, ""]}
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
            <Legend />
            <Bar dataKey="income" name="আয়" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="ব্যয়" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)" }}>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-lg">💳</span> সাম্প্রতিক পেমেন্ট
          </h3>
          {data.recentPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">💸</div>
              <p>এখনো কোনো পেমেন্ট নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "#f8faff", border: "1px solid #e8eef5" }}>
                  <div>
                    <div className="font-semibold text-sm text-slate-700">{p.customerName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.paymentDate).toLocaleDateString("bn-BD")}
                      {p.note && ` • ${p.note}`}
                    </div>
                  </div>
                  <div className="font-bold text-green-600">৳{fmt(parseFloat(p.amount))}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Debtors */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e8eef5", boxShadow: "0 2px 12px rgba(30,64,175,0.06)" }}>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-lg">⚠️</span> সর্বোচ্চ বাকিদার
          </h3>
          {data.topDebtors.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">🎉</div>
              <p>কোনো বাকি নেই!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.topDebtors.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "#fff8f0", border: "1px solid #fed7aa" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: i === 0 ? "#fef3c7" : "#f8faff", color: i === 0 ? "#d97706" : "#64748b", border: "1px solid #e2e8f0" }}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-700">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.phone}</div>
                    </div>
                  </div>
                  <div className="font-bold text-red-500">৳{fmt(parseFloat(c.totalDue))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business Info Footer */}
      <div className="rounded-2xl p-5 text-center"
        style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", border: "1px solid #bae6fd" }}>
        <div className="text-2xl mb-2">🖨️</div>
        <h3 className="font-bold text-blue-800">দুরন্ত ডিজিটাল সাইন</h3>
        <p className="text-blue-600 text-sm italic">ডিজাইনে দুরন্ত, মানে অনন্য</p>
        <p className="text-blue-500 text-xs mt-1">📍 হোটেল সাদিকের নিচতলা, বড় মসজিদের সামনে, পাটগ্রাম, লালমনিরহাট</p>
        <p className="text-blue-500 text-xs">📞 01710513624</p>
      </div>
    </div>
  );
}
