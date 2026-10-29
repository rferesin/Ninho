package com.ninho.user;

import com.ninho.category.CategoryService;
import com.ninho.common.ApiException;
import com.ninho.security.AuthUser;
import com.ninho.security.JwtService;
import com.ninho.user.dto.AuthResponse;
import com.ninho.user.dto.LoginRequest;
import com.ninho.user.dto.RegisterRequest;
import com.ninho.user.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CategoryService categoryService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CategoryService categoryService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.categoryService = categoryService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Este email ja esta em uso");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);
        categoryService.seedDefaults(user);
        return toAuth(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> ApiException.badRequest("Email ou senha incorretos"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.badRequest("Email ou senha incorretos");
        }
        return toAuth(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuario nao encontrado"));
        return UserResponse.from(user);
    }

    private AuthResponse toAuth(User user) {
        AuthUser principal = new AuthUser(user.getId(), user.getEmail(), user.getName());
        return new AuthResponse(jwtService.generate(principal), UserResponse.from(user));
    }
}
