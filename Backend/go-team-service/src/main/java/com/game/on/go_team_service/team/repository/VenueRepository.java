package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VenueRepository extends JpaRepository<Venue, UUID> {
    Optional<Venue> findByNameIgnoreCaseAndStreetIgnoreCaseAndCityIgnoreCaseAndProvinceIgnoreCaseAndPostalCodeIgnoreCase(
            String name,
            String street,
            String city,
            String province,
            String postalCode
    );
}
