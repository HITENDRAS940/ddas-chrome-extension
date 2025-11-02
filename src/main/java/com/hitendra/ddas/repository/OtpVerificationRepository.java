package com.hitendra.ddas.repository;

import com.hitendra.ddas.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for OTP verification operations
 */
@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    /**
     * Find valid OTP for email and type
     */
    @Query("SELECT o FROM OtpVerification o WHERE o.email = :email AND o.type = :type " +
           "AND o.isUsed = false AND o.expiresAt > :now ORDER BY o.createdAt DESC")
    List<OtpVerification> findValidOtpsByEmailAndType(
            @Param("email") String email,
            @Param("type") OtpVerification.OtpType type,
            @Param("now") LocalDateTime now
    );

    /**
     * Find OTP by email, OTP code and type
     */
    Optional<OtpVerification> findByEmailAndOtpAndTypeAndIsUsedFalse(
            String email, String otp, OtpVerification.OtpType type
    );

    /**
     * Count recent OTP attempts for an email
     */
    @Query("SELECT COUNT(o) FROM OtpVerification o WHERE o.email = :email " +
           "AND o.createdAt > :since")
    long countRecentOtpAttempts(
            @Param("email") String email,
            @Param("since") LocalDateTime since
    );

    /**
     * Delete expired OTPs
     */
    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    /**
     * Delete all OTPs for an email and type
     */
    void deleteByEmailAndType(String email, OtpVerification.OtpType type);
}
