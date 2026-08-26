import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

export function ContextualPopover({ open, anchorRef, onClose, children, className, width = 320, placement = "bottom" }) {
  const panelRef = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;
    const updatePosition = () => {
      const anchor = anchorRef.current.getBoundingClientRect();
      const panelHeight = panelRef.current?.offsetHeight ?? 260;
      const viewportPadding = 12;
      const panelWidth = Math.min(width, window.innerWidth - viewportPadding * 2);
      const fitsBelow = anchor.bottom + 8 + panelHeight <= window.innerHeight - viewportPadding;
      const top = placement === "top" || !fitsBelow ? anchor.top - panelHeight - 8 : anchor.bottom + 8;
      const right = Math.min(window.innerWidth - viewportPadding, Math.max(viewportPadding + panelWidth, anchor.right));
      setPosition({ top: Math.max(viewportPadding, top), left: right - panelWidth, width: panelWidth });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, open, placement, width]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (anchorRef?.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      onClose?.();
    };
    const handleKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open || !position) return null;
  return createPortal(<div ref={panelRef} role="dialog" className={cn("fixed z-[80] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl border border-taste-border bg-white p-4 shadow-modal", className)} style={position}>{children}</div>, document.body);
}
