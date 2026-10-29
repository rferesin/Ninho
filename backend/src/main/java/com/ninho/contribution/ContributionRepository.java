package com.ninho.contribution;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {

    List<Contribution> findByNestIdAndUserIdOrderByDateDescCreatedAtDesc(Long nestId, Long userId);

    Optional<Contribution> findByIdAndUserId(Long id, Long userId);
}
