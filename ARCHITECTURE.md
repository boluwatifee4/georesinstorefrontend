# Architecture Overview

This Angular app is structured for long-term growth, SSR, and signals-based state. No components are created yet—only folders and placeholders to guide future work.

Top-level principles

- Standalone components with route-level code-splitting and lazy loading.
- Signals for local and feature state. Avoid global stores unless needed.
- Feature-first boundaries (admin vs store), with clear separation of UI, state, services, and models.
- Keep shared code minimal and stable. Prefer duplication over premature coupling.
- SSR-first: avoid direct window/document access; wrap platform APIs; use transfer cache for HTTP.

Folders

src/app/

- core/: App-wide singletons (auth, http, logging), guards, interceptors, global providers.
- shared/: Reusable UI primitives, pipes, directives; no business logic.
- features/
  - admin/: Admin domain
    - pages/: Route-level features (lazy)
    - components/: Presentational pieces scoped to admin
    - services/: Domain services (API orchestration, mapping)
    - state/: Signals-based state (feature stores, computed, effects)
    - models/: Domain types and DTOs
    - routes/: Child route definitions for /admin/\*\*
    - guards/, interceptors/, resolvers/, utils/: Feature-specific infra
  - store/: Storefront domain (mirrors admin)
- routes/: App route definitions and helpers; wire /admin and /store lazy routes here.
- api/: Cross-cutting API utilities (base clients, interceptors, DTO mappers)
- config/: Environment/config tokens, runtime config loader (supports SSR)
- infrastructure/: SSR, http transfer, platform abstractions
- types/: Cross-cutting TS types
- utils/: Cross-cutting helpers

src/environments/

- Environment files when needed; consider runtime-config to avoid rebuilds.

Routing

- app.routes.ts defines top-level lazy routes:
  - path: 'admin', loadChildren via routes in features/admin/routes
  - path: 'store', loadChildren via routes in features/store/routes
- Prefer provideRouter with withEnabledBlockingInitialNavigation, and withViewTransitions if desired.

Signals state

- Keep state close to features in state/ using Angular signals, computed, and effect.
- For server communication, prefer HttpClient with fetch-like signatures, wrapped to be SSR-safe, and use TransferState.

SSR

- Use the provided server module files; ensure any platform-specific code lives behind an injection token and checks isPlatformBrowser.
- Opt into hydration in app.config.ts and enable withHttpTransferCache.

Testing

- Co-locate tests with features. Prefer small, focused tests.

Naming

- Use kebab-case folders and files. Suffix tokens/types with .model.ts or .types.ts where helpful.

Next steps

- Define app.routes.ts lazy entries to point to feature route files.
- Add initial config token and runtime config loader.
- Add api base client and http interceptors in core/.
- Flesh out admin/store child route files as you feed endpoints and pages.
