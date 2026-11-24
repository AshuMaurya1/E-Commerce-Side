package com.shopsphere.order;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import com.shopsphere.cart.dto.CartDtos.AddCartItemRequest;
import com.shopsphere.category.dto.CategoryDtos.CategoryRequest;
import com.shopsphere.order.dto.OrderDtos.CancelOrderRequest;
import com.shopsphere.order.dto.OrderDtos.CheckoutItemRequest;
import com.shopsphere.order.dto.OrderDtos.PlaceOrderRequest;
import com.shopsphere.order.dto.OrderDtos.UpdateOrderStatusRequest;
import com.shopsphere.payment.PaymentService;
import com.shopsphere.payment.dto.PaymentDtos.CreatePaymentOrderRequest;
import com.shopsphere.payment.dto.PaymentDtos.VerifyPaymentRequest;
import com.shopsphere.product.ProductRepository;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.razorpay.key-secret=test_rzp_secret_123",
        "app.razorpay.webhook-secret=test_webhook_secret_456"
})
class OrderPaymentFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

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
                                new RegisterRequest("Order Tester", email, "Password123", "9876511111"))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private long createAddress(String token) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/v1/addresses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddressRequest(
                                "Order Tester", "9876511111", "22 Park Street", null,
                                "Kolkata", "West Bengal", "700016", "India", "Home", true))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    @Test
    void fullOrderPaymentWebhookStateMachineAndIsolationFlow() throws Exception {
        String adminToken = loginAdmin();
        String customerAToken = registerCustomer("order.a@shopsphere.local");
        String customerBToken = registerCustomer("order.b@shopsphere.local");
        long addressA = createAddress(customerAToken);

        MvcResult catRes = mockMvc.perform(post("/api/v1/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CategoryRequest("Order Cat", null, null, null, null, 1, true))))
                .andExpect(status().isCreated())
                .andReturn();
        long catId = objectMapper.readTree(catRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        MvcResult prodRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ProductRequest(
                                catId, "Stainless Kettle", null, "SS-ORD-01", "BrewCraft",
                                "Kettle", "Precision pour kettle",
                                new BigDecimal("2000.00"), null,
                                5, 2, false, false, true, List.of()))))
                .andExpect(status().isCreated())
                .andReturn();
        long prodId = objectMapper.readTree(prodRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Insufficient stock rejected at checkout
        mockMvc.perform(post("/api/v1/orders")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlaceOrderRequest(
                                addressA, PaymentMethod.COD, null, null,
                                List.of(new CheckoutItemRequest(prodId, 9))))))
                .andExpect(status().isBadRequest());

        // Add 2 to cart and checkout via RAZORPAY
        mockMvc.perform(post("/api/v1/cart/items")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddCartItemRequest(prodId, 2))))
                .andExpect(status().isOk());

        MvcResult orderRes = mockMvc.perform(post("/api/v1/orders")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PlaceOrderRequest(
                                addressA, PaymentMethod.RAZORPAY, null, "Leave at desk", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.data.totalAmount").value(4000.00))
                .andReturn();

        String orderNumber = objectMapper.readTree(orderRes.getResponse().getContentAsString())
                .path("data").path("orderNumber").asText();

        // Inventory reserved immediately (5 -> 3)
        assertEquals(3, productRepository.findById(prodId).orElseThrow().getStockQuantity());

        // Customer B cannot access Customer A's order
        mockMvc.perform(get("/api/v1/orders/" + orderNumber)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerBToken))
                .andExpect(status().isForbidden());

        // Create payment order (falls back to simulated order ID since keyId isn't set,
        // while verify/webhook use our test secrets)
        MvcResult payInitRes = mockMvc.perform(post("/api/v1/payments/razorpay/order")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreatePaymentOrderRequest(orderNumber))))
                .andExpect(status().isOk())
                .andReturn();
        String rzpOrderId = objectMapper.readTree(payInitRes.getResponse().getContentAsString())
                .path("data").path("razorpayOrderId").asText();

        // Tampered payment signature fails
        mockMvc.perform(post("/api/v1/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyPaymentRequest(
                                orderNumber, rzpOrderId, "pay_bad_001", "tampered_sig"))))
                .andExpect(status().isUnauthorized());

        String verifiedPaymentId = "pay_verify_001";
        String paymentSignature = PaymentService.computeHmacSha256(
                rzpOrderId + "|" + verifiedPaymentId, "test_rzp_secret_123");
        mockMvc.perform(post("/api/v1/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyPaymentRequest(
                                orderNumber, rzpOrderId, verifiedPaymentId, paymentSignature))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CAPTURED"));

        // Valid webhook captures payment; duplicate webhook is safely ignored
        String webhookPayload = """
                {
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "pay_wh_1001",
                        "order_id": "%s"
                      }
                    }
                  }
                }
                """.formatted(rzpOrderId);
        String webhookSig = PaymentService.computeHmacSha256(webhookPayload, "test_webhook_secret_456");

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .header("X-Razorpay-Signature", webhookSig)
                        .header("X-Razorpay-Event-Id", "evt_unique_1001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Webhook processed"));

        // Duplicate webhook ignored
        mockMvc.perform(post("/api/v1/payments/webhook")
                        .header("X-Razorpay-Signature", webhookSig)
                        .header("X-Razorpay-Event-Id", "evt_unique_1001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Duplicate or ignored webhook"));

        // Verify soldCount incremented exactly once (2 units) and order is PLACED + PAID
        assertEquals(2, productRepository.findById(prodId).orElseThrow().getSoldCount());
        mockMvc.perform(get("/api/v1/orders/" + orderNumber)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PLACED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));

        // Invalid status transition (PLACED -> DELIVERED) rejected
        mockMvc.perform(patch("/api/v1/admin/orders/" + orderNumber + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateOrderStatusRequest(OrderStatus.DELIVERED, "Skip"))))
                .andExpect(status().isBadRequest());

        // Valid status transition (PLACED -> CONFIRMED) succeeds
        mockMvc.perform(patch("/api/v1/admin/orders/" + orderNumber + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new UpdateOrderStatusRequest(OrderStatus.CONFIRMED, "Confirmed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // Customer cancels order -> inventory restored (3 -> 5) and payment marked REFUND_PENDING
        mockMvc.perform(post("/api/v1/orders/" + orderNumber + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CancelOrderRequest("Changed my mind"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("REFUND_PENDING"));

        assertEquals(5, productRepository.findById(prodId).orElseThrow().getStockQuantity());

        // Admin dashboard returns real metrics
        MvcResult dashRes = mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalOrders").isNumber())
                .andReturn();
        JsonNode dash = objectMapper.readTree(dashRes.getResponse().getContentAsString());
        assertEquals(true, dash.path("success").asBoolean());
    }
}
