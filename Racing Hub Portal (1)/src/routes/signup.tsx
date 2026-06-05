import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, getDashboardPathByRole } from "@/auth/AuthContext";
import { toast } from "sonner";
import { Trophy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { currentUser, isAuthenticated, signupSpectator } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && currentUser) {
    return <Navigate to={getDashboardPathByRole(currentUser.role)} />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Password confirmation does not match.");
      return;
    }
    setLoading(true);
    const result = await signupSpectator({ username, password, name });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      toast.error("Registration failed", { description: result.error });
      return;
    }
    toast.success("Registration successful");
    navigate({ to: getDashboardPathByRole(result.user.role) });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold">Racing Portal</span>
        </Link>
        <h1 className="text-2xl font-bold">Create spectator account</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Jockey, referee and owner accounts are created by an administrator.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Full name"
            className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm" required />
          <input value={username} onChange={event => setUsername(event.target.value)} placeholder="Username"
            className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm" required />
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password"
            className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm" required />
          <input type="password" value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Confirm password"
            className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-sm" required />
          {error && <div className="text-sm text-danger bg-danger/10 border border-danger/20 px-3 py-2 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Creating..." : <>Create account <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        <Link to="/login" className="block text-center text-sm text-primary mt-5">Back to sign in</Link>
      </div>
    </div>
  );
}
