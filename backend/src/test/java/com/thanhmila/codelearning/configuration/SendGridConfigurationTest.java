package com.thanhmila.codelearning.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thanhmila.codelearning.controller.admin.AdminEmailController;
import com.thanhmila.codelearning.controller.email.SendGridWebhookController;
import com.thanhmila.codelearning.repository.email.EmailDeliveryLogRepository;
import com.thanhmila.codelearning.repository.email.FailedEmailQueueRepository;
import com.thanhmila.codelearning.repository.user.UserRepository;
import com.thanhmila.codelearning.service.email.impl.EmailConsumerServiceImpl;
import com.thanhmila.codelearning.service.email.impl.EmailProducerServiceImpl;
import com.thanhmila.codelearning.service.email.impl.SendGridApiServiceImpl;
import com.thanhmila.codelearning.service.email.impl.SendGridWebhookServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.reactive.function.client.WebClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SendGridConfigurationTest {

    private static final Class<?>[] EMAIL_COMPONENTS = {
            AdminEmailController.class,
            SendGridWebhookController.class,
            EmailConsumerServiceImpl.class,
            EmailProducerServiceImpl.class,
            SendGridApiServiceImpl.class,
            SendGridWebhookServiceImpl.class
    };

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(PropertyPlaceholderAutoConfiguration.class))
            .withUserConfiguration(EMAIL_COMPONENTS);

    @Test
    void devStartsWithSendGridDisabledWithoutCredentialsOrEmailDependencies() {
        contextRunner
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withPropertyValues("spring.profiles.active=dev")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getEnvironment().getProperty("sendgrid.enabled")).isEqualTo("false");
                    for (Class<?> component : EMAIL_COMPONENTS) {
                        assertThat(context).doesNotHaveBean(component);
                    }
                });
    }

    @Test
    void explicitFlagDisablesAllEmailComponents() {
        contextRunner.withPropertyValues("sendgrid.enabled=false").run(context -> {
            assertThat(context).hasNotFailed();
            for (Class<?> component : EMAIL_COMPONENTS) {
                assertThat(context).doesNotHaveBean(component);
            }
        });
    }

    @Test
    void explicitFlagEnablesEmailComponents() {
        enabledContextRunner().withPropertyValues("sendgrid.enabled=true").run(context -> {
            assertThat(context).hasNotFailed();
            for (Class<?> component : EMAIL_COMPONENTS) {
                assertThat(context).hasSingleBean(component);
            }
        });
    }

    @Test
    void missingFlagPreservesEnabledBehavior() {
        enabledContextRunner().run(context -> {
            assertThat(context).hasNotFailed();
            for (Class<?> component : EMAIL_COMPONENTS) {
                assertThat(context).hasSingleBean(component);
            }
        });
    }

    private ApplicationContextRunner enabledContextRunner() {
        return contextRunner
                .withPropertyValues(
                        "sendgrid.api-key=test-key",
                        "sendgrid.webhook-public-key=test-public-key",
                        "sendgrid.from-email=test@example.com",
                        "sendgrid.from-name=CodeLearning")
                .withBean("sendGridWebClient", WebClient.class, () -> mock(WebClient.class))
                .withBean(RabbitTemplate.class, () -> mock(RabbitTemplate.class))
                .withBean(UserRepository.class, () -> mock(UserRepository.class))
                .withBean(EmailDeliveryLogRepository.class, () -> mock(EmailDeliveryLogRepository.class))
                .withBean(FailedEmailQueueRepository.class, () -> mock(FailedEmailQueueRepository.class))
                .withBean(ObjectMapper.class, ObjectMapper::new);
    }
}
