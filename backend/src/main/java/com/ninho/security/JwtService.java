package com.ninho.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generate(AuthUser user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.getExpirationMs());
        return Jwts.builder()
                .subject(String.valueOf(user.id()))
                .claim("email", user.email())
                .claim("name", user.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public AuthUser parse(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Long id = Long.valueOf(claims.getSubject());
        String email = claims.get("email", String.class);
        String name = claims.get("name", String.class);
        return new AuthUser(id, email, name);
    }
}
