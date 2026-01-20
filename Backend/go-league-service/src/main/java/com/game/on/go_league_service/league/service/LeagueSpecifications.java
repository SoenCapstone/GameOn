package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.UUID;

public final class LeagueSpecifications {

    private LeagueSpecifications() {
    }

    public static Specification<League> notArchived() {
        return (root, query, builder) -> builder.isNull(root.get("archivedAt"));
    }

    public static Specification<League> withSport(String sport) {
        return (root, query, builder) -> sport == null
                ? null
                : builder.equal(builder.lower(root.get("sport")), sport.toLowerCase());
    }

    public static Specification<League> withRegion(String region) {
        return (root, query, builder) -> region == null
                ? null
                : builder.equal(builder.lower(root.get("region")), region.toLowerCase());
    }

    public static Specification<League> search(String queryText) {
        return (root, query, builder) -> queryText == null
                ? null
                : builder.or(
                        builder.like(builder.lower(root.get("name")), like(queryText)),
                        builder.like(builder.lower(root.get("slug")), like(queryText))
                );
    }

    public static Specification<League> ownerIs(String  ownerId) {
        return (root, query, builder) -> ownerId == null
                ? builder.disjunction()
                : builder.equal(root.get("ownerUserId"), ownerId);
    }

    public static Specification<League> visibleTo(String callerId) {
        return (root, query, builder) -> {
            if (callerId == null) {
                return builder.equal(root.get("privacy"), LeaguePrivacy.PUBLIC);
            }
            return builder.or(
                    builder.equal(root.get("privacy"), LeaguePrivacy.PUBLIC),
                    builder.equal(root.get("ownerUserId"), callerId)
            );
        };
    }

    public static Specification<League> idIn(Collection<UUID> leagueIds) {
        return (root, query, builder) -> {
            if (leagueIds == null || leagueIds.isEmpty()) {
                return builder.disjunction();
            }
            return root.get("id").in(leagueIds);
        };
    }

    private static String like(String value) {
        return "%" + value.toLowerCase() + "%";
    }
}
