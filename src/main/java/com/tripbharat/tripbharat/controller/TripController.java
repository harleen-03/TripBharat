package com.tripbharat.tripbharat.controller;

import com.tripbharat.tripbharat.model.TripRequest;
import com.tripbharat.tripbharat.model.TripResponse;
import com.tripbharat.tripbharat.service.GroqService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TripController {


    @Autowired
    private GroqService groqService;

    @PostMapping("/plan")
    public TripResponse generatePlan(@RequestBody TripRequest request) {
        try {
            String plan = groqService.generateTripPlan(request);
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
