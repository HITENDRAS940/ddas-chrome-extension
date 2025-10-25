package com.hitendra.ddas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for AWS S3 operations
 * Handles uploading and retrieving hash text files from S3
 */
@Service
@Slf4j
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    /**
     * Upload hash text file to S3 under user's folder
     * @param userId User's unique ID
     * @param hash SHA-256 hash to store
     * @return S3 URL of uploaded file
     */
    public String uploadHashFile(String userId, String hash) {
        String fileName = "hash_" + UUID.randomUUID() + ".txt";
        String key = userId + "/" + fileName;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType("text/plain")
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(
                            new ByteArrayInputStream(hash.getBytes(StandardCharsets.UTF_8)),
                            hash.length()
                    )
            );

            String s3Url = String.format("s3://%s/%s", bucketName, key);
            log.info("Hash file uploaded successfully: {}", s3Url);
            return s3Url;

        } catch (S3Exception e) {
            log.error("Error uploading hash file to S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload hash file to S3", e);
        }
    }

    /**
     * List all hash files for a specific user
     * @param userId User's unique ID
     * @return List of S3 object keys
     */
    public List<String> listUserHashFiles(String userId) {
        List<String> hashFiles = new ArrayList<>();
        String prefix = userId + "/";

        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);

            for (S3Object s3Object : listResponse.contents()) {
                hashFiles.add(s3Object.key());
            }

            log.info("Found {} hash files for user: {}", hashFiles.size(), userId);
            return hashFiles;

        } catch (S3Exception e) {
            log.error("Error listing hash files from S3: {}", e.getMessage(), e);
            return hashFiles; // Return empty list on error
        }
    }

    /**
     * Download hash file content from S3
     * @param key S3 object key
     * @return Hash string content
     */
    public String downloadHashFile(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            InputStream inputStream = s3Client.getObject(getObjectRequest);
            String hashContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            inputStream.close();

            log.info("Downloaded hash file: {}", key);
            return hashContent.trim();

        } catch (S3Exception | IOException e) {
            log.error("Error downloading hash file from S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to download hash file from S3", e);
        }
    }

    /**
     * Delete hash file from S3
     * @param key S3 object key
     */
    public void deleteHashFile(String key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted hash file: {}", key);

        } catch (S3Exception e) {
            log.error("Error deleting hash file from S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete hash file from S3", e);
        }
    }
}

