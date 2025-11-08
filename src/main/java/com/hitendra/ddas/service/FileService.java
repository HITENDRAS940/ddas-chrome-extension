package com.hitendra.ddas.service;

import com.hitendra.ddas.dto.FileListResponse;
import com.hitendra.ddas.dto.FileUploadResponse;
import com.hitendra.ddas.entity.FileRecord;
import com.hitendra.ddas.repository.FileRecordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Core service for file duplication detection
 * Orchestrates hashing, S3 storage, and database operations
 */
@Service
@Slf4j
public class FileService {

    private final HashService hashService;
    private final S3Service s3Service;
    private final FileRecordRepository fileRecordRepository;

    public FileService(HashService hashService, S3Service s3Service, FileRecordRepository fileRecordRepository) {
        this.hashService = hashService;
        this.s3Service = s3Service;
        this.fileRecordRepository = fileRecordRepository;
    }

    /**
     * Process uploaded file:
     * 1. Generate hash
     * 2. Check for duplicates
     * 3. If duplicate, return existing file info
     * 4. If unique, upload hash to S3 and save metadata to DB
     */
    @Transactional
    public FileUploadResponse processFile(MultipartFile file, String userId) {
        log.info("Processing file: {} for user: {}", file.getOriginalFilename(), userId);

        // Step 1: Generate SHA-256 hash of the file
        String fileHash = hashService.generateFileHash(file);
        log.info("File hash generated: {}", fileHash);

        // Step 2: Check if this hash already exists for the user in database
        Optional<FileRecord> existingRecord = fileRecordRepository.findByUserIdAndFileHash(userId, fileHash);

        if (existingRecord.isPresent()) {
            // Duplicate detected!
            log.warn("Duplicate file detected! Hash: {} already exists for user: {}", fileHash, userId);
            FileRecord existing = existingRecord.get();
            return FileUploadResponse.duplicate(
                    file.getOriginalFilename(),
                    fileHash,
                    existing.getHashFileUrl(),
                    existing.getCreatedAt()
            );
        }

        // Step 3: No duplicate found - upload hash to S3
        log.info("No duplicate found. Uploading hash to S3...");
        String s3Url = s3Service.uploadHashFile(userId, fileHash);

        // Step 4: Save metadata to database
        FileRecord fileRecord = new FileRecord();
        fileRecord.setUserId(userId);
        fileRecord.setOriginalFileName(file.getOriginalFilename());
        fileRecord.setHashFileUrl(s3Url);
        fileRecord.setFileHash(fileHash);

        fileRecordRepository.save(fileRecord);
        log.info("File metadata saved to database. ID: {}", fileRecord.getId());

        return FileUploadResponse.success(
                file.getOriginalFilename(),
                fileHash,
                s3Url
        );
    }

    /**
     * Get all files for a specific user
     */
    public List<FileListResponse> getUserFiles(String userId) {
        log.info("Fetching all files for user: {}", userId);
        List<FileRecord> records = fileRecordRepository.findByUserId(userId);

        return records.stream()
                .map(record -> new FileListResponse(
                        record.getId(),
                        record.getOriginalFileName(),
                        record.getHashFileUrl(),
                        record.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }
}
