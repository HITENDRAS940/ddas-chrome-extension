package com.hitendra.ddas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for storing OTP verification codes
 */
@Entity
@Table(name = "otp_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean isUsed = false;

    @Column(nullable = false)
    private Integer attempts = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpType type;

    public enum OtpType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET,
        LOGIN_VERIFICATION
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
