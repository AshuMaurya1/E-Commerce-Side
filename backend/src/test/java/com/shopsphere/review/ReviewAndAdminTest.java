package com.shopsphere.review;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.address.dto.AddressDtos.AddressRequest;
import com.shopsphere.auth.dto.AuthDtos.LoginRequest;
import com.shopsphere.auth.dto.AuthDtos.RegisterRequest;
import com.shopsphere.category.dto.CategoryDtos.CategoryRequest;
import com.shopsphere.order.PaymentMethod;
import com.shopsphere.order.dto.OrderDtos.CheckoutItemRequest;
import com.shopsphere.order.dto.OrderDtos.PlaceOrderRequest;
import com.shopsphere.product.dto.ProductDtos.ProductRequest;
import com.shopsphere.review.dto.ReviewDtos.CreateReviewRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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
class ReviewAndAdminTest {

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

    @Test
    void verifiedReviewModerationAndCustomerDeactivationFlow() throws Exception {
        String adminToken = loginAdmin();

        MvcResult regRes = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Review Buyer", "buyer@shopsphere.local", "Password123", "9876540000"))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode regJson = objectMapper.readTree(regRes.getResponse().getContentAsString());
        String buyerToken = regJson.path("data").path("accessToken").asText();
        long buyerId = regJson.path("data").path("user").path("id").asLong();

        MvcResult catRes = mockMvc.perform(post("/api/v1/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CategoryRequest("Review Cat", null, null, null, null, 1, true))))
                .andExpect(status().isCreated())
                .andReturn();
        long catId = objectMapper.readTree(catRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        MvcResult prodRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ProductRequest(
                                catId, "Linen Throw", null, "SS-REV-01", "LoomHouse",
                                "Throw", "Soft woven throw", new BigDecimal("1999.00"), null,
                                8, 2, false, false, true, List.of()))))
                .andExpect(status().isCreated())
                .andReturn();
        long prodId = objectMapper.readTree(prodRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        MvcResult addrRes = mockMvc.perform(post("/api/v1/addresses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddressRequest(
                                "Review Buyer", "9876540000", "10 Residency Rd", null,
                                "Pune", "Maharashtra", "411001", "India", "Home", true))))
                .andExpect(status().isCreated())
                .andReturn();
        long addrId = objectMapper.readTree(addrRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Place COD order so review is marked verifiedPurchase = true
        mockMvc.perform(post("/api/v1/orders")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlaceOrderRequest(
                                addrId, PaymentMethod.COD, null, null,
                                List.of(new CheckoutItemRequest(prodId, 1))))))
                .andExpect(status().isCreated());

        MvcResult revRes = mockMvc.perform(post("/api/v1/reviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(
                                prodId, 5, "Great weave", "Really comfortable and breathable cotton."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verifiedPurchase").value(true))
                .andReturn();
        long revId = objectMapper.readTree(revRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Duplicate review rejected
        mockMvc.perform(post("/api/v1/reviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(
                                prodId, 4, "Again", "Duplicate review attempt"))))
                .andExpect(status().isConflict());

        // Admin hides review -> rating resets to 0
        mockMvc.perform(patch("/api/v1/admin/reviews/" + revId + "/approval")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("approved", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approved").value(false));

        mockMvc.perform(get("/api/v1/products/" + prodId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewCount").value(0));

        // Admin deactivates customer -> login rejected with 403
        mockMvc.perform(patch("/api/v1/admin/customers/" + buyerId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("buyer@shopsphere.local", "Password123"))))
                .andExpect(status().isForbidden());

        // Newsletter subscription
        mockMvc.perform(post("/api/v1/newsletter/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "news@shopsphere.local"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
