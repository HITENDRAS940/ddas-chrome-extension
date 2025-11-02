package com.hitendra.ddas.controller;

import com.hitendra.ddas.dto.FileListResponse;
import com.hitendra.ddas.dto.FileUploadResponse;
import com.hitendra.ddas.service.AuthService;
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
    private final AuthService authService;

    public FileController(FileService fileService, AuthService authService) {
        this.fileService = fileService;
        this.authService = authService;
    }

    /**
     * Upload file and detect duplicates
     * POST /api/files/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {

        // Get authenticated username
        String username = authService.getCurrentUsername();

        log.info("Received file upload request - File: {}, User: {}", file.getOriginalFilename(), username);

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new FileUploadResponse(false, "File is empty", null, null, null));
        }

        // Process file and check for duplicates using authenticated username
        FileUploadResponse response = fileService.processFile(file, username);

        // Return 409 Conflict if duplicate, 201 Created if new file
        HttpStatus status = response.isDuplicate() ? HttpStatus.CONFLICT : HttpStatus.CREATED;

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Get all files for authenticated user
     * GET /api/files/all
     */
    @GetMapping("/all")
    public ResponseEntity<List<FileListResponse>> getAllUserFiles() {
        String username = authService.getCurrentUsername();
        log.info("Fetching all files for user: {}", username);
        List<FileListResponse> files = fileService.getUserFiles(username);
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

