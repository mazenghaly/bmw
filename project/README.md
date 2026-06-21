# BMW E90 Diagnostic Platform — Portfolio Site

Single streaming page: **`E90 Diagnostic Platform.dc.html`**. Dark, photography-led, mobile-first. Built so dropping in real photos and project values requires **no layout changes** — just find-and-replace.

---

## A. Text tokens to replace

Find-and-replace these literal strings across the `.dc.html` file:

| Token | Where it appears | Example |
|---|---|---|
| `[[PROJECT_TITLE]]` | Hero headline, footer | "E90 Alignment Bench" |
| `[[PROJECT_TAGLINE]]` | Hero sub-line | "A salvaged BMW E90 front-cut, rebuilt into a laboratory-grade wheel-alignment diagnostic platform" |
| `[[YEAR]]` | Hero label, team block, footer | "2025" |
| `[[UNIVERSITY]]` | Hero, team, footer | |
| `[[DEPARTMENT]]` | Team block | Faculty / department line |
| `[[TEAM_LINE]]` | Hero meta line | short "4 members" or lead names |
| `[[SUPERVISOR]]` | Team block | name + title |
| `[[MEMBER_1..4_NAME]]` / `[[MEMBER_1..4_ROLE]]` | Team list | role = mechanical / electronics & CAN / software / CAD |

> RTL note: markup is structured for a future Arabic `dir="rtl"` variant; not implemented yet (English only, per brief).

---

## B. Photos to capture

Every slot is a dark placeholder at the correct aspect ratio with a mono caption naming the file. Replace the placeholder `<div role="img" …>` block with an `<img>` of the matching filename. Hero stays eager-loaded; **all others get `loading="lazy"`** and explicit `width`/`height`.

| Filename | Aspect | Content |
|---|---|---|
| `images/hero-after.jpg` | 16:9+ | Finished restored car — cinematic 3/4 front, low angle (strongest "after") |
| `images/before-frontcut.jpg` | 16:9 | Damaged/scrap front-cut as received (slider left) |
| `images/after-frontcut.jpg` | 16:9 | Same angle, fully restored (slider right) |
| `images/suspension-steering.jpg` | 4:3 | Stripped/cleaned suspension, steering rack, brakes |
| `images/dashboard-before.jpg` | 3:2 | Cracked, sun-damaged dash |
| `images/dashboard-after.jpg` | 3:2 | Rebuilt dash, clean |
| `images/solidworks-cad.jpg` | 16:10 | CAD model / mechanical drawing screenshot |
| `images/sensor-mounts.jpg` | 16:10 | 3D-printed PLA sensor mounts on the car |
| `images/wiring-harness.jpg` | 4:3 | ~50 m harness routed/mounted |
| `images/cluster-lit.jpg` | 21:9 | BMW instrument cluster powered + illuminated |
| `images/screen-integrated.jpg` | 16:10 | Display bonded into the air vent, live data |
| `images/university-logo` / `images/dept-logo` | 3:2 | Logos (team block) |

---

## C. Design system

- **Palette** (CSS vars in the helmet `:root`): bg `#0E0F11`, surface `#16181B`, text `#ECECEA`, muted `#8A8F98`, hairline `#2A2D31`, **accent `#3A6EA5`** (single BMW-ish blue).
- **Type:** Archivo / Archivo Expanded (display + body), JetBrains Mono (indices, labels, spec figures — tabular).
- **Motion:** scroll reveals, hero parallax, draggable before/after slider, top scroll-progress bar. All disabled under `prefers-reduced-motion`.
- **Tweaks** (in the editor panel): `accent` (blue / brass / steel), `grain` on/off, `motion` on/off.

## D. Deploy
It's a self-contained page — open it directly or export to a standalone HTML file for drag-and-drop hosting. Fonts load from Google Fonts with `display=swap`; self-host into `/fonts/` later if you want zero external requests.
