package com.shopsphere.config;

import java.math.BigDecimal;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Cookie cookie = new Cookie();
    private Seed seed = new Seed();
    private Razorpay razorpay = new Razorpay();
    private Payment payment = new Payment();
    private Cloudinary cloudinary = new Cloudinary();
    private Shipping shipping = new Shipping();

    public static class Jwt {
        private String secret;
        private long accessExpirationMs = 900_000L;
        private long refreshExpirationMs = 604_800_000L;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getAccessExpirationMs() { return accessExpirationMs; }
        public void setAccessExpirationMs(long accessExpirationMs) { this.accessExpirationMs = accessExpirationMs; }
        public long getRefreshExpirationMs() { return refreshExpirationMs; }
        public void setRefreshExpirationMs(long refreshExpirationMs) { this.refreshExpirationMs = refreshExpirationMs; }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Cookie {
        private boolean secure = false;
        private String sameSite = "Strict";

        public boolean isSecure() { return secure; }
        public void setSecure(boolean secure) { this.secure = secure; }
        public String getSameSite() { return sameSite; }
        public void setSameSite(String sameSite) { this.sameSite = sameSite; }
    }

    public static class Seed {
        private String adminEmail = "admin@shopsphere.local";
        private String adminPassword = "Admin@12345";
        private boolean sampleData = true;

        public String getAdminEmail() { return adminEmail; }
        public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
        public String getAdminPassword() { return adminPassword; }
        public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
        public boolean isSampleData() { return sampleData; }
        public void setSampleData(boolean sampleData) { this.sampleData = sampleData; }
    }

    public static class Razorpay {
        private String keyId = "";
        private String keySecret = "";
        private String webhookSecret = "";

        public String getKeyId() { return keyId; }
        public void setKeyId(String keyId) { this.keyId = keyId; }
        public String getKeySecret() { return keySecret; }
        public void setKeySecret(String keySecret) { this.keySecret = keySecret; }
        public String getWebhookSecret() { return webhookSecret; }
        public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
        public boolean isConfigured() {
            return keyId != null && !keyId.isBlank()
                    && !keyId.contains("your_key_id")
                    && keySecret != null && !keySecret.isBlank()
                    && !keySecret.contains("your_razorpay");
        }
    }

    public static class Payment {
        private boolean simulationEnabled = false;

        public boolean isSimulationEnabled() { return simulationEnabled; }
        public void setSimulationEnabled(boolean simulationEnabled) { this.simulationEnabled = simulationEnabled; }
    }

    public static class Cloudinary {
        private String cloudName = "";
        private String apiKey = "";
        private String apiSecret = "";

        public String getCloudName() { return cloudName; }
        public void setCloudName(String cloudName) { this.cloudName = cloudName; }
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getApiSecret() { return apiSecret; }
        public void setApiSecret(String apiSecret) { this.apiSecret = apiSecret; }
        public boolean isConfigured() {
            return cloudName != null && !cloudName.isBlank() && !cloudName.contains("your_cloud_name")
                    && apiKey != null && !apiKey.isBlank()
                    && apiSecret != null && !apiSecret.isBlank();
        }
    }

    public static class Shipping {
        private BigDecimal freeThreshold = new BigDecimal("999.00");
        private BigDecimal flatRate = new BigDecimal("79.00");

        public BigDecimal getFreeThreshold() { return freeThreshold; }
        public void setFreeThreshold(BigDecimal freeThreshold) { this.freeThreshold = freeThreshold; }
        public BigDecimal getFlatRate() { return flatRate; }
        public void setFlatRate(BigDecimal flatRate) { this.flatRate = flatRate; }
    }

    public Jwt getJwt() { return jwt; }
    public Cors getCors() { return cors; }
    public Cookie getCookie() { return cookie; }
    public Seed getSeed() { return seed; }
    public Razorpay getRazorpay() { return razorpay; }
    public Payment getPayment() { return payment; }
    public Cloudinary getCloudinary() { return cloudinary; }
    public Shipping getShipping() { return shipping; }
}
