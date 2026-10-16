package lk.vyro.gymbooking.dev;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.vyro.gymbooking.config.DataSeeder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Development & Demo", description = "Endpoints for resetting demo seed data")
@RestController
@RequestMapping("/api/dev")
public class DevController {

    private final DataSeeder dataSeeder;

    public DevController(DataSeeder dataSeeder) {
        this.dataSeeder = dataSeeder;
    }

    @Operation(summary = "Reset database to seed data", description = "Wipes classes and bookings, then re-seeds 8 fresh upcoming classes relative to right now in Asia/Colombo.")
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetDatabase() {
        dataSeeder.resetAndSeed();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Database successfully reset to initial demo schedule relative to current time."
        ));
    }
}
