# AutoApply — Design Requirements Document (DRD)
### Frontend Visual & Component Specification
**Version 1.0 · Companion to the AutoApply PRD/TDD**

---

## 1. Design Tokens

### 1.1 Color

| Role | Token | Value | Usage in AutoApply |
|---|---|---|---|
| Primary text | `--color-ink` | `#1b1b1b` | Headings, primary body text, primary button fill |
| Surface (elevated) | `--color-marble` | `#ffffff` | Cards, modals, nav bar, table rows |
| Canvas | `--color-drafting-gray` | `#eaeaea` | App background behind cards |
| Secondary text | `--color-steel` | `#60646c` | Subtext, helper copy, table secondary columns |
| Tertiary text | `--color-ash` | `#7c7c7c` | Timestamps, metadata, disabled states |
| Border | `--color-hairline` | `#e0e1e6` | All 1px borders/dividers |
| Signal gradient | `--color-signal-gradient` | `linear-gradient(89.97deg, #19a05f 0%, #0d7f8c 100%)` | Reserved solely for top-level alert/status bar |
| Shadow | `--shadow-lg` | `rgba(0,0,0,0.15) 0px 4px 20px 0px` | Primary buttons, elevated preview/modal panels only |

### 1.2 Semantic Hues
- Success: `#19a05f`
- In-progress / Queued: `#00b9f1`
- Needs attention / manual action: `#f5a623` (amber)
- Rejected / error: `#d64545` (red)
- AI confidence: `#00f2e6` (mint)

---

## 2. Typography & Layout
- Font: Inter
- Hairline borders (1px solid `#e0e1e6`)
- Radii: 6px (buttons), 12px (panels/inputs), 20px (cards), 40px (pills)
