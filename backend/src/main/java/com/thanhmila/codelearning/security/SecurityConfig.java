package com.thanhmila.codelearning.security;

import jakarta.servlet.http.Cookie;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SecurityConfig {

    static final String[] AUTH_ENTRY_ENDPOINTS = {"/auth/login", "/auth/register", "/auth/refresh", "/auth/google"};

    final CustomJwtDecoder customJwtDecoder;
    final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    final IpRateLimitFilter ipRateLimitFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    List<String> allowedOrigins;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(ipRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        // 1. Pre-flight request (CORS)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Các API xác thực (Auth)
                        .requestMatchers(AUTH_ENTRY_ENDPOINTS).permitAll()

                        // 3. Các API Public để xem dữ liệu (Giới hạn HTTP GET)
                        .requestMatchers(HttpMethod.GET, "/courses/**", "/lessons/{lessonId}", "/contests", "/contests/*/leaderboard").permitAll()
                        .requestMatchers("/online-judge/problems/practice").permitAll()

                        // 4. Các API Webhook / Callback từ hệ thống bên thứ 3
                        .requestMatchers(HttpMethod.POST, "/payment/webhook").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/online-judge/submissions").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/online-judge/webhooks/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/webhooks/sendgrid").permitAll()

                        // 5. API Response Error
                        .requestMatchers("/error").permitAll()

                        // 6. Tất cả các request còn lại đều yêu cầu xác thực
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(bearerTokenResolver())
                        .jwt(jwt -> jwt
                                .decoder(customJwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                );

        return http.build();
    }

    @Bean
    BearerTokenResolver bearerTokenResolver(){
        DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
        List<PathPatternRequestMatcher> authEntryMatchers = Arrays.stream(AUTH_ENTRY_ENDPOINTS)
                .map(PathPatternRequestMatcher.withDefaults()::matcher)
                .toList();
        return request -> {
            // These endpoints authenticate credentials or a refresh token themselves.
            if (authEntryMatchers.stream().anyMatch(matcher -> matcher.matches(request))) {
                return null;
            }

            String token = defaultResolver.resolve(request);

            if (token != null && !token.isBlank()) {
                return token;
            }

            Cookie[] cookies = request.getCookies();

            if(cookies == null) {
                return null;
            }

            for (Cookie cookie : cookies){
                if("access_token".equals(cookie.getName())){
                    String cookieToken = cookie.getValue();
                    if(cookieToken != null && !cookieToken.isBlank())
                        return cookieToken;
                }
            }
            return null;
        };
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cấu hình các domain frontend được phép gọi API
        configuration.setAllowedOrigins(allowedOrigins); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng cấu hình CORS này cho toàn bộ endpoint (/**)
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
