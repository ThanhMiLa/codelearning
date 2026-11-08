package com.thanhmila.codelearning.service.email.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thanhmila.codelearning.configuration.RabbitMQConfig;
import com.thanhmila.codelearning.dto.email.BulkEmailMessage;
import com.thanhmila.codelearning.dto.email.SendGridEmailRequest;
import com.thanhmila.codelearning.entity.email.FailedEmailQueueEntity;
import com.thanhmila.codelearning.repository.email.FailedEmailQueueRepository;
import com.thanhmila.codelearning.service.email.SendGridApiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class EmailConsumerServiceImpl {
    final SendGridApiService sendGridApiService;
    final FailedEmailQueueRepository failedEmailQueueRepository;
    final ObjectMapper objectMapper;

    @Value("${sendgrid.from-email}")
    String fromEmail;

    @Value("${sendgrid.from-name}")
    String fromName;

    @RabbitListener(queues = RabbitMQConfig.BULK_EMAIL_QUEUE)
    public void consumeBulkEmail(BulkEmailMessage message) {
        try {
            List<SendGridEmailRequest.Personalization> personalizations = new ArrayList<>();

            for (BulkEmailMessage.UserEmailInfo userInfo : message.getUsers()) {
                SendGridEmailRequest.To to = SendGridEmailRequest.To.builder().email(userInfo.getEmail()).build();
                Map<String, Object> dynamicData = new HashMap<>();
                dynamicData.put("name", userInfo.getName()); // Pass name to template

                SendGridEmailRequest.Personalization personalization = SendGridEmailRequest.Personalization.builder()
                        .to(List.of(to))
                        .dynamic_template_data(dynamicData)
                        .build();
                personalizations.add(personalization);
            }

            SendGridEmailRequest request = SendGridEmailRequest.builder()
                    .from(SendGridEmailRequest.From.builder().email(fromEmail).name(fromName).build())
                    .template_id(message.getTemplateId())
                    .personalizations(personalizations)
                    .build();

            sendGridApiService.sendEmailBulk(request);
            log.info("Successfully sent email batch: {}", message.getBatchId());

        } catch (Exception e) {
            log.error("Failed to send email batch {}: {}", message.getBatchId(), e.getMessage());
            
            // Push to DLQ (Database)
            try {
                String payloadJson = objectMapper.writeValueAsString(message);
                FailedEmailQueueEntity failedEntity = FailedEmailQueueEntity.builder()
                        .batchId(message.getBatchId())
                        .payloadJson(payloadJson)
                        .errorReason(e.getMessage())
                        .status("PENDING_RETRY")
                        .build();
                failedEmailQueueRepository.save(failedEntity);
            } catch (Exception jsonEx) {
                log.error("Failed to parse JSON for DLQ saving: {}", jsonEx.getMessage());
            }
        }
    }
}
