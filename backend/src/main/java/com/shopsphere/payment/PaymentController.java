package com.shopsphere.payment;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.payment.dto.PaymentDtos.CreatePaymentOrderRequest;
import com.shopsphere.payment.dto.PaymentDtos.PaymentFailureRequest;
import com.shopsphere.payment.dto.PaymentDtos.PaymentResponse;
import com.shopsphere.payment.dto.PaymentDtos.RazorpayOrderResponse;
import com.shopsphere.payment.dto.PaymentDtos.SimulatePaymentRequest;
import com.shopsphere.payment.dto.PaymentDtos.VerifyPaymentRequest;
import com.shopsphere.user.Role;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/razorpay/order")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePaymentOrderRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.createRazorpayOrder(principal.getId(), request.orderNumber())));
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verify(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Payment verified",
                paymentService.verifyPayment(principal.getId(), request)));
    }

    @PostMapping("/razorpay/simulate-success")
    public ResponseEntity<ApiResponse<PaymentResponse>> simulateSuccess(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SimulatePaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Test payment completed",
                paymentService.simulateTestSuccess(principal.getId(), request.orderNumber())));
    }

    @PostMapping("/razorpay/fail")
    public ResponseEntity<ApiResponse<Void>> fail(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PaymentFailureRequest request
    ) {
        paymentService.recordPaymentFailure(principal.getId(), request.orderNumber(), request.reason());
        return ResponseEntity.ok(ApiResponse.ok("Payment failure recorded", null));
    }

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> webhook(
            @RequestBody String rawPayload,
            @RequestHeader(name = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(name = "X-Razorpay-Event-Id", required = false) String eventId
    ) {
        boolean processed = paymentService.processWebhook(rawPayload, signature, eventId);
        return ResponseEntity.ok(ApiResponse.ok(
                processed ? "Webhook processed" : "Duplicate or ignored webhook", null));
    }

    @GetMapping("/order/{orderNumber}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getForOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber
    ) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.getOrderPayment(principal.getId(), orderNumber, isAdmin)));
    }
}
