import { useEffect, useState } from "react";
import { Button } from "./Button";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "password" | "number" | "date" | "select" | "textarea" | "tags";
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  min?: number;
  max?: number;
};

export function FormModal<T extends Record<string, any>>({
  open,
  title,
  fields,
  initial,
  onClose,
  onSubmit,
  submitLabel = "Save",
  validate,
}: {
  open: boolean;
  title: string;
  fields: Field[];
  initial?: Partial<T>;
  onClose: () => void;
  onSubmit: (values: T) => void | Promise<void>;
  submitLabel?: string;
  validate?: (values: T) => Record<string, string> | null;
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setValues({ ...(initial ?? {}) }); setErrors({}); setSubmitting(false); }
  }, [open, initial]);

  if (!open) return null;

  const set = (k: string, v: any) => {
    setValues(prev => ({ ...prev, [k]: v }));
    setErrors(prev => {
      if (!prev[k] && !prev._form) return prev;
      const n = { ...prev }; delete n[k]; delete n._form; return n;
    });
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && (values[f.name] === undefined || values[f.name] === "")) {
        errs[f.name] = `${f.label} is required`;
      }
    }
    if (Object.keys(errs).length === 0 && validate) {
      const custom = validate(values as T);
      if (custom) Object.assign(errs, custom);
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      setSubmitting(true);
      await onSubmit(values as T);
    } catch (err: any) {
      // Map server-side errors onto matching fields, with a top-level summary.
      if (err && err.name === "ApiError") {
        const fe: Record<string, string> = { ...(err.fieldErrors ?? {}) };
        fe._form = err.message || "Yêu cầu thất bại";
        setErrors(fe);
      } else {
        setErrors({ _form: err?.message || "Đã xảy ra lỗi không xác định" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {errors._form && (
            <div className="mb-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              {errors._form}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {fields.map(f => {
              const err = errors[f.name];
              const inputCls = `mt-1 w-full px-3 py-2 border rounded-md bg-background ${err ? "border-danger" : "border-input"}`;
              return (
                <div key={f.name} className={f.full || f.type === "textarea" ? "col-span-2" : ""}>
                  <label className="text-xs text-muted-foreground">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
                  {f.type === "select" ? (
                    <select className={inputCls} value={values[f.name] ?? ""} onChange={e => set(f.name, e.target.value)}>
                      <option value="">— Select —</option>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea className={inputCls} rows={3} placeholder={f.placeholder} value={values[f.name] ?? ""} onChange={e => set(f.name, e.target.value)} />
                  ) : f.type === "tags" ? (
                    <div>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder={f.placeholder}
                        value={values[f.name] ?? ""}
                        onChange={e => set(f.name, e.target.value)}
                      />
                      {(() => {
                        const tags = String(values[f.name] ?? "").split(",").map(s => s.trim()).filter(Boolean);
                        if (!tags.length) return null;
                        return (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {tags.map((tag, i) => (
                              <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                                {tag}
                                <button
                                  type="button"
                                  className="text-primary/60 hover:text-primary focus:outline-none"
                                  onClick={() => {
                                    const newTags = tags.filter((_, idx) => idx !== i);
                                    set(f.name, newTags.join(", "));
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      className={inputCls}
                      placeholder={f.placeholder}
                      min={f.type === "number" ? f.min : undefined}
                      max={f.type === "number" ? f.max : undefined}
                      value={values[f.name] ?? ""}
                      onChange={e => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                    />
                  )}

                  {err && <div className="mt-1 text-xs text-danger">{err}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="ghost" onClick={() => { setValues({ ...(initial ?? {}) }); setErrors({}); }} disabled={submitting}>Clear</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Saving…" : submitLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onClose, onConfirm, confirmLabel = "Delete" }: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="px-6 py-4 text-sm text-muted-foreground">{message}</div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function DetailModal({ open, title, items, onClose }: {
  open: boolean;
  title: string;
  items: { label: string; value: React.ReactNode }[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="px-6 py-4 text-sm space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">{it.label}</span>
              <span className="text-foreground text-right">{it.value ?? "—"}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
