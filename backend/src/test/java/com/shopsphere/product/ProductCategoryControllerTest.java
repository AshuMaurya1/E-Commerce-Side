package com.shopsphere.product;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.auth.dto.AuthDtos.LoginRequest;
import com.shopsphere.category.dto.CategoryDtos.CategoryRequest;
import com.shopsphere.inventory.dto.InventoryDtos.AdjustInventoryRequest;
import com.shopsphere.product.dto.ProductDtos.ProductImageRequest;
import com.shopsphere.product.dto.ProductDtos.ProductRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAsAdmin() throws Exception {
        LoginRequest req = new LoginRequest("admin@shopsphere.local", "Admin@12345");
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    void adminCanCreateCategoryProductAndAdjustInventoryAndPublicCanQuery() throws Exception {
        String adminToken = loginAsAdmin();

        CategoryRequest catReq = new CategoryRequest(
                "Desk Accessories", null, "Clean desk organization", null, null, 1, true
        );
        MvcResult catRes = mockMvc.perform(post("/api/v1/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug").value("desk-accessories"))
                .andReturn();
        long catId = objectMapper.readTree(catRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        ProductRequest prodReq = new ProductRequest(
                catId,
                "Aluminum Laptop Stand",
                null,
                "SS-DESK-101",
                "NordicForm",
                "Ergonomic CNC aluminum riser",
                "Solid aluminum laptop stand with ventilated tray and silicone pads.",
                new BigDecimal("2499.00"),
                new BigDecimal("1999.00"),
                4,
                5,
                true,
                false,
                true,
                List.of(new ProductImageRequest("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800", "Stand", true, 0))
        );

        MvcResult prodRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prodReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.effectivePrice").value(1999.00))
                .andReturn();
        long prodId = objectMapper.readTree(prodRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Public catalog search & filter
        mockMvc.perform(get("/api/v1/products")
                        .param("category", "desk-accessories")
                        .param("minPrice", "1500")
                        .param("maxPrice", "2100")
                        .param("sort", "price_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].sku").value("SS-DESK-101"));

        // Low stock alert shows product (4 <= 5)
        mockMvc.perform(get("/api/v1/admin/inventory/low-stock")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(prodId));

        // Adjust stock negatively past zero fails cleanly
        AdjustInventoryRequest badAdjust = new AdjustInventoryRequest(prodId, -10, "Invalid");
        mockMvc.perform(post("/api/v1/admin/inventory/adjust")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badAdjust)))
                .andExpect(status().isBadRequest());

        // Adjust stock positively succeeds and writes inventory log
        AdjustInventoryRequest goodAdjust = new AdjustInventoryRequest(prodId, 10, "Restock shipment");
        mockMvc.perform(post("/api/v1/admin/inventory/adjust")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodAdjust)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stockQuantity").value(14));

        mockMvc.perform(get("/api/v1/admin/inventory/logs")
                        .param("productId", String.valueOf(prodId))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(2));
    }
}
