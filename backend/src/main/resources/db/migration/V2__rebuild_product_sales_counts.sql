-- Remove legacy/demo counters and rebuild popularity from real order rows.
UPDATE products
SET sold_count = COALESCE((
    SELECT SUM(oi.quantity)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = products.id
      AND o.status IN ('PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED')
      AND (o.payment_status = 'PAID'
           OR (o.payment_method = 'COD' AND o.status = 'DELIVERED'))
), 0);
