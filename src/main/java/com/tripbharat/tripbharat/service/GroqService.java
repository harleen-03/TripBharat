package com.tripbharat.tripbharat.service;

import com.tripbharat.tripbharat.model.TripRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.builder()
            .codecs(config -> config
                    .defaultCodecs()
                    .maxInMemorySize(2 * 1024 * 1024))
            .build();

    private static final String SYSTEM_PROMPT =
            "You are TripBharat, an Indian road trip planner. " +
                    "Respond in exactly this format:\n\n" +
                    "🚗 ROUTE\n[NH number, distance, drive time, warnings]\n\n" +
                    "⛽ FUEL STOPS\n[2 stops with location and km mark]\n\n" +
                    "🍽️ EAT ON THE WAY\n[3 local dhabas — no chains, include dish to order]\n\n" +
                    "📅 DAY-WISE PLAN\n[Day by day itinerary with timings]\n\n" +
                    "⚠️ TRIP WARNINGS\n[Weather, crowds, road conditions]\n\n" +
                    "📲 WHATSAPP SUMMARY\n[Fun shareable summary under 100 words]\n\n" +
                    "Use km, ₹, IST. Local food only. Verify road conditions before travel.";

    public String generateTripPlan(TripRequest request) {

        String userMessage = String.format(
                "Plan a road trip from %s to %s for %d days. " +
                        "Travel style: %s. Budget: %s per person. " +
                        "Give NH route, local dhabas, hidden gems, practical tips.",
                request.getFrom(),
                request.getTo(),
                request.getDays(),
                request.getStyle(),
                request.getBudget()
        );

        Map<String, Object> requestBody = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", SYSTEM_PROMPT
                        ),
                        Map.of(
                                "role", "user",
                                "content", userMessage
                        )
                ),
                "temperature", 0.7,
                "max_tokens", 1000
        );


        try {
            Map<?,?> response = webClient.post()
                    .uri("https://api.groq.com/openai/v1/chat/completions")
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> {
                                        System.out.println("=== GROQ ERROR ===");
                                        System.out.println(body);
                                        return new RuntimeException("Groq Error: " + body);
                                    })
                    )
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            return extractText(response);

        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    private String extractText(Map<?,?> response) {
        try {
            List<?> choices = (List<?>) response.get("choices");
            Map<?,?> choice = (Map<?,?>) choices.get(0);
            Map<?,?> message = (Map<?,?>) choice.get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to parse Groq response: " + e.getMessage()
            );
        }
    }
}