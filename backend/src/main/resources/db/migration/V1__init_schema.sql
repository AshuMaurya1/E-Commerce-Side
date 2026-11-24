-- ShopSphere MySQL 8 Normalized Schema (Flyway V1)

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('CUSTOMER', 'ADMIN'))
);

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipient_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(80) NOT NULL DEFAULT 'India',
    label VARCHAR(40) NOT NULL DEFAULT 'Home',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL,
    description VARCHAR(500) NULL,
    image_url VARCHAR(500) NULL,
    parent_id BIGINT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_name UNIQUE (name),
    CONSTRAINT uk_categories_slug UNIQUE (slug),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX idx_categories_active ON categories(active);

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    brand VARCHAR(100) NULL,
    short_description VARCHAR(320) NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    discount_price DECIMAL(12, 2) NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    trending BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    review_count INT NOT NULL DEFAULT 0,
    sold_count INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_products_slug UNIQUE (slug),
    CONSTRAINT uk_products_sku UNIQUE (sku),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT chk_products_price CHECK (price > 0),
    CONSTRAINT chk_products_stock CHECK (stock_quantity >= 0)
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_price ON products(price);

CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(600) NOT NULL,
    alt_text VARCHAR(200) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX idx_product_images_product ON product_images(product_id);

CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_code VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_carts_user UNIQUE (user_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cart_items_cart_product UNIQUE (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_items_qty CHECK (quantity > 0)
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TABLE wishlist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wishlist_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);

CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    max_discount DECIMAL(12, 2) NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_coupons_code UNIQUE (code),
    CONSTRAINT chk_coupons_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED'))
);
CREATE INDEX idx_coupons_active ON coupons(active);

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NULL,
    coupon_code VARCHAR(50) NULL,
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    shipping_recipient VARCHAR(120) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_line1 VARCHAR(255) NOT NULL,
    shipping_line2 VARCHAR(255) NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(80) NOT NULL,
    customer_note VARCHAR(500) NULL,
    cancellation_reason VARCHAR(500) NULL,
    return_reason VARCHAR(500) NULL,
    inventory_reserved BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_orders_number UNIQUE (order_number),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    CONSTRAINT chk_orders_status CHECK (status IN (
        'PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED',
        'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'
    )),
    CONSTRAINT chk_orders_payment_status CHECK (payment_status IN (
        'PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED'
    ))
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    product_sku_snapshot VARCHAR(64) NOT NULL,
    product_image_snapshot VARCHAR(600) NULL,
    unit_price_snapshot DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'RAZORPAY',
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    webhook_event_id VARCHAR(120) NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    failure_reason VARCHAR(500) NULL,
    refund_id VARCHAR(100) NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT uk_payments_rzp_order UNIQUE (razorpay_order_id),
    CONSTRAINT uk_payments_rzp_payment UNIQUE (razorpay_payment_id),
    CONSTRAINT uk_payments_webhook_event UNIQUE (webhook_event_id),
    CONSTRAINT chk_payments_status CHECK (status IN ('CREATED', 'CAPTURED', 'FAILED', 'REFUNDED'))
);
CREATE INDEX idx_payments_order ON payments(order_id);

CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL,
    title VARCHAR(160) NULL,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_reviews_product_user UNIQUE (product_id, user_id),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);

CREATE TABLE inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    order_id BIGINT NULL,
    actor_user_id BIGINT NULL,
    action_type VARCHAR(30) NOT NULL,
    quantity_delta INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    note VARCHAR(300) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_logs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_logs_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_inventory_action CHECK (action_type IN (
        'INITIAL_SEED', 'MANUAL_ADJUSTMENT', 'ORDER_RESERVE', 'ORDER_RELEASE',
        'ORDER_CANCEL_RESTORE', 'ORDER_RETURN_RESTORE'
    ))
);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);

CREATE TABLE order_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    changed_by_user_id BIGINT NULL,
    note VARCHAR(400) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_history_actor FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_order_history_order ON order_status_history(order_id);

CREATE TABLE newsletter_subscribers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(180) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_newsletter_email UNIQUE (email)
);
