package com.hitendra.ddas.controller;

import com.hitendra.ddas.dto.AuthResponse;
import com.hitendra.ddas.dto.LoginRequest;
import com.hitendra.ddas.dto.OtpRequest;
import com.hitendra.ddas.dto.OtpVerificationRequest;
import com.hitendra.ddas.dto.SignupRequest;
import com.hitendra.ddas.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller for login and signup
 */
@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * User signup endpoint
     * POST /api/auth/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        log.info("Signup request received for username: {}", request.getUsername());

        AuthResponse response = authService.signup(request);

        // Return 201 Created for successful signup (pending verification)
        // Return 400 Bad Request for validation errors
        HttpStatus status = response.getMessage().contains("✅") ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Email verification endpoint
     * POST /api/auth/verify-email
     */
    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody OtpVerificationRequest request) {
        log.info("Email verification request received for: {}", request.getEmail());

        AuthResponse response = authService.verifyEmail(request.getEmail(), request.getOtp());

        // If token is present, verification was successful
        HttpStatus status = response.getToken() != null ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Resend OTP endpoint
     * POST /api/auth/resend-otp
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendOtp(@Valid @RequestBody OtpRequest request) {
        log.info("Resend OTP request received for: {}", request.getEmail());

        AuthResponse response = authService.resendOtp(request.getEmail());

        HttpStatus status = response.getMessage().contains("✅") ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * User login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for: {}", request.getUsernameOrEmail());

        AuthResponse response = authService.login(request);

        // If token is present, login was successful
        if (response.getToken() != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Health check for auth service
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth Service is running! 🔐");
    }
}

