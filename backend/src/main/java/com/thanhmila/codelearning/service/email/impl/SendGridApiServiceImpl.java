package com.thanhmila.codelearning.service.email.impl;

import com.thanhmila.codelearning.dto.email.SendGridEmailRequest;
import com.thanhmila.codelearning.service.email.SendGridApiService;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendGridApiServiceImpl implements SendGridApiService {
    
    final WebClient webClient;
    
    @Value("${sendgrid.api-key}") 
    String apiKey;

    public SendGridApiServiceImpl(@Qualifier("sendGridWebClient") WebClient webClient) {
        this.webClient = webClient;
    }
    
    @Override
    public void sendEmailBulk(SendGridEmailRequest request) {
        webClient.post()
                .uri("https://api.sendgrid.com/v3/mail/send")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), 
                          response -> response.bodyToMono(String.class).flatMap(errorBody -> Mono.error(new RuntimeException("SendGrid API Error: " + errorBody))))
                .bodyToMono(Void.class)
                .block();
    }

    @Override
    public Object getTemplates() {
        return webClient.get()
                .uri("https://api.sendgrid.com/v3/templates?generations=dynamic")
                .header("Authorization", "Bearer " + apiKey)
                .retrieve()
                .bodyToMono(Object.class)
                .block();
    }
}
