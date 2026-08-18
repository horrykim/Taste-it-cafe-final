# Taste It — UI Design System

## 1. Brand

Primary Teal:

```text
#7CE1DB
```

Primary Purple:

```text
#D17FB2
```

Primary surface:

```text
White
```

General background:

Light/white application background.

Text:

Dark/black for readable contrast.

Accent color:

Not finalized beyond the two approved brand colors.

Do not introduce a new dominant brand color without approval.

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

Use teal and purple consistently but not everywhere.

Recommended:

- Teal: primary actions, selected navigation, positive brand emphasis
- Purple: secondary accent, AI/report identity, selected supporting UI
- White: primary surface
- Neutral dark: text
- Neutral borders: structure
- Red/orange/etc.: semantic warning/danger states

Do not use teal or purple to represent every status.

---

## 5. Typography

Use a clean sans-serif system.

Prioritize:

- Clear hierarchy
- Strong page titles
- Readable labels
- Compact metadata
- Consistent heading levels
- Comfortable line height

Avoid excessive font-size variation.

---

## 6. Cards

Cards should generally use:

- White background
- Rounded corners
- Subtle border
- Optional soft shadow
- Consistent padding

Cards should group related information rather than decorate empty space.

---

## 7. Buttons

### Primary

Use Taste It teal.

### Secondary

Use white/light neutral with border.

### Accent

Use purple for supporting/AI-related actions when appropriate.

### Danger

Use semantic red for destructive actions.

Buttons must communicate their action clearly.

Avoid fake buttons that do nothing.

---

## 8. Inputs and Forms

Use consistent:

- Label
- Input
- Helper text
- Error text
- Focus state
- Disabled state

Forms should be readable and not excessively dense.

---

## 9. Tables

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

## 10. Status Indicators

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

## 11. Navigation

Sidebar navigation should:

- Use Lucide icons
- Have clear labels
- Show active route
- Support responsive drawer behavior
- Be role-aware
- Avoid showing inaccessible Owner features to Staff

The selected branch should be visible in the topbar.

---

## 12. Icons

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
