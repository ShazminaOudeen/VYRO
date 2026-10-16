package lk.vyro.gymbooking.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.vyro.gymbooking.ai.dto.AiClassSuggestion;
import lk.vyro.gymbooking.ai.dto.AiSuggestionRequest;
import lk.vyro.gymbooking.ai.dto.AiSuggestionResponse;
import lk.vyro.gymbooking.booking.BookingRepository;
import lk.vyro.gymbooking.booking.BookingService;
import lk.vyro.gymbooking.booking.BookingStatus;
import lk.vyro.gymbooking.gymclass.GymClassService;
import lk.vyro.gymbooking.gymclass.dto.GymClassResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final ZoneId COLOMBO_ZONE = ZoneId.of("Asia/Colombo");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMM d 'at' h:mm a");

    private final GymClassService gymClassService;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final RestClient restClient;

    @Value("${gemini.api.key:}")
    private String configuredApiKey;

    @Value("${gemini.model:gemini-3.1-flash-lite}")
    private String geminiModel;

    public AiService(GymClassService gymClassService,
                     BookingService bookingService,
                     BookingRepository bookingRepository,
                     ObjectMapper objectMapper,
                     Clock clock) {
        this.gymClassService = gymClassService;
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;

        // 15-second timeout for LLM generation
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8000);
        factory.setReadTimeout(15000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public AiSuggestionResponse getSuggestions(AiSuggestionRequest request) {
        String query = request.query().trim();
        Instant now = Instant.now(clock);

        // 1. Gather all candidate classes for the next 7 days that are in the future
        List<GymClassResponse> candidateClasses = gymClassService.getScheduleNext7Days().stream()
                .filter(c -> c.startsAt().isAfter(now))
                .filter(c -> {
                    if (request.memberId() == null) return true;
                    // Exclude classes member already booked or waitlisted
                    boolean hasActive = bookingRepository.existsByGymClassIdAndMemberIdAndStatusIn(
                            c.id(),
                            request.memberId(),
                            List.of(BookingStatus.BOOKED, BookingStatus.WAITLISTED)
                    );
                    if (hasActive) return false;
                    // Exclude classes overlapping with member's confirmed classes
                    return !bookingService.hasOverlappingBooking(request.memberId(), c.startsAt(), c.endsAt(), c.id());
                })
                .toList();

        if (candidateClasses.isEmpty()) {
            return new AiSuggestionResponse(query, "FALLBACK", List.of());
        }

        // 2. Resolve Gemini API Key
        String apiKey = resolveApiKey();

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                GeminiCallResult geminiResult = callGemini(candidateClasses, query, apiKey);
                if (geminiResult.success()) {
                    log.info("Gemini model ({}) responded successfully with {} suggestion(s) for query: '{}'",
                            geminiModel, geminiResult.suggestions().size(), query);
                    return new AiSuggestionResponse(query, "GEMINI", geminiResult.suggestions());
                }
            } catch (Exception e) {
                log.warn("Gemini AI API call encountered error: {}. Falling back to smart match engine.", e.getMessage());
            }
        } else {
            log.info("No GEMINI_API_KEY detected. Using smart match engine.");
        }

        // 3. Fallback Smart Matching Engine
        List<AiClassSuggestion> fallbackSuggestions = fallbackMatching(candidateClasses, query, now);
        return new AiSuggestionResponse(query, "FALLBACK", fallbackSuggestions);
    }

    private record GeminiCallResult(boolean success, List<AiClassSuggestion> suggestions) {}

        private String resolveApiKey() {
        if (configuredApiKey != null && !configuredApiKey.isBlank()) {
            return configuredApiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey.trim();
        }
        return readApiKeyFromDotEnv();
    }

    private String readApiKeyFromDotEnv() {
        List<Path> potentialPaths = List.of(
                Paths.get(".env"),
                Paths.get("backend", ".env"),
                Paths.get("..", ".env")
        );

        for (Path path : potentialPaths) {
            if (Files.exists(path)) {
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.startsWith("GEMINI_API_KEY=")) {
                            String value = line.substring("GEMINI_API_KEY=".length()).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (!value.isBlank()) {
                                return value;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Could not read .env at {}: {}", path, e.getMessage());
                }
            }
        }
        return null;
    }

    private GeminiCallResult callGemini(List<GymClassResponse> candidates, String query, String apiKey) {
        Map<Long, GymClassResponse> classMap = candidates.stream()
                .collect(Collectors.toMap(GymClassResponse::id, c -> c));

        List<Map<String, Object>> compactList = candidates.stream().map(c -> {
            ZonedDateTime zdt = c.startsAt().atZone(COLOMBO_ZONE);
            Map<String, Object> m = new HashMap<>();
            m.put("classId", c.id());
            m.put("title", c.title());
            m.put("coach", c.coach());
            m.put("dayOfWeek", zdt.getDayOfWeek().name());
            m.put("scheduledTime", zdt.format(TIME_FORMATTER));
            m.put("durationMinutes", c.durationMinutes());
            m.put("seatsLeft", c.seatsLeft());
            return m;
        }).toList();

        String classesJson;
        try {
            classesJson = objectMapper.writeValueAsString(compactList);
        } catch (Exception e) {
            classesJson = compactList.toString();
        }

        String prompt = """
            You are an intelligent fitness class recommender for VYRO gym.
            Given the user request and available gym classes, select up to 3 best matching classes.
            For each recommendation, give a friendly 1-sentence reason why it fits.

            CRITICAL SCHEDULING RULES:
            - If the user request mentions a specific day (e.g. "friday", "monday", "weekend", "saturday"), ONLY choose classes that match that day. If none match, return an empty array [].
            - If the user request specifies a time (e.g. "morning", "evening", "after 6.30pm", "after 6pm"), ONLY pick classes that start at or after that time.
            - If no classes match the requested schedule or criteria, return an empty array [] - do NOT recommend classes on the wrong day.

            Available classes (JSON):
            %s

            User request: "%s"

            Respond ONLY with a valid JSON array matching this format (no markdown code blocks, no text outside JSON):
            [
              {"classId": 1, "reason": "High-intensity workout tailored to your schedule."}
            ]
            """.formatted(classesJson, query);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "responseMimeType", "application/json"
                )
        );

        String[] modelsToTry = new String[]{geminiModel, "gemini-3.1-flash-lite"};

        for (String model : modelsToTry) {
            try {
                String targetUrl = GEMINI_BASE_URL + model + ":generateContent?key=" + apiKey;
                String responseStr = restClient.post()
                        .uri(targetUrl)
                        .header("x-goog-api-key", apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);

                List<AiClassSuggestion> parsed = parseGeminiResponse(responseStr, classMap);
                return new GeminiCallResult(true, parsed);
            } catch (Exception ex) {
                log.warn("Gemini model {} request failed: {}", model, ex.getMessage());
            }
        }

        return new GeminiCallResult(false, List.of());
    }

    private List<AiClassSuggestion> parseGeminiResponse(String rawResponse, Map<Long, GymClassResponse> classMap) {
        List<AiClassSuggestion> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode candidatesNode = root.path("candidates");
            if (candidatesNode.isMissingNode() || !candidatesNode.isArray() || candidatesNode.isEmpty()) {
                return results;
            }

            String contentText = candidatesNode.get(0).path("content").path("parts").get(0).path("text").asText();
            contentText = contentText.replaceAll("```json", "").replaceAll("```", "").trim();

            JsonNode suggestionsArray = objectMapper.readTree(contentText);
            if (suggestionsArray.isArray()) {
                Set<Long> seenIds = new HashSet<>();
                for (JsonNode item : suggestionsArray) {
                    long classId = item.has("classId") ? item.path("classId").asLong() : item.path("id").asLong();
                    String reason = item.path("reason").asText("Recommended for your fitness routine.");

                    if (classMap.containsKey(classId) && seenIds.add(classId)) {
                        results.add(new AiClassSuggestion(classId, classMap.get(classId), reason));
                        if (results.size() >= 3) break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse Gemini JSON output: {}", e.getMessage());
        }
        return results;
    }

    private List<AiClassSuggestion> fallbackMatching(List<GymClassResponse> candidates, String query, Instant now) {
        String q = query.toLowerCase();

        // 1. Detect requested Day
        String explicitDay = null;
        for (String day : List.of("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")) {
            if (q.contains(day)) {
                explicitDay = day;
                break;
            }
        }
        boolean wantWeekend = containsAny(q, "weekend", "saturday", "sunday");

        // 2. Detect requested Time
        boolean wantMorning = containsAny(q, "morning", "early", "breakfast", "dawn") || (q.contains("am") && !q.contains("pm"));
        boolean wantEvening = containsAny(q, "evening", "night", "sunset", "after work");

        // Parse "after 6", "after 6.30", "after 6:30pm", "after 7"
        int minMinuteOfDay = -1;
        Pattern afterPattern = Pattern.compile("after\\s*(\\d{1,2})(?:[.:](\\d{2}))?\\s*(am|pm)?");
        Matcher matcher = afterPattern.matcher(q);
        if (matcher.find()) {
            int h = Integer.parseInt(matcher.group(1));
            int m = matcher.group(2) != null ? Integer.parseInt(matcher.group(2)) : 0;
            String meridiem = matcher.group(3);
            if ("pm".equalsIgnoreCase(meridiem) && h < 12) {
                h += 12;
            } else if (h <= 11 && !q.contains("am") && (q.contains("pm") || h <= 9)) {
                h += 12; // "after 6.30" in evening context
            }
            minMinuteOfDay = h * 60 + m;
        }

        // Keywords detection
        boolean wantRelaxing = containsAny(q, "relax", "stretch", "yoga", "mobility", "calm", "recovery", "gentle", "pilates", "unwind", "chill", "easy", "light");
        boolean wantHard = containsAny(q, "hard", "hiit", "intense", "burn", "sweat", "cardio", "box", "boxing", "energy", "tough", "fast");
        boolean wantStrength = containsAny(q, "strength", "muscle", "lift", "weights", "circuit", "power", "iron", "body", "endurance");

        record ScoredClass(GymClassResponse gymClass, int score, String reason) {}
        List<ScoredClass> scored = new ArrayList<>();

        for (GymClassResponse c : candidates) {
            ZonedDateTime classTime = c.startsAt().atZone(COLOMBO_ZONE);
            int hour = classTime.getHour();
            int minute = classTime.getMinute();
            int classMinuteOfDay = hour * 60 + minute;
            DayOfWeek day = classTime.getDayOfWeek();
            boolean isWeekend = (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY);
            String dayName = day.name().toLowerCase();
            String lowerTitle = c.title().toLowerCase();

            // HARD FILTERS: If user specified a day and this class is NOT that day, skip it!
            if (explicitDay != null && !dayName.equals(explicitDay)) {
                continue;
            }
            if (wantWeekend && !isWeekend) {
                continue;
            }
            // HARD FILTER: If user specified "after X pm" and class is before that, skip it!
            if (minMinuteOfDay > 0 && classMinuteOfDay < minMinuteOfDay) {
                continue;
            }

            int score = 10; // Base score for passing hard filters

            // Match Intensity / Workout Theme
            if (wantRelaxing && containsAny(lowerTitle, "yoga", "stretch", "mobility", "recovery", "pilates")) {
                score += 25;
            }
            if (wantHard && containsAny(lowerTitle, "hiit", "burn", "box", "spin", "conditioning", "sweat")) {
                score += 25;
            }
            if (wantStrength && containsAny(lowerTitle, "strength", "circuit", "power", "iron", "lift", "crossfit", "weightlifting")) {
                score += 25;
            }

            // Match Time of Day
            if (wantMorning) {
                if (hour < 12) score += 20;
                else score -= 15;
            }
            if (wantEvening) {
                if (hour >= 17) score += 20;
                else score -= 15;
            }

            // Direct title or coach match
            if (q.contains(lowerTitle) || lowerTitle.contains(q)) score += 30;
            if (q.contains(c.coach().toLowerCase())) score += 20;

            String reason = buildFallbackReason(c, hour, isWeekend, wantRelaxing, wantHard, wantStrength);
            scored.add(new ScoredClass(c, score, reason));
        }

        scored.sort((a, b) -> {
            if (b.score() != a.score()) return Integer.compare(b.score(), a.score());
            return a.gymClass().startsAt().compareTo(b.gymClass().startsAt());
        });

        return scored.stream()
                .filter(s -> s.score() > 0)
                .limit(3)
                .map(s -> new AiClassSuggestion(s.gymClass().id(), s.gymClass(), s.reason()))
                .toList();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String buildFallbackReason(GymClassResponse c, int classHour, boolean isWeekend,
                                        boolean relaxing, boolean hard, boolean strength) {
        String titleLower = c.title().toLowerCase();

        if (relaxing && containsAny(titleLower, "yoga", "stretch", "mobility", "recovery", "pilates")) {
            return "Perfect for restorative stretching, relaxation, and physical recovery.";
        }
        if (hard && containsAny(titleLower, "hiit", "burn", "box", "conditioning", "cycling")) {
            return "High-intensity cardio session designed to challenge endurance and torch calories.";
        }
        if (strength && containsAny(titleLower, "strength", "circuit", "power", "lift", "crossfit", "weightlifting")) {
            return "Great full-body resistance workout to build muscular strength and tone.";
        }
        if (isWeekend) {
            return "Popular weekend session with Coach " + c.coach() + " to stay consistent.";
        }
        if (classHour < 12) {
            return "Energizing morning session with Coach " + c.coach() + " to start your day strong.";
        }
        if (classHour >= 17) {
            return "Convenient evening class with Coach " + c.coach() + " to decompress after your workday.";
        }
        return "Upcoming class with Coach " + c.coach() + " that fits your schedule.";
    }
}
