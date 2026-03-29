import { Alert } from "react-native";
import type { AxiosError } from "axios";
import {
  getScheduleApiErrorMessage,
  showScheduleSubmitError,
} from "@/utils/schedule-errors";

describe("schedule-errors", () => {
  describe("getScheduleApiErrorMessage", () => {
    it("returns network error when no response", () => {
      const result = getScheduleApiErrorMessage(undefined, "Forbidden!");

      expect(result).toEqual({
        status: 0,
        message: "Network error. Please retry.",
      });
    });

    it("returns forbidden message when status is 403", () => {
      const err = {
        response: { status: 403 },
      } as AxiosError<{ message?: string }>;

      const result = getScheduleApiErrorMessage(err, "Forbidden!");

      expect(result).toEqual({ status: 403, message: "Forbidden!" });
    });

    it("maps known conflict codes using provided team names", () => {
      const err = {
        response: {
          status: 409,
          data: {
            code: "TEAM_TIME_SLOT_CONFLICT",
            message: "backend message",
            conflictingTeamIds: ["team-2"],
          },
        },
      } as AxiosError<{
        message?: string;
        code?: "TEAM_TIME_SLOT_CONFLICT";
        conflictingTeamIds?: string[];
      }>;

      const result = getScheduleApiErrorMessage(err, "Forbidden!", {
        "team-2": "Barcelona",
      });

      expect(result.status).toBe(409);
      expect(result.message).toBe(
        "Barcelona already has a confirmed match that overlaps this time or falls within the required 60-minute buffer.",
      );
    });
  });

  describe("showScheduleSubmitError", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it("shows retry dialog for network errors", () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const onRetry = jest.fn();

      showScheduleSubmitError(undefined, "Unauthorized", onRetry);

      expect(alertSpy).toHaveBeenCalledWith(
        "Network error",
        "Network error. Please retry.",
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({ text: "Retry", onPress: onRetry }),
        ]),
      );
    });

    it("shows schedule failed alert for API response errors", () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const onRetry = jest.fn();
      const err = {
        response: { status: 500, data: { message: "fail" } },
      } as AxiosError<{ message?: string }>;

      showScheduleSubmitError(err, "Unauthorized", onRetry);

      expect(alertSpy).toHaveBeenCalledWith("Schedule failed", "fail");
      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});