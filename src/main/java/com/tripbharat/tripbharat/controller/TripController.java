package com.tripbharat.tripbharat.controller;

import com.tripbharat.tripbharat.model.TripRequest;
import com.tripbharat.tripbharat.model.TripResponse;
import com.tripbharat.tripbharat.service.GroqService;
import com.tripbharat.tripbharat.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TripController {

    @Autowired
    private GroqService groqService;

    @Autowired
    private RateLimiterService rateLimiterService;

    @PostMapping("/plan")
    public TripResponse generatePlan(
            @RequestBody TripRequest request,
            HttpServletRequest httpRequest) {

        // ── Get client IP ─────────────────────────
        String clientIp = getClientIp(httpRequest);

        // ── Check rate limit ──────────────────────
        if (!rateLimiterService.isAllowed(clientIp)) {
            return new TripResponse(
                    "Too many requests! You can generate up to 5 trip plans " +
                            "per minute. Please wait a moment and try again. 🙏",
                    false
            );
        }

        // ── Input Validation ──────────────────────
        if (request.getFrom() == null || request.getFrom().trim().isEmpty()) {
            return new TripResponse("Please enter a starting city.", false);
        }
        if (request.getTo() == null || request.getTo().trim().isEmpty()) {
            return new TripResponse("Please enter a destination city.", false);
        }
        if (request.getFrom().trim().equalsIgnoreCase(request.getTo().trim())) {
            return new TripResponse(
                    "Starting city and destination cannot be the same.", false);
        }
        if (request.getDays() < 1 || request.getDays() > 14) {
            return new TripResponse(
                    "Number of days must be between 1 and 14.", false);
        }
        if (request.getStyle() == null || request.getStyle().trim().isEmpty()) {
            return new TripResponse("Please select a travel style.", false);
        }
        if (request.getBudget() == null || request.getBudget().trim().isEmpty()) {
            return new TripResponse("Please select a budget range.", false);
        }

        // ── Generate Plan ─────────────────────────
        try {
            String plan = groqService.generateTripPlan(request);
            return new TripResponse(plan);
        } catch (Exception e) {
            return new TripResponse(e.getMessage(), false);
        }
    }

    @GetMapping("/health")
    public String health() {
        return "TripBharat is running!";
    }

    // ── Extract real IP (handles proxies) ─────────
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For can have multiple IPs — take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}