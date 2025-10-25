package com.hitendra.ddas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for listing user files
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileListResponse {

    private Long id;
    private String originalFileName;
    private String hashFileUrl;
    private LocalDateTime createdAt;
}

