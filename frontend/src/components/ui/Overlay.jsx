import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, IconButton } from "./Button";

export function Modal({ open, onClose, title, children, footer, className }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    if (open) document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-modal",
          className
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header - fixed */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-taste-border px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          {onClose && (
            <IconButton label="Close dialog" size="sm" onClick={onClose}>
              <X size={18} />
            </IconButton>
          )}
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer - fixed */}
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-taste-border px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = "Confirm action", description, confirmLabel = "Confirm", loading = false, danger = false, className }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className={className} 
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </Modal>
  );
}

export function Dropdown({ open, children, className }) {
  if (!open) return null;
  return (
    <div className={cn("absolute right-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-taste-border bg-white p-1.5 shadow-modal", className)}>
      {children}
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, className }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    if (open) document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div className="fixed inset-0 z-[60] flex justify-end" role="presentation">
        <div className="absolute inset-0 bg-slate-950/20" style={{ animation: "fadeIn 0.2s ease-out" }} onClick={onClose} />
        <div
          role="dialog"
          aria-modal="true"
          className={cn("relative w-full md:w-[40vw] lg:w-[400px] h-full bg-white shadow-xl flex flex-col sm:rounded-l-2xl", className)}
          style={{ animation: "drawerSlideIn 0.25s ease-out" }}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-taste-border px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <IconButton label="Close panel" size="sm" onClick={onClose}><X size={18} /></IconButton>
          </div>
          <div className="flex-1 overflow-y-auto p-0">{children}</div>
          {footer && <div className="shrink-0 flex flex-col gap-2 border-t border-taste-border p-5">{footer}</div>}
        </div>
      </div>
    </>
  );
}