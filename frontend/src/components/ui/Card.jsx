import { cn } from "../../utils/cn";

export function Card({ as: Component = "section", className, children, ...props }) { return <Component className={cn("rounded-2xl border border-taste-border bg-white shadow-card", className)} {...props}>{children}</Component>; }
export function ContentCard({ className, children, ...props }) { return <Card className={cn("p-5 sm:p-6", className)} {...props}>{children}</Card>; }
// Icon well uses Icon Well — Light Cyan (#B6F9FF), circular, per the design
// system's "circular icon backgrounds on dashboard stat cards".
export function StatCard({ label, value, icon: Icon, trend, className }) { return <Card className={cn("p-5", className)}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>{trend && <p className="mt-2 text-xs text-slate-500">{trend}</p>}</div>{Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B6F9FF] text-[#062B56]"><Icon size={20} /></span>}</div></Card>; }