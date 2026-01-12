# ProjectPan

French-language beauty product inventory app. Track usage, prevent duplicate purchases, motivate mindful consumption.

## Key Documents

- `/docs/REFERENCE.md` — Full product specification. **Read entirely before starting any work.**

## Tech Stack

- React (Vite)
- IndexedDB for data persistence (use idb or Dexie.js wrapper)
- CSS Modules or Tailwind (pick one, stay consistent)
- French only — all UI text, labels, dates in French
- Mobile-first responsive
- Deployed on Vercel

## Code Standards

- Functional components with hooks
- Component files: PascalCase (`ProductCard.jsx`)
- One component per file
- Hooks in `/hooks`, utilities in `/utils`, data layer in `/data`
- Keep components focused — extract logic into custom hooks

## Quality Gates

**After every significant change:**

1. `npm run build` — must pass with no errors
2. `npm run lint` — must pass (configure ESLint)
3. Browser console — no errors or warnings
4. Test on mobile viewport (375px width minimum)
5. Verify all visible text is in French

**Before considering implementation complete:**

1. All screens from REFERENCE.md implemented
2. All user flows work end-to-end
3. Empty states display correctly
4. Data persists after page refresh
5. Animations work (checkmark on usage, confetti on finish)
6. Category colors are visually distinct
7. App works offline (no network requests needed)

## Verification Protocol

After completing the implementation, provide:

1. Summary of what was built (screens, features)
2. Step-by-step test script to verify each feature
3. Any deviations from the spec and why
4. Known limitations or future improvements
