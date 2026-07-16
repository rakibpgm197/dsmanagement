"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (userId === "dspatgram" && password === "5825900") {
      sessionStorage.setItem("ds_auth", "1");
      router.push("/dashboard");
    } else {
      setError("ভুল User ID বা পাসওয়ার্ড! আবার চেষ্টা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1e40af 70%, #2563eb 100%)"
    }}>
      {/* Top decorative bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #f59e0b, #3b82f6, #10b981, #f59e0b)" }} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Banner Image */}
            <div className="rounded-2xl overflow-hidden mb-5 shadow-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-banner.png" alt="দুরন্ত ডিজিটাল সাইন" className="w-full object-cover"
                style={{ maxHeight: 160 }} />
            </div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <span style={{ fontSize: 36 }}>🖨️</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              দুরন্ত ডিজিটাল সাইন
            </h1>
            <p className="text-blue-200 text-sm font-medium">ডিজাইনে দুরন্ত, মানে অনন্য</p>
            <div className="mt-2 flex items-center justify-center gap-1">
              <span style={{ width: 30, height: 2, background: "rgba(255,255,255,0.3)", display: "inline-block", borderRadius: 99 }} />
              <span className="text-blue-300 text-xs">পাটগ্রাম, লালমনিরহাট</span>
              <span style={{ width: 30, height: 2, background: "rgba(255,255,255,0.3)", display: "inline-block", borderRadius: 99 }} />
            </div>
          </div>

          {/* Login Card */}
          <div className="glass-card rounded-2xl p-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: "#1e3a8a" }}>
              🔐 অ্যাডমিন লগইন
            </h2>
            <p className="text-center text-sm text-slate-500 mb-6">আপনার তথ্য দিয়ে প্রবেশ করুন</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#334155" }}>
                  👤 User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="User ID লিখুন"
                  className="input-field"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#334155" }}>
                  🔑 পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="input-field"
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl p-3 text-sm text-center font-medium"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
                style={{ borderRadius: 12 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    লগইন হচ্ছে...
                  </span>
                ) : "✅ লগইন করুন"}
              </button>
            </form>
          </div>

          {/* Footer info */}
          <div className="text-center mt-6 text-blue-300 text-sm animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p>📍 হোটেল সাদিকের নিচতলা, বড় মসজিদের সামনে</p>
            <p className="mt-1">📞 01710513624</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
