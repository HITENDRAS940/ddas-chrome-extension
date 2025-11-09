package com.hitendra.ddas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for file upload endpoint
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    private boolean duplicate;
    private String message;
    private String fileName;
    private String fileHash;
    private String existingFileUrl; // If duplicate, URL of existing file
    private String existingFileName; // If duplicate, original filename of existing file
    private LocalDateTime uploadDate; // When the file was originally uploaded

    public static FileUploadResponse duplicate(String fileName, String fileHash, String existingFileUrl, String existingFileName, LocalDateTime uploadDate) {
        return new FileUploadResponse(
                true,
                "⚠️ Duplicate file detected! This file already exists.",
                fileName,
                fileHash,
                existingFileUrl,
                existingFileName,
                uploadDate
        );
    }

    public static FileUploadResponse success(String fileName, String fileHash, String s3Url) {
        return new FileUploadResponse(
                false,
                "✅ File stored successfully!",
                fileName,
                fileHash,
                s3Url,
                null, // No existing file for successful uploads
                LocalDateTime.now()
        );
    }
}

