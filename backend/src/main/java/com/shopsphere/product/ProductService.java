package com.shopsphere.product;

import com.shopsphere.category.Category;
import com.shopsphere.category.CategoryRepository;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.common.SlugUtils;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ConflictException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.inventory.InventoryActionType;
import com.shopsphere.inventory.InventoryLog;
import com.shopsphere.inventory.InventoryLogRepository;
import com.shopsphere.inventory.InventoryService;
import com.shopsphere.product.dto.ProductDtos.ProductDetailResponse;
import com.shopsphere.product.dto.ProductDtos.ProductImageRequest;
import com.shopsphere.product.dto.ProductDtos.ProductRequest;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;
    private final InventoryLogRepository inventoryLogRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            InventoryService inventoryService,
            InventoryLogRepository inventoryLogRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryService = inventoryService;
        this.inventoryLogRepository = inventoryLogRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductSummaryResponse> listPublicProducts(
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            Boolean trending,
            Boolean inStock,
            String sort,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 48);

        Specification<Product> spec = (root, query, cb) -> {
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("category", JoinType.INNER);
            }

            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));
            predicates.add(cb.isTrue(root.get("category").get("active")));

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("brand"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("shortDescription"), "")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern)
                ));
            }

            if (category != null && !category.isBlank()) {
                String trimmed = category.trim();
                if (trimmed.chars().allMatch(Character::isDigit)) {
                    predicates.add(cb.equal(root.get("category").get("id"), Long.parseLong(trimmed)));
                } else {
                    predicates.add(cb.equal(root.get("category").get("slug"), trimmed));
                }
            }

            Expression<BigDecimal> effectivePrice = cb.coalesce(root.get("discountPrice"), root.get("price"));
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(effectivePrice, minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(effectivePrice, maxPrice));
            }
            if (Boolean.TRUE.equals(featured)) {
                predicates.add(cb.isTrue(root.get("featured")));
            }
            if (Boolean.TRUE.equals(trending)) {
                predicates.add(cb.isTrue(root.get("trending")));
            }
            if (Boolean.TRUE.equals(inStock)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }

            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                String sortKey = sort == null ? "newest" : sort.trim().toLowerCase();
                switch (sortKey) {
                    case "price_asc" -> query.orderBy(cb.asc(effectivePrice), cb.desc(root.get("id")));
                    case "price_desc" -> query.orderBy(cb.desc(effectivePrice), cb.desc(root.get("id")));
                    case "popularity" -> query.orderBy(
                            cb.desc(root.get("soldCount")),
                            cb.desc(root.get("reviewCount")),
                            cb.desc(root.get("id"))
                    );
                    case "rating" -> query.orderBy(
                            cb.desc(root.get("averageRating")),
                            cb.desc(root.get("reviewCount"))
                    );
                    default -> query.orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
                }
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<Product> results = productRepository.findAll(spec, PageRequest.of(safePage, safeSize));
        return PagedResponse.from(results.map(ProductSummaryResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getPublicProduct(String slugOrId) {
        Product product = findActiveBySlugOrId(slugOrId);
        return ProductDetailResponse.from(product);
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryResponse> getRelatedProducts(Long productId) {
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return productRepository
                .findTop6ByCategoryIdAndActiveTrueAndIdNotOrderBySoldCountDesc(product.getCategory().getId(), productId)
                .stream()
                .map(ProductSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductSummaryResponse> listAdminProducts(
            String search,
            Long categoryId,
            Boolean active,
            boolean lowStockOnly,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        Page<Product> results = productRepository.searchAdminProducts(search, categoryId, active, lowStockOnly, pageable);
        return PagedResponse.from(results.map(ProductSummaryResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getAdminProduct(Long id) {
        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return ProductDetailResponse.from(product);
    }

    @Transactional
    public ProductDetailResponse createProduct(ProductRequest request, Long actorUserId) {
        validatePrices(request.price(), request.discountPrice());

        String sku = request.sku().trim().toUpperCase();
        if (productRepository.existsBySkuIgnoreCase(sku)) {
            throw new ConflictException("A product with SKU " + sku + " already exists");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = new Product();
        product.setCategory(category);
        product.setSku(sku);
        product.setSlug(resolveUniqueSlug(request.slug(), request.name(), null));
        applyEditableFields(product, request);
        product.setStockQuantity(request.stockQuantity());
        applyImages(product, request.images());

        Product saved = productRepository.save(product);
        inventoryService.recordInitialStock(saved, actorUserId, "Initial stock on product creation");
        return ProductDetailResponse.from(saved);
    }

    @Transactional
    public ProductDetailResponse updateProduct(Long id, ProductRequest request, Long actorUserId) {
        validatePrices(request.price(), request.discountPrice());

        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String sku = request.sku().trim().toUpperCase();
        if (!product.getSku().equalsIgnoreCase(sku) && productRepository.existsBySkuIgnoreCase(sku)) {
            throw new ConflictException("A product with SKU " + sku + " already exists");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        int previousStock = product.getStockQuantity();
        int newStock = request.stockQuantity();

        product.setCategory(category);
        product.setSku(sku);
        product.setSlug(resolveUniqueSlug(request.slug(), request.name(), product.getId()));
        applyEditableFields(product, request);
        product.setStockQuantity(newStock);
        applyImages(product, request.images());

        Product saved = productRepository.save(product);

        if (newStock != previousStock) {
            InventoryLog log = new InventoryLog();
            log.setProduct(saved);
            log.setActorUserId(actorUserId);
            log.setActionType(InventoryActionType.MANUAL_ADJUSTMENT);
            log.setQuantityDelta(newStock - previousStock);
            log.setPreviousStock(previousStock);
            log.setNewStock(newStock);
            log.setNote("Updated via product edit");
            inventoryLogRepository.save(log);
        }

        return ProductDetailResponse.from(saved);
    }

    @Transactional
    public ProductDetailResponse toggleProductStatus(Long id, boolean active) {
        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setActive(active);
        return ProductDetailResponse.from(productRepository.save(product));
    }

    @Transactional
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setActive(false);
        productRepository.save(product);
    }

    private Product findActiveBySlugOrId(String slugOrId) {
        if (slugOrId.chars().allMatch(Character::isDigit)) {
            return productRepository.findByIdAndActiveTrue(Long.parseLong(slugOrId))
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        }
        return productRepository.findBySlugAndActiveTrue(slugOrId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private void validatePrices(BigDecimal price, BigDecimal discountPrice) {
        if (discountPrice != null && discountPrice.compareTo(price) >= 0) {
            throw new BadRequestException("Discount price must be lower than the original price");
        }
    }

    private void applyEditableFields(Product product, ProductRequest request) {
        product.setName(request.name().trim());
        product.setBrand(request.brand() == null || request.brand().isBlank() ? null : request.brand().trim());
        product.setShortDescription(request.shortDescription() == null || request.shortDescription().isBlank()
                ? null : request.shortDescription().trim());
        product.setDescription(request.description().trim());
        product.setPrice(request.price());
        product.setDiscountPrice(request.discountPrice());
        product.setLowStockThreshold(request.lowStockThreshold() != null ? request.lowStockThreshold() : 5);
        product.setFeatured(request.featured());
        product.setTrending(request.trending());
        if (request.active() != null) {
            product.setActive(request.active());
        }
    }

    private void applyImages(Product product, List<ProductImageRequest> imageRequests) {
        product.getImages().clear();
        if (imageRequests == null || imageRequests.isEmpty()) {
            return;
        }
        boolean hasPrimary = imageRequests.stream().anyMatch(ProductImageRequest::primaryImage);
        for (int i = 0; i < imageRequests.size(); i++) {
            ProductImageRequest imgReq = imageRequests.get(i);
            ProductImage img = new ProductImage();
            img.setProduct(product);
            img.setImageUrl(imgReq.imageUrl().trim());
            img.setAltText(imgReq.altText() == null || imgReq.altText().isBlank()
                    ? product.getName() : imgReq.altText().trim());
            img.setPrimaryImage(hasPrimary ? imgReq.primaryImage() : (i == 0));
            img.setSortOrder(imgReq.sortOrder() > 0 ? imgReq.sortOrder() : i);
            product.getImages().add(img);
        }
    }

    private String resolveUniqueSlug(String requestedSlug, String name, Long currentId) {
        String base = SlugUtils.toSlug(
                requestedSlug != null && !requestedSlug.isBlank() ? requestedSlug : name
        );
        String candidate = base;
        int suffix = 2;
        while (true) {
            var existing = productRepository.findBySlugAndActiveTrue(candidate);
            boolean taken = productRepository.existsBySlug(candidate);
            if (!taken || (currentId != null && existing.map(p -> p.getId().equals(currentId)).orElse(false))) {
                return candidate;
            }
            if (currentId != null) {
                Product current = productRepository.findById(currentId).orElse(null);
                if (current != null && current.getSlug().equals(candidate)) {
                    return candidate;
                }
            }
            candidate = base + "-" + suffix++;
        }
    }
}
