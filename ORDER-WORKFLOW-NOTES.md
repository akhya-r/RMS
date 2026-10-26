# Order workflow update

## What changed
- The live API is `backend/src/index.js`; this is the file used by `npm start`. The separate `backend/src/routes/order.js` file is not mounted by this starter's active server, so it was left unchanged.
- Order statuses now follow one consistent path: `pending` → `preparing` → `ready` → `completed`.
- An order can be cancelled while it is pending, preparing, or ready. Cancellation requires confirmation in the browser.
- `completed` and `cancelled` are final statuses and cannot be reopened through the status endpoint.
- The order table only offers legal next statuses. Status filter labels are now readable, while their stored values remain compatible with existing MongoDB orders.
- The server validates transitions too, so a direct API request cannot skip stages just by bypassing the browser UI.

## Test it
1. Back up your project folder first. Keep your existing `backend/.env`; it is intentionally not included in this ZIP.
2. Extract this project and copy your existing `backend/.env` into the extracted `backend` folder, or apply the changed files to your current project.
3. Run `npm install` if needed, then `npm run check` and `npm start`.
4. Create a test order. In Orders, move it from Pending to Preparing, then Ready, then Completed.
5. Create another test order and cancel it. Confirm that a completed/cancelled order shows `Final` and cannot be changed again.
6. Try to skip a step by calling the status API directly; the server should return HTTP 409.

## Notes
This update does not delete or migrate existing orders and does not change MongoDB connection settings. Existing orders keep their current status.
