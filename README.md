# AF Restaurant Management — Restaurant Management (local starter)

This repaired project includes a responsive browser UI, an Express API, JWT account authentication, order management, and MongoDB persistence.

## Requirements
- Node.js 20+ (Node 22 recommended)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## First-time setup on Windows
1. Extract this ZIP to a normal folder, for example `D:\RMS`.
2. Open PowerShell in that folder.
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Create the environment file:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
5. Open `backend\.env` and replace `JWT_SECRET` with a random string at least 24 characters long. Keep `MONGODB_URI=mongodb://127.0.0.1:27017/restaurant_management` for local MongoDB. Do not share your `.env` file.
6. Make sure the MongoDB Windows service is running. In PowerShell, you can check with:
   ```powershell
   Get-Service MongoDB
   ```
   If it is stopped, open PowerShell as Administrator and run `Start-Service MongoDB`.
7. Start the application:
   ```powershell
   npm start
   ```
8. Open **http://localhost:5000** in Chrome or Edge. Create an account and restaurant, then create an order. Data is saved in MongoDB.

For development with automatic server restarts, use `npm run dev`.

## Database
Yes, MongoDB is required for persistent accounts and orders. Local database name: `restaurant_management`. MongoDB creates the database/collections automatically after the first successful write. The app does not create or expose a default admin password.

## What works in this build
- Responsive dashboard and navigation
- Account registration and sign-in (passwords hashed with bcrypt)
- Per-account restaurant workspace
- Create orders with multiple line items, quantities and prices
- Restaurant-scoped menu management with add/edit/delete, availability and categories
- CSV menu import and simple category-based food suggestions
- Orders can select saved menu items; the backend resolves their authoritative menu price
- Order list, search/filter, status changes, and payment marking
- API health check at `/health`
- Data persists in MongoDB; protected API routes use JWT and scope orders to the signed-in restaurant

## Important scope notes
This is a usable local MVP, not yet a production-ready full restaurant SaaS. Inventory, reservations, table maps, kitchen live display, staff invitations/permissions, billing/subscription payments, email, automated integration tests, backups and production deployment are still planned. Menu management, CSV import, and basic menu suggestions are included in this milestone. Payment selection here is a record/status only; it does not charge cards or connect to a payment processor. Review security and test with a non-production database before using real customer data.

## Troubleshooting
- `MONGODB_URI is missing`: copy `backend/.env.example` to `backend/.env`.
- `JWT_SECRET must be set`: change the placeholder in `backend/.env` to a random string of at least 24 characters.
- `ECONNREFUSED 127.0.0.1:27017`: start the MongoDB service or set `MONGODB_URI` to your Atlas URI.
- `EADDRINUSE`: another process is already using port 5000; stop it or change `PORT` in `backend/.env`.
- If Windows says scripts are blocked, use PowerShell's normal `npm` command from the project folder; no custom PowerShell script is required.
