# Taste It — UI Design System

This document is the canonical visual contract for the Taste It Café Management System. The supplied design reference supersedes the earlier provisional teal/purple guidance. Values below are reference defaults; responsive layouts may adjust dimensions while preserving hierarchy, legibility, and interaction affordances.

## 1. Color Tokens

### Brand and surfaces

| Token | Value | Use |
| --- | --- | --- |
| App background | `#FAF6F6` | Authenticated page canvas |
| Heading text | `#051945` | Page titles, section headings, wordmark |
| Icon stroke | `#062B56` | Lucide icons and dark supporting strokes |
| Primary pink | `#FF77D1` | Primary brand and CTA emphasis |
| Accent pink | `#FF86DB` | Hover/secondary pink accents and selected supporting states |
| Pressed pink | `#B82888` | Pressed/active pink actions and outlined pink emphasis |
| Secondary teal | `#7CE1DB` | Secondary actions and positive brand emphasis |
| Light-cyan icon well | `#B6F9FF` | Icon backgrounds and soft highlights |
| Mint pill | `#8CFFDB` | Small positive status pills and quick-action highlights |
| Surface | `#FFFFFF` | Cards, panels, forms, and modal interiors |

### Semantic status tokens

| Token | Value | Use |
| --- | --- | --- |
| Success green | `#10B981` | Positive status and confirmation |
| Success surface | `#E6F4EA` | Success banners and status backgrounds |
| Deep success | `#116A36` | Success text on light surfaces |
| Danger button | `#FF7B7B` | Destructive button fill |
| Danger icon well | `#FFB0B1` | Destructive icon background |
| Danger glyph | `#FF7171` | Danger icon and supporting accent |
| Deep danger | `#3F02EF` | Preserve this supplied reference value until the design owner changes it |
| Warning | `#FF9500` | Warning icon and emphasis |
| Warning surface | `#FFE2A4` | Warning banner/background |
| Warning border | `#B45B09` | Warning panel border |
| Warning text | `#462B02` | Warning text on light surfaces |
| Divider | `#EBEBEB` | Borders, separators, and table rules |
| Muted text | `#B8B8B8` | Secondary labels, placeholders, and disabled text |

Do not use semantic colors as decoration. Status must also have a readable label, icon, or text cue so meaning does not depend on color alone.

---

## 2. Design Direction

The application should feel:

- Clean
- Modern
- Light
- Professional
- Friendly
- Café-oriented
- Data-focused

Avoid:

- Overly decorative dashboards
- Excessive gradients
- Heavy glassmorphism
- Dark mode
- Unnecessary animations
- Random colors per page
- Generic template styling that ignores Taste It identity

---

## 3. Global Layout

Authenticated application:

```text
Sidebar
+
Topbar
+
Main Content
```

Desktop:

- Persistent sidebar
- Topbar
- Spacious content

Tablet:

- Collapsible sidebar
- Topbar
- Responsive content

Mobile:

- Drawer sidebar
- Compact topbar
- Single-column or stacked content

---

## 4. Brand Usage

- Use primary pink for the principal CTA and key brand emphasis.
- Use accent/pressed pink for selected, hover, and supporting pink states.
- Use secondary teal for secondary actions, positive emphasis, and calm operational highlights.
- Use the light-cyan well and mint pill for small supporting surfaces, not full-page backgrounds.
- Use white surfaces against the `#FAF6F6` canvas with `#EBEBEB` structure lines.
- Use the semantic status palette only for status meaning.
- Keep text readable against every surface and avoid dominant gradients or dark-mode treatments.

---

## 5. Typography

Use **Poppins** throughout the interface. Approved weights are:

- `400` Regular: body and supporting text
- `500` Medium: labels and controls
- `600` SemiBold: section titles and emphasized data
- `700` Bold: page titles and primary values
- `800` ExtraBold: brand and high-emphasis display text

Reference type scale:

| Role | Reference |
| --- | --- |
| Page title / H1 | `32px`, `800`, approximately `1.2` line height |
| Dashboard H1 | `24px`, `700`, approximately `1.25` line height |
| Modal title / H2 | `18px`, `700`, approximately `1.3` line height |
| Card/section title | `15px`, `600`, approximately `1.35` line height |
| Body/table text | `13px`, `400`, approximately `1.45` line height |
| Caption/meta | `12px`, `500`, approximately `1.4` line height |
| Badge/micro-label | `11px`, `600` |

Do not use viewport-scaled display type in compact panels. Responsive overrides may reduce size while preserving the hierarchy.

---

## 6. Geometry and Layout

Reference canvas and shell:

- Reference canvas: `1180 × 820px` tablet landscape composition, approximately `4:3`.
- Sidebar: `240px` fixed reference width on desktop.
- Header: approximately `70px` high.
- Outer content gutters: `56px` on the reference canvas, with `24px` compact/tablet padding where space is constrained.
- Card/section gaps: `14–16px`.
- Use CSS Grid/Flexbox with `minmax(0, 1fr)` tracks; never use absolute positioning to place page content.

Responsive behavior:

- Desktop: persistent sidebar and multi-column content where each track remains readable.
- Tablet: collapsible sidebar and reflowing grids; the `1180 × 820px` canvas is a reference, not a minimum runtime viewport.
- Mobile: drawer sidebar, single-column content, readable controls, and vertical scrolling without horizontal page overflow.

## 7. Cards and Surfaces

Cards should use a white surface, `#EBEBEB` border, subtle shadow, and consistent padding. Reference geometry:

- Primary cards: `16px` radius.
- Secondary menu/modal surfaces: `12px` radius.
- Small controls: `4px` radius where shown.
- Inputs and dropdowns: `8px` radius.
- Pills and primary buttons: `24px` radius.
- Reference card padding: `16–20px`.
- Cards group related information; they do not decorate empty space or nest unnecessarily.

---

## 8. Buttons

### Primary

Use primary pink `#FF77D1` with dark readable text or an approved contrasting treatment.

### Secondary

Use white/light neutral with border.

### Accent

Use accent pink or secondary teal for supporting actions. AI Weekly Summary may use the pink identity without changing its role-based access.

### Danger

Use the supplied danger tokens for destructive actions, with confirmation for irreversible operations.

Buttons must communicate their action clearly.

Avoid fake buttons that do nothing.

---

## 9. Inputs and Forms

Use consistent:

- Label
- Input
- Helper text
- Error text
- Focus state
- Disabled state

Forms should be readable and not excessively dense.

Reference controls are approximately `44px` high with an `8px` radius, subtle divider border, and a visible focus ring using the pink or teal accent.

---

## 10. Tables

Tables must:

- Have clear headers
- Use readable row spacing
- Use consistent alignment
- Provide empty states
- Provide loading states where needed
- Provide horizontal handling on small screens
- Avoid overflowing the entire viewport

Do not create unreadable mobile tables.

---

## 11. Status Indicators

Inventory statuses:

### Normal

Neutral/positive treatment.

### Low Stock

Warning treatment.

### Out of Stock

Danger treatment.

Status should be understandable without relying on color alone.

Use labels/icons where appropriate.

---

## 12. Navigation

Sidebar navigation should:

- Use Lucide icons
- Have clear labels
- Show active route
- Support responsive drawer behavior
- Be role-aware
- Avoid showing inaccessible Owner features to Staff

The selected branch should be visible in the topbar.

---

## 13. Icons

Use:

```text
lucide-react
```

Do not mix multiple icon libraries.

Icons should support the label, not replace essential text when meaning would be ambiguous.

---

## 13. Modals

Use modals for:

- Delete confirmation
- Deactivation confirmation
- Reconciliation confirmation
- Other important destructive/confirmation actions

Avoid modal overload.

---

## 14. Feedback Components

Use reusable patterns for:

- Toast
- Success message
- Error message
- Empty state
- Loading state
- Error state
- Confirmation state

---

## 15. POS Design

POS is an operational screen.

Prioritize:

- Speed
- Large readable controls
- Search
- Category access
- Clear item availability
- Cart visibility
- Quantity control
- Payment information entry
- Clear completion action
- Receipt result

POS must remain usable on tablet/mobile.

---

## 16. Dashboard Design

Dashboards should emphasize operational decisions.

Useful areas include:

- Sales overview
- Inventory status
- Low-stock alerts
- Out-of-stock alerts
- Recent sales
- Reconciliation information
- Report shortcuts

Do not fill the dashboard with decorative charts that do not support project requirements.

---

## 17. Reports

Reports should prioritize:

- Clear filters
- Date range
- Branch context
- Summary values
- Tables/charts where useful
- Readability
- Export/print only if approved

AI Weekly Reports should be visually distinguishable but still consistent with the main system.

---

## 18. Accessibility

Controls should have:

- Visible focus
- Useful labels
- Appropriate contrast
- Keyboard accessibility
- aria labels where needed

Do not communicate critical information through color alone.

---

## 19. Figma/Design Reference Rule

The final Figma/design files are not yet complete.

When a new approved Figma/screenshot is supplied:

1. Study it first.
2. Preserve approved brand colors.
3. Match spacing.
4. Match typography.
5. Match cards.
6. Match buttons.
7. Match sidebar/topbar patterns.
8. Reuse established patterns across other screens.
9. Do not blindly copy a pattern where it damages usability.
