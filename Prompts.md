# AI Engineering Log — Aura Engine

This document records AI-assisted architectural questions used during planning and implementation. AI suggestions were treated as drafts. Schema rules, query behavior, security settings, deployment variables, and performance claims must be verified by a human engineer before release.

## Query architecture

**Architectural query**  
How should a Node/Express API search and paginate a 50,000-document MongoDB inventory without loading the complete collection into application memory?

**Reasoning goal**  
Keep response size bounded, use database indexes, validate query parameters, and return metadata the React client can render without guessing.

**Adopted decision**  
Use MongoDB `find`, indexed filters, `skip`, `limit` (hard-capped at 100), projection, deterministic secondary `_id` sorting, and a parallel `countDocuments`. Exact `AUR-...` terms use the unique SKU index; natural-language terms use the product-name text index.

**Human validation**  
Inspect query plans with Atlas Performance Advisor or `explain("executionStats")` after seeding. Confirm that production latency and large page offsets remain acceptable; replace deep offset pagination with cursor pagination if usage requires it.

## Analytics pipeline

**Architectural query**  
How can valuation, inventory cost, potential margin, stock count, low-stock count, and per-category chart data be calculated without transferring all products to Node.js?

**Reasoning goal**  
Move arithmetic to MongoDB and return the exact chart payload in one request.

**Adopted decision**  
Use `$match` followed by `$facet`. Both facets use `$group`; valuation and cost use `$multiply`, and `$project` rounds values and removes internal identifiers. The category facet sorts by valuation.

**Human validation**  
Compare a small manually calculated sample with the API response. In Postman confirm a warm analytics response is under the evaluation target, noting that free-tier cold starts and network latency can affect wall-clock time.

## Data validation

**Architectural query**  
How should business constraints be enforced consistently for create and partial update operations?

**Reasoning goal**  
Reject malformed inputs before MongoDB and guarantee `price >= cost` plus non-negative stock.

**Adopted decision**  
Use strict Zod schemas at the route boundary. For partial updates, load the existing product, merge validated changes, and rerun the complete product schema so a single-field price or cost update cannot bypass the cross-field rule.

**Human validation**  
Run automated schema tests and the Postman invalid-payload request. Confirm a 400 response includes a useful field-level message. Confirm duplicate SKU conflicts return 409.

## Seeder and indexes

**Architectural query**  
How should 50,000 reproducible mock products be inserted without creating one enormous client-side operation?

**Reasoning goal**  
Generate realistic volume, avoid excessive memory, make retries predictable, and create known search samples for the client demo.

**Adopted decision**  
Use seeded Faker data and ordered batches of 2,500. SKUs are deterministic and unique. The script resumes from the current count unless `--reset` is passed, and it explicitly creates indexes when complete.

**Human validation**  
Verify the final document count is exactly 50,000 after a reset seed. Run `npm run verify:indexes` and inspect Atlas to confirm `sku`, `category`, and `productName` indexes exist.

## Frontend performance

**Architectural query**  
How can the dashboard remain responsive while users search and visualize a large catalog?

**Reasoning goal**  
Avoid rendering or transferring thousands of rows and prevent one request per keystroke.

**Adopted decision**  
Debounce search input by 350 ms, cancel obsolete requests with `AbortController`, request 50 records per page, render skeleton/empty/error states, stream CSV on the server, and split the chart bundle from the main UI bundle.

**Human validation**  
Use Chrome DevTools Network to confirm `limit=50`, verify cancelled requests during fast typing, test mobile widths, and run Lighthouse against the deployed production build.

## Security and deployment

**Architectural query**  
What baseline hardening is appropriate for a public inventory API deployed separately from its frontend?

**Reasoning goal**  
Reduce information leakage and abuse while allowing only the intended browser origin.

**Adopted decision**  
Use Helmet, JSON body limits, API/mutation rate limits, disabled framework headers, sanitized 500 responses, request IDs, compression, and explicit `CLIENT_ORIGIN` CORS allow-listing. Credentials stay in platform environment variables.

**Human validation**  
Test the deployed Vercel origin, verify an unrelated browser origin is rejected, inspect Render logs without exposing secrets, and confirm `.env` files are ignored by Git.
