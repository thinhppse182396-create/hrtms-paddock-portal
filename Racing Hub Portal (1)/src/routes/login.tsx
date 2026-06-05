import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, getDashboardPathByRole } from "@/auth/AuthContext";
import { Trophy, Eye, ArrowRight, UserPlus } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { currentUser, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (isAuthenticated && currentUser) {
    return <Navigate to={getDashboardPathByRole(currentUser.role)} />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: getDashboardPathByRole(result.user.role) });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <div className="font-bold">Racing Portal</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Tournament Management</div>
          </div>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Welcome back</h2>
          <p className="mt-4 text-white/70">Sign in with an account stored in the racing portal database.</p>
        </div>
        <div className="text-xs text-white/50">Racing Portal</div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Sign in to access your racing portal</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Username</label>
              <input value={username} onChange={event => setUsername(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-sm" required />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setForgotOpen(true)}>
                  Forgot password?
                </button>
              </div>
              <input type="password" value={password} onChange={event => setPassword(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-input rounded-lg bg-card text-sm" required />
            </div>
            {error && <div className="text-sm text-danger bg-danger/10 border border-danger/20 px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? "Signing in..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 text-sm text-primary">
              <UserPlus className="h-4 w-4" /> Create account
            </Link>
            <Link to="/watch" className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-input text-sm">
              <Eye className="h-4 w-4" /> Guest view
            </Link>
          </div>
        </div>
      </div>
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForgotOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-card shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Forgot password?</h2>
            </div>
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Contact an administrator and provide your username. The administrator can set a new temporary password from User & Role Management.
            </div>
            <div className="flex justify-end border-t border-border px-6 py-4">
              <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => setForgotOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
