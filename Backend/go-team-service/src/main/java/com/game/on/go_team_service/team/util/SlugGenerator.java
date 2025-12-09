package com.game.on.go_team_service.team.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugGenerator {

    private SlugGenerator() {
    }

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
}
