package com.tripbharat.tripbharat.controller;

import com.tripbharat.tripbharat.dto.AuthResponse;
import com.tripbharat.tripbharat.dto.LoginRequest;
import com.tripbharat.tripbharat.dto.RegisterRequest;
import com.tripbharat.tripbharat.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins="*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request)
    {
        AuthResponse response=authService.register(request);

        if(response.isSuccess())
        {
            return ResponseEntity.ok(response);

        }
        else
        {
            return ResponseEntity.badRequest().body(response);
        }
    }


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request)
    {
        AuthResponse response=authService.login(request);

        if(response.isSuccess())
        {
            return ResponseEntity.ok(response);
        }
        else
        {
            return ResponseEntity.badRequest().body(response);
        }
    }

}
