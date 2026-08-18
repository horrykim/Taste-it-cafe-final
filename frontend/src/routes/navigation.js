import { BarChart3, Boxes, ClipboardCheck, FileChartColumn, LayoutDashboard, MapPinned, ShoppingCart, Sparkles, Users, UtensilsCrossed } from "lucide-react";

export const navigationByRole = {
  OWNER: [
    { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
    { label: "Menu Management", path: "/app/menu", icon: UtensilsCrossed },
    { label: "Inventory", path: "/app/inventory", icon: Boxes },
    { label: "Reconciliation", path: "/app/reconciliation", icon: ClipboardCheck },
    { label: "Sales", path: "/app/sales", icon: BarChart3 },
    { label: "Branch Management", path: "/app/branches", icon: MapPinned },
    { label: "Staff Management", path: "/app/staff", icon: Users },
    { label: "Reports", path: "/app/reports", icon: FileChartColumn },
    { label: "AI Business Reports", path: "/app/reports/ai", icon: Sparkles },
  ],
  STAFF: [
    { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
    { label: "POS", path: "/app/pos", icon: ShoppingCart },
    { label: "Menu", path: "/app/menu", icon: UtensilsCrossed },
    { label: "Inventory", path: "/app/inventory", icon: Boxes },
    { label: "Reconciliation", path: "/app/reconciliation", icon: ClipboardCheck },
    { label: "Sales", path: "/app/sales", icon: BarChart3 },
  ],
};

export const pageLabels = {
  "/app/dashboard": "Dashboard", "/app/pos": "Point of Sale", "/app/menu": "Menu Management", "/app/inventory": "Inventory", "/app/reconciliation": "Inventory Reconciliation", "/app/sales": "Sales", "/app/reports": "Reports", "/app/reports/ai": "AI Business Reports", "/app/branches": "Branch Management", "/app/staff": "Staff Management",
  "/app/design-system": "Design system",
};
