---
name: Executive Command
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#c0c8c5'
  on-secondary: '#2a3230'
  secondary-container: '#434b49'
  on-secondary-container: '#b2bab7'
  tertiary: '#ffceca'
  on-tertiary: '#68000a'
  tertiary-container: '#ffa7a0'
  on-tertiary-container: '#9e0016'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#dce4e1'
  secondary-fixed-dim: '#c0c8c5'
  on-secondary-fixed: '#151d1b'
  on-secondary-fixed-variant: '#404846'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
---

## Brand & Style
The design system is engineered for high-stakes enterprise communication, evoking the precision and authority of a modern command center. The aesthetic is rooted in **Professional Minimalism** with a **High-Density Fintech** influence. It prioritizes information density and operational clarity over decorative flourishes.

The interface should feel like a high-performance instrument: reliable, serious, and meticulously structured. Every element serves a functional purpose, utilizing an architectural layout that conveys stability and technical excellence. The target audience includes C-suite executives and technical teams who require a "zero-latency" visual feel—clean, sharp, and decisively professional.

## Colors
The palette is optimized for long-duration focus and visual hierarchy in low-light environments. 

- **Primary (Digital Teal):** Used exclusively for active states, primary actions, and connectivity indicators. It represents "system live" status.
- **Backgrounds (Obsidian & Slate):** The base layer uses Obsidian (#020617) for the deepest UI levels (e.g., video stage), while Deep Slate (#0F172A) is used for sidebars and control panels to create subtle depth.
- **Surface Bright:** A technical grey (#333B39) reserved for 1px borders and structural dividers to maintain a high-fidelity, architectural feel.
- **Alert Red:** Reserved strictly for critical terminations, muting indicators, or system errors.

## Typography
This design system utilizes **Geist** exclusively to leverage its technical, developer-centric precision. 

The type scale is strictly architectural. Headings utilize a **Bold** weight with **tight negative letter-spacing** to create a sense of urgency and authority. Body text remains neutral and legible with standard tracking. Labels and metadata use uppercase styling with increased letter-spacing to mimic instrument gauges and professional data feeds, ensuring secondary information is distinct from primary narrative content.

## Layout & Spacing
The layout follows a precise **8px rhythmic grid**. All component dimensions, padding, and margins must be multiples of 8px to maintain a rigid, engineered structure.

- **Desktop:** Uses a fixed-width sidebar (320px) for participants/chat and a fluid main "Stage" for video feeds. 
- **Grid:** Video tiles follow a 12-column fluid grid system with 16px gutters.
- **Density:** High-density spacing is preferred in control panels (8px/16px) to maximize the "Command Center" utility, while the video stage uses 32px safe areas to allow the content to breathe.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Subtle Outlines** rather than traditional shadows. 

1.  **Level 0 (Stage):** Obsidian (#020617) - The base layer.
2.  **Level 1 (Panels):** Deep Slate (#0F172A) - Sidebars and drawers.
3.  **Level 2 (Modals/Overlays):** A slightly lighter tint of Slate with a 1px 'Surface Bright' border.

Avoid heavy shadows. Instead, use the 1px #333B39 border to define the geometry of elements. Active overlays may use a very subtle, low-opacity (10%) Digital Teal outer glow to signify focus without breaking the professional aesthetic.

## Shapes
To balance the technical "rigidity" with modern browser-based ergonomics, the design system employs a **Rounded-XL (12px)** standard for all primary surfaces, containers, and video tiles.

Small components like buttons and input fields follow the base `rounded-md` (8px) logic. The consistency of the 12px radius across large containers creates a cohesive, "custom-software" feel that distinguishes it from standard web-app frameworks.

## Components
- **Buttons:** Primary buttons are solid Digital Teal with black text. Secondary buttons use a ghost style with the Surface Bright border and white text. Termination buttons (End Call) are Alert Red.
- **Video Tiles:** 12px radius, 1px Surface Bright border. Participant names appear in the bottom-left using `label-md` on a 40% opacity black pill.
- **Control Bar:** A floating or anchored dock at the bottom. Icons are 20px, stroke-based (1.5px weight). Mute/Video-off states toggle to Alert Red backgrounds.
- **Input Fields:** Dark Obsidian backgrounds with 1px Surface Bright borders. On focus, the border transitions to Digital Teal.
- **Status Indicators:** Small 8px circles. Pulsing Digital Teal for "Live", solid Red for "Recording", and Grey for "Offline".
- **Lists:** High-density participant lists with 8px vertical padding between items, separated by 1px horizontal dividers in Surface Bright.