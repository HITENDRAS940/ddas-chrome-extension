package com.hitendra.ddas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity to store metadata of uploaded files
 * Only metadata is stored in DB, actual hash files are stored in S3
 */
@Entity
@Table(name = "file_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false, unique = true)
    private String hashFileUrl; // S3 URL of the hash text file

    @Column(nullable = false)
    private String fileHash; // SHA-256 hash for quick comparison

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

