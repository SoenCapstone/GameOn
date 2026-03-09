package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.Venue;
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
