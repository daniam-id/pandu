# Design System

## Overview
A mobile application for tracking cycling activities and planning group trips. The target audience is active individuals who enjoy sports. The interface is clean, modern, and fresh, with green as the primary focus.

## Colors

### Light Mode
- **Background**: `#FFFFFF` — page background
- **Surface**: `#F9F9F9` — cards, panels, modals
- **Surface Offset**: `#E5E7EB` — nested surfaces, table rows, subtle separators
- **Border**: `#E5E7EB` — default border color
- **Primary**: `#085427` — CTAs, active states, key interactive elements
- **Primary Hover**: `#06401E`
- **Primary Highlight**: `#8CE363` — subtle tint for selected/active backgrounds, logos, and progress bars
- **Text Primary**: `#111827`
- **Text Muted**: `#6B7280`
- **Text Faint**: `#9CA3AF` — tertiary labels, timestamps
- **Text Inverse**: `#FFFFFF` — text on dark/colored backgrounds
- **Success**: `#8CE363`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`

### Dark Mode
- **Background**: `#121212` — page background
- **Surface**: `#1E1E1E` — cards, panels, modals
- **Surface Offset**: `#2D2D2D` — subtle separators
- **Border**: `#374151` — default border color
- **Primary**: `#8CE363` — CTAs, active states
- **Primary Hover**: `#71C64B`
- **Primary Highlight**: `#085427` — highlight background
- **Text Primary**: `#F9FAFB`
- **Text Muted**: `#9CA3AF`
- **Text Faint**: `#6B7280`
- **Text Inverse**: `#111827` — text on light backgrounds
- **Success**: `#8CE363`
- **Warning**: `#FBBF24`
- **Error**: `#F87171`

## Typography
- **Display font**: Inter — source: Google Fonts
  Import URL: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- **Body font**: Inter — source: Google Fonts
  Import URL: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- **Scale**:

  | Token | Size | Usage |
  |---|---|---|
  | hero | 32px | Main landing headlines only |
  | 2xl | 24px | Page-level display headings |
  | xl | 20px | Section headings / page titles |
  | lg | 18px | Subheadings, card titles |
  | base | 16px | Body copy — default |
  | sm | 14px | Buttons, nav labels, UI chrome |
  | xs | 12px | Badges, timestamps, distances |

- **Display font boundary**: only at xl (20px) and above
- **Body font boundary**: base and below

## Spacing & Layout
- **Base unit**: 8px
- **Section padding**: 16px to 24px
- **Card padding**: 16px
- **Content widths**: narrow 320px, default 360px, wide 400px (mobile scale)
- **Border radius**:
  - sm: 8px — inputs, small chips
  - md: 12px — buttons, form controls
  - lg: 20px — cards
  - xl: 32px — modals, large panels, bottom sheets
  - full: 9999px — pill badges, main buttons
- **Shadows**:
  - sm: `0 1px 2px 0 rgba(0,0,0,0.05)` — subtle card lift
  - md: `0 4px 6px -1px rgba(0,0,0,0.1)` — hover/floating state
  - lg: `0 10px 15px -3px rgba(0,0,0,0.1)` — modals, dropdowns
- **Grid / layout structure**: Single column for mobile with a bottom navigation bar.
- **Breakpoints**: mobile 320px, tablet 768px, desktop 1024px

## Components

### Button
- Primary: bg `#085427`, text `#FFFFFF`, radius `9999px`, padding `16px 24px`, hover: slightly darker.
- Secondary: border `#085427`, bg transparent, hover: very faint green background.
- Ghost: no border, accent text, hover: faint gray background.

### Card
- Background: `#FFFFFF` (or `#085427` for highlight cards)
- Border: `none`
- Radius: `20px`
- Shadow: Subtle (sm)
- Padding: `16px`

### Input / Form Control
- Background: `#F3F4F6` or dark green with transparency
- Border: `none`
- Radius: `12px`
- Focus ring: `2px solid #8CE363`, offset `2px`
- Placeholder text: `#9CA3AF`

### Navigation
- Background: `#FFFFFF`
- Sticky: Yes (Bottom bar)
- Border bottom: `none`
- Link color: `#6B7280`, active: `#085427`, hover: `#111827`

### Badge / Chip
- Shape: pill (radius-full)
- Background: Transparent with a light border, or light gray
- Text: `#111827` and size `xs` (12px)

### Divider
- Color: `#E5E7EB`
- Weight: 1px

## Do's and Don'ts

### Do
- Use dark green (`#085427`) as the primary color for important actions and buttons.
- Use light green (`#8CE363`) only for accents, highlights, or progress statuses.
- Apply large border radii to cards and modals for a friendly, approachable feel.
- Use generous white space between elements to improve readability.

### Don't
- Don't use other bright colors besides the defined light green to avoid visual clashing.
- Don't use heavy or dark shadows on cards.
- Don't use font sizes below 12px anywhere.
- Don't use sharp, square buttons; always use rounded corners.

---

## Extraction Notes
- **Colors**: Confident. Extracted from the dominant visual elements (dark green and accent green). Dark mode is inferred as the images only show light interfaces and solid green panel interfaces.
- **Fonts**: Estimated as Inter or SF Pro (standard modern mobile).
- **Spacing**: Estimated from standard mobile visual proportions (8px multiples).
- **Dark mode**: Inferred based on common design practices.
- **Uncertainties**: Hover/active states are not explicitly visible and are estimated based on standard patterns.