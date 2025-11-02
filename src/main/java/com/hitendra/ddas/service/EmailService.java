package com.hitendra.ddas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails
 */
@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send OTP verification email
     */
    public boolean sendOtpEmail(String toEmail, String otp, String purpose) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("DDAS - Email Verification Code");

            String emailBody = buildOtpEmailBody(otp, purpose);
            message.setText(emailBody);

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
            return true;

        } catch (MailException e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            return false;
        }
    }

    /**
     * Send welcome email after successful verification
     */
    public boolean sendWelcomeEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to DDAS - Duplicate Detection & Archive System");

            String emailBody = buildWelcomeEmailBody(username);
            message.setText(emailBody);

            mailSender.send(message);
            log.info("Welcome email sent successfully to: {}", toEmail);
            return true;

        } catch (MailException e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
            return false;
        }
    }

    /**
     * Build OTP email body
     */
    private String buildOtpEmailBody(String otp, String purpose) {
        return String.format("""
            Dear User,
            
            Your verification code for %s is:
            
            %s
            
            This code will expire in 5 minutes. Please do not share this code with anyone.
            
            If you didn't request this verification code, please ignore this email.
            
            Best regards,
            DDAS Team
            """, purpose, otp);
    }

    /**
     * Build welcome email body
     */
    private String buildWelcomeEmailBody(String username) {
        return String.format("""
            Dear %s,
            
            Welcome to DDAS (Duplicate Detection & Archive System)!
            
            Your email has been successfully verified and your account is now active.
            You can now start using our Chrome extension to detect duplicate files and manage your downloads.
            
            Features you can now access:
            • Upload files to check for duplicates
            • Automatic download monitoring
            • Secure file storage and management
            • Real-time duplicate detection
            
            Thank you for choosing DDAS!
            
            Best regards,
            DDAS Team
            """, username);
    }
}
