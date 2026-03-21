import React from "react";
import { render } from "@testing-library/react-native";
import { getScheduleApiErrorMessage } from "@/utils/schedule-errors";
import {
  getScheduleConflictMessage,
  LEAGUE_SAME_DAY_CONFLICT_MESSAGE,
} from "@/features/matches/schedule-shared";
import { MatchDetailsSection } from "@/components/matches/match-details-section";
import { AxiosError } from "axios";
jest.mock("expo-router", () => ({}));
jest.mock("@react-navigation/native", () => ({}));
jest.mock("react-native-svg", () => ({}));
jest.mock("expo-blur", () => ({}));

// Mock Form.DateTime, Form.Section, Form.Input, Form.Link to avoid undefined errors
jest.mock("@/components/form/form", () => {
  const { View } = jest.requireActual("react-native");
  return {
    Form: {
      DateTime: (props: React.JSX.IntrinsicAttributes) => (
        <View testID="date-time-picker" {...props} />
      ),
      Section: ({ children }: { children?: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Input: (
        props: React.JSX.IntrinsicAttributes &
          React.ClassAttributes<HTMLInputElement> &
          React.InputHTMLAttributes<HTMLInputElement>,
      ) => <input data-testid="venue-input" {...props} />,
      Link: (
        props: React.JSX.IntrinsicAttributes &
          React.ClassAttributes<HTMLButtonElement> &
          React.ButtonHTMLAttributes<HTMLButtonElement>,
      ) => <button data-testid="add-venue-link" {...props} />,
      Menu: (
        props: React.JSX.IntrinsicAttributes & {
          label?: string;
          value?: string;
          options?: string[];
        },
      ) => (
        <select data-testid="form-menu" {...props}>
          {(props.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ),
      Button: (
        props: React.JSX.IntrinsicAttributes &
          React.ClassAttributes<HTMLButtonElement> &
          React.ButtonHTMLAttributes<HTMLButtonElement>,
      ) => <button data-testid="form-button" {...props} />,
      Switch: (
        props: React.JSX.IntrinsicAttributes & {
          label?: string;
          value?: boolean;
        },
      ) => {
        const { value, ...rest } = props;
        return (
          <input
            data-testid="form-switch"
            type="checkbox"
            checked={value}
            {...rest}
          />
        );
      },
    },
  };
});

describe("getScheduleApiErrorMessage", () => {
  it("returns network error when no response", () => {
    const fakeError = {
      isAxiosError: true,
      toJSON: () => ({}),
      name: "AxiosError",
      message: "",
    };
    const result = getScheduleApiErrorMessage(
      fakeError as AxiosError<{ message?: string }> | undefined,
      "Forbidden!",
    );
    expect(result).toEqual({
      status: 0,
      message: "Network error. Please retry.",
    });
  });
  it("returns forbidden message when status is 403", () => {
    const err = {
      isAxiosError: true,
      toJSON: () => ({}),
      name: "AxiosError",
      message: "",
      response: { status: 403 },
    };
    const result = getScheduleApiErrorMessage(
      err as AxiosError<{ message?: string }> | undefined,
      "Forbidden!",
    );
    expect(result.status).toBe(403);
    expect(result.message).toBe("Forbidden!");
  });
  it("returns default message otherwise", () => {
    const err = {
      isAxiosError: true,
      toJSON: () => ({}),
      name: "AxiosError",
      message: "",
      response: { status: 500, data: { message: "fail" } },
    };
    const result = getScheduleApiErrorMessage(
      err as AxiosError<{ message?: string }> | undefined,
      "Forbidden!",
    );
    expect(result.status).toBe(500);
    expect(result.message).toBe("fail");
  });

  it("maps structured conflict codes to frontend copy", () => {
    const err = {
      isAxiosError: true,
      toJSON: () => ({}),
      name: "AxiosError",
      message: "",
      response: {
        status: 409,
        data: {
          code: "TEAM_TIME_SLOT_CONFLICT",
          message: "backend message",
          conflictingTeamIds: ["team-2"],
        },
      },
    };
    const result = getScheduleApiErrorMessage(
      err as AxiosError<{
        message?: string;
        code?: "TEAM_TIME_SLOT_CONFLICT";
        conflictingTeamIds?: string[];
      }>,
      "Forbidden!",
      { "team-2": "Barcelona" },
    );
    expect(result.status).toBe(409);
    expect(result.message).toBe(
      "Barcelona already has a confirmed match that overlaps this time or falls within the required 60-minute buffer.",
    );
  });
});

describe("getScheduleConflictMessage", () => {
  it("returns the mapped copy for a known conflict code", () => {
    expect(
      getScheduleConflictMessage("LEAGUE_TEAM_SAME_DAY_CONFLICT", "fallback"),
    ).toBe(LEAGUE_SAME_DAY_CONFLICT_MESSAGE);
  });

  it("uses team names when conflicting ids are provided", () => {
    expect(
      getScheduleConflictMessage(
        "TEAM_DAILY_LIMIT_EXCEEDED",
        "fallback",
        ["home-id", "away-id"],
        { "home-id": "Real Madrid", "away-id": "Barcelona" },
      ),
    ).toBe("Real Madrid and Barcelona already have 3 confirmed matches on this day.");
  });

  it("falls back to the provided backend message when code is missing", () => {
    expect(getScheduleConflictMessage(undefined, "fallback")).toBe("fallback");
  });
});

describe("MatchDetailsSection", () => {
  it("calls onDateChange, onStartTimeChange, onEndTimeChange when date/time is selected", () => {
    const onDateChange = jest.fn();
    const onStartTimeChange = jest.fn();
    const onEndTimeChange = jest.fn();
    const onVenueChange = jest.fn();
    const onAddVenue = jest.fn();
    const date = new Date("2023-01-01");
    const startTimeValue = new Date("2023-01-01T10:00:00");
    const endTimeValue = new Date("2023-01-01T11:00:00");
    const venue = "Test Venue";

    const { getAllByTestId } = render(
      <MatchDetailsSection
        date={date}
        startTimeValue={startTimeValue}
        endTimeValue={endTimeValue}
        venue={venue}
        onDateChange={onDateChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onVenueChange={onVenueChange}
        onAddVenue={onAddVenue}
      />,
    );

    const pickers = getAllByTestId("date-time-picker");
    pickers[0].props.onChange(null, date);
    expect(onDateChange).toHaveBeenCalledWith(date);
    pickers[1].props.onChange(null, startTimeValue);
    expect(onStartTimeChange).toHaveBeenCalledWith(startTimeValue);
    pickers[2].props.onChange(null, endTimeValue);
    expect(onEndTimeChange).toHaveBeenCalledWith(endTimeValue);
  });

  it("does not call handlers when selectedDate is null", () => {
    const onDateChange = jest.fn();
    const onStartTimeChange = jest.fn();
    const onEndTimeChange = jest.fn();
    const onVenueChange = jest.fn();
    const onAddVenue = jest.fn();
    const date = new Date("2023-01-01");
    const startTimeValue = new Date("2023-01-01T10:00:00");
    const endTimeValue = new Date("2023-01-01T11:00:00");
    const venue = "Test Venue";

    const { getAllByTestId } = render(
      <MatchDetailsSection
        date={date}
        startTimeValue={startTimeValue}
        endTimeValue={endTimeValue}
        venue={venue}
        onDateChange={onDateChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onVenueChange={onVenueChange}
        onAddVenue={onAddVenue}
      />,
    );

    const pickers = getAllByTestId("date-time-picker");
    pickers[0].props.onChange(null, null);
    expect(onDateChange).not.toHaveBeenCalled();
    pickers[1].props.onChange(null, null);
    expect(onStartTimeChange).not.toHaveBeenCalled();
    pickers[2].props.onChange(null, null);
    expect(onEndTimeChange).not.toHaveBeenCalled();
  });
});
