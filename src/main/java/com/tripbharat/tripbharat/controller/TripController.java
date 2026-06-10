package com.tripbharat.tripbharat.controller;

import com.tripbharat.tripbharat.model.TripRequest;
import com.tripbharat.tripbharat.model.TripResponse;
import com.tripbharat.tripbharat.service.ClaudeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TripController {


    @Autowired
    private ClaudeService claudeService;

    @PostMapping("/plan")
    public TripResponse generatePlan(@RequestBody TripRequest request) {
        try {
            String plan = claudeService.generateTripPlan(request);
            return new TripResponse(plan);
        } catch (Exception e) {
            return new TripResponse(e.getMessage(), false);
        }
    }

    //Health check - to verify the server is running
    @GetMapping("/health")
    public String health()
    {
        return "Trip Bharat is running fine";
    }

}
