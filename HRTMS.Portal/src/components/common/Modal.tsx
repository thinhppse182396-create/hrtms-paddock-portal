import type { ReactNode } from "react";
import { Button } from "./Button";

export function Modal({ open, onClose, title, children, onConfirm, confirmLabel = "Confirm" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 animate-fade-in-fast" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="px-6 py-4">{children}</div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {onConfirm && <Button onClick={onConfirm}>{confirmLabel}</Button>}
        </div>
      </div>
    </div>
  );
}
