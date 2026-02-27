import React from "react";
import { render } from "@testing-library/react-native";
import {
  getScheduleApiErrorMessage,
  MatchDetailsSection,
} from "@/components/matches/schedule-shared";
import { AxiosError } from "axios";
jest.mock("expo-router", () => ({}));
jest.mock("@react-navigation/native", () => ({}));
jest.mock("react-native-svg", () => ({}));
jest.mock("expo-blur", () => ({}));

// Mock Form.DateTime, Form.Section, Form.Input, Form.Link to avoid undefined errors
jest.mock("@/components/form/form", () => {
  const React = jest.requireActual("react");
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
