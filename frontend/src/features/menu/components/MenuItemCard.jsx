import { Pencil, Trash2 } from "lucide-react";
import { Badge, Card, IconButton, StatusBadge, Toggle } from "../../../components/ui";

function MenuItemCard({ item, categoryName, isOwner, onToggle, onDetails, onEdit, onDelete }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><Badge variant="purple">{categoryName}</Badge><h2 className="mt-3 truncate text-lg font-semibold text-slate-900">{item.name}</h2></div>
        {isOwner && <IconButton label={`Edit ${item.name}`} size="sm" onClick={() => onEdit(item)}><Pencil size={17} /></IconButton>}
      </div>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{item.description || "No description provided."}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-taste-border pt-4">
        <div><p className="text-lg font-bold text-slate-900">₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p><StatusBadge status={item.status === "ACTIVE" ? "active" : "inactive"} /></div>
        <Toggle label={item.status === "ACTIVE" ? "Available" : "Unavailable"} checked={item.status === "ACTIVE"} onChange={(checked) => onToggle(item.id, checked)} />
      </div>
      <div className="mt-4 flex gap-2"><button type="button" onClick={() => onDetails(item)} className="flex-1 rounded-xl border border-taste-border px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple">View details</button>{isOwner && <><button type="button" onClick={() => onEdit(item)} className="rounded-xl bg-taste-teal-soft px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-taste-teal/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple"><Pencil size={16} aria-hidden="true" /><span className="sr-only">Edit {item.name}</span></button><button type="button" onClick={() => onDelete(item)} className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple" aria-label={`Delete ${item.name}`}><Trash2 size={16} /></button></>}</div>
    </Card>
  );
}

export default MenuItemCard;