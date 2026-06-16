import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, getDashboardPathByRole } from "@/auth/AuthContext";
import { Trophy, Eye, Shield, Flag, Users, Award, ArrowRight, Sparkles, UserPlus } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

const demoAccounts = [
  { role: "Admin", user: "admin_super", pass: "admin123", color: "from-violet-500 to-indigo-500" },
  { role: "Referee", user: "ref_sarah", pass: "referee123", color: "from-amber-500 to-orange-500" },
  { role: "Horse Owner", user: "owner_wayne", pass: "owner123", color: "from-emerald-500 to-teal-500" },
  { role: "Jockey", user: "jockey_smith", pass: "jockey123", color: "from-sky-500 to-blue-500" },
  { role: "Spectator", user: "fan_alex", pass: "spectator123", color: "from-rose-500 to-pink-500" },
];

function LoginPage() {
  const { currentUser, isAuthenticated, login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpUser, setFpUser] = useState("");
  const [fpPass, setFpPass] = useState("");
  const [fpPass2, setFpPass2] = useState("");
  const [fpMsg, setFpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (isAuthenticated && currentUser) {
    return <Navigate to={getDashboardPathByRole(currentUser.role)} />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = login(username.trim(), password);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    navigate({ to: getDashboardPathByRole(res.user.role) });
  };

  const fillDemo = (u: string, p: string) => { setUsername(u); setPassword(p); setError(""); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand hero panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">Racing Portal</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Tournament Management</div>
            </div>
          </Link>
        </div>

        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-xs mb-5">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-white/80">All-in-one platform for horse racing</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Run tournaments, track results,<br />
            <span className="text-amber-300">crown your champions.</span>
          </h2>
          <p className="text-white/70 mt-4 leading-relaxed">
            From horse registration and jockey invitations to live races, referee reports and award ceremonies — managed end-to-end in one portal.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-8">
            {[
              { icon: Shield, label: "55 Business Rules", sub: "Enforced end-to-end" },
              { icon: Flag, label: "Live Races", sub: "Realtime ticker" },
              { icon: Users, label: "4 Roles", sub: "Admin · Owner · Jockey · Spectator" },
              { icon: Award, label: "Award Ceremonies", sub: "Trophies & cash prizes" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-lg bg-white/[0.06] ring-1 ring-white/10 p-3">
                <Icon className="h-4 w-4 text-amber-300 mb-2" />
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-[11px] text-white/60">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Racing Portal · Built on Lovable
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="text-base font-bold text-foreground">Racing Portal</div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access your racing portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button type="button" onClick={() => { setForgotOpen(true); setFpUser(username); setFpPass(""); setFpPass2(""); setFpMsg(null); }} className="text-xs text-muted-foreground hover:text-primary">Forgot?</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Signing in..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-sm font-medium text-primary transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Create account
            </Link>
            <Link
              to="/watch"
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-input bg-card hover:bg-accent text-sm text-foreground transition-colors"
            >
              <Eye className="h-4 w-4" /> Guest view
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground text-center">
            Đăng ký công khai chỉ dành cho vai trò <span className="font-semibold">Spectator</span>. Các vai trò khác do Admin tạo.
          </p>

          <div className="mt-7">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick demo accounts</div>
              <span className="text-[10px] text-muted-foreground">Click to autofill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map(d => (
                <button
                  key={d.user}
                  type="button"
                  onClick={() => fillDemo(d.user, d.pass)}
                  className="group relative overflow-hidden text-left rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-3"
                >
                  <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${d.color}`} />
                  <div className="pl-2">
                    <div className="text-xs font-semibold text-foreground">{d.role}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{d.user}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setForgotOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">Đặt lại mật khẩu</h3>
            <p className="text-xs text-muted-foreground mt-1">Nhập tên đăng nhập và mật khẩu mới. (Tài khoản demo không thể đổi.)</p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setFpMsg(null);
                if (fpPass !== fpPass2) { setFpMsg({ type: "err", text: "Mật khẩu xác nhận không khớp" }); return; }
                const res = resetPassword(fpUser, fpPass);
                if (!res.ok) { setFpMsg({ type: "err", text: res.error }); return; }
                setFpMsg({ type: "ok", text: "Đổi mật khẩu thành công. Bạn có thể đăng nhập ngay." });
                setUsername(fpUser); setPassword("");
              }}
            >
              <div>
                <label className="text-xs font-medium text-foreground">Tên đăng nhập</label>
                <input value={fpUser} onChange={e => setFpUser(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Mật khẩu mới</label>
                <input type="password" value={fpPass} onChange={e => setFpPass(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Xác nhận mật khẩu</label>
                <input type="password" value={fpPass2} onChange={e => setFpPass2(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {fpMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg border ${fpMsg.type === "ok" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-danger bg-danger/10 border-danger/20"}`}>
                  {fpMsg.text}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setForgotOpen(false)} className="flex-1 py-2 rounded-lg border border-input bg-card hover:bg-accent text-sm text-foreground">Đóng</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium">Đặt lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
