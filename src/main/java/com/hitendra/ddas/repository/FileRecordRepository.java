package com.hitendra.ddas.repository;

import com.hitendra.ddas.entity.FileRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for FileRecord entity
 */
@Repository
public interface FileRecordRepository extends JpaRepository<FileRecord, Long> {

    /**
     * Find all file records for a specific user
     */
    List<FileRecord> findByUserId(String userId);

    /**
     * Check if a file with specific hash exists for a user
     */
    Optional<FileRecord> findByUserIdAndFileHash(String userId, String fileHash);

    /**
     * Check if hash already exists for a user
     */
    boolean existsByUserIdAndFileHash(String userId, String fileHash);
}

