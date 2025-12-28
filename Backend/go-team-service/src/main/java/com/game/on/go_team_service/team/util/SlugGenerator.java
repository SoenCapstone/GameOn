package com.game.on.go_team_service.team.util;

import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public final class SlugGenerator {

    private final TeamRepository teamRepository;

    public static String from(String input) {
        if (input == null) {
            return null;
        }
        var nowhitespace = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^\\w\\- ]", "")
                .trim()
                .replaceAll("[\u005F]", "-")
                .replaceAll(" +", "-");
        return nowhitespace.toLowerCase(Locale.ENGLISH);
    }

    public String generateUniqueSlug(String name) {
        var baseSlug = SlugGenerator.from(name);
        if (!StringUtils.hasText(baseSlug)) {
            throw new BadRequestException("Unable to generate team slug");
        }
        var slug = baseSlug;
        int suffix = 1;
        while (teamRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + suffix++;
        }
        return slug;
    }
}
