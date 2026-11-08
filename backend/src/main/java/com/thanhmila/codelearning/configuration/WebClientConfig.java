package com.thanhmila.codelearning.configuration;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import io.netty.resolver.DefaultAddressResolverGroup;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.Assert;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WebClientConfig {

    @Value("${judge0.base-url}")
    String baseUrl;

    @Value("${judge0.timeout:20s}")
    Duration timeout;

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }

    @Bean
    public WebClient judge0WebClient(WebClient.Builder builder) {
        Assert.hasText(baseUrl, "Cấu hình 'judge0.base-url' không được để rỗng! Hãy kiểm tra biến môi trường.");

        int timeoutMillis = (int) timeout.toMillis();

        HttpClient httpClient = HttpClient.create()
                .resolver(DefaultAddressResolverGroup.INSTANCE)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutMillis)
                .responseTimeout(timeout)
                .doOnConnected(connection ->
                        connection
                                .addHandlerLast(new ReadTimeoutHandler(timeoutMillis, TimeUnit.MILLISECONDS))
                                .addHandlerLast(new WriteTimeoutHandler(timeoutMillis, TimeUnit.MILLISECONDS))
                );

        return builder.clone()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    @Bean
    public WebClient payosWebClient(WebClient.Builder builder, ProjectProperties.Payos payosProps) {
        Assert.hasText(payosProps.getBaseUrl(), "Cấu hình 'payos.base-url' không được để rỗng!");
        Assert.hasText(payosProps.getClientId(), "Cấu hình 'payos.client-id' không được để rỗng!");
        Assert.hasText(payosProps.getApiKey(), "Cấu hình 'payos.api-key' không được để rỗng!");
        Assert.hasText(payosProps.getChecksumKey(), "Cấu hình 'payos.checksum-key' không được để rỗng!");
        Assert.hasText(payosProps.getReturnUrl(), "Cấu hình 'payos.return-url' không được để rỗng!");
        Assert.hasText(payosProps.getCancelUrl(), "Cấu hình 'payos.cancel-url' không được để rỗng!");
        Assert.isTrue(payosProps.getTimeout() != null && !payosProps.getTimeout().isNegative() && !payosProps.getTimeout().isZero(),
                "Cấu hình 'payos.timeout' phải là khoảng thời gian dương!");

        int timeoutMillis = (int) payosProps.getTimeout().toMillis();

        HttpClient httpClient = HttpClient.create()
                .resolver(DefaultAddressResolverGroup.INSTANCE)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutMillis)
                .responseTimeout(payosProps.getTimeout())
                .doOnConnected(connection ->
                        connection
                                .addHandlerLast(new ReadTimeoutHandler(timeoutMillis, TimeUnit.MILLISECONDS))
                                .addHandlerLast(new WriteTimeoutHandler(timeoutMillis, TimeUnit.MILLISECONDS))
                );

        return builder.clone()
                .baseUrl(payosProps.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("x-client-id", payosProps.getClientId())
                .defaultHeader("x-api-key", payosProps.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "sendgrid", name = "enabled", havingValue = "true", matchIfMissing = true)
    public WebClient sendGridWebClient(WebClient.Builder builder) {
        return builder.clone().build();
    }
}