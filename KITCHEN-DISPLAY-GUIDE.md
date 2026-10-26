# AF Kitchen Display System — v4 milestone

## What this adds
- A dedicated Kitchen display view in the sidebar.
- Active tickets grouped by status (New, Preparing, Ready) with order number, customer, order type, age, line items, order notes, and total.
- Actions that move an order through the existing API workflow: Pending → Preparing → Ready → Completed.
- Search and status filters, full-screen mode, manual refresh, and automatic refresh every 10 seconds while the kitchen view is open.
- Ticket age warning after 20 minutes.
- HTML escaping for order/customer/item text before rendering.

## Run locally
1. Keep a backup of your current working folder and ZIP.
2. Extract this version into a new folder.
3. Copy your existing `backend/.env` into the new folder's `backend` directory. Never share or commit that file.
4. From the project root run `npm install`, `npm run check`, then `npm start`.
5. Sign in, create a test order, and open **Kitchen display** in the sidebar.
6. Confirm the ticket appears, then test Start preparing → Mark ready → Complete order.

## Important implementation notes
- Kitchen display uses the authenticated `/api/orders` and `/api/orders/:id/status` endpoints. These endpoints scope queries and updates to `req.user.restaurantId`, so a user sees only the orders in their own restaurant workspace.
- This milestone uses 10-second polling, not WebSockets. It is intentionally simple and dependable for local testing. A later milestone can switch to Socket.IO for near-real-time updates.
- The app is **not yet production-ready SaaS**. Before taking paying customers, implement and test staff roles/permissions, tenant-isolation tests, subscription plans and enforcement, billing provider integration, customer-facing order endpoints, audit logging, rate limiting, production secrets, backups, monitoring, and deployment hardening.
- Existing database data is not migrated or deleted by these frontend changes.
