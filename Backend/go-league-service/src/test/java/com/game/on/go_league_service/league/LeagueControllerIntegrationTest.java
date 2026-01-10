package com.game.on.go_league_service.league;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


class LeagueControllerIntegrationTest {

    private MockMvc mockMvc;

    private Object leagueController;

    @BeforeEach
    void setup() throws Exception {
        this.leagueController = instantiateLeagueControllerWithMocks();
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(leagueController)
                .build();
    }

    @Test
    void controllerClassIsDiscovered() {
        assertThat(leagueController).isNotNull();
        assertThat(leagueController.getClass().getSimpleName().toLowerCase()).contains("league");
        assertThat(leagueController.getClass().getSimpleName().toLowerCase()).contains("controller");
    }

    @Test
    void controllerHasAtLeastOneRequestMapping() {
        List<String> paths = extractRequestMappingPaths(leagueController.getClass());
        assertThat(paths)
                .as("Expected at least one @RequestMapping path on the League controller")
                .isNotEmpty();

        boolean anyMentionsLeague = paths.stream().anyMatch(p -> p.toLowerCase().contains("league"));
        assertThat(anyMentionsLeague)
                .as("Expected at least one mapping path containing 'league'")
                .isTrue();
    }

    @Test
    void unknownRouteReturns404() throws Exception {
        mockMvc.perform(get("/__this_route_should_not_exist__"))
                .andExpect(status().isNotFound());
    }

    private static Object instantiateLeagueControllerWithMocks() throws Exception {
        Class<?> controllerClass = findLeagueControllerClass();
        assertThat(controllerClass)
                .as("Could not find a League controller annotated with @RestController")
                .isNotNull();

        Constructor<?> ctor = Arrays.stream(controllerClass.getDeclaredConstructors())
                .max(Comparator.comparingInt(Constructor::getParameterCount))
                .orElseThrow(() -> new IllegalStateException("No constructor found for " + controllerClass.getName()));

        Object[] args = Arrays.stream(ctor.getParameterTypes())
                .map(Mockito::mock)
                .toArray();

        ctor.setAccessible(true);
        Object instance = ctor.newInstance(args);


        for (var field : controllerClass.getDeclaredFields()) {
            field.setAccessible(true);
            Object current = field.get(instance);
            if (current == null && !field.getType().isPrimitive()) {
                try {
                    ReflectionTestUtils.setField(instance, field.getName(), Mockito.mock(field.getType()));
                } catch (Throwable ignored) {

                }
            }
        }

        return instance;
    }

    private static Class<?> findLeagueControllerClass() {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);

        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        String basePackage = "com.game.on.go_league_service";

        return scanner.findCandidateComponents(basePackage).stream()
                .map(bd -> {
                    try {
                        return Class.forName(bd.getBeanClassName());
                    } catch (ClassNotFoundException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .filter(c -> c.getSimpleName().toLowerCase().contains("league"))
                .filter(c -> c.getSimpleName().toLowerCase().contains("controller"))
                .findFirst()
                .orElse(null);
    }

    private static List<String> extractRequestMappingPaths(Class<?> controllerClass) {
        List<String> classPaths = new ArrayList<>();
        RequestMapping classMapping = controllerClass.getAnnotation(RequestMapping.class);
        if (classMapping != null) {
            classPaths.addAll(extractPaths(classMapping.value(), classMapping.path()));
        } else {
            classPaths.add("");
        }

        Set<String> methodPaths = new LinkedHashSet<>();
        for (Method m : controllerClass.getDeclaredMethods()) {
            RequestMapping rm = m.getAnnotation(RequestMapping.class);
            if (rm != null) {
                methodPaths.addAll(extractPaths(rm.value(), rm.path()));
            } else {
                Arrays.stream(m.getAnnotations())
                        .map(a -> a.annotationType().getAnnotation(RequestMapping.class))
                        .filter(Objects::nonNull)
                        .forEach(meta -> methodPaths.addAll(extractPaths(meta.value(), meta.path())));
            }
        }

        Set<String> combined = new LinkedHashSet<>();
        for (String cp : classPaths) {
            for (String mp : methodPaths) {
                String full = (StringUtils.hasText(cp) ? cp : "") + (StringUtils.hasText(mp) ? mp : "");
                if (!StringUtils.hasText(full)) full = "/";
                combined.add(full);
            }
        }

        return combined.stream()
                .map(p -> p.startsWith("/") ? p : "/" + p)
                .collect(Collectors.toList());
    }

    private static List<String> extractPaths(String[] value, String[] path) {
        List<String> out = new ArrayList<>();
        if (value != null) out.addAll(Arrays.asList(value));
        if (path != null) out.addAll(Arrays.asList(path));
        out = out.stream().filter(StringUtils::hasText).collect(Collectors.toList());
        if (out.isEmpty()) out.add("");
        return out;
    }
}
