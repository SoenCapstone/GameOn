package com.game.on.go_league_service.league.util;

import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public final class SlugGenerator {

    private final LeagueRepository leagueRepository;


    public static String from(String input) {
        if (input == null) {
            return null;
        }
        var normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^\\w\\- ]", "")
                .trim()
                .replaceAll("[\\u005F]", "-")
                .replaceAll(" +", "-");
        return normalized.toLowerCase(Locale.ENGLISH);
    }

    public String generateUniqueSlug(String name) {
        var baseSlug = SlugGenerator.from(name);
        if (!StringUtils.hasText(baseSlug)) {
            throw new BadRequestException("Unable to generate league slug");
        }
        var slug = baseSlug;
        int suffix = 1;
        while (leagueRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + suffix++;
        }
        return slug;
    }
}
