package com.hitendra.ddas.controller;

import com.hitendra.ddas.dto.FileListResponse;
import com.hitendra.ddas.dto.FileUploadResponse;
import com.hitendra.ddas.service.FileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST Controller for file upload and duplication detection
 */
@RestController
@RequestMapping("/api/files")
@Slf4j
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    /**
     * Upload file and detect duplicates
     * POST /api/files/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId) {

        log.info("Received file upload request - File: {}, UserId: {}", file.getOriginalFilename(), userId);

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new FileUploadResponse(false, "File is empty", null, null, null));
        }

        // Process file and check for duplicates
        FileUploadResponse response = fileService.processFile(file, userId);

        // Return 409 Conflict if duplicate, 201 Created if new file
        HttpStatus status = response.isDuplicate() ? HttpStatus.CONFLICT : HttpStatus.CREATED;

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Get all files for a user
     * GET /api/files/all?userId={userId}
     */
    @GetMapping("/all")
    public ResponseEntity<List<FileListResponse>> getAllUserFiles(@RequestParam("userId") String userId) {
        log.info("Fetching all files for user: {}", userId);
        List<FileListResponse> files = fileService.getUserFiles(userId);
        return ResponseEntity.ok(files);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("DDAS API is running! ✅");
    }
}

