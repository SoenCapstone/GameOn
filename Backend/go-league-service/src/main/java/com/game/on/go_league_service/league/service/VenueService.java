package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.client.dto.TeamSummaryResponse;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.VenueCreateRequest;
import com.game.on.go_league_service.league.dto.VenueResponse;
import com.game.on.go_league_service.league.model.Venue;
import com.game.on.go_league_service.league.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;
    private final TeamClient teamClient;
    private final CurrentUserProvider userProvider;

    @Transactional
    public VenueResponse createVenue(VenueCreateRequest request) {
        String userId = userProvider.clerkUserId();

        String name = trimToNull(request.name());
        String street = trimToNull(request.street());
        String city = trimToNull(request.city());
        String province = trimToNull(request.province());
        String postalCode = trimToNull(request.postalCode());
        String country = trimToNull(request.country());
        String region = resolveRegion(request.region(), city);

        venueRepository
                .findByNameIgnoreCaseAndStreetIgnoreCaseAndCityIgnoreCaseAndProvinceIgnoreCaseAndPostalCodeIgnoreCase(
                        name,
                        street,
                        city,
                        province,
                        postalCode
                )
                .ifPresent(existing -> {
                    throw new BadRequestException("Venue already exists at this address");
                });

        validateRegionAgainstTeams(region, request.homeTeamId(), request.awayTeamId());

        Venue venue = Venue.builder()
                .name(name)
                .street(street)
                .city(city)
                .province(province)
                .postalCode(postalCode)
                .country(country == null ? "Canada" : country)
                .region(region)
                .latitude(request.latitude())
                .longitude(request.longitude())
                .googlePlaceId(trimToNull(request.googlePlaceId()))
                .createdByUserId(userId)
                .build();

        return toResponse(venueRepository.save(venue));
    }

    @Transactional(readOnly = true)
    public List<VenueResponse> listVenues(UUID homeTeamId, UUID awayTeamId) {
        List<Venue> venues = venueRepository.findAll();
        if (homeTeamId == null && awayTeamId == null) {
            return venues.stream().map(this::toResponse).toList();
        }

        TeamSummaryResponse homeTeam = homeTeamId == null ? null : teamClient.getTeam(homeTeamId);
        TeamSummaryResponse awayTeam = awayTeamId == null ? null : teamClient.getTeam(awayTeamId);

        return venues.stream()
                .filter(venue -> isRegionAllowed(venue.getRegion(), homeTeam, awayTeam))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VenueResponse getVenue(UUID venueId) {
        return toResponse(requireVenue(venueId));
    }

    @Transactional(readOnly = true)
    public Venue requireVenue(UUID venueId) {
        return venueRepository.findById(venueId)
                .orElseThrow(() -> new NotFoundException("Venue not found"));
    }

    @Transactional(readOnly = true)
    public String resolveMatchRegion(Venue venue) {
        return trimToNull(venue.getRegion());
    }

    @Transactional(readOnly = true)
    public void ensureRegionAllowedForMatch(Venue venue, UUID homeTeamId, UUID awayTeamId) {
        TeamSummaryResponse homeTeam = teamClient.getTeam(homeTeamId);
        TeamSummaryResponse awayTeam = teamClient.getTeam(awayTeamId);
        if (!isRegionAllowed(venue.getRegion(), homeTeam, awayTeam)) {
            throw new BadRequestException("Selected venue is outside allowed regions for the teams");
        }
    }

    private void validateRegionAgainstTeams(String region, UUID homeTeamId, UUID awayTeamId) {
        if (homeTeamId == null && awayTeamId == null) {
            return;
        }
        TeamSummaryResponse homeTeam = homeTeamId == null ? null : teamClient.getTeam(homeTeamId);
        TeamSummaryResponse awayTeam = awayTeamId == null ? null : teamClient.getTeam(awayTeamId);
        if (!isRegionAllowed(region, homeTeam, awayTeam)) {
            throw new BadRequestException("Venue region is outside allowed regions for this scheduling context");
        }
    }

    private boolean isRegionAllowed(String region, TeamSummaryResponse homeTeam, TeamSummaryResponse awayTeam) {
        if (region == null) {
            return false;
        }
        if (homeTeam != null && !containsIgnoreCase(normalizeRegions(homeTeam.allowedRegions()), region)) {
            return false;
        }
        if (awayTeam != null && !containsIgnoreCase(normalizeRegions(awayTeam.allowedRegions()), region)) {
            return false;
        }
        return true;
    }

    private VenueResponse toResponse(Venue venue) {
        return new VenueResponse(
                venue.getId(),
                venue.getName(),
                venue.getStreet(),
                venue.getCity(),
                venue.getProvince(),
                venue.getPostalCode(),
                venue.getCountry(),
                venue.getRegion(),
                venue.getLatitude(),
                venue.getLongitude(),
                venue.getGooglePlaceId(),
                venue.getCreatedByUserId(),
                venue.getCreatedAt(),
                venue.getUpdatedAt()
        );
    }

    private List<String> normalizeRegions(List<String> regions) {
        if (regions == null) {
            return List.of();
        }
        return regions.stream()
                .map(this::trimToNull)
                .filter(value -> value != null)
                .toList();
    }

    private boolean containsIgnoreCase(List<String> values, String target) {
        if (target == null || values == null) {
            return false;
        }
        return values.stream().anyMatch(value -> value != null && value.equalsIgnoreCase(target));
    }

    private String resolveRegion(String requestedRegion, String city) {
        String normalized = trimToNull(requestedRegion);
        if (normalized != null) {
            return normalized;
        }
        String fallback = trimToNull(city);
        if (fallback == null) {
            throw new BadRequestException("region could not be resolved from venue address");
        }
        return fallback;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
