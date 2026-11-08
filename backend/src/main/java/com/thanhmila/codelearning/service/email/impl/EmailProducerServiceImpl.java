package com.thanhmila.codelearning.service.email.impl;

import com.thanhmila.codelearning.configuration.RabbitMQConfig;
import com.thanhmila.codelearning.dto.email.BulkEmailMessage;
import com.thanhmila.codelearning.dto.request.EmailCampaignRequest;
import com.thanhmila.codelearning.entity.user.UserEntity;
import com.thanhmila.codelearning.repository.user.UserRepository;
import com.thanhmila.codelearning.service.email.EmailProducerService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.util.Objects;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailProducerServiceImpl implements EmailProducerService {
    RabbitTemplate rabbitTemplate;
    UserRepository userRepository;
    
    @Override
    public void processAndSendCampaign(EmailCampaignRequest request) {
        List<UserEntity> validUsers;

        if ("ALL".equalsIgnoreCase(request.getTargetType())) {
            validUsers = userRepository.findByIsEmailValidTrue();
        } else if ("SPECIFIC".equalsIgnoreCase(request.getTargetType())) {
            if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
                return;
            }
            List<Long> parsedIds = request.getUserIds().stream()
                    .map(id -> {
                        try {
                            return Long.parseLong(id);
                        } catch (NumberFormatException e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (parsedIds.isEmpty()) return;

            validUsers = userRepository.findAllById(parsedIds).stream()
                    .filter(UserEntity::getIsEmailValid)
                    .collect(Collectors.toList());
        } else {
            // Future extensions like "ROLE" could be handled here
            return;
        }

        List<BulkEmailMessage.UserEmailInfo> userInfos = validUsers.stream()
                .map(u -> new BulkEmailMessage.UserEmailInfo(u.getEmail(), u.getDisplayName() != null ? u.getDisplayName() : u.getUsername()))
                .collect(Collectors.toList());

        // SendGrid limit is 1000 emails/request. Cut 500 emails per batch for safety.
        int batchSize = 500; 
        
        for (int i = 0; i < userInfos.size(); i += batchSize) {
            List<BulkEmailMessage.UserEmailInfo> batch = userInfos.subList(i, Math.min(i + batchSize, userInfos.size()));
            
            BulkEmailMessage message = BulkEmailMessage.builder()
                    .batchId("BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .templateId(request.getTemplateId())
                    .users(batch)
                    .build();

            rabbitTemplate.convertAndSend(
                RabbitMQConfig.EMAIL_EXCHANGE, 
                RabbitMQConfig.ROUTING_KEY_BULK_EMAIL, 
                message
            );
        }
    }
}
