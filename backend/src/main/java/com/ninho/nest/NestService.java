package com.ninho.nest;

import com.ninho.common.ApiException;
import com.ninho.contribution.Contribution;
import com.ninho.contribution.ContributionRepository;
import com.ninho.contribution.dto.ContributionRequest;
import com.ninho.contribution.dto.ContributionResponse;
import com.ninho.nest.dto.NestRequest;
import com.ninho.nest.dto.NestResponse;
import com.ninho.transaction.TransactionRepository;
import com.ninho.user.User;
import com.ninho.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class NestService {

    private final NestRepository nestRepository;
    private final ContributionRepository contributionRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public NestService(
            NestRepository nestRepository,
            ContributionRepository contributionRepository,
            UserRepository userRepository,
            TransactionRepository transactionRepository
    ) {
        this.nestRepository = nestRepository;
        this.contributionRepository = contributionRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<NestResponse> list(Long userId) {
        return nestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public NestResponse get(Long userId, Long id) {
        return NestResponse.from(requireOwned(userId, id));
    }

    @Transactional
    public NestResponse create(Long userId, NestRequest request) {
        User user = userRepository.getReferenceById(userId);
        Nest nest = new Nest();
        nest.setUser(user);
        nest.setCurrentAmount(BigDecimal.ZERO);
        nest.setStatus(NestStatus.ACTIVE);
        apply(nest, request, true);
        return NestResponse.from(nestRepository.save(nest));
    }

    @Transactional
    public NestResponse update(Long userId, Long id, NestRequest request) {
        Nest nest = requireOwned(userId, id);
        apply(nest, request, false);
        refreshStatus(nest);
        return NestResponse.from(nest);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Nest nest = requireOwned(userId, id);
        transactionRepository.clearNest(nest.getId());
        nestRepository.delete(nest);
    }

    @Transactional(readOnly = true)
    public List<ContributionResponse> listContributions(Long userId, Long nestId) {
        requireOwned(userId, nestId);
        return contributionRepository.findByNestIdAndUserIdOrderByDateDescCreatedAtDesc(nestId, userId).stream()
                .map(ContributionResponse::from)
                .toList();
    }

    @Transactional
    public ContributionResponse contribute(Long userId, Long nestId, ContributionRequest request) {
        Nest nest = requireOwned(userId, nestId);
        if (nest.getStatus() == NestStatus.PAUSED) {
            throw ApiException.badRequest("Ninho pausado nao recebe aportes");
        }
        Contribution contribution = new Contribution();
        contribution.setAmount(request.amount());
        contribution.setDate(request.date());
        contribution.setNote(blankToNull(request.note()));
        contribution.setNest(nest);
        contribution.setUser(userRepository.getReferenceById(userId));
        contributionRepository.save(contribution);

        nest.setCurrentAmount(nest.getCurrentAmount().add(request.amount()));
        refreshStatus(nest);
        return ContributionResponse.from(contribution);
    }

    @Transactional
    public void deleteContribution(Long userId, Long nestId, Long contributionId) {
        Nest nest = requireOwned(userId, nestId);
        Contribution contribution = contributionRepository.findByIdAndUserId(contributionId, userId)
                .orElseThrow(() -> ApiException.notFound("Aporte nao encontrado"));
        if (!contribution.getNest().getId().equals(nestId)) {
            throw ApiException.notFound("Aporte nao encontrado");
        }
        nest.setCurrentAmount(nest.getCurrentAmount().subtract(contribution.getAmount()).max(BigDecimal.ZERO));
        contributionRepository.delete(contribution);
        refreshStatus(nest);
    }

    public Nest requireOwned(Long userId, Long id) {
        return nestRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Ninho nao encontrado"));
    }

    private void apply(Nest nest, NestRequest request, boolean creating) {
        nest.setName(request.name().trim());
        nest.setDescription(blankToNull(request.description()));
        nest.setTargetAmount(request.targetAmount());
        nest.setDeadline(request.deadline());
        nest.setColor(request.color());
        if (!creating && request.status() != null) {
            nest.setStatus(request.status());
        }
    }

    private void refreshStatus(Nest nest) {
        if (nest.getStatus() == NestStatus.PAUSED) {
            return;
        }
        if (nest.getCurrentAmount().compareTo(nest.getTargetAmount()) >= 0) {
            nest.setStatus(NestStatus.COMPLETED);
        } else if (nest.getStatus() == NestStatus.COMPLETED) {
            nest.setStatus(NestStatus.ACTIVE);
        }
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
