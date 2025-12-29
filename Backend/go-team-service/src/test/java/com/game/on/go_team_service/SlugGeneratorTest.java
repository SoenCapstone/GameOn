package com.game.on.go_team_service;

import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.team.repository.TeamRepository;
import com.game.on.go_team_service.team.util.SlugGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlugGeneratorTest {

    private final TeamRepository teamRepository = mock(TeamRepository.class);
    private final SlugGenerator slugGenerator = new SlugGenerator(teamRepository);

    @Test
    void from_whenNull_returnsNull() {
        assertNull(SlugGenerator.from(null));
    }

    @Test
    void from_whenSimpleWords_lowercasesAndHyphenates() {
        assertEquals("hello-world", SlugGenerator.from("Hello World"));
    }

    @Test
    void from_removesDiacritics() {
        // Montréal -> montreal
        assertEquals("montreal", SlugGenerator.from("Montréal"));
    }

    @Test
    void from_replacesUnderscoresWithHyphens() {
        assertEquals("a-b-c", SlugGenerator.from("A_B_C"));
    }

    @Test
    void from_trimsAndCollapsesSpaces() {
        assertEquals("my-team-name", SlugGenerator.from("   My   Team   Name   "));
    }

    @Test
    void from_removesNonWordCharsButKeepsHyphenAndSpaces() {
        // punctuation removed, spaces collapsed to hyphen
        assertEquals("team-1-2", SlugGenerator.from("Team! 1 @ 2"));
    }

    @Test
    void from_allInvalidCharacters_becomesEmptyString() {
        // everything is stripped, leaving ""
        assertEquals("", SlugGenerator.from("!!!@@@###"));
    }

    @Test
    void generateUniqueSlug_whenBaseUnique_returnsBase() {
        when(teamRepository.existsBySlug("my-team")).thenReturn(false);

        String out = slugGenerator.generateUniqueSlug("My Team");

        assertEquals("my-team", out);
        verify(teamRepository).existsBySlug("my-team");
        verifyNoMoreInteractions(teamRepository);
    }

    @Test
    void generateUniqueSlug_whenBaseTaken_appendsSuffix1() {
        when(teamRepository.existsBySlug("my-team")).thenReturn(true);
        when(teamRepository.existsBySlug("my-team-1")).thenReturn(false);

        String out = slugGenerator.generateUniqueSlug("My Team");

        assertEquals("my-team-1", out);
        verify(teamRepository).existsBySlug("my-team");
        verify(teamRepository).existsBySlug("my-team-1");
        verifyNoMoreInteractions(teamRepository);
    }

    @Test
    void generateUniqueSlug_whenMultipleTaken_incrementsSuffixUntilFree() {
        when(teamRepository.existsBySlug("my-team")).thenReturn(true);
        when(teamRepository.existsBySlug("my-team-1")).thenReturn(true);
        when(teamRepository.existsBySlug("my-team-2")).thenReturn(true);
        when(teamRepository.existsBySlug("my-team-3")).thenReturn(false);

        String out = slugGenerator.generateUniqueSlug("My Team");

        assertEquals("my-team-3", out);

        verify(teamRepository).existsBySlug("my-team");
        verify(teamRepository).existsBySlug("my-team-1");
        verify(teamRepository).existsBySlug("my-team-2");
        verify(teamRepository).existsBySlug("my-team-3");
        verifyNoMoreInteractions(teamRepository);
    }

    @Test
    void generateUniqueSlug_whenGeneratedSlugBlank_throwsBadRequest() {
        // baseSlug becomes "" after cleaning => hasText() false
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> slugGenerator.generateUniqueSlug("!!!@@@###")
        );

        assertEquals("Unable to generate team slug", ex.getMessage());
        verifyNoInteractions(teamRepository);
    }

    @Test
    void generateUniqueSlug_whenNameIsNull_throwsBadRequest() {
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> slugGenerator.generateUniqueSlug(null)
        );

        assertEquals("Unable to generate team slug", ex.getMessage());
        verifyNoInteractions(teamRepository);
    }

    @Test
    void generateUniqueSlug_whenNameIsOnlyWhitespace_throwsBadRequest() {
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> slugGenerator.generateUniqueSlug("   ")
        );

        assertEquals("Unable to generate team slug", ex.getMessage());
        verifyNoInteractions(teamRepository);
    }
}

