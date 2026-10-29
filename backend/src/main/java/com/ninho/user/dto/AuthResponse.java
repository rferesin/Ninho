package com.ninho.user.dto;

public record AuthResponse(String token, UserResponse user) {
}
