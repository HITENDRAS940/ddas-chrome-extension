package com.hitendra.ddas.service;

import com.hitendra.ddas.entity.OtpVerification;
import com.hitendra.ddas.repository.OtpVerificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for OTP generation and verification
 */
@Service
@Slf4j
public class OtpService {

    @Autowired
    private OtpVerificationRepository otpRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:3}")
    private int maxOtpAttempts;

    private final SecureRandom random = new SecureRandom();

    /**
     * Generate and send OTP for email verification
     */
    @Transactional
    public boolean generateAndSendOtp(String email, OtpVerification.OtpType type) {
        try {
            // Check if too many recent attempts
            if (hasExceededRateLimit(email)) {
                log.warn("Rate limit exceeded for email: {}", email);
                return false;
            }

            // Invalidate any existing OTPs for this email and type
            invalidateExistingOtps(email, type);

            // Generate new OTP
            String otp = generateOtp();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpExpiryMinutes);

            // Save OTP to database
            OtpVerification otpVerification = new OtpVerification();
            otpVerification.setEmail(email);
            otpVerification.setOtp(otp);
            otpVerification.setType(type);
            otpVerification.setExpiresAt(expiresAt);
            otpVerification.setIsUsed(false);
            otpVerification.setAttempts(0);

            otpRepository.save(otpVerification);

            // Send OTP via email
            String purpose = getPurposeText(type);
            boolean emailSent = emailService.sendOtpEmail(email, otp, purpose);

            if (!emailSent) {
                log.error("Failed to send OTP email for: {}", email);
                return false;
            }

            log.info("OTP generated and sent successfully for email: {}", email);
            return true;

        } catch (Exception e) {
            log.error("Error generating OTP for email: {}", email, e);
            return false;
        }
    }

    /**
     * Verify OTP code
     */
    @Transactional
    public boolean verifyOtp(String email, String otp, OtpVerification.OtpType type) {
        try {
            // Find the OTP record
            var otpRecordOpt = otpRepository.findByEmailAndOtpAndTypeAndIsUsedFalse(email, otp, type);

            if (otpRecordOpt.isEmpty()) {
                log.warn("Invalid OTP provided for email: {}", email);
                return false;
            }

            OtpVerification otpRecord = otpRecordOpt.get();

            // Check if OTP has expired
            if (otpRecord.getExpiresAt().isBefore(LocalDateTime.now())) {
                log.warn("Expired OTP provided for email: {}", email);
                return false;
            }

            // Check if max attempts exceeded
            if (otpRecord.getAttempts() >= maxOtpAttempts) {
                log.warn("Max OTP attempts exceeded for email: {}", email);
                return false;
            }

            // Mark OTP as used
            otpRecord.setIsUsed(true);
            otpRecord.setAttempts(otpRecord.getAttempts() + 1);
            otpRepository.save(otpRecord);

            log.info("OTP verified successfully for email: {}", email);
            return true;

        } catch (Exception e) {
            log.error("Error verifying OTP for email: {}", email, e);
            return false;
        }
    }

    /**
     * Generate random 6-digit OTP
     */
    private String generateOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Check if rate limit is exceeded (max 3 OTPs per hour)
     */
    private boolean hasExceededRateLimit(String email) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentAttempts = otpRepository.countRecentOtpAttempts(email, oneHourAgo);
        return recentAttempts >= 3;
    }

    /**
     * Invalidate existing OTPs for email and type
     */
    private void invalidateExistingOtps(String email, OtpVerification.OtpType type) {
        List<OtpVerification> existingOtps = otpRepository.findValidOtpsByEmailAndType(
                email, type, LocalDateTime.now());

        for (OtpVerification otp : existingOtps) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
        }
    }

    /**
     * Get purpose text for email
     */
    private String getPurposeText(OtpVerification.OtpType type) {
        return switch (type) {
            case EMAIL_VERIFICATION -> "email verification";
            case PASSWORD_RESET -> "password reset";
            case LOGIN_VERIFICATION -> "login verification";
        };
    }

    /**
     * Clean up expired OTPs (should be called periodically)
     */
    @Transactional
    public void cleanupExpiredOtps() {
        try {
            otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
            log.info("Expired OTPs cleaned up successfully");
        } catch (Exception e) {
            log.error("Error cleaning up expired OTPs", e);
        }
    }
}
