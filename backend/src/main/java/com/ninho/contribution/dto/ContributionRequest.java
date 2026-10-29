package com.ninho.contribution.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContributionRequest(
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull LocalDate date,
        @Size(max = 240) String note
) {
}
