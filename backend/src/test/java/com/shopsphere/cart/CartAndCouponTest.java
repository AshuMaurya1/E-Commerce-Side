package com.shopsphere.cart;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.auth.dto.AuthDtos.LoginRequest;
import com.shopsphere.auth.dto.AuthDtos.RegisterRequest;
import com.shopsphere.cart.dto.CartDtos.AddCartItemRequest;
import com.shopsphere.cart.dto.CartDtos.ApplyCouponRequest;
import com.shopsphere.category.dto.CategoryDtos.CategoryRequest;
import com.shopsphere.coupon.DiscountType;
import com.shopsphere.coupon.dto.CouponDtos.CouponRequest;
import com.shopsphere.product.dto.ProductDtos.ProductRequest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
class CartAndCouponTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAdmin() throws Exception {
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("admin@shopsphere.local", "Admin@12345"))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String registerCustomer(String email) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Cart Tester", email, "Password123", "9876500001"))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    void cartCalculatesBackendTotalsAndRejectsInvalidCouponsAndStockOverflow() throws Exception {
        String adminToken = loginAdmin();
        String customerToken = registerCustomer("cart.user@shopsphere.local");

        MvcResult catRes = mockMvc.perform(post("/api/v1/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CategoryRequest("Cart Cat", null, null, null, null, 1, true))))
                .andExpect(status().isCreated())
                .andReturn();
        long catId = objectMapper.readTree(catRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        MvcResult prodRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ProductRequest(
                                catId, "Ceramic Pour Over", null, "SS-CART-01", "BrewCraft",
                                "Pour over", "Handcrafted ceramic dripper",
                                new BigDecimal("800.00"), new BigDecimal("600.00"),
                                3, 2, false, false, true, List.of()))))
                .andExpect(status().isCreated())
                .andReturn();
        long prodId = objectMapper.readTree(prodRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Create expired coupon and valid coupon
        mockMvc.perform(post("/api/v1/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CouponRequest(
                                "EXPIRED20", "Expired", DiscountType.PERCENTAGE,
                                new BigDecimal("20"), BigDecimal.ZERO, null, null,
                                Instant.now().minus(1, ChronoUnit.DAYS), true))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CouponRequest(
                                "SAVE100", "Save 100", DiscountType.FIXED,
                                new BigDecimal("100"), new BigDecimal("500"), null, 10,
                                Instant.now().plus(10, ChronoUnit.DAYS), true))))
                .andExpect(status().isCreated());

        // Add exceeding stock fails
        mockMvc.perform(post("/api/v1/cart/items")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddCartItemRequest(prodId, 5))))
                .andExpect(status().isBadRequest());

        // Add 2 units (subtotal = 1200, free shipping >= 999)
        mockMvc.perform(post("/api/v1/cart/items")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddCartItemRequest(prodId, 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subtotal").value(1200.00))
                .andExpect(jsonPath("$.data.shippingFee").value(0.00));

        // Invalid & expired coupons rejected
        mockMvc.perform(post("/api/v1/cart/coupon")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyCouponRequest("NOPE"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/cart/coupon")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyCouponRequest("EXPIRED20"))))
                .andExpect(status().isBadRequest());

        // Valid coupon applied cleanly
        mockMvc.perform(post("/api/v1/cart/coupon")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApplyCouponRequest("SAVE100"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.discountAmount").value(100.00))
                .andExpect(jsonPath("$.data.totalAmount").value(1100.00));

        // Wishlist toggle
        mockMvc.perform(post("/api/v1/wishlist/" + prodId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(delete("/api/v1/wishlist/" + prodId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(get("/api/v1/cart")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appliedCouponCode").value("SAVE100"));
    }
}
