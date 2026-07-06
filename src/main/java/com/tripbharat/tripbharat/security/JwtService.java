package com.tripbharat.tripbharat.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.logging.structured.ElasticCommonSchemaProperties;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiry;

    //get the username from the token
    public String extractUsername(String token)
    {
        return extractClaim(token, Claims::getSubject);
    }

    //get the expiry date from the token
    public Date extractExpiration(String token)
    {
        return extractClaim(token, Claims::getExpiration);
    }


    //Extract any claim from the token
    public <T> T extractClaim(String token,Function<Claims, T> claimsResolver)
    {
        final Claims claim=extractAllClaims(token);
        return claimsResolver.apply(claim);
    }

    //Extract all claims from the token
    public Claims extractAllClaims(String token)
    {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJwt(token)
                .getBody();
    }

    // ── Validate token ─────────────────────────
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()))
                && !isTokenExpired(token);
    }

    // ── Check if token is expired ──────────────
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    //Generate the token for the user
    public String generateToken(UserDetails userDetails)
    {
          return generateToken(new HashMap<>(), userDetails);
    }

    //Generate token with extra claims
    public String generateToken(Map<String, Object> extraclaims,
                                UserDetails userDetails)
    {
        return Jwts.builder()
                .setClaims(extraclaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiry))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

        // compact converts everything to a string
    }

    //get signing key from secret
    private Key getSigningKey()
    {
        byte[] keyBytes=Base64.getDecoder().decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);

    }
}
