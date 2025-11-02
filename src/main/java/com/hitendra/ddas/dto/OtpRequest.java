package com.hitendra.ddas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for requesting OTP generation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
}
