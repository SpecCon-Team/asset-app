## Asset App (React + TypeScript)

Frontend for asset and ticket management, rebuilt with React 18, TypeScript, Vite, Tailwind, React Router, react-query, and zod.

### Getting Started
1. Install dependencies:
   - `npm install`
2. Create `.env`:
   - Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`
3. Run dev server:
   - `npm run dev`

### Environment
Create `.env` with:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Scripts
- `npm run dev` - start dev server
- `npm run build` - typecheck and build
- `npm run preview` - preview built app
- `npm run lint` - lint
- `npm run format` - prettier
- `npm run test` - vitest

### Structure
- `src/app` - layout, providers, router
- `src/features/*` - domain features (assets, tickets, users)
- `src/lib` - api client, utils
- `src/styles` - Tailwind styles

### Notes
- Auth is not implemented; JWT hook-up is ready in Axios interceptors.
- CSV import uses Papa Parse; backend should implement `POST /assets:bulk`.
# asset-app

# speccon-team