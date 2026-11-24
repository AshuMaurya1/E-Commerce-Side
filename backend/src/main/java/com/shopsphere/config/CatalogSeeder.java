package com.shopsphere.config;

import com.shopsphere.category.Category;
import com.shopsphere.category.CategoryRepository;
import com.shopsphere.coupon.Coupon;
import com.shopsphere.coupon.CouponRepository;
import com.shopsphere.coupon.DiscountType;
import com.shopsphere.inventory.InventoryService;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductImage;
import com.shopsphere.product.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
public class CatalogSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogSeeder.class);

    private final AppProperties appProperties;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final CouponRepository couponRepository;

    public CatalogSeeder(
            AppProperties appProperties,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            InventoryService inventoryService,
            CouponRepository couponRepository
    ) {
        this.appProperties = appProperties;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.couponRepository = couponRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!appProperties.getSeed().isSampleData() || categoryRepository.count() > 0) {
            return;
        }

        Category audio = createCategory("Audio & Tech", "audio-tech",
                "Everyday wireless audio, desk gear, and portable chargers.",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", 1);
        Category home = createCategory("Home & Living", "home-living",
                "Thoughtful lighting, ceramics, and textiles for calm interiors.",
                "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80", 2);
        Category apparel = createCategory("Apparel", "apparel",
                "Breathable staples crafted from natural cotton and merino fibers.",
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", 3);
        Category carry = createCategory("Carry & Travel", "carry-travel",
                "Weather-resistant packs, sleeves, and insulated drinkware.",
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80", 4);
        Category kitchen = createCategory("Kitchen & Coffee", "kitchen-coffee",
                "Precision pour-over kettles, grinders, and cookware.",
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80", 5);

        seedProduct(audio, "Studio ANC Wireless Headphones", "studio-anc-headphones", "SS-AUD-001", "SoundCraft",
                "Over-ear active noise cancellation with 38-hour battery life.",
                "Engineered with custom 40mm dynamic drivers, memory foam ear cushions, and hybrid active noise cancellation for focused work and travel. Includes USB-C fast charging and multipoint Bluetooth 5.3.",
                "8999.00", "7499.00", 24, true, true, 48,
                List.of(
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
                        "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(audio, "Tactile Wireless Mechanical Keyboard", "tactile-wireless-keyboard", "SS-AUD-002", "KeyAtelier",
                "Compact 75% hot-swappable aluminum keyboard for Mac and Windows.",
                "Machined anodized aluminum frame paired with PBT double-shot keycaps and quiet tactile switches. Connects wirelessly to up to three devices or over braided USB-C.",
                "6499.00", "5799.00", 18, true, true, 36,
                List.of(
                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
                        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(audio, "Minimalist Smart Desk Speaker", "minimalist-desk-speaker", "SS-AUD-003", "SoundCraft",
                "Warm acoustic fabric speaker with balanced room-filling sound.",
                "Compact tabletop wireless speaker wrapped in woven acoustic fabric. Tuned for clear vocals at low volume and rich low-end response across living spaces.",
                "4999.00", null, 15, false, true, 22,
                List.of(
                        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(home, "Matte Ceramic Table Lamp", "matte-ceramic-table-lamp", "SS-HOM-001", "NordicForm",
                "Textured stoneware base with diffused linen shade and warm LED bulb.",
                "Hand-finished matte stoneware base topped with a woven natural linen drum shade. Casts a gentle warm glow ideal for bedside tables and reading corners.",
                "3499.00", "2899.00", 14, true, false, 31,
                List.of(
                        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
                        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(home, "Woven Organic Cotton Throw", "woven-organic-cotton-throw", "SS-HOM-002", "LoomHouse",
                "Midweight breathable herringbone throw blanket in warm oatmeal.",
                "Loomed from 100% GOTS-certified long-staple cotton with subtle fringe detailing. Softens naturally with every wash and works year-round.",
                "2199.00", null, 30, false, true, 41,
                List.of(
                        "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(home, "Walnut Analog Desk Clock", "walnut-analog-desk-clock", "SS-HOM-003", "NordicForm",
                "Silent sweep quartz movement encased in solid oiled walnut.",
                "Precision-milled solid walnut casing with a brushed aluminum dial and non-ticking silent sweep movement for distraction-free focus.",
                "1899.00", "1599.00", 4, false, false, 19,
                List.of(
                        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(apparel, "Heavyweight Supima Crewneck Tee", "heavyweight-supima-tee", "SS-APP-001", "ThreadLine",
                "240 GSM combed Supima cotton t-shirt with structured collar.",
                "Cut in a relaxed tailored silhouette from extra-long-staple combed cotton. Pre-shrunk and enzyme-washed for lasting color and drape.",
                "1299.00", "999.00", 45, true, true, 84,
                List.of(
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
                        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(apparel, "Merino Blend Everyday Overshirt", "merino-everyday-overshirt", "SS-APP-002", "ThreadLine",
                "Versatile midweight overshirt for layering across seasons.",
                "Blends breathable merino wool with recycled fibers for temperature regulation and wrinkle resistance. Features corozo nut buttons and dual chest pockets.",
                "3999.00", "3499.00", 20, false, false, 27,
                List.of(
                        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(carry, "Commuter Water-Resistant Backpack", "commuter-backpack-20l", "SS-CAR-001", "FieldPack",
                "20L recycled ballistic nylon pack with padded 16-inch laptop sleeve.",
                "Built for daily commutes and weekend flights with weather-sealed zippers, suspended padded laptop compartment, luggage pass-through, and hidden quick-access pocket.",
                "4599.00", "3999.00", 22, true, true, 59,
                List.of(
                        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
                        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(carry, "Full-Grain Slim Cardholder", "full-grain-cardholder", "SS-CAR-002", "FieldPack",
                "Vegetable-tanned leather wallet holding up to 6 cards plus folded notes.",
                "Hand-stitched from vegetable-tanned full-grain leather with burnished edges and RFID-shielded center pocket that develops a rich patina over time.",
                "1499.00", null, 35, false, false, 44,
                List.of(
                        "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(kitchen, "Gooseneck Pour-Over Kettle", "gooseneck-pour-over-kettle", "SS-KIT-001", "BrewCraft",
                "Variable-temperature stainless steel kettle with precision spout.",
                "1200W quick-heat base with 1-degree temperature control, integrated brew stopwatch, and balanced counterweighted handle for steady pour-over extraction.",
                "4299.00", "3699.00", 16, true, false, 38,
                List.of(
                        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
                        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
                ));

        seedProduct(kitchen, "Double-Wall Insulated Travel Mug", "insulated-travel-mug", "SS-KIT-002", "BrewCraft",
                "Ceramic-lined 350ml stainless tumbler with leakproof sip lid.",
                "Vacuum-insulated body paired with an internal ceramic coating so coffee and tea retain pure flavor without metallic aftertaste.",
                "1399.00", "1149.00", 3, false, true, 63,
                List.of(
                        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80"
                ));

        seedCoupons();
        log.info("Seeded sample catalog with 5 categories and 12 products");
    }

    private void seedCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }
        Coupon welcome = new Coupon();
        welcome.setCode("WELCOME10");
        welcome.setDescription("10% off on orders above ₹500 (up to ₹500)");
        welcome.setDiscountType(DiscountType.PERCENTAGE);
        welcome.setDiscountValue(new BigDecimal("10.00"));
        welcome.setMinOrderValue(new BigDecimal("500.00"));
        welcome.setMaxDiscount(new BigDecimal("500.00"));
        welcome.setExpiresAt(Instant.now().plus(180, ChronoUnit.DAYS));
        welcome.setActive(true);
        couponRepository.save(welcome);

        Coupon flat = new Coupon();
        flat.setCode("FLAT150");
        flat.setDescription("Flat ₹150 off on orders above ₹1,499");
        flat.setDiscountType(DiscountType.FIXED);
        flat.setDiscountValue(new BigDecimal("150.00"));
        flat.setMinOrderValue(new BigDecimal("1499.00"));
        flat.setExpiresAt(Instant.now().plus(180, ChronoUnit.DAYS));
        flat.setActive(true);
        couponRepository.save(flat);
    }

    private Category createCategory(String name, String slug, String description, String imageUrl, int order) {
        Category c = new Category();
        c.setName(name);
        c.setSlug(slug);
        c.setDescription(description);
        c.setImageUrl(imageUrl);
        c.setDisplayOrder(order);
        c.setActive(true);
        return categoryRepository.save(c);
    }

    private void seedProduct(
            Category category,
            String name,
            String slug,
            String sku,
            String brand,
            String shortDesc,
            String desc,
            String price,
            String discountPrice,
            int stock,
            boolean featured,
            boolean trending,
            int soldCount,
            List<String> imageUrls
    ) {
        Product p = new Product();
        p.setCategory(category);
        p.setName(name);
        p.setSlug(slug);
        p.setSku(sku);
        p.setBrand(brand);
        p.setShortDescription(shortDesc);
        p.setDescription(desc);
        p.setPrice(new BigDecimal(price));
        p.setDiscountPrice(discountPrice != null ? new BigDecimal(discountPrice) : null);
        p.setStockQuantity(stock);
        p.setLowStockThreshold(5);
        p.setFeatured(featured);
        p.setTrending(trending);
        p.setActive(true);
        p.setSoldCount(soldCount);

        for (int i = 0; i < imageUrls.size(); i++) {
            ProductImage img = new ProductImage();
            img.setProduct(p);
            img.setImageUrl(imageUrls.get(i));
            img.setAltText(name);
            img.setPrimaryImage(i == 0);
            img.setSortOrder(i);
            p.getImages().add(img);
        }

        Product saved = productRepository.save(p);
        inventoryService.recordInitialStock(saved, null, "Initial catalog seed");
    }
}
