# Frontend tests

Tests live here rather than beside implementation files.

- `components/`: canonical control keyboard, focus, validation, events, and presentation contracts, grouped by component family.
- `widgets/`: domain interactions with session-only test fixtures, grouped by feature.
- `session/`: independent providers, seed isolation, mutation propagation, resets, and unsupported scenarios.
- `architecture/`: dependency resolution, re-export escapes, forbidden browser integration, and canonical control rules.
- `browser/`: Chrome route/interaction/appearance checks, including request and microphone guards.
- `setup.ts`: shared Vitest DOM setup and cleanup.

Run `npm test`, `npm run check`, and `npm run build` from the frontend directory. Run `npm run test:browser` for Playwright's installed Chrome channel; its configuration starts Vite automatically. Browser reports/screenshots are kept in the ignored `test-results/` and `playwright-report/` directories.

Fixtures in tests do not initialize the application. All application data, including settings catalogs, comes from the provider-scoped demo source and session. Unit/integration tests supply arbitrary source records directly to verify rendering and local updates. Browser tests allow static assets and Vite traffic but reject every application data request, streaming connection, or media-permission attempt. There are no catalog API exceptions or API response fixtures.
