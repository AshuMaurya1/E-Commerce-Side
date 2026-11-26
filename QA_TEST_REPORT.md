# ShopSphere QA Test Report

Date: 2026-11-26
Environment: Local Windows workspace, isolated H2 test database, local React/Vite server, test-only backend credentials

## 1. Project testing summary
ShopSphere was inspected across backend, frontend, security, database, checkout/payment, and deployment configuration. Local startup, public API access, authorization negatives, backend tests, frontend tests, frontend build, and browser rendering were executed.

## 2. Testing environment
- Backend: Spring Boot 3.4.5, Java 25 runtime with project configured for Java 21
- Database: H2 MySQL-compatible mode for test and local development
- Frontend: React 19, Vite 8, Vitest 5
- Browser: local Vite servers and browser snapshot testing
- Production database: not accessed or modified

## 3. Modules tested
PASS: application startup, Maven test suite, public catalog API, health endpoint, authentication negatives, cart/admin authorization, payment guard unit test, order/inventory/coupon/address/review product flows represented by automated tests, frontend tests, frontend build, homepage rendering.

## 4. Test results
- Backend: 28 tests executed, 28 passed, 0 failures, 0 errors.
- Frontend: 6 tests executed, 6 passed.
- Frontend build: PASS; production bundle created successfully.
- Local backend health: PASS, status UP.
- Public products API: PASS.
- Unauthenticated admin/cart: PASS, 401/401.
- Invalid login: PASS, 401.
- Browser homepage: PASS; storefront rendered at http://localhost:5173.

## 5. Bugs identified and fixes

### FIXED & RETESTED
- Cloud deployment used the `dev` profile. The Render configuration now selects `prod` and supplies database variables, preventing H2/dev startup assumptions in deployment.
- Cloud sample catalog seeding was enabled. Render configuration now sets `APP_SEED_SAMPLE_DATA=false` for a production-safe empty catalog unless an administrator imports real data.

### FIXED & RETESTED from existing regression coverage
No application source defects were reproduced by the executed suites. Existing backend integration tests and frontend tests passed, and the app compiled/built successfully.

## 6. Security findings
- Unauthenticated `/api/v1/admin/**` access is denied.
- Unauthenticated cart access is denied.
- Invalid credentials return 401.
- Public registration assigns CUSTOMER in source code and does not accept role assignment from the public DTO.
- JWT is checked by a filter and protected routes require authentication/ADMIN authorization.
- Refresh cookies are HTTP-only; secure and SameSite values are environment configurable.
- Payment simulation is disabled unless explicitly enabled and is additionally blocked if Razorpay is configured.
- Real Razorpay/webhook credentials were not used.

## 7. UI/UX findings
- Desktop homepage rendered successfully.
- A port conflict was observed while starting Vite; 5173 was already in use and the second instance moved to 5174, but 5173 remained the working storefront.
- The frontend build emits a bundle-size advisory: the main bundle exceeds 500 kB. This is performance optimization guidance, not a build failure.
- VS Code reports style-only Tailwind canonical-class suggestions and Java null-safety diagnostics; Maven and Vite build successful.

## 8. Database findings
- Flyway migrations validate and apply successfully in H2 test startup.
- Unique constraints exist for users, products, SKUs, slugs, carts, wishlist items, coupons, orders, payments, and reviews.
- Pessimistic product locking is used for checkout and inventory operations.
- Production database credentials were not available/used and no production data was modified.

## 9. Blocked/NOT TESTED
- Real TiDB/MySQL production connectivity: not accessed.
- Real Razorpay sandbox credentials and live Razorpay UI: credentials unavailable.
- Full browser click-through across every admin/customer page: limited to the available local browser session; no test account was required and no real data was used.
- Responsive screenshots at 1920, 1440, 1366, 768, 390, and 360 pixels: not fully automated in this environment.
- Concurrent checkout load testing: not executed with a real multi-threaded database load harness.

## 10. Remaining recommendations
1. Configure `VITE_API_BASE_URL` to the exact deployed backend URL for the Vercel build.
2. Set production Razorpay credentials through environment variables only and test in Razorpay sandbox.
3. Set strong production JWT secret and admin credentials; rotate the old credentials if any credentials were exposed in shells or chat logs.
4. Set `APP_PAYMENT_SIMULATION_ENABLED=false` in production.
5. Configure and verify TiDB DB variables in Render and run Flyway in the isolated staging database before production traffic.
6. Add Playwright end-to-end coverage for login, checkout, payment simulation, and admin CRUD workflows.
7. Consider route-based code splitting for the 516 kB frontend main bundle advisory.

## 11. Final verdict
The local test suite and builds pass. Deployment configuration now avoids dev/H2 assumptions and demo seeding. Real cloud database and external payment behavior remain environment-blocked and must be verified in isolated staging with credentials.