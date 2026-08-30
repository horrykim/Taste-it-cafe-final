# Taste It System --- UI/UX Design System

## 1. Design Goal

The interface should feel modern, clean, practical, and appropriate for
a cafe management system.

It should prioritize:

-   clarity;
-   fast operational use;
-   consistent spacing;
-   readable data;
-   predictable forms/modals;
-   responsive layouts.

## 2. Brand

The client brand direction is blue and pink.

Final hex values are not yet available.

Therefore brand colors must be centralized in CSS custom
properties/design tokens.

Changing a brand hex value should require changing the token rather than
searching individual components.

## 3. Color Tokens

The implementation should provide semantic tokens such as:

-   primary
-   accent
-   page background
-   surface
-   border
-   text
-   muted text
-   success
-   warning
-   danger

Exact values are provisional until the client provides final colors.

## 4. No Gradients

**Gradients are prohibited.**

Do not use:

-   linear gradients;
-   radial gradients;
-   conic gradients;
-   decorative gradient backgrounds;
-   gradient buttons.

Use solid colors, borders, shadows, spacing, and typography to create
hierarchy.

## 5. Typography

The existing project design direction uses Poppins. It may remain the
primary UI font unless the final client/design decision changes it.

Typography must prioritize readability over decoration.

## 6. Layout

Use:

-   consistent page containers;
-   clear section hierarchy;
-   responsive grids;
-   compact but comfortable controls;
-   appropriate whitespace.

## 7. Cards

Cards should be used when they clarify grouping.

Avoid excessive card nesting and visual clutter.

## 8. Tables

Tables should be used for dense operational data such as:

-   inventory;
-   staff;
-   sales;
-   reconciliation history.

Provide clear headings and status treatment.

## 9. Forms

Forms should:

-   clearly identify required fields;
-   validate input;
-   preserve entered values when validation fails;
-   show useful errors;
-   avoid unnecessary fields.

## 10. Modals

Use modals for focused actions such as:

-   add/edit forms;
-   confirmation of destructive/irreversible actions;
-   contextual details.

Do not use modals for entire workflows that would be clearer as
dedicated pages.

## 11. Status

Use text/icon/status treatments that do not depend on color alone.

Examples:

-   Active
-   Inactive
-   Low Stock
-   Completed
-   Pending

## 12. Assets

Placeholder assets are acceptable during development.

Do not hard-code temporary client branding into many components.

## 13. Accessibility

The interface should maintain:

-   keyboard accessibility;
-   visible focus states;
-   appropriate labels;
-   sufficient contrast;
-   meaningful button text;
-   accessible modal behavior.
