package com.shopsphere.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ForbiddenException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.common.exception.UnauthorizedException;
import com.shopsphere.config.AppProperties;
import com.shopsphere.order.Order;
import com.shopsphere.order.OrderPaymentStatus;
import com.shopsphere.order.OrderRepository;
import com.shopsphere.order.OrderService;
import com.shopsphere.order.OrderStatus;
import com.shopsphere.order.PaymentMethod;
import com.shopsphere.payment.dto.PaymentDtos.PaymentResponse;
import com.shopsphere.payment.dto.PaymentDtos.RazorpayOrderResponse;
import com.shopsphere.payment.dto.PaymentDtos.VerifyPaymentRequest;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            OrderService orderService,
            AppProperties appProperties,
            ObjectMapper objectMapper
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }
        if (order.getPaymentMethod() != PaymentMethod.RAZORPAY) {
            throw new BadRequestException("Order is not configured for online Razorpay payment");
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Order is not awaiting payment");
        }

        long amountInPaise = order.getTotalAmount()
                .multiply(new BigDecimal("100"))
                .longValue();

        Payment existing = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        if (existing != null && existing.getStatus() == PaymentStatus.CREATED && existing.getRazorpayOrderId() != null) {
            return new RazorpayOrderResponse(
                    order.getOrderNumber(),
                    existing.getRazorpayOrderId(),
                    amountInPaise,
                    existing.getCurrency(),
                    appProperties.getRazorpay().isConfigured() ? appProperties.getRazorpay().getKeyId() : null,
                    appProperties.getRazorpay().isConfigured() ? "RAZORPAY" : "SIMULATED"
            );
        }

        boolean configured = appProperties.getRazorpay().isConfigured();
        String rzpOrderId = configured
                ? callRazorpayCreateOrder(order.getOrderNumber(), amountInPaise)
                : "order_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider("RAZORPAY");
        payment.setRazorpayOrderId(rzpOrderId);
        payment.setAmount(order.getTotalAmount());
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.CREATED);
        paymentRepository.save(payment);

        return new RazorpayOrderResponse(
                order.getOrderNumber(),
                rzpOrderId,
                amountInPaise,
                "INR",
                configured ? appProperties.getRazorpay().getKeyId() : null,
                configured ? "RAZORPAY" : "SIMULATED"
        );
    }

    @Transactional
    public PaymentResponse verifyPayment(Long userId, VerifyPaymentRequest request) {
        Order order = orderRepository.findByOrderNumber(request.orderNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }

        String secret = appProperties.getRazorpay().getKeySecret();
        if (secret == null || secret.isBlank()) {
            throw new BadRequestException("Razorpay verification secret is not configured");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));

        if (!payment.getOrder().getId().equals(order.getId())) {
            throw new BadRequestException("Payment order mismatch");
        }

        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            return PaymentResponse.from(payment);
        }

        String payload = request.razorpayOrderId() + "|" + request.razorpayPaymentId();
        if (!verifyHmacSha256(payload, request.razorpaySignature(), secret)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Signature verification failed");
            paymentRepository.save(payment);
            throw new UnauthorizedException("Invalid payment signature");
        }

        payment.setRazorpayPaymentId(request.razorpayPaymentId());
        payment.setRazorpaySignature(request.razorpaySignature());
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setPaidAt(Instant.now());
        Payment saved = paymentRepository.save(payment);

        orderService.markOrderPaid(order, userId, "Razorpay payment verified (" + request.razorpayPaymentId() + ")");
        return PaymentResponse.from(saved);
    }

    @Transactional
    public PaymentResponse simulateTestSuccess(Long userId, String orderNumber) {
        if (appProperties.getRazorpay().isConfigured()) {
            throw new ForbiddenException("Simulation is disabled when Razorpay credentials are configured");
        }
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Order is not awaiting payment");
        }

        Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not initialized"));

        payment.setRazorpayPaymentId("pay_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14));
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setPaidAt(Instant.now());
        Payment saved = paymentRepository.save(payment);

        orderService.markOrderPaid(order, userId, "Test mode payment completed");
        return PaymentResponse.from(saved);
    }

    @Transactional
    public void recordPaymentFailure(Long userId, String orderNumber, String reason) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }
        String safeReason = reason != null && !reason.isBlank() ? reason.trim() : "Payment cancelled or declined";
        paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.CREATED) {
                p.setStatus(PaymentStatus.FAILED);
                p.setFailureReason(safeReason);
                paymentRepository.save(p);
            }
        });
        orderService.handleFailedPayment(order, safeReason);
    }

    @Transactional
    public boolean processWebhook(String rawPayload, String signatureHeader, String eventIdHeader) {
        String webhookSecret = appProperties.getRazorpay().getWebhookSecret();
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new BadRequestException("Webhook secret is not configured");
        }
        if (signatureHeader == null || !verifyHmacSha256(rawPayload, signatureHeader, webhookSecret)) {
            throw new UnauthorizedException("Invalid webhook signature");
        }

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String event = root.path("event").asText("");
            JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
            String rzpOrderId = paymentEntity.path("order_id").asText(null);
            String rzpPaymentId = paymentEntity.path("id").asText(null);

            String eventId = eventIdHeader != null && !eventIdHeader.isBlank()
                    ? eventIdHeader.trim()
                    : event + ":" + (rzpPaymentId != null ? rzpPaymentId : UUID.randomUUID());

            if (paymentRepository.existsByWebhookEventId(eventId)) {
                return false; // Duplicate webhook safely ignored
            }

            if (rzpOrderId == null || rzpOrderId.isBlank()) {
                return false;
            }

            Payment payment = paymentRepository.findByRazorpayOrderId(rzpOrderId).orElse(null);
            if (payment == null) {
                return false;
            }

            payment.setWebhookEventId(eventId);
            switch (event) {
                case "payment.captured" -> {
                    if (payment.getStatus() != PaymentStatus.CAPTURED) {
                        payment.setRazorpayPaymentId(rzpPaymentId);
                        payment.setStatus(PaymentStatus.CAPTURED);
                        payment.setPaidAt(Instant.now());
                        paymentRepository.save(payment);
                        orderService.markOrderPaid(payment.getOrder(), null,
                                "Payment captured via Razorpay webhook");
                    } else {
                        paymentRepository.save(payment);
                    }
                }
                case "payment.failed" -> {
                    String errDesc = paymentEntity.path("error_description").asText("Payment failed");
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setFailureReason(errDesc);
                    paymentRepository.save(payment);
                    orderService.handleFailedPayment(payment.getOrder(), errDesc);
                }
                case "refund.processed" -> {
                    String refundId = root.path("payload").path("refund").path("entity").path("id").asText(null);
                    payment.setStatus(PaymentStatus.REFUNDED);
                    payment.setRefundId(refundId);
                    paymentRepository.save(payment);
                    Order order = payment.getOrder();
                    order.setPaymentStatus(OrderPaymentStatus.REFUNDED);
                    orderRepository.save(order);
                }
                default -> paymentRepository.save(payment);
            }
            return true;
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Malformed webhook payload");
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getOrderPayment(Long userId, String orderNumber, boolean isAdmin) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!isAdmin && !order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this payment");
        }
        Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for this order"));
        return PaymentResponse.from(payment);
    }

    @SuppressWarnings("unchecked")
    private String callRazorpayCreateOrder(String receipt, long amountInPaise) {
        AppProperties.Razorpay cfg = appProperties.getRazorpay();
        String basicAuth = Base64.getEncoder().encodeToString(
                (cfg.getKeyId() + ":" + cfg.getKeySecret()).getBytes(StandardCharsets.UTF_8));

        Map<String, Object> body = Map.of(
                "amount", amountInPaise,
                "currency", "INR",
                "receipt", receipt
        );

        Map<String, Object> response = restClient.post()
                .uri("https://api.razorpay.com/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("id") == null) {
            throw new BadRequestException("Failed to create Razorpay order");
        }
        return response.get("id").toString();
    }

    public static String computeHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC-SHA256 computation failed", e);
        }
    }

    private boolean verifyHmacSha256(String data, String expectedHex, String secret) {
        if (expectedHex == null || expectedHex.isBlank()) {
            return false;
        }
        String computed = computeHmacSha256(data, secret);
        return MessageDigest.isEqual(
                computed.getBytes(StandardCharsets.UTF_8),
                expectedHex.trim().toLowerCase().getBytes(StandardCharsets.UTF_8)
        );
    }
}
