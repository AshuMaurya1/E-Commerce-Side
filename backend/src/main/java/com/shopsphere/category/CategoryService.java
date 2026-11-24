package com.shopsphere.category;

import com.shopsphere.category.dto.CategoryDtos.CategoryRequest;
import com.shopsphere.category.dto.CategoryDtos.CategoryResponse;
import com.shopsphere.common.SlugUtils;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ConflictException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.product.ProductRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listPublicCategories() {
        Map<Long, Long> counts = getActiveProductCounts();
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(c -> CategoryResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getPublicBySlug(String slug) {
        Category category = categoryRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        long count = productRepository.countByCategoryId(category.getId());
        return CategoryResponse.from(category, count);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAllAdminCategories() {
        Map<Long, Long> counts = getActiveProductCounts();
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(c -> CategoryResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("A category with this name already exists");
        }
        String slug = resolveUniqueSlug(request.slug(), name, null);

        Category category = new Category();
        applyFields(category, request, slug);
        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved, 0L);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        String name = request.name().trim();
        if (!category.getName().equalsIgnoreCase(name) && categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("A category with this name already exists");
        }
        String slug = resolveUniqueSlug(request.slug(), name, category.getId());
        applyFields(category, request, slug);
        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved, productRepository.countByCategoryId(saved.getId()));
    }

    @Transactional
    public CategoryResponse toggleStatus(Long id, boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        category.setActive(active);
        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved, productRepository.countByCategoryId(saved.getId()));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (productRepository.countByCategoryId(id) > 0) {
            throw new ConflictException("Cannot delete category with assigned products. Deactivate it instead.");
        }
        categoryRepository.delete(category);
    }

    private void applyFields(Category category, CategoryRequest request, String slug) {
        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
        category.setImageUrl(request.imageUrl() == null || request.imageUrl().isBlank()
                ? null : request.imageUrl().trim());
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        if (request.active() != null) {
            category.setActive(request.active());
        }
        if (request.parentId() != null) {
            if (category.getId() != null && category.getId().equals(request.parentId())) {
                throw new BadRequestException("Category cannot be its own parent");
            }
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
    }

    private String resolveUniqueSlug(String requestedSlug, String name, Long currentId) {
        String base = SlugUtils.toSlug(
                requestedSlug != null && !requestedSlug.isBlank() ? requestedSlug : name
        );
        String candidate = base;
        int suffix = 2;
        while (true) {
            var existing = categoryRepository.findBySlug(candidate);
            if (existing.isEmpty() || (currentId != null && existing.get().getId().equals(currentId))) {
                return candidate;
            }
            candidate = base + "-" + suffix++;
        }
    }

    private Map<Long, Long> getActiveProductCounts() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : productRepository.countActiveProductsByCategory()) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }
}
