package com.ninho.nest.dto;

import com.ninho.nest.Nest;
import com.ninho.nest.NestStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;

public record NestResponse(
        Long id,
        String name,
        String description,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal remainingAmount,
        int progressPercent,
        LocalDate deadline,
        NestStatus status,
        String color,
        Instant createdAt
) {
    public static NestResponse from(Nest nest) {
        BigDecimal current = nest.getCurrentAmount() == null ? BigDecimal.ZERO : nest.getCurrentAmount();
        BigDecimal target = nest.getTargetAmount();
        BigDecimal remaining = target.subtract(current).max(BigDecimal.ZERO);
        int percent = 0;
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            percent = current.multiply(BigDecimal.valueOf(100))
                    .divide(target, 0, RoundingMode.HALF_UP)
                    .intValue();
            percent = Math.min(percent, 100);
        }
        return new NestResponse(
                nest.getId(),
                nest.getName(),
                nest.getDescription(),
                target,
                current,
                remaining,
                percent,
                nest.getDeadline(),
                nest.getStatus(),
                nest.getColor(),
                nest.getCreatedAt()
        );
    }
}
