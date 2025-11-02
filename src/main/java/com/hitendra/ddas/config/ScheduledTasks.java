package com.hitendra.ddas.config;

import com.hitendra.ddas.service.OtpService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Scheduled tasks configuration
 */
@Configuration
@EnableScheduling
@Slf4j
public class ScheduledTasks {

    @Autowired
    private OtpService otpService;

    /**
     * Clean up expired OTPs every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void cleanupExpiredOtps() {
        log.info("Running scheduled cleanup of expired OTPs");
        otpService.cleanupExpiredOtps();
    }

    /**
     * Log system health every 6 hours
     */
    @Scheduled(fixedRate = 21600000) // 6 hours in milliseconds
    public void logSystemHealth() {
        log.info("DDAS System Health Check - Email verification system running");
    }
}
