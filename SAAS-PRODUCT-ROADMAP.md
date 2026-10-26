# AF Restaurant SaaS — product and architecture roadmap

## Product goal
AF is intended to be a subscription-based, multi-tenant restaurant operations platform. Many restaurants must be able to use one deployed application simultaneously without seeing or modifying another restaurant's data.

## Current foundation
- Registration creates a restaurant workspace and links its owner account to it.
- Authenticated menu and order operations in `backend/src/index.js` query using `req.user.restaurantId`.
- The kitchen display uses the same authenticated, restaurant-scoped order APIs.
- MongoDB stores restaurant, user, menu, and order records.

This is a useful foundation, but it is not yet a production SaaS release.

## Build order

### 1. Kitchen display (current milestone)
- Tickets, status progression, search, timers, full-screen mode, and periodic refresh.
- Next: Socket.IO events, sound/visual alerts with an opt-in control, per-item preparation state, station routing, and printer integration if needed.

### 2. Customer ordering
- Public restaurant slug/domain and published menu.
- Public menu endpoints must expose only available public fields and must never use an owner token in a customer's browser.
- Cart, customer details, order placement, order tracking, allergen/menu notes, and customer consent/privacy flows.
- Rate limits, abuse protection, server-side pricing, and idempotency keys for order submission.
- Integrate a payment provider only after provider availability, merchant onboarding, webhooks, refunds, and reconciliation are designed.

### 3. Owner dashboard
- Sales and order reporting using server-side tenant-scoped aggregation.
- Menu/category management, employees and role permissions, payments, expenses, inventory, shifts, reservations, and branch settings.
- Exportable reports, audit history, and safe handling of date ranges/time zones.

### 4. Multi-tenant security
- Use `restaurantId` as the tenant boundary on every tenant-owned record and every read/update/delete query.
- Never trust a restaurant ID sent by the browser as authorization; derive the active tenant from the verified session and membership.
- Add staff memberships and roles (owner, manager, cashier, kitchen, server), branch permissions, and tests proving cross-tenant reads/writes are denied.
- Add indexes that start with tenant identifiers where appropriate; review unique constraints so they are tenant-scoped when business rules allow.
- Add tenant-aware audit logs and support procedures that do not expose one customer's records to another.

### 5. Subscription platform
- Define plans and entitlements (e.g. number of branches, staff seats, monthly order volume, enabled modules).
- Store subscription status, billing customer/subscription IDs, current period, trial end, grace period, and cancellation state.
- Enforce entitlements on the server, not only by hiding buttons in the UI.
- Use payment-provider webhooks as the source of truth for paid status; verify signatures and make handlers idempotent.
- Define behavior for trial expiry, failed payments, grace periods, cancellation, refunds, and reactivation.
- Build a platform admin area for tenant support, plan management, billing status, and auditability.

### 6. Production readiness
- Production environment secrets, HTTPS, secure cookies/token strategy, CORS/CSRF review as applicable, rate limiting, validation, dependency updates, and security headers.
- Automated tests for tenant isolation, order state transitions, billing webhooks, authorization, and critical user flows.
- Backups plus restore drills, monitoring, error reporting, migrations, deployment pipeline, health checks, and incident response.
- Privacy policy, terms, data retention/deletion/export, support process, and local tax/payment compliance review.

## Non-negotiable rule
Every feature must preserve tenant isolation. Before a feature is marked launch-ready, test it with at least two separate restaurant accounts and verify that each account can only access its own data.
