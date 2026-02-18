# CLAUDE.md — Financial Controller (FIN-CONTROL)

## Project Overview

**Financial Controller** (branded "Financial Vault") is a personal finance management SPA for Brazilian users. It lets authenticated users track income/expense sections, installment payments, savings goals, and dreams — with real-time Firebase cloud sync and local storage fallback.

- **Language**: Brazilian Portuguese (pt-BR) UI, BRL (R$) currency throughout
- **Live URL**: https://ai.studio/apps/drive/1e5eKzV1Cw23C0uZx-hPpw0yO0sm6UZed
- **Firebase project**: `financial-controller-joia`

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 (JSX transform) |
| Language | TypeScript ~5.8 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS (loaded via CDN in `index.html`) |
| Icons | `lucide-react` 0.475.0 |
| Auth | Firebase Auth (email/password) |
| Database | Firebase Firestore |
| Local cache | `localStorage` (per-user key) |

> **Important**: Tailwind is loaded from CDN (`<script src="https://cdn.tailwindcss.com">`), not as a PostCSS plugin. The custom theme (neon colors, shadows) is configured inside a `tailwind.config` script block in `index.html`. There is **no** `tailwind.config.js` file.

---

## Repository Structure

```
FIN-CONTROL/
├── index.html          # Entry HTML; Tailwind CDN + theme config + importmap for ESM deps
├── index.tsx           # React root render
├── App.tsx             # Root component: auth gate, global state, layout, routing between modules
├── types.ts            # All TypeScript interfaces and INITIAL_DATA constant
├── firebaseConfig.ts   # Firebase app, Firestore (db), Auth, GoogleAuthProvider singletons
├── firestore.rules     # Firestore security rules (owner-only access)
├── vite.config.ts      # Vite config (port 3000, @ alias, GEMINI_API_KEY env pass-through)
├── tsconfig.json       # TypeScript config (ES2022, bundler resolution, @/* path alias)
├── package.json        # npm scripts + dependencies
├── components/
│   ├── AuthScreen.tsx      # Login/register form (email + password)
│   ├── Dashboard.tsx       # Summary cards: balance, income total, expense total, donut chart
│   ├── Modules.tsx         # CustomSectionModule, DreamsModule, GoalsModule
│   └── ui/
│       └── UIComponents.tsx # Shared primitives: Card, Modal, CollapsibleCard, Button, Input,
│                            #   CurrencyInput, Select, Badge, DonutChart, DraggableModuleWrapper
└── services/
    └── dataService.ts      # loadData, saveToLocal, saveToCloud, subscribeToData, validateFinancialData
```

---

## Core Data Model (`types.ts`)

```typescript
FinancialData {
  customSections: CustomSection[]   // All income & expense groups
  creditCards:    CreditCard[]      // (defined in types, not yet used in UI)
  pixKeys:        PixKey[]          // (defined in types, not yet used in UI)
  radarItems:     RadarItem[]       // (defined in types, not yet used in UI)
  dreams:         DreamItem[]       // Dreams module items
  goals:          Goal[]            // Goals module items
  dreamsTotalBudget: number
  sectionsOrder?: string[]          // Ordered list of section IDs for drag-and-drop
  lastUpdate?:    number            // Unix ms timestamp, used for cloud vs local conflict resolution
}

CustomSection {
  id:        string
  title:     string
  items:     SectionItem[]
  type:      'income' | 'expense'
  structure: 'standard' | 'installment'
}

SectionItem {
  id:                  string
  name:                string
  value:               number
  paidAmount?:         number            // Amount already paid (reduces outstanding balance)
  date?:               string
  installmentsCount?:  number            // Total installment count
  currentInstallment?: number            // Current installment number
  startMonth?:         string            // Format: 'YYYY-MM'
  isActive?:           boolean           // false = excluded from balance calculation
}
```

**Special constant**: `NATIVE_WALLET_ID = "native-wallet-session"` — the built-in WALLET section. It is always present, always the first income section, and cannot be deleted or renamed.

---

## Data Flow & Sync Strategy

1. **On login**: `loadData(userId)` fetches both Firestore and localStorage, picks whichever has the higher `lastUpdate` timestamp, reconciles, and returns the winner.
2. **On update**: `handleUpdate()` in `App.tsx`:
   - Updates React state immediately (optimistic)
   - Calls `saveToLocal()` synchronously
   - Schedules `saveToCloud()` with a **2-second debounce** (or immediately if `immediate=true`)
3. **Real-time**: `subscribeToData()` sets up a Firestore `onSnapshot` listener. External changes are applied unless `isInternalUpdate.current` is true (prevents echo from own saves).
4. **Validation**: `validateFinancialData()` in `dataService.ts` sanitizes all data before any read/write to prevent schema corruption.

---

## Application Modules (Views)

`App.tsx` manages a single `activeModule` state (`'dashboard' | 'dreams' | 'goals'`) — there is no router. Navigation is handled by buttons in the nav bar (desktop) and `BottomMobileNav` (mobile).

| Module | Component | Description |
|---|---|---|
| Dashboard | `Dashboard` + `CustomSectionModule` (×N) | Main view with balance summary and income/expense sections |
| Dreams | `DreamsModule` | Wishlist items with values and a monthly budget tracker |
| Goals | `GoalsModule` | Progress-tracked savings goals with deadline and color |

---

## Component Conventions

### UI Primitives (`components/ui/UIComponents.tsx`)

- **`Button`**: variants = `primary` (neon-blue) | `secondary` (ghost-white) | `danger` (neon-red) | `ghost`
- **`Input`**: Auto-uppercases text unless `noUppercase={true}`. For `type="month"` or `type="date"`, clicking the wrapper triggers `showPicker()`.
- **`CurrencyInput`**: Formats values as Brazilian Real (R$). Takes `value: number` + `onValueChange: (val: number) => void`. Internally stores display string, parses via `parseBRL()`.
- **`CollapsibleCard`**: Can be controlled (via `isOpen`/`onToggle`) or uncontrolled (via `defaultOpen`). Supports inline title editing when `onEditTitle` prop is provided.
- **`Modal`**: Handles `Enter` (confirm) and `Escape` (close) keyboard shortcuts globally while open.
- **`DraggableModuleWrapper`**: Wraps entire section cards for inter-section drag-and-drop reordering using the HTML Drag and Drop API.
- **`DraggableRow`** (internal to `Modules.tsx`): Handles item-level drag-and-drop within a section. Implements auto-scroll near viewport edges.

### Styling Conventions

- **Color palette** (defined in `index.html` Tailwind config):
  - `neon-blue`: `#00f3ff` — primary actions, borders, focus rings
  - `neon-green`: `#0aff68` — income, positive values
  - `neon-red`: `#ff0055` — expenses, danger actions, negative balance
  - `neon-yellow`: `#ffe600` — balance display, installment badges
  - `neon-pink`: `#bc13fe` — Dreams module accent
  - `neon-dark`: `#0a0a12` — deepest background
  - `neon-surface`: `#13131f` — card/panel background
- All text labels and item names are **UPPERCASE** by convention.
- Font: `Outfit` from Google Fonts (loaded in `index.html`).
- Responsive breakpoints: mobile-first; `sm:` prefix for ≥640px. Mobile has bottom nav bar; desktop has floating controls bottom-left.

### Currency Formatting

Always format BRL values with:
```typescript
val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
```
Prefix with `R$` in display. The `fmt` helper is defined locally in each component that needs it.

### ID Generation

Item and section IDs are generated with:
```typescript
Math.random().toString(36).substr(2, 9)
```
No UUID library is used.

---

## Balance Calculation

Income sections: sum all `item.value` where `item.isActive !== false`.

Expense sections: sum all `(item.value - (item.paidAmount || 0))` where `item.isActive !== false`.

**Balance = Total Income − Total Outstanding Expenses**

The `calculateBalance()` function in `App.tsx` is the source of truth. `Dashboard.tsx` performs the same calculation locally for display.

---

## Authentication

- Firebase Auth with **email/password** only (no Google/OAuth).
- `onAuthStateChanged` listener in `App.tsx` manages `user` state.
- Unauthenticated users see `<AuthScreen />` (login/register toggle).
- Sign-out via `signOut(auth)` from the nav bar.

---

## Security Notes

- **Firestore rules** (`firestore.rules`): Users can only read/write their own document at `users/{userId}`. All other paths are denied.
- **Data validation**: Every read from Firestore or localStorage is passed through `validateFinancialData()` before use.
- **Dev tools protection** (basic, client-side only): `App.tsx` disables right-click context menu and keyboard shortcuts for F12/DevTools. This is a UX choice, not a security boundary.
- The `NATIVE_WALLET_ID` section is protected from deletion (`deleteSection` guards against it) and its title is always forced back to `"WALLET"` on save.

---

## Development Workflow

### Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

### Environment Variables

The app uses a `GEMINI_API_KEY` env var (passed through Vite's `define` in `vite.config.ts`), but no Gemini API functionality is currently implemented in the codebase. Firebase config is **hardcoded** in `firebaseConfig.ts`.

Create `.env.local` if needed:
```
GEMINI_API_KEY=your_key_here
```

### No Test Suite

There are no unit or integration tests. No linting configuration (ESLint/Prettier) is present.

### TypeScript

Strict mode is not enabled. `allowJs: true`. Path alias `@/` maps to the project root.

---

## Key Patterns & Gotchas

1. **`handleUpdate` signature**: `(newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate = false)`. Always pass the full `FinancialData` object, not partial updates — use spread to preserve other fields.

2. **`immediate` flag**: Most mutations should pass `immediate=true` to trigger instant cloud save. Omit (defaults `false`) only for high-frequency updates like currency input changes (they debounce 2s).

3. **Section order**: `data.sectionsOrder` holds section IDs in display order. Always update it alongside `customSections` when adding/removing/reordering sections.

4. **Wallet section**: Never delete or rename the `NATIVE_WALLET_ID` section. It receives "transfer" events via `window.dispatchEvent` from income sections. The event type is `'transfer-to-wallet'` with `{ targetItemId, amount }` detail.

5. **Tailwind via CDN**: Adding new Tailwind utilities works as normal. However, since there's no PostCSS build step, you cannot use `@apply` in separate CSS files. All styles must be inline class strings.

6. **CollapsibleCard title editing**: Only available when `onEditTitle` prop is passed. Clicking the pencil icon (desktop hover-only) enters edit mode. The WALLET section explicitly passes `undefined` for this prop to disable editing.

7. **`normalizeData`**: Called on every data load to ensure all required arrays exist and the WALLET section is always present. If modifying `FinancialData`, update `INITIAL_DATA` and `normalizeData` in `App.tsx` together.

8. **`isInternalUpdate` ref**: Prevents the Firestore `onSnapshot` listener from overwriting state during the 3-second window after a local update. Do not add async gaps between `setData` calls and the ref reset.

---

## Adding a New Feature — Checklist

- [ ] Add any new types/interfaces to `types.ts`
- [ ] Add default values for new fields in `INITIAL_DATA` (and in `normalizeData` in `App.tsx`)
- [ ] Update `validateFinancialData` in `dataService.ts` to handle the new fields
- [ ] Build UI components using existing primitives from `UIComponents.tsx`
- [ ] Use `handleUpdate(prev => ({ ...prev, newField: value }), true)` for mutations
- [ ] Ensure text labels follow the UPPERCASE convention
- [ ] Format all monetary values with `toLocaleString('pt-BR', ...)` and `R$` prefix
- [ ] Test on both mobile (bottom nav) and desktop (sidebar) layouts
