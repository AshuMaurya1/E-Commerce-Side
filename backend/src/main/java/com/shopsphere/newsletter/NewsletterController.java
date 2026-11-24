package com.shopsphere.newsletter;

import com.shopsphere.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {
    boolean existsByEmailIgnoreCase(String email);
}

@RestController
@RequestMapping("/api/v1/newsletter")
public class NewsletterController {

    private final NewsletterSubscriberRepository repository;

    public NewsletterController(NewsletterSubscriberRepository repository) {
        this.repository = repository;
    }

    public record SubscribeRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Please enter a valid email address")
            @Size(max = 180)
            String email
    ) {}

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<Void>> subscribe(@Valid @RequestBody SubscribeRequest request) {
        String normalized = request.email().trim().toLowerCase();
        if (!repository.existsByEmailIgnoreCase(normalized)) {
            NewsletterSubscriber sub = new NewsletterSubscriber();
            sub.setEmail(normalized);
            repository.save(sub);
        }
        return ResponseEntity.ok(ApiResponse.ok("Subscribed to ShopSphere updates", null));
    }
}
