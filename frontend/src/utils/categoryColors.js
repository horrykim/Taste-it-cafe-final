// Category tag colors for Menu Management — sourced directly from the
// Taste It design system (see Taste_It_-_Color_Palette). These six are
// deliberately kept separate from the semantic success/warning/danger
// colors so a category tag is never mistaken for a status indicator.
export const CATEGORY_COLORS = [
  { id: "pink", swatch: "#F777D1", bg: "bg-[#FDEAFA]", text: "text-[#B82188]" }, // Primary Pink / Pink — Pressed
  { id: "teal", swatch: "#7CE1DB", bg: "bg-[#E3FBFA]", text: "text-[#0F6B66]" }, // Secondary Teal
  { id: "mint", swatch: "#8CFDBD", bg: "bg-[#E6FCEF]", text: "text-[#116A36]" }, // Mint Pill / Success — Deep
  { id: "cyan", swatch: "#B6F9FF", bg: "bg-[#EAFDFF]", text: "text-[#0E6C7A]" }, // Icon Well — Light Cyan
  { id: "amber", swatch: "#FF9500", bg: "bg-[#FFF1DE]", text: "text-[#9A4B00]" }, // Warning — Icon/Text
  { id: "violet", swatch: "#B82188", bg: "bg-[#F8E7F3]", text: "text-[#7A1660]" }, // Pink — Pressed (deep)
];

const FALLBACK_COLOR = CATEGORY_COLORS[0];

// Small, stable string hash (no external deps) — same input always maps to
// the same palette index, so a category without a saved `color` still
// renders consistently across reloads instead of jumping around.
function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0; // keep it a 32-bit int
  }
  return Math.abs(hash);
}

// Resolve a category's color entry. `colorId` is the persisted value on
// the category record (set via the color picker in the category form). If
// it's missing — e.g. older mock data that predates the color field — we
// derive a stable color from `seed` (typically the category name) instead
// of always returning the same fallback swatch. That's what made every
// category badge look identical before: `colorId` was undefined for all
// of them, so they all hit the same default.
export function getCategoryColor(colorId, seed) {
  const found = CATEGORY_COLORS.find((color) => color.id === colorId);
  if (found) return found;
  if (seed) return CATEGORY_COLORS[hashString(String(seed)) % CATEGORY_COLORS.length];
  return FALLBACK_COLOR;
}

// Pick a color for a *new* category, preferring one that isn't already in
// use by a sibling category so adjacent rows don't repeat a swatch until
// every option has been used at least once.
export function assignCategoryColor(seed, existingCategories = []) {
  const used = new Set(existingCategories.map((category) => category.color).filter(Boolean));
  const unused = CATEGORY_COLORS.find((color) => !used.has(color.id));
  if (unused) return unused.id;
  const index = seed ? hashString(String(seed)) % CATEGORY_COLORS.length : existingCategories.length % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index].id;
}