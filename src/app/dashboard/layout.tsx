"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: "🏠" },
  { href: "/dashboard/customers", label: "বাকির তালিকা", icon: "👥" },
  { href: "/dashboard/payments", label: "পেমেন্ট ইতিহাস", icon: "💳" },
  { href: "/dashboard/transactions", label: "আয়-ব্যয়", icon: "📊" },
  { href: "/dashboard/invoices", label: "ইনভয়েস", icon: "🧾" },
  { href: "/dashboard/reminders", label: "রিমাইন্ডার", icon: "🔔" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const auth = sessionStorage.getItem("ds_auth");
    if (!auth) {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("ds_auth");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f0f4f8" }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Brand */}
        <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span className="text-2xl">🖨️</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">দুরন্ত ডিজিটাল সাইন</div>
              <div className="text-blue-300 text-xs mt-0.5">পাটগ্রাম, লালমনিরহাট</div>
            </div>
          </div>
          <div className="mt-3 text-center text-blue-200 text-xs font-mono"
            style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 8px" }}>
            ⏰ {currentTime}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="text-blue-300 text-xs text-center mb-3">
            <div>📍 হোটেল সাদিকের নিচতলা</div>
            <div>📞 01710513624</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            🚪 লগআউট
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(30,64,175,0.06)" }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <div className="w-5 h-0.5 bg-slate-600 mb-1" />
              <div className="w-5 h-0.5 bg-slate-600 mb-1" />
              <div className="w-5 h-0.5 bg-slate-600" />
            </button>
            <div>
              <div className="font-bold text-slate-800 text-sm">দুরন্ত ডিজিটাল সাইন</div>
              <div className="text-xs text-slate-500">
                {new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ background: "#eff6ff", color: "#1d4ed8" }}>
              <span>👤</span>
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
