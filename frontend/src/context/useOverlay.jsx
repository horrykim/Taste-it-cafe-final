import { useContext } from "react";
import { OverlayContext } from "./OverlayStateContext";

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("useOverlay must be used within an OverlayProvider.");
  return context;
}