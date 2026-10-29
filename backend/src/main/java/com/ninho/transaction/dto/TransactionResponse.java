package com.ninho.transaction.dto;

import com.ninho.transaction.Transaction;
import com.ninho.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        String description,
        BigDecimal amount,
        TransactionType type,
        LocalDate date,
        Long categoryId,
        String categoryName,
        String categoryColor,
        Long nestId,
        String nestName,
        Instant createdAt
) {
    public static TransactionResponse from(Transaction transaction) {
        Long nestId = transaction.getNest() == null ? null : transaction.getNest().getId();
        String nestName = transaction.getNest() == null ? null : transaction.getNest().getName();
        return new TransactionResponse(
                transaction.getId(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getDate(),
                transaction.getCategory().getId(),
                transaction.getCategory().getName(),
                transaction.getCategory().getColor(),
                nestId,
                nestName,
                transaction.getCreatedAt()
        );
    }
}
