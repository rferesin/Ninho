package com.ninho.dashboard.dto;

import com.ninho.nest.dto.NestResponse;
import com.ninho.transaction.dto.TransactionResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpense,
        BigDecimal monthlyBalance,
        BigDecimal reservedInNests,
        long activeNests,
        long completedNests,
        List<CategoryExpense> expensesByCategory,
        List<NestResponse> nests,
        List<TransactionResponse> recentTransactions
) {
    public record CategoryExpense(Long categoryId, String name, String color, BigDecimal total) {
    }
}
