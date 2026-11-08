package com.thanhmila.codelearning.service.email.impl;

import com.thanhmila.codelearning.dto.email.SendGridWebhookEvent;
import com.thanhmila.codelearning.entity.email.EmailDeliveryLogEntity;
import com.thanhmila.codelearning.repository.email.EmailDeliveryLogRepository;
import com.thanhmila.codelearning.repository.user.UserRepository;
import com.thanhmila.codelearning.service.email.SendGridWebhookService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SendGridWebhookServiceImpl implements SendGridWebhookService {
    EmailDeliveryLogRepository logRepository;
    UserRepository userRepository;

    @Override
    @Transactional
    public void processWebhookEvents(List<SendGridWebhookEvent> events) {
        for (SendGridWebhookEvent event : events) {
            EmailDeliveryLogEntity logEntity = EmailDeliveryLogEntity.builder()
                .email(event.getEmail())
                .eventType(event.getEvent())
                .reason(event.getReason())
                .sgEventId(event.getSg_event_id())
                .sgMessageId(event.getSg_message_id())
                .timestamp(event.getTimestamp())
                .build();
            logRepository.save(logEntity);

            if ("bounce".equals(event.getEvent()) || "spamreport".equals(event.getEvent()) 
                    || "dropped".equals(event.getEvent()) || "unsubscribe".equals(event.getEvent())) {
                userRepository.findByEmail(event.getEmail()).ifPresent(user -> {
                    user.setIsEmailValid(false);
                    userRepository.save(user);
                    log.info("Blocked user {} due to event: {}", event.getEmail(), event.getEvent());
                });
            }
        }
    }
}
