package com.thanhmila.codelearning.controller.admin;

import com.thanhmila.codelearning.dto.request.EmailCampaignRequest;
import com.thanhmila.codelearning.dto.response.ApiResponse;
import com.thanhmila.codelearning.service.email.EmailProducerService;
import com.thanhmila.codelearning.service.email.SendGridApiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.Instant;

@ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
@RestController
@RequestMapping("/admin/emails")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminEmailController {
    EmailProducerService emailProducerService;
    SendGridApiService sendGridApiService;

    @GetMapping("/templates")
    @PreAuthorize("hasAuthority('ADMIN_EMAIL_VIEW')")
    public ResponseEntity<ApiResponse<Object>> getSendGridTemplates() {
        Object templates = sendGridApiService.getTemplates();
        
        return ResponseEntity.ok(ApiResponse.<Object>builder()
                .status(200)
                .code(1000)
                .message("Get SendGrid templates successfully")
                .result(templates)
                .timestamp(Instant.now().toString())
                .build());
    }

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('ADMIN_EMAIL_SEND')")
    public ResponseEntity<ApiResponse<String>> sendEmailCampaign(@Valid @RequestBody EmailCampaignRequest request) {
        emailProducerService.processAndSendCampaign(request);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .status(200)
                .code(1000)
                .message("Push email campaign request successfully")
                .result("Đã đẩy yêu cầu gửi email campaign vào hàng đợi thành công!")
                .timestamp(Instant.now().toString())
                .build());
    }
}
