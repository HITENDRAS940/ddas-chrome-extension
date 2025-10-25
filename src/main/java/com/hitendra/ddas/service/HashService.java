package com.hitendra.ddas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Service for hashing files using SHA-256 algorithm
 */
@Service
@Slf4j
public class HashService {

    private static final String HASH_ALGORITHM = "SHA-256";

    /**
     * Generate SHA-256 hash of a file
     * @param file MultipartFile to hash
     * @return SHA-256 hash as hexadecimal string
     */
    public String generateFileHash(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            InputStream inputStream = file.getInputStream();

            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }

            inputStream.close();

            byte[] hashBytes = digest.digest();
            String hash = bytesToHex(hashBytes);

            log.info("Generated SHA-256 hash for file: {} -> {}", file.getOriginalFilename(), hash);
            return hash;

        } catch (NoSuchAlgorithmException | IOException e) {
            log.error("Error generating hash for file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate file hash", e);
        }
    }

    /**
     * Convert byte array to hexadecimal string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}

