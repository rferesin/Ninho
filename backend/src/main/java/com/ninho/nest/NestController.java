package com.ninho.nest;

import com.ninho.contribution.dto.ContributionRequest;
import com.ninho.contribution.dto.ContributionResponse;
import com.ninho.nest.dto.NestRequest;
import com.ninho.nest.dto.NestResponse;
import com.ninho.security.AuthUser;
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
@RequestMapping("/api/nests")
public class NestController {

    private final NestService nestService;

    public NestController(NestService nestService) {
        this.nestService = nestService;
    }

    @GetMapping
    public List<NestResponse> list(@AuthenticationPrincipal AuthUser user) {
        return nestService.list(user.id());
    }

    @GetMapping("/{id}")
    public NestResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return nestService.get(user.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NestResponse create(
            @AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody NestRequest request
    ) {
        return nestService.create(user.id(), request);
    }

    @PutMapping("/{id}")
    public NestResponse update(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @Valid @RequestBody NestRequest request
    ) {
        return nestService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        nestService.delete(user.id(), id);
    }

    @GetMapping("/{id}/contributions")
    public List<ContributionResponse> contributions(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id
    ) {
        return nestService.listContributions(user.id(), id);
    }

    @PostMapping("/{id}/contributions")
    @ResponseStatus(HttpStatus.CREATED)
    public ContributionResponse contribute(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @Valid @RequestBody ContributionRequest request
    ) {
        return nestService.contribute(user.id(), id, request);
    }

    @DeleteMapping("/{id}/contributions/{contributionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContribution(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @PathVariable Long contributionId
    ) {
        nestService.deleteContribution(user.id(), id, contributionId);
    }
}
