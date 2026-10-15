package lk.vyro.gymbooking.user.dto;

import lk.vyro.gymbooking.user.AppUser;
import lk.vyro.gymbooking.user.Role;

public record UserResponse(
    Long id,
    String name,
    String email,
    Role role
) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
