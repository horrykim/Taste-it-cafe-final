import { BarChart3, BookOpen, Boxes, ClipboardCheck, FileChartColumn, History, LayoutDashboard, List, MapPinned, PackageSearch, ShoppingCart, Sparkles, Tags, TriangleAlert, Users, UtensilsCrossed } from "lucide-react";

export const navigationByRole = {
  OWNER: [
    { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
    { label: "POS", path: "/app/pos", icon: ShoppingCart },
    { label: "Menu Management", icon: UtensilsCrossed, children: [{ label: "Menu Items", path: "/app/menu", search: "?view=items", icon: List }, { label: "Categories", path: "/app/menu", search: "?view=categories", icon: Tags }, { label: "Recipes", path: "/app/menu", search: "?view=recipes", icon: BookOpen }] },
    { label: "Inventory Management", icon: Boxes, children: [{ label: "Inventory", path: "/app/inventory", icon: PackageSearch }, { label: "Stock Alerts", path: "/app/inventory", search: "?status=alerts", icon: TriangleAlert }, { label: "Reconciliation", path: "/app/reconciliation", icon: ClipboardCheck }, { label: "Inventory History", path: "/app/inventory/history", icon: History }] },
    { label: "Sales", path: "/app/sales", icon: BarChart3 },
    { label: "Branch Management", path: "/app/branches", icon: MapPinned },
    { label: "Staff Management", path: "/app/staff", icon: Users },
    { label: "Reports", path: "/app/reports", icon: FileChartColumn },
    { label: "AI Weekly Summary", path: "/app/reports/ai", icon: Sparkles },
  ],
  STAFF: [
    { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
    { label: "POS", path: "/app/pos", icon: ShoppingCart },
    { label: "Menu Management", icon: UtensilsCrossed, children: [{ label: "Menu Items", path: "/app/menu", search: "?view=items", icon: List }] },
    { label: "Inventory Management", icon: Boxes, children: [{ label: "Inventory", path: "/app/inventory", icon: PackageSearch }, { label: "Stock Alerts", path: "/app/inventory", search: "?status=alerts", icon: TriangleAlert }, { label: "Reconciliation", path: "/app/reconciliation", icon: ClipboardCheck }] },
    { label: "Sales", path: "/app/sales", icon: BarChart3 },
  ],
};

export const pageLabels = {
  "/app/dashboard": "Dashboard", "/app/pos": "Point of Sale", "/app/menu": "Menu Management", "/app/inventory": "Inventory", "/app/inventory/history": "Inventory History", "/app/reconciliation": "Inventory Reconciliation", "/app/sales": "Sales", "/app/reports": "Reports", "/app/reports/ai": "AI Weekly Summary", "/app/branches": "Branch Management", "/app/staff": "Staff Management",
  "/app/design-system": "Design system",
};
