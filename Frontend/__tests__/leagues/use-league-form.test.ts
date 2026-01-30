import { renderHook, act } from "@testing-library/react-native";
import { useLeagueForm } from "@/hooks/use-league-form";
import { SPORTS } from "@/components/teams/team-form-constants";
import { LEVEL_OPTIONS } from "@/components/leagues/league-form-constants";

describe("useLeagueForm", () => {
  it("initializes with default values and all setters", () => {
    const { result } = renderHook(() => useLeagueForm());

    expect(result.current.leagueName).toBe("");
    expect(result.current.selectedSport).toBeNull();
    expect(result.current.selectedLevel).toBeNull();
    expect(result.current.region).toBe("");
    expect(result.current.location).toBe("");
    expect(result.current.isPublic).toBe(true);
    expect(result.current.openPicker).toBeNull();

    expect(typeof result.current.setLeagueName).toBe("function");
    expect(typeof result.current.setSelectedSport).toBe("function");
    expect(typeof result.current.setSelectedLevel).toBe("function");
    expect(typeof result.current.setRegion).toBe("function");
    expect(typeof result.current.setLocation).toBe("function");
    expect(typeof result.current.setIsPublic).toBe("function");
    expect(typeof result.current.setOpenPicker).toBe("function");
  });

  it("updates all form fields", () => {
    const { result } = renderHook(() => useLeagueForm());
    const sport = SPORTS[0];
    const level = LEVEL_OPTIONS[0];

    act(() => {
      result.current.setLeagueName("Test League");
      result.current.setSelectedSport(sport);
      result.current.setSelectedLevel(level);
      result.current.setRegion("North America");
      result.current.setLocation("Toronto, ON");
      result.current.setIsPublic(false);
      result.current.setOpenPicker("sport");
    });

    expect(result.current.leagueName).toBe("Test League");
    expect(result.current.selectedSport).toBe(sport);
    expect(result.current.selectedLevel).toBe(level);
    expect(result.current.region).toBe("North America");
    expect(result.current.location).toBe("Toronto, ON");
    expect(result.current.isPublic).toBe(false);
    expect(result.current.openPicker).toBe("sport");
  });

  it("toggles privacy setting and clears picker", () => {
    const { result } = renderHook(() => useLeagueForm());

    expect(result.current.isPublic).toBe(true);

    act(() => {
      result.current.setIsPublic(false);
    });
    expect(result.current.isPublic).toBe(false);

    act(() => {
      result.current.setIsPublic(true);
    });
    expect(result.current.isPublic).toBe(true);

    act(() => {
      result.current.setOpenPicker("sport");
    });
    expect(result.current.openPicker).toBe("sport");

    act(() => {
      result.current.setOpenPicker(null);
    });
    expect(result.current.openPicker).toBeNull();
  });

  it("initializes with full initial data", () => {
    const initialData = {
      name: "My League",
      sport: "Soccer",
      region: "North America",
      location: "Toronto",
      level: "RECREATIONAL",
      privacy: "PUBLIC",
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.leagueName).toBe("My League");
    expect(result.current.region).toBe("North America");
    expect(result.current.location).toBe("Toronto");
    expect(result.current.isPublic).toBe(true);
  });

  it("initializes with partial initial data", () => {
    const initialData = {
      name: "Partial League",
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.leagueName).toBe("Partial League");
    expect(result.current.selectedSport).toBeNull();
    expect(result.current.selectedLevel).toBeNull();
    expect(result.current.region).toBe("");
    expect(result.current.location).toBe("");
  });

  it("handles sport and level initialization with case-insensitive matching", () => {
    const initialData = {
      name: "My League",
      sport: "SOCCER",
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.selectedSport).toBeDefined();
    expect(result.current.selectedSport?.label.toLowerCase()).toBe("soccer");
  });

  it("initializes level from LEVEL_OPTIONS by ID", () => {
    const levelOption = LEVEL_OPTIONS[0];
    const initialData = {
      name: "My League",
      level: levelOption.id,
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.selectedLevel).toEqual(levelOption);
  });

  it("handles PRIVATE privacy during initialization", () => {
    const initialData = {
      name: "My League",
      privacy: "PRIVATE",
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.isPublic).toBe(false);
  });

  it("handles missing sport and level gracefully", () => {
    const initialData = {
      name: "My League",
      sport: "NonexistentSport",
      level: "NONEXISTENT_LEVEL",
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.selectedSport).toBeNull();
    expect(result.current.selectedLevel).toBeNull();
  });

  it("handles empty strings and null initialData", () => {
    const initialDataEmpty = {
      name: "My League",
      sport: "",
      region: "",
      location: "",
    };

    const { result: result1 } = renderHook(() =>
      useLeagueForm({ initialData: initialDataEmpty }),
    );

    expect(result1.current.leagueName).toBe("My League");
    expect(result1.current.region).toBe("");
    expect(result1.current.location).toBe("");

    const { result: result2 } = renderHook(() =>
      useLeagueForm({ initialData: undefined }),
    );

    expect(result2.current.leagueName).toBe("");
    expect(result2.current.region).toBe("");
  });

  it("handles long, special character, and unicode input", () => {
    const { result } = renderHook(() => useLeagueForm());
    const longName = "A".repeat(200);
    const specialName = "League @#$% & Special!";
    const unicodeName = "Liga 🏆 ⚽";

    act(() => {
      result.current.setLeagueName(longName);
    });
    expect(result.current.leagueName).toBe(longName);

    act(() => {
      result.current.setLeagueName(specialName);
    });
    expect(result.current.leagueName).toBe(specialName);

    act(() => {
      result.current.setLeagueName(unicodeName);
    });
    expect(result.current.leagueName).toBe(unicodeName);
  });

  it("initializes with long, special, and unicode characters", () => {
    const initialData = {
      name: "C".repeat(200),
      region: "D".repeat(200),
      location: "Location, City (State) @#$%",
      sport: "Soccer",
      level: "BEGINNER",
    };

    const { result } = renderHook(() => useLeagueForm({ initialData }));

    expect(result.current.leagueName).toBe("C".repeat(200));
    expect(result.current.region).toBe("D".repeat(200));
    expect(result.current.location).toBe("Location, City (State) @#$%");
  });

  it("preserves state across multiple renders and handles reset", () => {
    const { result, rerender } = renderHook(() => useLeagueForm());

    act(() => {
      result.current.setLeagueName("Test League");
      result.current.setRegion("Test Region");
      result.current.setIsPublic(false);
    });

    const name1 = result.current.leagueName;
    const region1 = result.current.region;

    rerender({});

    expect(result.current.leagueName).toBe(name1);
    expect(result.current.region).toBe(region1);

    act(() => {
      result.current.setLeagueName("");
      result.current.setRegion("");
      result.current.setLocation("");
      result.current.setIsPublic(true);
      result.current.setSelectedSport(null);
      result.current.setSelectedLevel(null);
    });

    expect(result.current.leagueName).toBe("");
    expect(result.current.region).toBe("");
    expect(result.current.isPublic).toBe(true);
    expect(result.current.selectedSport).toBeNull();
    expect(result.current.selectedLevel).toBeNull();
  });

  it("handles sport option updates without crashing", () => {
    const { result } = renderHook(() => useLeagueForm());

    act(() => {
      result.current.setSelectedSport(SPORTS[0]);
    });

    expect(result.current.selectedSport).toBeDefined();

    act(() => {
      result.current.setSelectedSport(SPORTS[1] || null);
    });

    expect(result.current.selectedSport).toBeDefined();
  });
});
