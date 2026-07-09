package com.tripbharat.tripbharat.service;

import com.tripbharat.tripbharat.entity.SavedTrip;
import com.tripbharat.tripbharat.dto.SavedTripDTO;
import com.tripbharat.tripbharat.entity.User;
import com.tripbharat.tripbharat.repository.SavedTripRepository;
import com.tripbharat.tripbharat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripSaveService {
    private final SavedTripRepository savedTripRepository;
    private final UserRepository userRepository;

    //save a trip
    public SavedTripDTO saveTrip(String email, SavedTripDTO dto)
    {
        // Find the user by email
        User user= userRepository.findByEmail(email)
                .orElseThrow(()->
                        new RuntimeException("User not found " + email));

        // Check if user has already saved this exact route
        List<SavedTrip> existing= savedTripRepository.findByUserOrderBySavedAtDesc(user);
        boolean alreadySaved = existing.stream().anyMatch(trip ->
                trip.getFromCity().equalsIgnoreCase(dto.getFromCity()) &&
                        trip.getToCity().equalsIgnoreCase(dto.getToCity()) &&
                        trip.getDays() == dto.getDays()
        );

        if (alreadySaved) {
            throw new RuntimeException(
                    "You've already saved a trip from " +
                            dto.getFromCity() + " to " + dto.getToCity()
            );
        }


        // Build and save the entity
        SavedTrip savedTrip = SavedTrip.builder()
                .user(user)
                .fromCity(dto.getFromCity())
                .toCity(dto.getToCity())
                .days(dto.getDays())
                .style(dto.getStyle())
                .budget(dto.getBudget())
                .plan(dto.getPlan())
                .build();

        SavedTrip saved = savedTripRepository.save(savedTrip);

        return toDTO(saved);

    }

    // ── Get all trips for a user ───────────────
    public List<SavedTripDTO> getUserTrips(String email)
    {
        User user =userRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException(
                                "User not found" + email
                        ));

        return savedTripRepository
                .findByUserOrderBySavedAtDesc(user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    //Delete a saved trip
    public void deleteTrip(String email, Long tripId)
    {
       User user=userRepository.
               findByEmail(email)
               .orElseThrow(()->
                       new RuntimeException("User not found" + email));


        // Find trip — ensures user can only delete their OWN trips
        SavedTrip trip=savedTripRepository
                .findByIdAndUser(tripId,user)
                .orElseThrow(
                        ()->new RuntimeException("Trip not found or you do not have the appropriate permission")
                );

        savedTripRepository.delete(trip);
    }

// ── Get trip count for user ────────────────
    public Long getTripCount(String email)
    {
        User user=userRepository.findByEmail(email)
                .orElseThrow(()->
                        new RuntimeException("user not found "+email));


        return savedTripRepository.countByUser(user);
    }

    // ── Convert Entity → DTO ───────────────────
    private SavedTripDTO toDTO(SavedTrip trip) {
        SavedTripDTO dto = new SavedTripDTO();
        dto.setId(trip.getId());
        dto.setFromCity(trip.getFromCity());
        dto.setToCity(trip.getToCity());
        dto.setDays(trip.getDays());
        dto.setStyle(trip.getStyle());
        dto.setBudget(trip.getBudget());
        dto.setPlan(trip.getPlan());
        dto.setSavedAt(trip.getSavedAt());
        return dto;
    }
}
