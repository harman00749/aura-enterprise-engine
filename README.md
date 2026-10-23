# Aura Enterprise Engine

Aura Enterprise Engine is a commercial-grade MERN inventory intelligence platform designed to keep a 50,000-product catalog fast, searchable, and actionable. It replaces browser-heavy inventory loading with server-side pagination, indexed queries, database-native analytics, streaming CSV export, and strict business validation.

> Public repository note: this codebase intentionally uses the approved code name only. It contains no confidential client name, proprietary records, or production credentials.

## Business value

- Loads only 50 inventory records at a time instead of transferring the whole catalog.
- Searches product names and exact SKUs on the server using MongoDB indexes.
- Calculates valuation, cost, potential margin, low-stock totals, and category metrics inside MongoDB.
- Gives operations teams responsive tables, filters, charts, CSV export, and clear stock-risk indicators.
- Protects data integrity by rejecting negative stock and any price lower than cost.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Recharts, Lucide icons, responsive CSS |
| Backend | Node.js, Express 5, TypeScript, Zod, Helmet, rate limiting, compression |
| Database | MongoDB Atlas, Mongoose, compound/text indexes, aggregation pipelines |
| Data generation | Faker.js standalone 50,000-product seeder |
| Hosting | Vercel (client), Render (API), MongoDB Atlas (database) |
| Quality | Vitest, TypeScript strict mode, Postman collection |

## Requirements implemented

### 1. Database architecture and massive seeding

The `Product` model contains `productName`, unique `sku`, `category`, `price`, `cost`, `stockQuantity`, `reorderLevel`, and `lastUpdated`. The standalone Faker seeder inserts exactly 50,000 realistic records in 2,500-record batches, creates predictable `laptop` samples for QA, and is deterministic for reproducible testing.

Indexes:

- Unique ascending `sku` index
- Ascending `category` index
- Ascending and text indexes on `productName`
- Compound `category + price` and `category + stockQuantity` indexes for common operational queries

### 2. Optimized inventory query engine

`GET /api/inventory?page=1&limit=50&search=laptop&category=electronics&sort=-price`

The response contains only the requested slice plus `totalRecords`, `totalPages`, `currentPage`, `pageSize`, `hasNextPage`, and `hasPreviousPage`. Limits are capped at 100 to prevent accidental bulk payloads.

### 3. MongoDB aggregation analytics

`GET /api/analytics`

The service uses `$match`, `$facet`, `$group`, `$multiply`, `$project`, and `$sort`. Calculations are performed in MongoDB—never by downloading all 50,000 products into Node.js.

### 4. Validation and integrity

Zod validates query parameters, route identifiers, `POST /api/inventory`, and `PUT /api/inventory/:id`. Invalid requests receive a consistent `400` JSON error. Duplicate SKUs receive `409`; missing resources receive `404`; unexpected failures receive a sanitized `500`.

## Project structure

```text
Aura Enterprise Engine/
├── client/
│   └── src/{components,hooks,services,types}
├── server/
│   ├── src/{config,controllers,middleware,models,routes,schemas,scripts,services,utils}
│   └── tests/
├── docs/Aura-Engine.postman_collection.json
├── Prompts.md
├── render.yaml
└── vercel.json
```

## Local setup (PowerShell)

Prerequisites: Node.js 20–24 and a MongoDB Atlas connection string.

```powershell
cd "$env:USERPROFILE\OneDrive\Desktop\Aura Enterprise Engine"
npm.cmd install
Copy-Item "server\.env.example" "server\.env"
Copy-Item "client\.env.example" "client\.env"
```

Edit `server\.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/aura_engine?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
LOG_HTTP_REQUESTS=true
```

Keep `client\.env` as:

```env
VITE_API_URL=http://localhost:5000/api
```

Seed and verify the database once:

```powershell
npm.cmd run seed --workspace server -- --reset
npm.cmd run verify:indexes
```

Run frontend and backend together:

```powershell
npm.cmd run dev
```

Open [http://localhost:5173](http://localhost:5173). The API health route is [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Scripts

```powershell
npm.cmd run dev            # client and API in watch mode
npm.cmd run build          # production build for both workspaces
npm.cmd run typecheck      # strict TypeScript checks
npm.cmd run test           # backend validation/query unit tests
npm.cmd run seed           # seed up to 50,000 products
npm.cmd run verify:indexes # print and verify database indexes
```

## REST API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API and database health |
| GET | `/api/inventory` | Indexed search, filter, sort, and pagination |
| GET | `/api/inventory/categories` | Category filter values |
| GET | `/api/inventory/export` | Stream filtered inventory as CSV |
| GET | `/api/inventory/:id` | Read one product |
| POST | `/api/inventory` | Create a validated product |
| PUT | `/api/inventory/:id` | Update a validated product |
| DELETE | `/api/inventory/:id` | Delete a product |
| GET | `/api/analytics` | Database-native totals and category analytics |

All responses use one shape:

```json
{ "success": true, "data": {} }
```

Errors use:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": {} } }
```

## Deployment

### Backend on Render

1. Create a **Web Service** from this repository (the included `render.yaml` is ready).
2. Add `MONGODB_URI` and set `CLIENT_ORIGIN` to the final Vercel origin, for example `https://aura-engine.vercel.app` (no trailing slash).
3. Use build command `npm install --include=dev && npm run build --workspace server`.
4. Use start command `npm run start --workspace server`.
5. In Atlas Network Access, add `0.0.0.0/0` only for the hosted demo and use a least-privilege database user.

### Frontend on Vercel

1. Import the same repository. `vercel.json` supplies the monorepo build settings.
2. Add `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`.
3. Deploy, then copy the exact Vercel origin into Render's `CLIENT_ORIGIN` and redeploy the API.

Never commit `.env`, Atlas credentials, or API secrets.

## QA and client demo

Import [`docs/Aura-Engine.postman_collection.json`](docs/Aura-Engine.postman_collection.json) into Postman and set `baseUrl` to the deployed API origin including `/api`.

Recommended 3–5 minute flow:

1. Open the live Vercel dashboard and show the catalog total and aggregation charts.
2. Open DevTools Network, paginate, and prove the request contains `limit=50` and the payload contains only 50 records.
3. Search and filter without a browser freeze; export the current result as CSV.
4. In Postman run `GET /inventory?search=laptop&limit=5` and point out `queryTimeMs`/Postman response time.
5. Run `GET /analytics` and explain that valuation is calculated by MongoDB aggregation.
6. Send the included invalid product payload and show the specific `400 Bad Request` response.
7. Open MongoDB Atlas to show 50,000 documents and the required indexes (do not expose credentials).

## Verification status

- 9 automated tests passing
- Strict client and server TypeScript checks passing
- Client and server production builds passing
- No known npm vulnerabilities at verification time

AI-assisted architectural decisions and human verification checks are transparently documented in [Prompts.md](Prompts.md).
