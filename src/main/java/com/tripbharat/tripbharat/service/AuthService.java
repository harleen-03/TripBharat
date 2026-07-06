package com.tripbharat.tripbharat.service;

import com.tripbharat.tripbharat.dto.AuthResponse;
import com.tripbharat.tripbharat.dto.LoginRequest;
import com.tripbharat.tripbharat.dto.RegisterRequest;
import com.tripbharat.tripbharat.entity.User;
import com.tripbharat.tripbharat.repository.UserRepository;
import com.tripbharat.tripbharat.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    //Register new user
    public AuthResponse register(RegisterRequest request)
    {
        //check if the user already exists
        if(userRepository.existsByEmail(request.getEmail()))
        {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already register. Please login instead")
                    .build();

        }

        //Create new user with hashed password
        User user=User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        //save this new user to the database
        userRepository.save(user);

        //Generate JWT token for this
        UserDetails userDetails=userDetailsService
                .loadUserByUsername(user.getEmail());
        String token= jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .message("Registration successful!")
                .build();
    }

    //Login existing user
    public AuthResponse login(LoginRequest request)
    {
        try{
            //verify email and password
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        }
        catch (BadCredentialsException e)
        {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email or password.")
                    .build();
        }

        // Load user and generate token
        UserDetails userDetails = userDetailsService
                .loadUserByUsername(request.getEmail());
        String token = jwtService.generateToken(userDetails);

        // Get user name from database
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .message("Login successful!")
                .build();
    }

}
