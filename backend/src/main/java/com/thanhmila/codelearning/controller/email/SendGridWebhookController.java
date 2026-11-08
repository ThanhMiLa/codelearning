package com.thanhmila.codelearning.controller.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thanhmila.codelearning.dto.email.SendGridWebhookEvent;
import com.thanhmila.codelearning.dto.response.ApiResponse;
import com.thanhmila.codelearning.service.email.SendGridWebhookService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@Slf4j
@ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
@RestController
@RequestMapping("/api/webhooks/sendgrid")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendGridWebhookController {
    final SendGridWebhookService webhookService;
    final ObjectMapper objectMapper;

    @Value("${sendgrid.webhook-public-key}")
    String webhookPublicKey;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> handleWebhook(
            @RequestHeader(value = "X-Twilio-Email-Event-Webhook-Signature", required = false) String signature,
            @RequestHeader(value = "X-Twilio-Email-Event-Webhook-Timestamp", required = false) String timestamp,
            @RequestBody String rawPayload) {
            
        // 1. Xác thực bảo mật (Verify Signature)
        boolean isValid = verifySendGridSignature(webhookPublicKey, rawPayload, signature, timestamp);
        
        if (!isValid) {
            log.warn("🚨 SECURITY WARNING: Invalid SendGrid webhook signature!");
            return ResponseEntity.status(401).body(ApiResponse.<Void>builder()
                    .status(401)
                    .code(1001) // Mã code tự định nghĩa cho lỗi bảo mật
                    .message("Invalid SendGrid webhook signature")
                    .timestamp(Instant.now().toString())
                    .build());
        }

        // 2. Chuyển đổi JSON string thành Object và xử lý logic
        try {
            List<SendGridWebhookEvent> events = objectMapper.readValue(rawPayload, new TypeReference<List<SendGridWebhookEvent>>() {});
            webhookService.processWebhookEvents(events);
        } catch (Exception e) {
            log.error("Error parsing or processing SendGrid webhook: ", e);
            // Vẫn trả về 200 OK để SendGrid không gửi lại request liên tục
        }
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200)
                .code(1000)
                .message("Handle SendGrid webhook successfully")
                .timestamp(Instant.now().toString())
                .build());
    }

    // Hàm tiện ích để xác thực chữ ký
    private boolean verifySendGridSignature(String publicKey, String payload, String signature, String timestamp) {
        // Todo: Triển khai code mã hóa ECDSA kiểm tra chữ ký ở đây bằng thư viện SendGrid
        // Hiện tại kiểm tra cơ bản
        if (publicKey == null || publicKey.isEmpty()) {
            return false;
        }
        return signature != null && !signature.isEmpty() && timestamp != null && !timestamp.isEmpty();
    }
}
