# ShopSphere System Architecture & Database Design

## 1. Modular Monolith Architecture

```mermaid
flowchart LR
    Client["React + Vite Storefront & Admin UI"] -->|Axios + Bearer JWT + HttpOnly Cookie| Security["Spring Security + JwtAuthenticationFilter"]
    Security --> Controllers["REST Controllers (/api/v1/*)"]
    Controllers --> Services["Transactional Domain Services"]
    Services --> Repos["Spring Data JPA Repositories"]
    Repos --> DB["MySQL 8 (shopsphere_db) / Flyway"]
    Services --> Razorpay["Razorpay Orders & Webhooks"]
    Services --> Cloudinary["Cloudinary Image API / Local Uploads"]
```

## 2. Database Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : has
    USERS ||--o{ ADDRESSES : owns
    USERS ||--|| CARTS : owns
    USERS ||--o{ WISHLIST_ITEMS : saves
    USERS ||--o{ ORDERS : places
    USERS ||--o{ REVIEWS : writes

    CATEGORIES ||--o{ CATEGORIES : parent
    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ CART_ITEMS : in
    PRODUCTS ||--o{ WISHLIST_ITEMS : in
    PRODUCTS ||--o{ ORDER_ITEMS : referenced_by
    PRODUCTS ||--o{ REVIEWS : receives
    PRODUCTS ||--o{ INVENTORY_LOGS : tracks

    CARTS ||--o{ CART_ITEMS : contains
    COUPONS ||--o{ ORDERS : applied_to
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ PAYMENTS : paid_by
    ORDERS ||--o{ ORDER_STATUS_HISTORY : logs
```

## 3. Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: Razorpay Checkout
    [*] --> PLACED: Cash on Delivery
    PENDING_PAYMENT --> PLACED: Payment Verified / Webhook
    PENDING_PAYMENT --> CANCELLED: Payment Failed / Expired / Cancelled
    PLACED --> CONFIRMED
    PLACED --> CANCELLED
    CONFIRMED --> PACKED
    CONFIRMED --> CANCELLED
    PACKED --> SHIPPED
    PACKED --> CANCELLED
    SHIPPED --> DELIVERED
    DELIVERED --> RETURN_REQUESTED
    RETURN_REQUESTED --> RETURNED
    RETURN_REQUESTED --> DELIVERED
    RETURNED --> REFUNDED
    CANCELLED --> REFUNDED
```

## 4. Key API Modules (`/api/v1`)

| Module | Base Path | Access |
|---|---|---|
| Auth | `/api/v1/auth` | Public (`/register`, `/login`, `/refresh`, `/logout`) |
| Users & Addresses | `/api/v1/users`, `/api/v1/addresses` | Authenticated (`CUSTOMER`, `ADMIN`) |
| Categories & Products | `/api/v1/categories`, `/api/v1/products` | Public GET, Admin write |
| Cart & Wishlist | `/api/v1/cart`, `/api/v1/wishlist` | Authenticated |
| Orders | `/api/v1/orders` | Customer-scoped |
| Payments & Webhooks | `/api/v1/payments` | Authenticated + Razorpay HMAC Webhook |
| Reviews & Newsletter | `/api/v1/reviews`, `/api/v1/newsletter` | Public GET / Subscribe, Auth write |
| Admin Console | `/api/v1/admin/**` | `ADMIN` role only |

Interactive API docs are exposed at `/swagger-ui.html` and `/v3/api-docs`.
