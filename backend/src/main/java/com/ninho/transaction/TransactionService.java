package com.ninho.transaction;

import com.ninho.category.Category;
import com.ninho.category.CategoryService;
import com.ninho.common.ApiException;
import com.ninho.nest.Nest;
import com.ninho.nest.NestRepository;
import com.ninho.transaction.dto.TransactionRequest;
import com.ninho.transaction.dto.TransactionResponse;
import com.ninho.user.User;
import com.ninho.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryService categoryService;
    private final NestRepository nestRepository;
    private final UserRepository userRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            CategoryService categoryService,
            NestRepository nestRepository,
            UserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.categoryService = categoryService;
        this.nestRepository = nestRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list(Long userId) {
        return transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(userId).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(Long userId, Long id) {
        return TransactionResponse.from(requireOwned(userId, id));
    }

    @Transactional
    public TransactionResponse create(Long userId, TransactionRequest request) {
        User user = userRepository.getReferenceById(userId);
        Transaction transaction = new Transaction();
        apply(userId, transaction, request);
        transaction.setUser(user);
        return TransactionResponse.from(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionResponse update(Long userId, Long id, TransactionRequest request) {
        Transaction transaction = requireOwned(userId, id);
        apply(userId, transaction, request);
        return TransactionResponse.from(transaction);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Transaction transaction = requireOwned(userId, id);
        transactionRepository.delete(transaction);
    }

    private void apply(Long userId, Transaction transaction, TransactionRequest request) {
        Category category = categoryService.requireOwned(userId, request.categoryId());
        Nest nest = null;
        if (request.nestId() != null) {
            nest = nestRepository.findByIdAndUserId(request.nestId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Ninho nao encontrado"));
        }
        transaction.setDescription(request.description().trim());
        transaction.setAmount(request.amount());
        transaction.setType(request.type());
        transaction.setDate(request.date());
        transaction.setCategory(category);
        transaction.setNest(nest);
    }

    private Transaction requireOwned(Long userId, Long id) {
        return transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Transacao nao encontrada"));
    }
}
