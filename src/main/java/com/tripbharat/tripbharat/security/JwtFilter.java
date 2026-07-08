package com.tripbharat.tripbharat.security;

import java.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest httpServletRequest,
                                    @NonNull HttpServletResponse httpServletResponse,
                                    @NonNull FilterChain filterChain)
        throws ServletException, IOException
    {
        // Step 1 get authorization header
        final String authHeader= httpServletRequest.getHeader("Authorization");

        // If no auth header or doesn't start with Bearer — skip
        if(authHeader==null || !authHeader.startsWith("Bearer"))
        {
            filterChain.doFilter(httpServletRequest,httpServletResponse);
            return;
        }

        // ── Step 2: Extract JWT token ──────────────
        // Header format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
        // We skip "Bearer " (7 characters) to get just the token
        final String jwt=authHeader.substring(7);


        // ── Step 3: Extract email from token ───────
        final String useremail=jwtService.extractUsername(jwt);

        // ── Step 4: Validate and set authentication ─
        // Only proceed if email exists and user is not already authenticated
        if(useremail != null &&
                SecurityContextHolder.getContext().getAuthentication()==null)
        {
            // Load user from database
            UserDetails userDetails=userDetailsService.loadUserByUsername(useremail);

            // Validate token
            if(jwtService.isTokenValid(jwt,userDetails))
            {
                // Create authentication token
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // Add request details to auth token
                authToken.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(httpServletRequest)
                );

                // Set authentication in security context
                // This tells Spring Security: this user is authenticated
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // ── Step 5: Continue to next filter ────────
        filterChain.doFilter(httpServletRequest,httpServletResponse);
    }


}
