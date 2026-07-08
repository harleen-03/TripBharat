package com.tripbharat.tripbharat.repository;


import com.tripbharat.tripbharat.entity.SavedTrip;
import com.tripbharat.tripbharat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedTripRepository extends JpaRepository<SavedTrip, Long> {


    // Get all trips for a specific user — ordered by newest first
    List<SavedTrip> findByUserOrderBySavedAtDesc(User user);

    // Find a specific trip by ID and user
    // (prevents users from accessing other users' trips)
    Optional<SavedTrip> findByIdAndUser(Long id, User user);


    // Count how many trips a user has saved
    long countByUser(User user);


}
