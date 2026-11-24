package com.shopsphere.auth;

import com.shopsphere.auth.dto.AuthDtos.AuthResponse;
import com.shopsphere.auth.dto.AuthDtos.LoginRequest;
import com.shopsphere.auth.dto.AuthDtos.RegisterRequest;
import com.shopsphere.common.exception.ConflictException;
import com.shopsphere.common.exception.ForbiddenException;
import com.shopsphere.common.exception.UnauthorizedException;
import com.shopsphere.config.AppProperties;
import com.shopsphere.user.Role;
import com.shopsphere.user.User;
import com.shopsphere.user.UserRepository;
import com.shopsphere.user.dto.UserDtos.UserResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppProperties appProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AppProperties appProperties
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.appProperties = appProperties;
    }

    public record AuthTokensResult(AuthResponse response, String rawRefreshToken) {}

    @Transactional
    public AuthTokensResult register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        // Public registration always assigns CUSTOMER role
        user.setRole(Role.CUSTOMER);
        user.setActive(true);

        User saved = userRepository.save(user);
        return issueTokens(saved);
    }

    @Transactional
    public AuthTokensResult login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new ForbiddenException("Your account has been deactivated. Contact support.");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthTokensResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is missing");
        }

        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh session expired. Please log in again.");
        }

        User user = stored.getUser();
        if (!user.isActive()) {
            throw new ForbiddenException("Your account has been deactivated");
        }

        // Rotate refresh token: revoke the used token before issuing a new one
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken, Long authenticatedUserId) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
        }
        if (authenticatedUserId != null) {
            refreshTokenRepository.revokeAllActiveByUserId(authenticatedUserId);
        }
    }

    private AuthTokensResult issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefresh = generateSecureToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(rawRefresh));
        refreshToken.setExpiresAt(Instant.now().plusMillis(appProperties.getJwt().getRefreshExpirationMs()));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        AuthResponse response = new AuthResponse(
                accessToken,
                appProperties.getJwt().getAccessExpirationMs(),
                UserResponse.from(user)
        );
        return new AuthTokensResult(response, rawRefresh);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
