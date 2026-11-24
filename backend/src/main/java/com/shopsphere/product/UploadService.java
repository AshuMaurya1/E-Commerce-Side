package com.shopsphere.product;

import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.config.AppProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {

    private static final long MAX_FILE_BYTES = 5 * 1024 * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/avif"
    );

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    public UploadService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public record UploadResult(String url, String storageProvider) {}

    public UploadResult uploadProductImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image file to upload");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new BadRequestException("Image file size must not exceed 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Only JPEG, PNG, WEBP, and AVIF images are supported");
        }

        if (appProperties.getCloudinary().isConfigured()) {
            return uploadToCloudinary(file);
        }
        return saveLocally(file, contentType);
    }

    @SuppressWarnings("unchecked")
    private UploadResult uploadToCloudinary(MultipartFile file) {
        AppProperties.Cloudinary cfg = appProperties.getCloudinary();
        long timestamp = Instant.now().getEpochSecond();
        String folder = "shopsphere/products";
        String payloadToSign = "folder=" + folder + "&timestamp=" + timestamp + cfg.getApiSecret();
        String signature = sha1Hex(payloadToSign);

        try {
            byte[] bytes = file.getBytes();
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "product.jpg";
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            });
            body.add("api_key", cfg.getApiKey());
            body.add("timestamp", String.valueOf(timestamp));
            body.add("folder", folder);
            body.add("signature", signature);

            Map<String, Object> response = restClient.post()
                    .uri("https://api.cloudinary.com/v1_1/" + cfg.getCloudName() + "/image/upload")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null || response.get("secure_url") == null) {
                throw new BadRequestException("Cloudinary upload did not return an image URL");
            }
            return new UploadResult(response.get("secure_url").toString(), "cloudinary");
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded image");
        }
    }

    private UploadResult saveLocally(MultipartFile file, String contentType) {
        String ext = switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/avif" -> ".avif";
            default -> ".jpg";
        };
        try {
            Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);
            String filename = UUID.randomUUID() + ext;
            Path target = uploadDir.resolve(filename);
            Files.write(target, file.getBytes());
            return new UploadResult("/uploads/" + filename, "local");
        } catch (IOException e) {
            throw new BadRequestException("Failed to store uploaded image");
        }
    }

    private String sha1Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 unavailable", e);
        }
    }
}
