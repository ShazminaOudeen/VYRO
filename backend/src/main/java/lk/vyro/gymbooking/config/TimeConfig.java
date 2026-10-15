package lk.vyro.gymbooking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class TimeConfig {

    public static final ZoneId ASIA_COLOMBO = ZoneId.of("Asia/Colombo");

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public ZoneId zoneId() {
        return ASIA_COLOMBO;
    }
}
