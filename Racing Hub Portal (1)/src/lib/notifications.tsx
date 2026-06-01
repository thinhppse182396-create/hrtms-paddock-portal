import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";

export interface Notification {
  id: string;
  title: string;
  body?: string;
  at: string;
  read: boolean;
}

interface Ctx {
  items: Notification[];
  unread: number;
  push: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markAllRead: () => void;
}

const NotificationCtx = createContext<Ctx | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notification[]>([
    { id: "N1", title: "Welcome", body: "Real-time race updates are now live.", at: "just now", read: false },
  ]);
  const tick = useRef(0);

  const push: Ctx["push"] = (n) => {
    tick.current += 1;
    setItems(prev => [{ ...n, id: `N${Date.now()}-${tick.current}`, at: "just now", read: false }, ...prev].slice(0, 20));
  };

  // Simulate real-time events (live race ticker + occasional alerts)
  useEffect(() => {
    const id = setInterval(() => {
      const samples = [
        { title: "Live: R004 lap update", body: "Thunder Bolt taking the lead at turn 3" },
        { title: "Result published", body: "R003 ranks are now official" },
        { title: "New registration", body: "Silver Arrow registered for R001" },
        { title: "Prize awarded", body: "$50,000 paid to winner of R003" },
      ];
      push(samples[Math.floor(Math.random() * samples.length)]);
    }, 25000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo<Ctx>(() => ({
    items,
    unread: items.filter(i => !i.read).length,
    push,
    markAllRead: () => setItems(prev => prev.map(i => ({ ...i, read: true }))),
  }), [items]);

  return <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>;
}

export function useNotifications() {
  const v = useContext(NotificationCtx);
  if (!v) throw new Error("useNotifications outside provider");
  return v;
}

export function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        className="relative p-2 rounded-md hover:bg-accent transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-danger-foreground text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold">Notifications</div>
            {items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No notifications</div>
            ) : items.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-border/50 text-sm">
                <div className="font-medium text-foreground">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{n.at}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
