package com.tripbharat.tripbharat.service;

import com.tripbharat.tripbharat.model.TripRequest;
import org.springframework.stereotype.Service;

@Service
public class ClaudeService {


    public String generateTripPlan(TripRequest request)
    {
        return String.format(
                "TRIP PLAN: %s to %s\n" +
                        "Duration: %d days\n" +
                        "Style: %s\n" +
                        "Budget: %s\n\n" +
                        "[Claude API integration coming on Day 2]",
                request.getFrom(),
                request.getTo(),
                request.getDays(),
                request.getStyle(),
                request.getBudget()
        );

    }
}
