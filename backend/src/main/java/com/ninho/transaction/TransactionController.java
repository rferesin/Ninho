package com.ninho.transaction;

import com.ninho.security.AuthUser;
import com.ninho.transaction.dto.TransactionRequest;
import com.ninho.transaction.dto.TransactionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<TransactionResponse> list(@AuthenticationPrincipal AuthUser user) {
        return transactionService.list(user.id());
    }

    @GetMapping("/{id}")
    public TransactionResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return transactionService.get(user.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(
            @AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody TransactionRequest request
    ) {
        return transactionService.create(user.id(), request);
    }

    @PutMapping("/{id}")
    public TransactionResponse update(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        return transactionService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        transactionService.delete(user.id(), id);
    }
}
