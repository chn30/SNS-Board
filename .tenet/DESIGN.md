# Design System

## Chosen Direction
- Selected mockup: `.tenet/visuals/2026-04-16-05-mockup-glassmorphism-neon.html`
- Design rationale: Glassmorphism + neon accents. 도파민 자극적인 화려한 비주얼. 반투명 글래스 효과와 네온 그라데이션으로 현대적 느낌.

## Visual Principles
- Color palette:
  - Background: `#05050a` (deep black)
  - Surface: `rgba(255,255,255,0.03)` (glass panels)
  - Border: `rgba(255,255,255,0.06)` (subtle glass edges)
  - Primary: `#8b5cf6` (purple) → `#ec4899` (pink) gradient
  - Accent: `#a78bfa` (light purple)
  - Text primary: `#e2e8f0`
  - Text secondary: `#8892b0`
  - Text muted: `#64748b`
  - Error/Hot: `#f87171` with glow animation
  - Success: `#34d399`
  - Warning: `#fbbf24`
  - Category colors:
    - 자유: purple `rgba(139,92,246,0.15)` / `#a78bfa`
    - 질문: yellow `rgba(251,191,36,0.15)` / `#fbbf24`
    - 정보: green `rgba(52,211,153,0.15)` / `#34d399`
- Typography:
  - Font: Inter, system-ui, sans-serif
  - Title: 26px / 900 weight
  - Post title: 16px / 700 weight
  - Body: 14px / 400 weight / line-height 1.6
  - Small: 11-12px
- Spacing: 4px base scale (4, 8, 12, 16, 20, 24, 28, 32)
- Border radius: 8px (small), 12px (medium), 14px (buttons/avatars), 16px (cards)

## Component Patterns
- Buttons: Glass background `rgba(255,255,255,0.03)` with hover `rgba(139,92,246,0.1)`. Primary: gradient purple→pink with glow shadow
- Forms: Dark glass background, subtle border, focus ring purple glow
- Cards: Glass `rgba(255,255,255,0.03)`, `1px solid rgba(255,255,255,0.06)`, hover lifts with purple border glow
- Navigation: 4-column layout — icon bar (72px) + left panel (280px) + main feed (flex) + right sidebar (340px)
- Avatar: 44px rounded-rect (14px radius), gradient backgrounds per-post (rotating 4 colors)
- HOT badge: Glow animation, `#f87171` with pulsing box-shadow

## Layout
- Grid system: 4-column CSS grid (`72px 280px 1fr 340px`)
- Responsive:
  - < 1200px: collapse left panel → 3 columns
  - < 900px: single column (main only)
- Sticky headers with backdrop-filter blur
- Infinite scroll for feed

## Animation
- Card hover: translateY(-1px) + box-shadow
- HOT badge: 2s infinite glow keyframes
- Button hover: background color transition 0.2s
- Write button: translateY(-1px) + increased shadow on hover
