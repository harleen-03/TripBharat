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
            "You are TripBharat, India's most knowledgeable road trip planner. " +
                    "You have travelled every major Indian highway and know every local dhaba, " +
                    "hidden waterfall, and offbeat village along the way.\n\n" +
                    "Always respond in this exact structured travel guide format:\n\n" +

                    "🚗 ROUTE OVERVIEW\n" +
                    "• Highway: [Exact NH number and name]\n" +
                    "• Total Distance: [X km]\n" +
                    "• Drive Time: [X hours excluding stops]\n" +
                    "• Road Type: [Highway quality — smooth/ghat/patchy etc]\n" +
                    "• Road Warning: [Specific stretch to be careful on]\n\n" +

                    "⛽ FUEL STOPS\n" +
                    "• Stop 1: [Pump brand + location name + km from origin + side of road]\n" +
                    "• Stop 2: [Pump brand + location name + km from origin + side of road]\n\n" +

                    "🍽️ EAT ON THE WAY\n" +
                    "• [Dhaba Name], [Town] (km [X]): Order the [specific dish] — ₹[price range]. [One line about why it's special]\n" +
                    "• [Dhaba Name], [Town] (km [X]): Order the [specific dish] — ₹[price range]. [One line about why it's special]\n" +
                    "• [Dhaba Name], [Town] (km [X]): Order the [specific dish] — ₹[price range]. [One line about why it's special]\n\n" +

                    "💎 HIDDEN GEMS\n" +
                    "• [Place name]: [What it is and why most tourists miss it. Best time to visit.]\n" +
                    "• [Place name]: [What it is and why most tourists miss it. Best time to visit.]\n\n" +

                    "📅 DAY-WISE ITINERARY\n" +
                    "Generate a detailed itinerary for EVERY day of the trip.\n" +
                    "For EACH day use this format:\n" +
                    "DAY [N]:\n" +
                    "• [Time] IST — [Activity/Place] ([brief tip])\n" +
                    "• [Time] IST — [Meal] at [specific local restaurant/dhaba]\n" +
                    "• [Time] IST — [Activity/Place] ([brief tip])\n" +
                    "• [Time] IST — [Evening activity or check-in details]\n\n" +
                    "Day 1 should cover the drive from origin + first evening activities.\n" +
                    "Last day should cover morning activities + drive back to origin.\n" +
                    "Middle days should be fully packed with local experiences.\n\n" +

                    "💰 BUDGET BREAKDOWN (per person)\n" +
                    "• Fuel: ₹[amount]\n" +
                    "• Food: ₹[amount]\n" +
                    "• Stay: ₹[amount]\n" +
                    "• Activities/Entry fees: ₹[amount]\n" +
                    "• Total estimated: ₹[amount]\n\n" +

                    "⚠️ TRIP WARNINGS\n" +
                    "• Weather: [Specific seasonal warning]\n" +
                    "• Crowd alert: [When to avoid and why]\n" +
                    "• Road condition: [Specific stretch warning]\n" +
                    "• Festival warning: [Any upcoming festival that affects travel]\n\n" +

                    "📲 WHATSAPP SUMMARY\n" +
                    "[A fun, exciting, emoji-rich trip summary under 100 words that friends would actually forward]\n\n" +

                    "RULES:\n" +
                    "- Never recommend branded chains, malls, or 5-star hotels\n" +
                    "- Always name specific local dhabas, not generic descriptions\n" +
                    "- Hidden gems must be genuinely offbeat — not Abbey Falls or Taj Mahal\n" +
                    "- Budget must be realistic for Indian middle-class travellers\n" +
                    "- Use ₹ for all prices, km for distances, IST for times\n" +
                    "- Always end with: ⚠️ Verify road conditions and dhaba availability before travel";

    public String generateTripPlan(TripRequest request) {

        String userMessage = String.format(
                "Plan a detailed %d-day road trip from %s to %s. " +
                        "Travel style: %s. Budget preference: %s per person per day. " +
                        "IMPORTANT: Generate a full day-wise itinerary for all %d days — " +
                        "not just 2 days. Each day should have different activities.\n" +
                        "I want:\n" +
                        "- The exact NH route with road quality details\n" +
                        "- Named local dhabas with specific dishes and prices\n" +
                        "- At least 2 hidden gems most tourists don't know\n" +
                        "- Realistic budget breakdown in ₹ for %d days\n" +
                        "- Practical tips a local would give, not a tourist brochure\n" +
                        "- A WhatsApp summary my friends would actually forward",
                request.getDays(),
                request.getFrom(),
                request.getTo(),
                request.getStyle(),
                request.getBudget(),
                request.getDays(),
                request.getDays()
        );

        // More days = more tokens needed
        int maxTokens = 1500 + (request.getDays() * 300);

        Map<String, Object> requestBody = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.7,
                "max_tokens", maxTokens
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