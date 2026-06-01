import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, getDashboardPathByRole } from "@/auth/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Role } from "@/data/mockUsers";
import { mockUsers } from "@/data/mockUsers";
import { toast } from "sonner";
import {
  LayoutDashboard, Calendar, Trophy, Users, ShieldCheck, FileText, AlertTriangle,
  GalleryHorizontal, Gavel, Gift, Target, Activity, ListChecks, Send,
  BarChart3, DollarSign, Settings, ArrowLeft, KeyRound,
} from "lucide-react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

interface Feature { to: string; label: string; desc: string; icon: React.ReactNode }

const FEATURES: Record<Role, Feature[]> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", desc: "Overall system metrics", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/admin/tournaments", label: "Tournaments", desc: "Create and manage tournaments", icon: <Trophy className="h-4 w-4" /> },
    { to: "/admin/races", label: "Races", desc: "Configure races and prizes", icon: <Calendar className="h-4 w-4" /> },
    { to: "/admin/registrations", label: "Registrations", desc: "Approve / reject horse entries", icon: <ListChecks className="h-4 w-4" /> },
    { to: "/admin/referees", label: "Referees", desc: "Assign referees to races", icon: <Gavel className="h-4 w-4" /> },
    { to: "/admin/results", label: "Results", desc: "Publish race results", icon: <FileText className="h-4 w-4" /> },
    { to: "/admin/awards", label: "Awards", desc: "Configure prize ceremonies", icon: <Gift className="h-4 w-4" /> },
    { to: "/admin/users", label: "Users", desc: "All system accounts", icon: <Users className="h-4 w-4" /> },
    { to: "/admin/analytics", label: "Analytics", desc: "Reports & insights", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/admin/audit-log", label: "Audit Log", desc: "Trace all changes", icon: <Activity className="h-4 w-4" /> },
  ],
  REFEREE: [
    { to: "/referee/dashboard", label: "Dashboard", desc: "My referee summary", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/referee/assigned-races", label: "Assigned Races", desc: "Races assigned to me", icon: <Calendar className="h-4 w-4" /> },
    { to: "/referee/pre-race-check", label: "Pre-Race Check", desc: "Verify horses & jockeys, start race", icon: <ShieldCheck className="h-4 w-4" /> },
    { to: "/referee/record-result", label: "Record Result", desc: "Submit final standings", icon: <FileText className="h-4 w-4" /> },
    { to: "/referee/violations", label: "Violations", desc: "Log rule infractions", icon: <AlertTriangle className="h-4 w-4" /> },
    { to: "/referee/reports", label: "Reports", desc: "Post-race reports", icon: <FileText className="h-4 w-4" /> },
  ],
  OWNER: [
    { to: "/owner/dashboard", label: "Dashboard", desc: "Stable overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/owner/my-horses", label: "My Horses", desc: "Manage your horses", icon: <GalleryHorizontal className="h-4 w-4" /> },
    { to: "/owner/horse-performance", label: "Horse Performance", desc: "Stats & history", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/owner/race-registration", label: "Race Registration", desc: "Enter horses into races", icon: <ListChecks className="h-4 w-4" /> },
    { to: "/owner/my-registrations", label: "My Registrations", desc: "Track approvals", icon: <FileText className="h-4 w-4" /> },
    { to: "/owner/jockey-invitations", label: "Jockey Invitations", desc: "Invite jockeys", icon: <Send className="h-4 w-4" /> },
    { to: "/owner/awards", label: "Awards", desc: "Prize money earned", icon: <DollarSign className="h-4 w-4" /> },
  ],
  JOCKEY: [
    { to: "/jockey/dashboard", label: "Dashboard", desc: "Your racing summary", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/jockey/schedule", label: "Schedule", desc: "Upcoming races", icon: <Calendar className="h-4 w-4" /> },
    { to: "/jockey/invitations", label: "Invitations", desc: "Accept / decline offers", icon: <Send className="h-4 w-4" /> },
    { to: "/jockey/performance", label: "Performance", desc: "Career stats", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/jockey/awards", label: "Awards", desc: "Trophies & winnings", icon: <Trophy className="h-4 w-4" /> },
    { to: "/jockey/profile", label: "Jockey Profile", desc: "License, weight, contact", icon: <Settings className="h-4 w-4" /> },
  ],
  SPECTATOR: [
    { to: "/spectator/predictions", label: "Predictions", desc: "Predict ranks, win prize-money points", icon: <Target className="h-4 w-4" /> },
    { to: "/spectator/dashboard", label: "Dashboard", desc: "Live races & upcoming events", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/spectator/schedule", label: "Race Schedule", desc: "All upcoming races", icon: <Calendar className="h-4 w-4" /> },
    { to: "/spectator/results", label: "Results", desc: "Past race standings", icon: <FileText className="h-4 w-4" /> },
    { to: "/spectator/leaderboard", label: "Leaderboard", desc: "Top jockeys & horses", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/spectator/awards", label: "Awards", desc: "Ceremonies & winners", icon: <Gift className="h-4 w-4" /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  REFEREE: "Race Referee",
  OWNER: "Horse Owner",
  JOCKEY: "Jockey",
  SPECTATOR: "Spectator",
};

function ProfilePage() {
  const { currentUser, isAuthenticated, resetPassword, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  if (!isAuthenticated || !currentUser) return <Navigate to="/login" />;

  const isDemoAccount = mockUsers.some(u => u.username === currentUser.username);
  const features = FEATURES[currentUser.role];

  const submitPw = () => {
    setPwError(null);
    if (isDemoAccount) { setPwError("Demo account cannot change password"); return; }
    if (newPw !== confirmPw) { setPwError("New password and confirmation do not match"); return; }
    const res = resetPassword(currentUser.username, newPw);
    if (!res.ok) { setPwError(res.error); return; }
    toast.success("Password updated");
    setOldPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: getDashboardPathByRole(currentUser.role) })}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
          <button
            onClick={() => { logout(); window.location.href = "/login"; }}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Logout
          </button>
        </div>

        <PageHeader title="My Profile" subtitle="Account details, security and feature access for your role" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account card */}
          <div className="lg:col-span-1 bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground">@{currentUser.username}</div>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium">{ROLE_LABEL[currentUser.role]}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Account type</dt>
                <dd>
                  <StatusBadge status={isDemoAccount ? "Demo" : "Active"} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Features</dt>
                <dd className="font-medium">{features.length}</dd>
              </div>
            </dl>
          </div>

          {/* Change password */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Change Password
            </h3>
            {isDemoAccount ? (
              <div className="text-sm text-muted-foreground bg-muted/50 border border-border rounded-md p-3">
                This is a demo account. Sign up a new account to change passwords.
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="text-xs text-muted-foreground">Current password</label>
                  <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">New password (≥ 6 chars)</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Confirm new password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm" />
                </div>
                {pwError && <div className="text-xs text-destructive">{pwError}</div>}
                <Button onClick={submitPw} disabled={!newPw || !confirmPw}>Update password</Button>
              </div>
            )}
          </div>
        </div>

        {/* Features grid */}
        <h3 className="text-sm font-semibold text-foreground mt-8 mb-3">All features in your role</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map(f => (
            <Link
              key={f.to}
              to={f.to}
              className="group rounded-lg border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {f.icon}
                </span>
                <div className="font-semibold text-foreground">{f.label}</div>
              </div>
              <div className="text-xs text-muted-foreground pl-12">{f.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
