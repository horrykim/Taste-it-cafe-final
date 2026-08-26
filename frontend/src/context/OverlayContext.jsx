import { useMemo, useState } from "react";
import { OverlayContext } from "./OverlayStateContext";

export function OverlayProvider({ children }) {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const value = useMemo(() => ({ activeOverlay, setActiveOverlay }), [activeOverlay]);
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}