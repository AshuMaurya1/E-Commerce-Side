package com.shopsphere.auth;

import java.time.Duration;
import java.util.Arrays;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.auth.AuthService.AuthTokensResult;
import com.shopsphere.auth.dto.AuthDtos.AuthResponse;
import com.shopsphere.auth.dto.AuthDtos.LoginRequest;
import com.shopsphere.auth.dto.AuthDtos.RegisterRequest;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.exception.ForbiddenException;
import com.shopsphere.config.AppProperties;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public static final String REFRESH_COOKIE_NAME = "shopsphere_refresh_token";

    private final AuthService authService;
    private final AppProperties appProperties;

    public AuthController(AuthService authService, AppProperties appProperties) {
        this.authService = authService;
        this.appProperties = appProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthTokensResult result = authService.register(request);
        addRefreshCookie(response, result.rawRefreshToken(),
                Duration.ofMillis(appProperties.getJwt().getRefreshExpirationMs()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully", result.response()));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthTokensResult result = authService.login(request);
        addRefreshCookie(response, result.rawRefreshToken(),
                Duration.ofMillis(appProperties.getJwt().getRefreshExpirationMs()));
        return ResponseEntity.ok(ApiResponse.ok("Signed in successfully", result.response()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        validateOriginIfPresent(request);
        AuthTokensResult result = authService.refresh(refreshToken);
        addRefreshCookie(response, result.rawRefreshToken(),
                Duration.ofMillis(appProperties.getJwt().getRefreshExpirationMs()));
        return ResponseEntity.ok(ApiResponse.ok("Session refreshed", result.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        validateOriginIfPresent(request);
        Long userId = principal != null ? principal.getId() : null;
        authService.logout(refreshToken, userId);
        addRefreshCookie(response, "", Duration.ZERO);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    private void addRefreshCookie(HttpServletResponse response, String value, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(appProperties.getCookie().isSecure())
                .sameSite(appProperties.getCookie().getSameSite())
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void validateOriginIfPresent(HttpServletRequest request) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin == null || origin.isBlank()) {
            return;
        }
        boolean allowed = Arrays.stream(appProperties.getCors().getAllowedOrigins().split(","))
                .map(String::trim)
                .anyMatch(origin::equalsIgnoreCase);
        if (!allowed) {
            throw new ForbiddenException("Invalid request origin");
        }
    }
}
