# Claude Code Developer Constitution: Wobbly Knight

## 1. Non-Negotiable Coding Rules

### Rule 1: Zero Comments in Code (Strictly Enforced)
- Do NOT write any comments in code (`//`, `/* */`, `#`).
- Self-documenting code only: descriptive function, type, variable, and interface names.
- Zero exceptions.

### Rule 2: Strict English Only
- All code, types, file names, commit messages, CSS classes, UI translation keys, and logs must be in English only.

### Rule 3: Mandatory i18n from Day 1
- Never hardcode raw strings in DOM elements, Canvas/WebGL overlays, or HTML.
- All player-facing text must use `t('key')` backed by `src/i18n/en.ts`.

### Rule 4: 250-Line File Limit & Modularity
- No single file may exceed 200–250 lines. Split aggressively:
  - `core/`: Clocks, event buses, math vectors, types.
  - `physics/`: Wobbly constraints, verlet/spring joints, collision solver.
  - `entities/`: Player knight, enemies, flail/weapon, pickups.
  - `render/`: Three.js scene, isometric camera, lighting, procedural meshes.
  - `ui/`: HUD, upgrade cards modal, game over screen.
  - `i18n/`: Localization registry and English dictionary.

### Rule 5: Web Portal Relative Path Compliance
- Always use relative paths (`./`) for assets and imports.
- Never use root-absolute paths (`/assets/...`) which break in iframe CDNs (CrazyGames, itch.io).

### Rule 6: Primitive Automation Scripts
- Batch files (`.bat`) must contain ONLY primitive one-line execution commands (`@echo off`, `npm run dev`).
- Never put comments (`REM`, `::`), non-ASCII characters, or multiline blocks in batch files.

---

## 2. Technical Stack
- Language: TypeScript 5.x (Strict mode)
- Bundler: Vite (configured with `base: './'`)
- Graphics: Three.js (WebGL renderer, Top-Down Isometric Orthographic / Tilted Camera)
- Audio: Web Audio API (procedural oscillators and noise buffers)
