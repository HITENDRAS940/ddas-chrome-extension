package com.hitendra.ddas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for authentication response (login/signup)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private UserInfo user;
    private String message;

    public AuthResponse(String message) {
        this.message = message;
    }

    public AuthResponse(String token, String username, String email, String fullName, String message) {
        this.token = token;
        this.user = new UserInfo(username, email, fullName);
        this.message = message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String username;
        private String email;
        private String fullName;
    }
}

