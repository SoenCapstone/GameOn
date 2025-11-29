package com.game.on.go_team_service.team.service;

import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class TeamSpecifications {

    private TeamSpecifications() {
    }

    public static Specification<Team> notArchived() {
        return (root, query, builder) -> builder.isNull(root.get("deletedAt"));
    }

    public static Specification<Team> withLeague(UUID leagueId) {
        return (root, query, builder) -> leagueId == null
                ? null
                : builder.equal(root.get("leagueId"), leagueId);
    }

    public static Specification<Team> withSport(String sport) {
        return (root, query, builder) -> sport == null
                ? null
                : builder.equal(builder.lower(root.get("sport")), sport.toLowerCase());
    }

    public static Specification<Team> search(String queryText) {
        return (root, query, builder) -> queryText == null
                ? null
                : builder.or(
                        builder.like(builder.lower(root.get("name")), like(queryText)),
                        builder.like(builder.lower(root.get("slug")), like(queryText))
                );
    }

    public static Specification<Team> mine(Long userId) {
        return (root, query, builder) -> {
            if (userId == null) {
                return null;
            }
            query.distinct(true);
            var join = root.join("members", JoinType.INNER);
            return builder.and(
                    builder.equal(join.get("userId"), userId),
                    builder.equal(join.get("status"), TeamMemberStatus.ACTIVE)
            );
        };
    }

    private static String like(String value) {
        return "%" + value.toLowerCase() + "%";
    }
}
