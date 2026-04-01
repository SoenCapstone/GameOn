import { renderHook, act } from "@testing-library/react-native";
import { useTeamForm } from "@/hooks/use-team-form";
import type { TeamDetailResponse } from "@/hooks/use-team-detail";

type TeamFormInitialData = TeamDetailResponse;

function makeInitialData(
  overrides: Partial<TeamDetailResponse> = {},
): TeamDetailResponse {
  return {
    id: "team-1",
    name: "Test Team",
    sport: null,
    location: null,
    allowedRegions: null,
    logoUrl: null,
    scope: null,
    privacy: "PUBLIC",
    ownerUserId: "owner-1",
    ...overrides,
  };
}

describe("useTeamForm", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useTeamForm());

    expect(result.current.teamName).toBe("");
    expect(result.current.selectedSport).toBeUndefined();
    expect(result.current.selectedScope).toBeUndefined();
    expect(result.current.selectedCity).toBeUndefined();
    expect(result.current.logoUri).toBeNull();
    expect(result.current.isPublic).toBe(true);
    expect(result.current.openPicker).toBeNull();
  });

  it("initializes with provided initial data", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      sport: "Soccer",
      scope: "managed",
      location: "Montreal",
      allowedRegions: ["Montreal"],
      logoUrl: "https://example.com/logo.png",
      privacy: "PUBLIC",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.teamName).toBe("Test Team");
    expect(result.current.selectedSport).toEqual({
      id: "soccer",
      label: "Soccer",
    });
    expect(result.current.selectedScope).toEqual({
      id: "managed",
      label: "Managed",
    });
    expect(result.current.selectedCity).toEqual({
      id: "mtl",
      label: "Montreal",
    });
    expect(result.current.logoUri).toBe("https://example.com/logo.png");
    expect(result.current.isPublic).toBe(true);
  });

  it("sets privacy to false when initial data is PRIVATE", () => {
    const initialData = makeInitialData({
      name: "Private Team",
      privacy: "PRIVATE",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.isPublic).toBe(false);
  });

  it("updates team name", () => {
    const { result } = renderHook(() => useTeamForm());

    act(() => {
      result.current.setTeamName("New Team Name");
    });

    expect(result.current.teamName).toBe("New Team Name");
  });

  it("updates selected sport", () => {
    const { result } = renderHook(() => useTeamForm());
    const newSport = { id: "basketball", label: "Basketball" };

    act(() => {
      result.current.setSelectedSport(newSport);
    });

    expect(result.current.selectedSport).toEqual(newSport);
  });

  it("updates selected scope", () => {
    const { result } = renderHook(() => useTeamForm());
    const newScope = { id: "league_ready", label: "League Ready" };

    act(() => {
      result.current.setSelectedScope(newScope);
    });

    expect(result.current.selectedScope).toEqual(newScope);
  });

  it("updates selected city", () => {
    const { result } = renderHook(() => useTeamForm());
    const newCity = { id: "tor", label: "Toronto" };

    act(() => {
      result.current.setSelectedCity(newCity);
    });

    expect(result.current.selectedCity).toEqual(newCity);
  });

  it("updates logo URI", () => {
    const { result } = renderHook(() => useTeamForm());
    const newLogo = "https://example.com/new-logo.png";

    act(() => {
      result.current.setLogoUri(newLogo);
    });

    expect(result.current.logoUri).toBe(newLogo);
  });

  it("toggles isPublic", () => {
    const { result } = renderHook(() => useTeamForm());

    expect(result.current.isPublic).toBe(true);

    act(() => {
      result.current.setIsPublic(false);
    });

    expect(result.current.isPublic).toBe(false);

    act(() => {
      result.current.setIsPublic(true);
    });

    expect(result.current.isPublic).toBe(true);
  });

  it("updates open picker state", () => {
    const { result } = renderHook(() => useTeamForm());

    act(() => {
      result.current.setOpenPicker("sport");
    });

    expect(result.current.openPicker).toBe("sport");

    act(() => {
      result.current.setOpenPicker("city");
    });

    expect(result.current.openPicker).toBe("city");

    act(() => {
      result.current.setOpenPicker(null);
    });

    expect(result.current.openPicker).toBeNull();
  });

  it("handles case-insensitive sport matching", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      sport: "BASKETBALL",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedSport).toEqual({
      id: "basketball",
      label: "Basketball",
    });
  });

  it("handles case-insensitive scope matching", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      scope: "LEAGUE_READY",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedScope).toEqual({
      id: "league_ready",
      label: "League Ready",
    });
  });

  it("handles case-insensitive city matching", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      location: "VANCOUVER",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedCity).toEqual({
      id: "van",
      label: "Vancouver",
    });
  });

  it("handles missing sport in initial data gracefully", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      sport: "NonExistentSport",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedSport).toBeUndefined();
  });

  it("handles missing scope in initial data gracefully", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      scope: "nonexistent",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedScope).toBeUndefined();
  });

  it("handles missing city in initial data gracefully", () => {
    const initialData = makeInitialData({
      name: "Test Team",
      location: "NonExistentCity",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedCity).toBeUndefined();
  });

  it("handles empty initial data object", () => {
    const initialData = makeInitialData({
      name: "",
      sport: null,
      scope: null,
      location: null,
      allowedRegions: null,
      logoUrl: null,
      privacy: "PRIVATE",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.teamName).toBe("");
    expect(result.current.selectedSport).toBeUndefined();
    expect(result.current.logoUri).toBeNull();
    expect(result.current.isPublic).toBe(false);
  });

  it("updates state when initialData changes", () => {
    const { result, rerender } = renderHook(
      (props: { initialData: TeamFormInitialData }) =>
        useTeamForm({ initialData: props.initialData }),
      {
        initialProps: {
          initialData: {
            ...makeInitialData({
              name: "First Team",
              sport: "Soccer",
            }),
          },
        },
      },
    );

    expect(result.current.teamName).toBe("First Team");
    expect(result.current.selectedSport).toEqual({
      id: "soccer",
      label: "Soccer",
    });

    rerender({
      initialData: {
        ...makeInitialData({
          name: "Second Team",
          sport: "Basketball",
        }),
      },
    });

    expect(result.current.teamName).toBe("Second Team");
    expect(result.current.selectedSport).toEqual({
      id: "basketball",
      label: "Basketball",
    });
  });
});
