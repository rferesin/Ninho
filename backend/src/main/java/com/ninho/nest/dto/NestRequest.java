package com.ninho.nest.dto;

import com.ninho.nest.NestStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NestRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Size(max = 400) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal targetAmount,
        LocalDate deadline,
        NestStatus status,
        @NotBlank @Pattern(regexp = "^#([A-Fa-f0-9]{6})$") String color
) {
}
