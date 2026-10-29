package com.ninho.dashboard;

import com.ninho.dashboard.dto.DashboardResponse;
import com.ninho.nest.NestRepository;
import com.ninho.nest.NestStatus;
import com.ninho.nest.dto.NestResponse;
import com.ninho.transaction.TransactionRepository;
import com.ninho.transaction.TransactionType;
import com.ninho.transaction.dto.TransactionResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final NestRepository nestRepository;

    public DashboardService(TransactionRepository transactionRepository, NestRepository nestRepository) {
        this.transactionRepository = transactionRepository;
        this.nestRepository = nestRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse load(Long userId) {
        YearMonth month = YearMonth.now();
        LocalDate from = month.atDay(1);
        LocalDate to = month.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeBetween(userId, TransactionType.INCOME, from, to);
        BigDecimal expense = transactionRepository.sumByTypeBetween(userId, TransactionType.EXPENSE, from, to);
        List<NestResponse> nests = nestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NestResponse::from)
                .toList();
        BigDecimal reserved = nests.stream()
                .map(NestResponse::currentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DashboardResponse.CategoryExpense> byCategory = transactionRepository
                .sumExpensesByCategory(userId, from, to)
                .stream()
                .map(row -> new DashboardResponse.CategoryExpense(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        (BigDecimal) row[3]
                ))
                .toList();

        List<TransactionResponse> recent = transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(userId)
                .stream()
                .limit(6)
                .map(TransactionResponse::from)
                .toList();

        return new DashboardResponse(
                income,
                expense,
                income.subtract(expense),
                reserved,
                nestRepository.countByUserIdAndStatus(userId, NestStatus.ACTIVE),
                nestRepository.countByUserIdAndStatus(userId, NestStatus.COMPLETED),
                byCategory,
                nests,
                recent
        );
    }
}
