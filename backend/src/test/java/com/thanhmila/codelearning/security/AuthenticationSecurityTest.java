package com.thanhmila.codelearning.security;

import com.thanhmila.codelearning.controller.auth.AuthenticationController;
import com.thanhmila.codelearning.dto.response.AuthenticationResponse;
import com.thanhmila.codelearning.exception.AppException;
import com.thanhmila.codelearning.exception.ErrorCode;
import com.thanhmila.codelearning.service.auth.AuthenticationService;
import com.thanhmila.codelearning.service.auth.RateLimitService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthenticationController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
@ActiveProfiles("test")
class AuthenticationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthenticationService authenticationService;

    @MockitoBean
    private CustomJwtDecoder jwtDecoder;

    @MockitoBean
    private RateLimitService rateLimitService;

    @MockitoBean
    private UserRateLimitInterceptor userRateLimitInterceptor;

    @BeforeEach
    void setUp() throws Exception {
        when(rateLimitService.tryConsumeIp(anyString())).thenReturn(true);
        when(userRateLimitInterceptor.preHandle(any(), any(), any())).thenReturn(true);
    }

    @Test
    void loginWithStaleAccessCookieReachesControllerAndSetsNewCookies() throws Exception {
        when(authenticationService.login(any())).thenReturn(tokens());

        mockMvc.perform(post("/codelearning/auth/login").contextPath("/codelearning")
                        .cookie(new Cookie("access_token", "stale-token"))
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));

        verify(authenticationService).login(any());
        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void registerWithStaleAccessCookieReachesController() throws Exception {
        when(authenticationService.register(any())).thenReturn(tokens());

        mockMvc.perform(post("/auth/register")
                        .cookie(new Cookie("access_token", "stale-token"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Test User","username":"testuser","email":"test@example.com",
                                 "password":"password","confirmPassword":"password"}
                                """))
                .andExpect(status().isOk());

        verify(authenticationService).register(any());
        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void refreshWithStaleAccessCookieUsesRefreshToken() throws Exception {
        when(authenticationService.refresh("valid-refresh")).thenReturn(tokens());

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("access_token", "stale-token"), new Cookie("refresh_token", "valid-refresh")))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));

        verify(authenticationService).refresh("valid-refresh");
        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void loginStillRejectsIncorrectCredentials() throws Exception {
        when(authenticationService.login(any())).thenThrow(new AppException(ErrorCode.INVALID_USERNAME_OR_PASSWORD));

        mockMvc.perform(post("/auth/login")
                        .cookie(new Cookie("access_token", "stale-token"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_USERNAME_OR_PASSWORD.getCode()));
    }

    @Test
    void refreshStillRejectsInvalidRefreshToken() throws Exception {
        when(authenticationService.refresh("invalid-refresh")).thenThrow(new AppException(ErrorCode.INVALID_TOKEN));

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("access_token", "stale-token"), new Cookie("refresh_token", "invalid-refresh")))
                .andExpect(status().isUnauthorized());

        verify(authenticationService).refresh("invalid-refresh");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/auth/login", "/auth/register", "/auth/refresh", "/auth/google"})
    void authEndpointsIgnoreMalformedBearerHeaders(String path) throws Exception {
        if ("/auth/refresh".equals(path)) {
            when(authenticationService.refresh(null)).thenThrow(new AppException(ErrorCode.INVALID_TOKEN));
        }

        mockMvc.perform(post(path).header(HttpHeaders.AUTHORIZATION, "Bearer invalid token"))
                .andExpect("/auth/refresh".equals(path) ? status().isUnauthorized() : status().isBadRequest());

        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void protectedEndpointStillRejectsInvalidAccessCookie() throws Exception {
        when(jwtDecoder.decode("stale-token")).thenThrow(new BadJwtException("Invalid token"));

        mockMvc.perform(get("/users/me").cookie(new Cookie("access_token", "stale-token")))
                .andExpect(status().isUnauthorized());

        verify(jwtDecoder).decode("stale-token");
    }

    @Test
    void protectedEndpointStillRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginStillEnforcesIpRateLimit() throws Exception {
        when(rateLimitService.tryConsumeIp(anyString())).thenReturn(false);

        mockMvc.perform(post("/auth/login")
                        .cookie(new Cookie("access_token", "stale-token")))
                .andExpect(status().isTooManyRequests());

        verifyNoInteractions(authenticationService);
    }

    private AuthenticationResponse tokens() {
        return AuthenticationResponse.builder()
                .accessToken("new-access-token")
                .refreshToken("new-refresh-token")
                .build();
    }
}
