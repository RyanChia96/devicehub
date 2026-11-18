# DeviceHub frontend

Internal POS and back office for the phone shops. Vite + React 18 + TypeScript,
Tailwind CSS v4, shadcn-style components on Base UI, React Router, TanStack Query.
The folder layout follows the SRS frontend.

## Run it

```bash
npm install
cp .env.example .env   # first time only
npm run dev            # http://localhost:6010
```

Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format`.

## Where things live

| Folder | What goes there |
| --- | --- |
| `src/api/` | One file per backend area. Each function is the only place that knows the endpoint. They return sample data from `lib/demo-data.ts` until the backend exists (marked `TODO(backend)`). |
| `src/components/` | App-wide pieces: `AppShell` (sidebar, top bar, page), `AppSidebarNav`, `PageHeader` (title with breadcrumbs under it), `Snackbar`, `EmptyState`. |
| `src/components/ui/` | shadcn-style primitives (copied from SRS). Add more with `npx shadcn add <name>`. |
| `src/lib/` | Helpers and app state: API client, query keys, access rules, roles, branches and the branch switcher context, money formatting. |
| `src/pages/<module>/` | One component per route. |
| `src/routes/` | `registry.tsx` is the single list of pages: path, access rule, title, sidebar entry. Routes and the sidebar are both built from it. |
| `src/sections/<module>/` | Larger parts of a page. `sections/pos/` is the point-of-sale popup. |
| `src/i18n/` | Translations (English only for now). |

## How it fits together

- **Adding a page:** create it in `pages/`, then add one entry to `routes/registry.tsx`. It gets its route, guard, title, breadcrumb and sidebar link from that entry.
- **Access:** each page has an `AccessRule` (allowed roles). The route guard and the sidebar use the same rule. Everyone is the Owner until sign-in is wired (`api/auth.ts`).
- **Branch switcher:** "Owner · All branches" under the name in the top bar. `useBranch()` gives the current branch; pass it into queries so every screen follows it. It also sets which branch the POS sells from.
- **Point of sale:** a popup over any screen (`sections/pos/`). Picking an item in the top-bar search, or pressing Enter after a scan, opens it with the item in the cart. Closing keeps the cart.
- **Test items:** the dashed "Test items" button in the POS adds sample products. It only shows when `VITE_DEMO_TOOLS=true`; turn it off for production.
- **Theme:** tokens in `src/index.css`. Light mode (Folk style) by default; the Better Stack dark theme is defined under `.dark`.

## Design rules

Buttons are full pill, cards and panels 12px, inputs 8px. One accent per theme (ink black in light, indigo in dark); status colours only carry state. Page title first, breadcrumb under it. One snackbar, bottom centre.
