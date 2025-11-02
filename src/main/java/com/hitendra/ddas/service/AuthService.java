package com.hitendra.ddas.service;

import com.hitendra.ddas.dto.AuthResponse;
import com.hitendra.ddas.dto.LoginRequest;
import com.hitendra.ddas.dto.SignupRequest;
import com.hitendra.ddas.entity.OtpVerification;
import com.hitendra.ddas.entity.User;
import com.hitendra.ddas.repository.UserRepository;
import com.hitendra.ddas.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for user authentication (signup and login)
 */
@Service
@Slf4j
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    /**
     * Register a new user (requires email verification)
     */
    public AuthResponse signup(SignupRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse("❌ Username already taken!");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse("❌ Email already registered!");
        }

        // Create new user (inactive until email verification)
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setIsActive(false); // User inactive until email verification
        user.setIsEmailVerified(false);

        userRepository.save(user);

        // Send email verification OTP
        boolean otpSent = otpService.generateAndSendOtp(user.getEmail(), OtpVerification.OtpType.EMAIL_VERIFICATION);

        if (!otpSent) {
            log.error("Failed to send verification email for user: {}", user.getUsername());
            return new AuthResponse("❌ Failed to send verification email. Please try again.");
        }

        log.info("New user registered (pending verification): {}", user.getUsername());

        return new AuthResponse("✅ Account created! Please check your email for verification code.");
    }

    /**
     * Verify email with OTP
     */
    public AuthResponse verifyEmail(String email, String otp) {
        try {
            // Find user by email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if already verified
            if (user.getIsEmailVerified()) {
                return new AuthResponse("✅ Email already verified!");
            }

            // Verify OTP
            boolean otpValid = otpService.verifyOtp(email, otp, OtpVerification.OtpType.EMAIL_VERIFICATION);

            if (!otpValid) {
                return new AuthResponse("❌ Invalid or expired OTP!");
            }

            // Mark user as verified and active
            user.setIsEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            user.setIsActive(true);
            userRepository.save(user);

            // Send welcome email
            emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());

            // Generate JWT token
            String token = tokenProvider.generateToken(user.getUsername());

            log.info("Email verified successfully for user: {}", user.getUsername());

            return new AuthResponse(
                    token,
                    user.getUsername(),
                    user.getEmail(),
                    user.getFullName(),
                    "✅ Email verified successfully! Welcome to DDAS!"
            );

        } catch (Exception e) {
            log.error("Error verifying email for: {}", email, e);
            return new AuthResponse("❌ Email verification failed!");
        }
    }

    /**
     * Resend OTP for email verification
     */
    public AuthResponse resendOtp(String email) {
        try {
            // Find user by email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if already verified
            if (user.getIsEmailVerified()) {
                return new AuthResponse("✅ Email already verified!");
            }

            // Send new OTP
            boolean otpSent = otpService.generateAndSendOtp(email, OtpVerification.OtpType.EMAIL_VERIFICATION);

            if (!otpSent) {
                return new AuthResponse("❌ Failed to send OTP. Please try again later.");
            }

            log.info("OTP resent successfully for email: {}", email);
            return new AuthResponse("✅ New verification code sent to your email!");

        } catch (Exception e) {
            log.error("Error resending OTP for email: {}", email, e);
            return new AuthResponse("❌ Failed to resend OTP!");
        }
    }

    /**
     * Authenticate user login
     */
    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsernameOrEmail(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details
            User user = userRepository.findByUsername(request.getUsernameOrEmail())
                    .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if email is verified
            if (!user.getIsEmailVerified()) {
                return new AuthResponse("❌ Please verify your email first. Check your inbox for verification code.");
            }

            // Check if user is active
            if (!user.getIsActive()) {
                return new AuthResponse("❌ Account is deactivated. Please contact support.");
            }

            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Generate JWT token
            String token = tokenProvider.generateToken(user.getUsername());

            log.info("User logged in: {}", user.getUsername());

            return new AuthResponse(
                    token,
                    user.getUsername(),
                    user.getEmail(),
                    user.getFullName(),
                    "✅ Login successful!"
            );

        } catch (Exception e) {
            log.error("Login failed for user: {}", request.getUsernameOrEmail());
            return new AuthResponse("❌ Invalid username/email or password!");
        }
    }

    /**
     * Get current authenticated username
     */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return null;
    }
}

