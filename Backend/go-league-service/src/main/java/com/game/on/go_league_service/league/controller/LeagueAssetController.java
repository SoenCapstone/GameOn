package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.LeagueLogoResponse;
import com.game.on.go_league_service.league.service.LeagueService;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leagues")
@RequiredArgsConstructor
public class LeagueAssetController {

    private final LeagueService leagueService;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.region:us-east-1}")
    private String region;

    private static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};

    private void validateImageContentType(String contentType) {
        if (contentType == null || contentType.isEmpty()) {
            throw new ValidationException("Content-Type is required for image upload");
        }
        boolean isValid = false;
        for (String allowed : ALLOWED_IMAGE_TYPES) {
            if (allowed.equals(contentType)) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            throw new ValidationException("Only image uploads are supported. Allowed types: image/jpeg, image/png, image/gif, image/webp");
        }
    }

    /**
     * Upload a league logo image. The backend handles S3 upload and DB update.
     * POST /api/v1/leagues/{leagueId}/logo with multipart/form-data
     */
    @PostMapping("/{leagueId}/logo")
    public ResponseEntity<LeagueLogoResponse> uploadLeagueLogo(
            @PathVariable String leagueId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        String contentType = file.getContentType();
        validateImageContentType(contentType);

        // Determine extension from content type
        String ext = ".jpg";
        if (contentType != null) {
            switch (contentType.toLowerCase()) {
                case "image/jpeg" -> ext = ".jpg";
                case "image/png" -> ext = ".png";
                case "image/gif" -> ext = ".gif";
                case "image/webp" -> ext = ".webp";
            }
        }

        String key = String.format("league-logos/%s%s", leagueId, ext);
        byte[] fileBytes = file.getBytes();

        // Upload to S3
        try (S3Client s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build()) {

            var putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileBytes));
        }

        String publicUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);

        // Update league with logo URL in database
        leagueService.updateLeaugeLogo(UUID.fromString(leagueId), publicUrl);

        return ResponseEntity.ok(new LeagueLogoResponse(publicUrl, key));
    }
}