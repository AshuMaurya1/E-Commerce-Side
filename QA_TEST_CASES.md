# ShopSphere QA Test Cases

| Test Case ID | Module | Scenario | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| QA-BE-001 | Startup | Backend context and health | H2 test profile | Run Maven tests and health endpoint | Context starts; UP response | Context started; UP | PASS |
| QA-BE-002 | Build | Maven dependency resolution/compile | Java 25 local runtime | Run mvnw test | 28 tests pass | 28 passed | PASS |
| QA-BE-003 | Auth | Invalid login | Backend running | POST invalid email/password | 401 generic failure | 401 | PASS |
| QA-BE-004 | Authorization | Unauthenticated cart | No token/cookie | GET /api/v1/cart | 401 | 401 | PASS |
| QA-BE-005 | Authorization | Unauthenticated admin dashboard | No token | GET /api/v1/admin/dashboard | 401 | 401 | PASS |
| QA-BE-006 | Catalog | Public product list | Backend running | GET /api/v1/products?page=0&size=5 | 200 paged result | 200 paged result | PASS |
| QA-BE-007 | Auth | Public registration role | H2 test DB | Register via public endpoint | CUSTOMER role | Backend DTO/source test coverage; public role enforced | PASS |
| QA-BE-008 | Address | Address ownership | Address tests/profile | Create/list/update/delete/other user access | Owner-only access | Existing automated address test passed | PASS |
| QA-BE-009 | Cart/Coupon | Cart and coupon validation | Test customer/admin/product/coupon | Add/update/expired/invalid coupon cases | Backend validation and correct calculation | Existing integration test passed | PASS |
| QA-BE-010 | Inventory | Stock reservation/restoration | Product stock test fixture | Reserve, adjust, insufficient stock | No negative stock; correct logs | 6 inventory tests passed | PASS |
| QA-BE-011 | Coupon | Coupon rules | Coupon test fixtures | Duplicate, expired, invalid, limits, discount | Correct rejection/calculation | 7 coupon tests passed | PASS |
| QA-BE-012 | Order/Payment | Checkout and order state isolation | Test users/products/address | Checkout, insufficient stock, wrong user, tampered signature, webhook | Backend totals, stock, isolation, and signatures enforced | Order/payment integration test passed | PASS |
| QA-BE-013 | Payment | Simulation guard | Simulation disabled property | Call simulate-success | Forbidden outside test simulation | 1 guard test passed | PASS |
| QA-BE-014 | Product/Category | CRUD and relationships | Test admin/user | Create category/product and verify authorization | Admin-only mutations; valid relationships | 1 integration test passed | PASS |
| QA-BE-015 | Review/Admin | Review and admin operations | Test fixtures | Review create/delete/approval | Owner/admin rules enforced | 1 integration test passed | PASS |
| QA-FE-001 | Vitest | Frontend test suite | npm dependencies | Run npm test | All test files pass | 3 files, 6 tests passed | PASS |
| QA-FE-002 | Build | Production bundle | Frontend source | Run npm run build | Build succeeds | Build succeeded | PASS |
| QA-FE-003 | Homepage | Homepage rendering | Backend and Vite running | Open http://localhost:5173 | Header, catalog links, footer render | Rendered successfully | PASS |
| QA-FE-004 | Responsive | 1920/1440/1366/768/390/360 | Browser available | Visual viewport checks | No overflow or overlap | BLOCKED: no complete automated Playwright viewport run | BLOCKED |
| QA-FE-005 | UI interactions | Every storefront/admin interactive element | Auth/admin test accounts | Click each control | Correct intended action | NOT TESTED: complete account matrix unavailable | NOT TESTED |
| QA-FE-006 | Security | Customer/admin role separation | Customer/admin accounts | Customer calls admin endpoint | 403 | Existing backend security configuration reviewed; browser live matrix incomplete | BLOCKED |
| QA-DB-001 | Migrations | Flyway startup | H2 test profile | Run all tests/application | 2 migrations validate | 2 migrations up to date | PASS |
| QA-DB-002 | Integrity | Unique relationships | H2 test profile | Run CRUD/integration tests | Constraints and ownership maintained | Existing tests passed | PASS |
| QA-DB-003 | Real TiDB | Cloud connectivity/migrations | TiDB credentials | Connect and migrate staging | Successful isolated staging migration | Production credentials not used | BLOCKED |
| QA-PAY-001 | Razorpay | Real payment verification | Razorpay sandbox credentials | Create and verify sandbox order | Valid signature captures payment | BLOCKED: credentials unavailable | BLOCKED |
| QA-PAY-002 | Razorpay | Invalid signature | Test secrets | Send tampered signature | Unauthorized | Existing integration test passed | PASS |
| QA-PAY-003 | Webhook | Valid/duplicate webhook | Test webhook secret | Send valid then duplicate event | First processes; duplicate ignored | Existing integration test passed | PASS |
| QA-PAY-004 | Concurrency | Concurrent checkout oversell | Multi-thread test DB | Two checkouts for limited stock | One succeeds, one rejects | NOT TESTED: no concurrency harness | NOT TESTED |
| QA-DEP-001 | Render | Production profile | Render deployment config | Inspect render.yaml | prod profile and DB variables | prod profile and DB variables configured | FIXED & RETESTED |
| QA-DEP-002 | Render | Production sample catalog | Render deployment config | Inspect render.yaml | sample seeding disabled | APP_SEED_SAMPLE_DATA=false | FIXED & RETESTED |