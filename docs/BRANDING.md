# Branding & design tokens

## Brand

**ExchangeX** — the name is one word, capital E, capital X. Not "Exchange X", not "ExchangeX Platform".

The accent is a saturated blue. The logomark is a stylized **X**; the wordmark sets
`EXCHANGE` in a wide technical face with the X mark as the final glyph.

## Assets

All brand art lives at the root of `public/`.

| File | Content | Use on |
|---|---|---|
| `logomark_xchange_bl.png` | X mark, blue `#0000ff` | any background |
| `logomark_xchange_b.png` | X mark, black | light backgrounds |
| `logomark_xchange_bw.png` | X mark, white | dark backgrounds |
| `wordmark_xchange_blb.png` | Blue X + black text | light backgrounds |
| `wordmark_xchange_blw.png` | Blue X + white text | dark backgrounds |
| `wordmark_xchange_b.png` | All black | monochrome / print |
| `wordmark_xchange_l.png` | All white | monochrome on dark |

Suffix convention: `b` = black, `l` / `bw` = light/white, `bl` = blue, `blb` = blue+black,
`blw` = blue+white.

The logomark source is **1750×1181** — content aspect roughly 1.48:1, wider than tall. For
square icon slots, fit it centered with padding rather than stretching; better still, use a
purpose-drawn square master.

### Runtime logo resolution

`src/components/vector/Logo.tsx` and `LogoText.tsx` read `settings.logo` / `settings.logoDark`
and `settings.fullLogo` / `settings.fullLogoDark` from the dashboard store (configurable at
Admin → Settings → Logo). When unset they fall back to the brand defaults above, choosing the
light or dark variant from `isDark`.

---

## Design tokens

Tailwind 4. The palette is CSS custom properties in a `@theme` block in
`src/styles/globals.css`. Any `--color-*` entry there automatically produces the matching
utilities: `--color-primary-500` gives you `text-primary-500`, `bg-primary-500`,
`border-primary-500`, `from-primary-500`, and so on, including opacity modifiers
(`bg-primary-500/8`).

### Primary — ExchangeX blue

| Token | Hex |
|---|---|
| `--color-primary-50` | `#edf0ff` |
| `--color-primary-100` | `#dbe1ff` |
| `--color-primary-200` | `#bcc7ff` |
| `--color-primary-300` | `#93a4ff` |
| `--color-primary-400` | `#6b7bff` |
| **`--color-primary-500`** | **`#3b4dff`** ← default UI accent |
| `--color-primary-600` | `#1f2fff` |
| **`--color-primary-700`** | **`#0000ff`** ← exact brand blue |
| `--color-primary-800` | `#0000cc` |
| `--color-primary-900` | `#000099` |

`primary-700` is the literal logo blue. It is deliberately *not* the default UI step: pure
`#0000ff` has poor contrast on the near-black background and vibrates in large fills. Use
`primary-500` for interactive surfaces and reserve `primary-700` for accents and hover-darken.

### Muted — near-black neutral ramp

`--color-muted-50` `#ffffff` → `--color-muted-1000` `#000000`, with extra half-steps at
`150`, `850`. The high end is genuinely black, so surfaces sit on `muted-950`/`muted-1000`
and text on `muted-100`/`muted-200`.

### Trading colors

Defined in `tailwind.config.js`:

| Class | Hex | Meaning |
|---|---|---|
| `long` | `#3df57b` | bids, buys, gains |
| `long-dark` | `#44c64d` | hover |
| `short` | `#ea435c` | asks, sells, losses |
| `short-dark` | `#c72525` | hover |
| `long-short-button` | `#3b4dff` | neutral market action |
| `long-short-button-hover` | `#1f2fff` | hover |

### Semantic layer

`src/styles/modern-trading.css` defines HSL triples consumed by `tailwind.config.js` as
`hsl(var(--x))`: `--background`, `--foreground`, `--card`, `--popover`, `--primary`,
`--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`,
plus `--radius: 0.75rem`.

These give you `bg-card`, `text-muted-foreground`, `border-border`, `rounded-lg`.
`--primary` is `234 100% 62%` — the HSL form of `#3b4dff`.

Also there: component shorthands `.modern-card`, `.btn-long`, `.btn-short`, `.btn-market`,
`.orderbook-row`.

---

## Rules

**Use tokens, never hex.** `text-primary-500`, not `text-[#3b4dff]`. Hardcoded values do not
follow theme changes and are how the landing page ended up off-brand once already.

**Keep semantic red and green semantic.** `short` / `red-*` means "price down" or
"destructive". Do not use them decoratively — a red flourish next to a falling ticker reads
as data.

**Both modes.** Every surface must work in light and dark. Check `isDark` handling in
components that pick assets.

**Brand text in images.** Screenshots under `public/img/home/` have brand text baked into the
pixels. A text search will not find it. Open them when auditing brand assets.

---

