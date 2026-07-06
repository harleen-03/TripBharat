package com.tripbharat.tripbharat.repository;

import com.tripbharat.tripbharat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends  JpaRepository<User, Long> {

    // Find user by email — used during login
    Optional<User> findByEmail(String email);

    // Check if email already exists — used during registration
    boolean existsByEmail(String email);
}
