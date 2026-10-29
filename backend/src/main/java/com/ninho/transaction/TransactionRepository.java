package com.ninho.transaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("""
            select t from Transaction t
            join fetch t.category
            left join fetch t.nest
            where t.user.id = :userId
            order by t.date desc, t.createdAt desc
            """)
    List<Transaction> findByUserIdOrderByDateDescCreatedAtDesc(@Param("userId") Long userId);

    @Query("""
            select t from Transaction t
            join fetch t.category
            left join fetch t.nest
            where t.id = :id and t.user.id = :userId
            """)
    Optional<Transaction> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    boolean existsByCategoryId(Long categoryId);

    @Modifying
    @Query("update Transaction t set t.nest = null where t.nest.id = :nestId")
    void clearNest(@Param("nestId") Long nestId);

    @Query("""
            select coalesce(sum(t.amount), 0)
            from Transaction t
            where t.user.id = :userId
              and t.type = :type
              and t.date between :from and :to
            """)
    BigDecimal sumByTypeBetween(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
            select t.category.id, t.category.name, t.category.color, coalesce(sum(t.amount), 0)
            from Transaction t
            where t.user.id = :userId
              and t.type = com.ninho.transaction.TransactionType.EXPENSE
              and t.date between :from and :to
            group by t.category.id, t.category.name, t.category.color
            order by sum(t.amount) desc
            """)
    List<Object[]> sumExpensesByCategory(
            @Param("userId") Long userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
