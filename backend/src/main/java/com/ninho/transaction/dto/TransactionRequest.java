package com.ninho.transaction.dto;

import com.ninho.transaction.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotBlank @Size(min = 2, max = 180) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull TransactionType type,
        @NotNull LocalDate date,
        @NotNull Long categoryId,
        Long nestId
) {
}
