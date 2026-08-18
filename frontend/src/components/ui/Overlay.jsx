import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, IconButton } from "./Button";

export function Modal({ open, onClose, title, children, footer, className }) {
  useEffect(() => { const closeOnEscape = (event) => { if (event.key === "Escape") onClose?.(); }; if (open) document.addEventListener("keydown", closeOnEscape); return () => document.removeEventListener("keydown", closeOnEscape); }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/35 p-4 sm:items-center" role="presentation" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={cn("w-full max-w-lg rounded-2xl bg-white shadow-modal", className)} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between gap-4 border-b border-taste-border px-5 py-4"><h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2><IconButton label="Close dialog" size="sm" onClick={onClose}><X size={18} /></IconButton></div><div className="p-5">{children}</div>{footer && <div className="flex flex-col-reverse gap-2 border-t border-taste-border px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}</div></div>;
}
export function ConfirmDialog({ open, onClose, onConfirm, title = "Confirm action", description, confirmLabel = "Confirm", loading = false, danger = false }) { return <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}><p className="text-sm leading-6 text-slate-600">{description}</p></Modal>; }
export function Dropdown({ open, children, className }) { if (!open) return null; return <div className={cn("absolute right-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-taste-border bg-white p-1.5 shadow-modal", className)}>{children}</div>; }
