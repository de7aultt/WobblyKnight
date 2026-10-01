# Wobbly Knight: Production Roadmap

> **Core Loop:** WASD / Mouse to move -> Knight wobbles with spring physics -> Centrifugal momentum swings morning star / flail -> Smash wobbly goblins -> Collect Ale Mugs -> Pick 1 of 3 Roguelite Perks -> Face the Giant Butcher Boss.
> **Format:** Top-Down Isometric 3D (Three.js WebGL, tilted camera, low-poly tavern arena).

---

## Mainline Milestones

### [x] Sprint 1: Three.js Isometric Arena & Engine Skeleton
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Initialize Three.js scene, WebGLRenderer, and tilted Isometric Camera (Orthographic or low-FOV perspective).
  - Procedural 3D Tavern Pit arena: wooden plank floor, stone boundary railing, flickering corner torch point lights.
  - Setup core clock, event bus, and `src/i18n/` localization registry with `en.ts`.
  - Simple title overlay with "Start Brawl" button unlocking Web Audio context.
- **Verification:** Scene renders smoothly at 60 FPS, window resize handler maintains aspect ratio, compile check passes.

---

### [x] Sprint 2: Wobbly Ragdoll Knight & Flail Physics
- **Recommended Model:** `Claude 3.5 / 3.7 Opus`
- **Scope:**
  - Build modular 3D knight mesh using Three.js geometric primitives (chunky iron helmet with visor, rounded shoulder pads, torso, boots).
  - Implement wobbly physics controller: knight tilts and leans toward movement direction with spring damping.
  - Implement Flail / Morning Star physics: handle attached to knight, 3-link chain with spring constraints, heavy spiked ball at the end.
  - Rotating the knight or moving creates authentic centrifugal momentum and velocity-based hitboxes.
- **Verification:** Moving and spinning swings the spiked ball naturally with inertia; knight wobbles hilariously without tipping over.

---

### [x] Sprint 3: Enemy Mob Swarms & Impact Impulse
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Procedural enemy types: Wobbly Green Goblins (fast, low HP) and Drunken Peasant Brigands (slow, medium HP).
  - Simple swarm pathfinding toward the knight.
  - Physics collision detection between spiked ball and enemies.
  - When struck with sufficient velocity, enemies receive a violent ragdoll impulse, flying backwards and crashing into walls/barrels.
  - Defeated enemies pop into spinning golden Ale Mugs (XP pickups).
- **Verification:** Hitting mobs sends them flying with weight-based impulse; hitting them at low speed causes minor stagger.

---

### [x] Sprint 4: Ale Mug Drops & 3-Card Roguelite Level Up
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Knight magnetic pickup radius for Ale Mugs.
  - XP progress bar in HUD.
  - Level Up event triggers a clean DOM modal pausing the simulation and presenting **3 randomized perk cards**:
    - *Longer Chain:* +40% flail reach.
    - *Heavy Spikes:* +50% impact damage and larger knockback.
    - *Double Morningstar:* Spawns a second flail on the other hand.
    - *Drunken Dash:* Spacebar gives an explosive forward tumble.
    - *Spike Boots:* Stepping on enemies deals kick damage.
    - *Ale Magnet:* +100% pickup range.
  - All card titles and descriptions use `t('perk.key')` localization.
- **Verification:** Picking a perk instantly updates knight physics/stats and resumes action seamlessly.

---

### [ ] Sprint 5: Boss Wave & Procedural Sound FX
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Wave 5 Boss: **The Giant Butcher Boss** (huge size, heavy cleaver, telegraphs a telegraphed belly charge).
  - Web Audio synthesis module:
    - Whoosh sound scaling with flail angular velocity.
    - Punchy metallic crunch on enemy impact.
    - Cheerful gulp/chime on Ale Mug collection.
    - Low-rumble tavern background drone and crowd cheers.
- **Verification:** Boss fight feels intense and readable; audio plays cleanly without clipping.

---

### [ ] Sprint 6: Monetization Slots & Game Over Loop
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Knight health system with chunky heart icons in HUD.
  - Knockout state: knight collapses in ragdoll ragdoll tumble.
  - Game Over modal with two commercial ad slots:
    - **Rewarded Ad Hook 1:** *"Revive with Full Health & Shockwave"* (mocks 3-sec timer or CrazyGames SDK call, then clears nearby enemies).
    - **Rewarded Ad Hook 2:** *"Double Collected Ale"* for meta-upgrades.
    - **Midroll Ad Hook:** Triggered every 2nd completed run before restarting.
  - Persistent high-score (longest survival time and enemies smashed) saved in LocalStorage.
- **Verification:** Full loop from Death -> Revive/Restart operates cleanly without memory leaks.

---

### [ ] Sprint 7: Release Packaging & Web Portal Polish
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Native zero-dependency Node packager `scripts/pack.mjs` generating `wobbly-knight-web.zip` with `index.html` at root.
  - Vite `base: './'` build audit.
  - CrazyGames SDK v3 detection wrapper (falls back gracefully if running offline or on itch.io).
  - Performance audit: constant 60 FPS with 50+ active enemies on screen.
- **Verification:** Output zip unzips and runs locally without 404s, passes all build checks.

---

## Ad-Hoc / Quality-of-Life (QOL) Tasks
*(Critical bug fixes and balance tweaks take absolute priority over mainline milestones)*

### [x] QOL 1: Pure WASD Arcade Controls & Chain Dead-Zone Fix
- **Recommended Model:** `Claude 3.5 / 3.7 Sonnet`
- **Scope:**
  - Switch to pure WASD / Arrow keys control: knight smoothly rotates toward movement vector with angular inertia (no mouse required). Spinning W-D-S-A whips flail into orbit.
  - Fix close-combat dead zone: intermediate chain links also check hitboxes/damage, and knight body pushes enemies away with a radial shove.
- **Verification:** WASD controls feel natural and responsive without mouse; enemies cannot hug the knight or get stuck inside the dead zone.

---

### [x] QOL 2: Acquired Perks Tray in HUD
- **Recommended Model:** `Claude 3.5 / 3.7 Sonnet`
- **Scope:**
  - Add a stylized bottom tray / dock in the HUD displaying all currently acquired perks as compact badge slots.
  - Each badge shows the perk icon and a level counter (e.g., I, II, III).
  - Automatically updates whenever a new perk is selected from the Level Up modal.
- **Verification:** Picking perks in the modal immediately populates/increments badges in the bottom tray cleanly.

---

### [x] QOL 3: Drunken Dash Whirlwind & Ground-Clipping Fix
- **Recommended Model:** `Claude 3.5 / 3.7 Sonnet`
- **Scope:**
  - Fix ground clipping during Spacebar dash: elevate knight with a parabolic jump arc (y > 0) so the mesh stays above the tavern floor.
  - Turn dash into a powerful Whirlwind / Cyclone strike: knight rapidly spins (yaw) during the dash, whipping the flail(s) into a full 360° orbit with high centrifugal velocity.
  - Dash collision: crashing into enemies during dash deals heavy knockback and damage.
  - Enable pointer-events: auto on perk tray slots so hovering shows the tooltip.
- **Verification:** Spacebar dash leaps cleanly above the floor, spins the flail in a devastating 360° sweep, and clears enemies out of the path.

---

### [ ] QOL 4: Dash Cooldown Visual & 5-Second Timer
- **Recommended Model:** `Claude 3.5 / 3.7 Sonnet`
- **Scope:**
  - Increase Drunken Dash cooldown to 5 seconds.
  - Add visual cooldown swipe/fill overlay on the Dash perk slot in the bottom HUD tray (filling/draining vertically from bottom to top).
  - Quick green flash animation on the slot when the cooldown finishes and the dash is ready again.
- **Verification:** Using dash triggers a smooth 5-second swipe overlay on its HUD slot, followed by a crisp green ready flash.
