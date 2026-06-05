import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, getDashboardPathByRole } from "@/auth/AuthContext";
import { toast } from "sonner";
import { Trophy, Eye, ArrowRight, Sparkles, UserPlus } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

type SignupRole = "SPECTATOR" | "JOCKEY" | "REFEREE";

interface PendingAccount {
  username: string;
  name: string;
  role: "JOCKEY" | "REFEREE";
  licenseNo?: string;
  experience?: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
}

const PENDING_KEY = "pendingAccounts";
function loadPending(): PendingAccount[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; }
}
function savePending(list: PendingAccount[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

function SignupPage() {
  const { currentUser, isAuthenticated, signupSpectator } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<SignupRole>("SPECTATOR");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [experience, setExperience] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && currentUser) {
    return <Navigate to={getDashboardPathByRole(currentUser.role)} />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true);

    if (role === "SPECTATOR") {
      const res = signupSpectator({ username, password, name });
      setLoading(false);
      if (!res.ok) { setError(res.error); toast.error("Đăng ký thất bại", { description: res.error }); return; }
      toast.success("Đăng ký thành công", { description: `Chào mừng ${res.user.name}!` });
      navigate({ to: getDashboardPathByRole(res.user.role) });
      return;
    }

    // Jockey / Referee — yêu cầu Admin duyệt
    const uname = username.trim();
    if (uname.length < 3) { setError("Tên đăng nhập phải có ít nhất 3 ký tự"); setLoading(false); return; }
    if (!licenseNo.trim()) { setError("Vui lòng nhập số giấy phép"); setLoading(false); return; }
    const list = loadPending();
    if (list.some(p => p.username.toLowerCase() === uname.toLowerCase())) {
      setError("Tên đăng nhập đã được gửi yêu cầu — vui lòng chờ Admin duyệt");
      setLoading(false); return;
    }
    const next: PendingAccount = {
      username: uname, name: name.trim(), role,
      licenseNo: licenseNo.trim(), experience: experience.trim() || undefined,
      status: "Pending", submittedAt: new Date().toISOString().slice(0, 10),
    };
    savePending([...list, next]);
    setLoading(false);
    toast.success("Yêu cầu đã gửi", { description: "Tài khoản sẽ kích hoạt sau khi Admin duyệt." });
    navigate({ to: "/login" });
  };

  const isStaff = role !== "SPECTATOR";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#7c2d12] text-white">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-rose-500/30 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />

        <Link to="/" className="relative inline-flex items-center gap-3 w-fit">
          <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Racing Portal</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Tournament Management</div>
          </div>
        </Link>

        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-xs mb-5">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-white/80">Khán giả miễn phí · Nài/Trọng tài cần Admin duyệt</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Tham gia hệ thống<br />
            <span className="text-amber-300">Quản lý Giải đua ngựa.</span>
          </h2>
          <p className="text-white/70 mt-4 leading-relaxed">
            Spectator có thể đăng nhập ngay. Jockey & Referee gửi yêu cầu, Admin sẽ
            kiểm tra giấy phép và kích hoạt tài khoản trong vòng 24 giờ.
          </p>
        </div>

        <div className="relative text-xs text-white/50">© {new Date().getFullYear()} Racing Portal</div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="text-base font-bold text-foreground">Racing Portal</div>
          </div>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-[11px] font-semibold mb-3">
              <UserPlus className="h-3.5 w-3.5" /> ĐĂNG KÝ TÀI KHOẢN
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tạo tài khoản mới</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chọn vai trò phù hợp. Owner vui lòng liên hệ trực tiếp Admin.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {(["SPECTATOR", "JOCKEY", "REFEREE"] as SignupRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 rounded-lg text-xs font-semibold border transition ${role === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input hover:bg-accent text-foreground"}`}
              >
                {r === "SPECTATOR" ? "Khán giả" : r === "JOCKEY" ? "Nài ngựa" : "Trọng tài"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Họ và tên</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="VD: Nguyễn Văn A" required />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Tên đăng nhập</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="ít nhất 3 ký tự, không dấu" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Mật khẩu</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="≥ 6 ký tự" required />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Xác nhận</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="Nhập lại" required />
              </div>
            </div>

            {isStaff && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground">Số giấy phép</label>
                  <input value={licenseNo} onChange={e => setLicenseNo(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder={role === "JOCKEY" ? "JK-2026-xxx" : "RF-2026-xxx"} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Kinh nghiệm (tuỳ chọn)</label>
                  <input value={experience} onChange={e => setExperience(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="VD: 5 năm" />
                </div>
                <div className="text-[11px] text-muted-foreground bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
                  Yêu cầu sẽ chuyển sang trạng thái <b>Pending</b>. Bạn chưa thể đăng nhập cho đến khi Admin duyệt.
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 px-3 py-2 rounded-lg">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? "Đang xử lý..." : <>{isStaff ? "Gửi yêu cầu" : "Đăng ký"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">hoặc</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <Link to="/login" className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-input bg-card hover:bg-accent text-sm text-foreground transition-colors">
              Đã có tài khoản? Đăng nhập
            </Link>
            <Link to="/watch" className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-input bg-card hover:bg-accent text-sm text-foreground transition-colors">
              <Eye className="h-4 w-4" /> Xem với tư cách khách
            </Link>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground text-center leading-relaxed">
            Bạn là Chủ ngựa? Liên hệ Quản trị viên để được cấp tài khoản.
          </p>
        </div>
      </div>
    </div>
  );
}
