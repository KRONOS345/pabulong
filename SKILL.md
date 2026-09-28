---
name: "Pabulong UI/UX Design System"
description: "Strict UI/UX guidelines and design system contract for Pabulong based on shadcn/ui and preset b1FQi2wYi"
---

# Pabulong UI Implementation Contract

This file serves as the strict design system and UI implementation contract for the Pabulong platform. All UI development must adhere to these guidelines.

## 1. Core Component System
* **Primary System:** `shadcn/ui` is the sole component system.
* **Preset:** `b1FQi2wYi` (Style: Nova, Theme: Indigo, Base Color: Neutral, Radius: Default, Font: Inter, Icons: Lucide).
* **Strict Rule:** **Use shadcn/ui components wherever an equivalent exists.**
* **Prohibition:** Do **not** invent custom replacements for existing shadcn primitives (e.g., do not build a custom `<button>` or `<div role="dialog">` if `Button` or `Dialog` can be used). Tailwind utility classes are allowed for layout and composition only.

## 2. Global Styling & Tokens
* **Consistency:** Use theme tokens for all values. Avoid arbitrary Tailwind values like `bg-[#123456]` or `h-[42px]`.
* **Spacing:** Use standard Tailwind spacing scale (`p-4`, `gap-2`, `m-6`).
* **Typography:** Follow the hierarchy established by `Inter` and inherited headings. Avoid custom font families.
* **Radii & Borders:** Rely on the `radius` and `border` theme tokens (e.g., `rounded-md`, `border-border`). Do not scatter arbitrary `rounded-[10px]` values.
* **Shadows:** Use standard shadow tokens (e.g., `shadow-sm`, `shadow-md`) avoiding custom box-shadows.

## 3. UI Patterns & States
* **Accessibility:** All interactive elements must have focus states, accessible ARIA labels where necessary, and support keyboard navigation (Escape to close, Tab to navigate).
* **Loading States:** Every data-driven view must implement a consistent loading state using `Skeleton` components.
* **Empty States:** Collections with zero items must render a designed empty state (icon, message, CTA) rather than a blank container.
* **Error States:** Use `Alert` components or `Toast`/`Sonner` notifications for error feedback.
* **Responsive Behavior:** Ensure all views function correctly down to `390px` width. Avoid horizontal scrolling, clipped dialogs, and inaccessible menus. Use `Sheet`, `Drawer`, and `Popover` patterns for mobile.
* **Dark/Light Theme:** The application must support and respect the `dark` class utilizing the CSS variables set by the shadcn preset.

## 4. Shared Compositions
Instead of duplicating raw markup, compose shared UI patterns from shadcn primitives. Ensure they remain visually consistent with the preset:
- `PageHeader`, `SectionHeader`, `StatCard`
- `EmptyState`, `ErrorState`, `LoadingState`
- `ConfirmDialog`, `DataTable`, `SearchBar`

## 5. Clean Code Rules
* No duplicated custom components where shadcn already provides the primitive.
* No visually inconsistent buttons, cards, or inputs.
* No hard-coded styling that conflicts with the theme tokens.
* Maintain clean semantic HTML and avoid "div soup" where proper semantic tags apply.
