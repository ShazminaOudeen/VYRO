package lk.vyro.gymbooking.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VYRO Gym Class Booking API")
                        .version("1.0.0")
                        .description("REST API for VYRO gym class scheduling, booking, waitlist queueing, and roster management.")
                        .contact(new Contact().name("VYRO Engineering").email("dev@vyro.lk")));
    }
}
