package com.ninho.security;

import org.springframework.security.core.AuthenticatedPrincipal;

public record AuthUser(Long id, String email, String name) implements AuthenticatedPrincipal {

    @Override
    public String getName() {
        return email;
    }
}
