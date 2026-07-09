package com.tripbharat.tripbharat.controller;


import com.tripbharat.tripbharat.dto.SavedTripDTO;
import com.tripbharat.tripbharat.service.TripSaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin("*")
@RequiredArgsConstructor
public class TripSaveController {

    private final TripSaveService tripSaveService;

    @PostMapping("/save")
    public ResponseEntity<?> saveTrip(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SavedTripDTO savedTripDTO)
    {
       try
       {
           String email=userDetails.getUsername();
           SavedTripDTO savedTripDTO1=tripSaveService.saveTrip(email,savedTripDTO);
           return ResponseEntity.ok("saved");
       }
       catch (RuntimeException e)
       {
           return ResponseEntity.badRequest()
                   .body(new ErrorResponse(e.getMessage()));
       }
    }

    // GET API TRIPs
    @GetMapping()
    public ResponseEntity<?> getSavedTrips(
            @AuthenticationPrincipal UserDetails userDetails)
    {
        try
        {
            String email=userDetails.getUsername();
            List<SavedTripDTO> savedTripDTOList=tripSaveService.getUserTrips(email);
            return ResponseEntity.ok(savedTripDTOList);
        }
        catch (RuntimeException e)
        {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── DELETE /api/trips/{id} ─────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrip(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        try {
            String email = userDetails.getUsername();
            tripSaveService.deleteTrip(email, id);
            return ResponseEntity.ok(
                    new ErrorResponse("Trip deleted successfully")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── GET /api/trips/count ───────────────────
    @GetMapping("/count")
    public ResponseEntity<?> getTripCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            String email = userDetails.getUsername();
            long count = tripSaveService.getTripCount(email);
            return ResponseEntity.ok(new CountResponse(count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── Inner response classes ─────────────────
    record ErrorResponse(String message) {}
    record CountResponse(long count) {}
}
