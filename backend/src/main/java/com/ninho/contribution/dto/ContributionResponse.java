package com.ninho.contribution.dto;

import com.ninho.contribution.Contribution;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ContributionResponse(
        Long id,
        Long nestId,
        BigDecimal amount,
        LocalDate date,
        String note,
        Instant createdAt
) {
    public static ContributionResponse from(Contribution contribution) {
        return new ContributionResponse(
                contribution.getId(),
                contribution.getNest().getId(),
                contribution.getAmount(),
                contribution.getDate(),
                contribution.getNote(),
                contribution.getCreatedAt()
        );
    }
}
