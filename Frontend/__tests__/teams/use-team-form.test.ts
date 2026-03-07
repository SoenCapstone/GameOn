import { renderHook, act } from "@testing-library/react-native";
import { useTeamForm } from "@/hooks/use-team-form";
import type { TeamDetailResponse } from "@/hooks/use-team-detail";

function makeTeamData(
  partial: Partial<TeamDetailResponse>,
): TeamDetailResponse {
  return {
    id: null,
    ownerUserId: null,
    name: null,
    sport: null,
    location: null,
    allowedRegions: null,
    logoUrl: null,
    scope: null,
    privacy: "PUBLIC",
    ...partial,
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
    const initialData = makeTeamData({
      name: "Test Team",
      sport: "Soccer",
      scope: "managed",
      location: "Montreal",
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
    const initialData = makeTeamData({
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
    const initialData = makeTeamData({
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
    const initialData = makeTeamData({
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
    const initialData = makeTeamData({
      name: "Test Team",
      location: "VANCOUVER",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedCity).toEqual({
      id: "van",
      label: "Vancouver",
    });
  });

  it("leaves selectedSport undefined when sport does not match any option", () => {
    const initialData = makeTeamData({
      name: "Test Team",
      sport: "NonExistentSport",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedSport).toBeUndefined();
  });

  it("leaves selectedScope undefined when scope does not match any option", () => {
    const initialData = makeTeamData({
      name: "Test Team",
      scope: "nonexistent",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedScope).toBeUndefined();
  });

  it("leaves selectedCity undefined when location does not match any option", () => {
    const initialData = makeTeamData({
      name: "Test Team",
      location: "NonExistentCity",
    });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.selectedCity).toBeUndefined();
  });

  it("handles initial data with no sport, scope, or location", () => {
    const initialData = makeTeamData({ name: "", privacy: "PRIVATE" });

    const { result } = renderHook(() => useTeamForm({ initialData }));

    expect(result.current.teamName).toBe("");
    expect(result.current.selectedSport).toBeUndefined();
    expect(result.current.logoUri).toBeNull();
    expect(result.current.isPublic).toBe(false);
  });

  it("updates state when initialData changes", () => {
    const { result, rerender } = renderHook(
      (props: { initialData: TeamDetailResponse }) =>
        useTeamForm({ initialData: props.initialData }),
      {
        initialProps: {
          initialData: makeTeamData({ name: "First Team", sport: "Soccer" }),
        },
      },
    );

    expect(result.current.teamName).toBe("First Team");
    expect(result.current.selectedSport).toEqual({
      id: "soccer",
      label: "Soccer",
    });

    rerender({
      initialData: makeTeamData({ name: "Second Team", sport: "Basketball" }),
    });

    expect(result.current.teamName).toBe("Second Team");
    expect(result.current.selectedSport).toEqual({
      id: "basketball",
      label: "Basketball",
    });
  });
});
