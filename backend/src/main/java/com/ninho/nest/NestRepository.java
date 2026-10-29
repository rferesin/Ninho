package com.ninho.nest;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NestRepository extends JpaRepository<Nest, Long> {

    List<Nest> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Nest> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndStatus(Long userId, NestStatus status);
}
