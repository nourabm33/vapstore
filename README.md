# VAPPINO

VAPPINO is a French-language, mobile-first e-commerce storefront for vape, pod and e-liquid products in Tunisia. Prices are stored independently from product specifications and displayed in Tunisian dinars (DT).

## Architecture

- Vite + React frontend with an in-memory cart for the browsing experience.
- Node HTTP API in `server/` with MongoDB order persistence.
- Server-side catalog validation and price calculation.
- WhatsApp Cloud API notification service with secrets kept on the server.

## Setup

Install dependencies, copy `.env.example` to the server environment, and provide `MONGODB_URI`. The frontend uses the existing Vite setup. The API listens on `PORT` (3001 by default).

## Environment variables

- `MONGODB_URI` — MongoDB connection string.
- `MONGODB_DB_NAME` — database name, default `vappino`.
- `WHATSAPP_ACCESS_TOKEN` — Meta access token, supplied only through secure server secrets.
- `WHATSAPP_PHONE_NUMBER_ID` — Meta WhatsApp phone number ID.
- `OWNER_WHATSAPP_NUMBER` — destination number in international format.
- `PORT` — API port.

## API

### `POST /api/orders`

Accepts `{ customerName, customerPhone, notes?, items: [{ productId, quantity }] }` and requires an `Idempotency-Key` header. Product names, specifications and prices are retrieved from the server catalog. The response contains the generated reference, authoritative total, order status and notification status.

### `POST /api/test-whatsapp`

Sends a real test notification through the configured Meta API. It returns `WHATSAPP_NOT_CONFIGURED` when any required WhatsApp setting is missing.

## MongoDB

The server creates indexes for order reference, creation date, status, customer phone and the idempotency key. Orders are retained when notification delivery fails, with `status` set to `failed` and the notification error code stored separately.

## Security

The API validates input at the boundary, recalculates totals, limits request size and rate, prevents duplicate submissions with idempotency keys, sanitizes text, and never logs access tokens. External API errors are recorded without exposing credentials.

## Verification

Run the frontend type check, lint, and production build. API integration testing requires a reachable MongoDB instance and, for live notification testing, a securely configured `WHATSAPP_ACCESS_TOKEN`.
