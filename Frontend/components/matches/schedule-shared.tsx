import { useLayoutEffect } from "react";
import { Text, View } from "react-native";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form/form";
import { matchStyles } from "@/components/matches/match-styles";

export function getScheduleApiErrorMessage(err: any, forbiddenMessage: string) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message ?? "Could not schedule the match.";

  if (!err?.response) return { status: 0, message: "Network error. Please retry." };
  if (status === 403) return { status, message: forbiddenMessage };
  return { status, message };
}

export function useScheduleHeader(params: {
  navigation: any;
  title?: string;
  onSubmit: () => void;
  isPending: boolean;
  isValid: boolean;
}) {
  const { navigation, title = "Schedule a Match", onSubmit, isPending, isValid } = params;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title={title} />}
          right={
            <Button
              type="custom"
              label="Schedule"
              onPress={onSubmit}
              loading={isPending}
              isInteractive={!isPending && isValid}
            />
          }
        />
      ),
    });
  }, [isPending, isValid, navigation, onSubmit, title]);
}

export function MatchDetailsSection(props: {
  readonly date: Date;
  readonly startTimeValue: Date;
  readonly endTimeValue: Date;
  readonly venue: string;
  readonly errors: Record<string, string>;
  readonly onDateChange: (date: Date) => void;
  readonly onStartTimeChange: (date: Date) => void;
  readonly onEndTimeChange: (date: Date) => void;
  readonly onVenueChange: (value: string) => void;
  readonly onAddVenue: () => void;
}) {
  const {
    date,
    startTimeValue,
    endTimeValue,
    venue,
    errors,
    onDateChange,
    onStartTimeChange,
    onEndTimeChange,
    onVenueChange,
    onAddVenue,
  } = props;

  return (
    <Form.Section header="Match Details">
      <View>
        <Form.DateTime
          label="Date"
          value={date}
          mode="date"
          display="default"
          onChange={(_event, selectedDate) => {
            if (selectedDate) onDateChange(selectedDate);
          }}
        />
        {errors.date ? <Text style={matchStyles.errorInline}>{errors.date}</Text> : null}
      </View>

      <View>
        <Form.DateTime
          label="Start Time"
          value={startTimeValue}
          mode="time"
          display="default"
          onChange={(_event, selectedDate) => {
            if (selectedDate) onStartTimeChange(selectedDate);
          }}
        />
        {errors.startTime ? <Text style={matchStyles.errorInline}>{errors.startTime}</Text> : null}
      </View>

      <View>
        <Form.DateTime
          label="End Time"
          value={endTimeValue}
          mode="time"
          display="default"
          onChange={(_event, selectedDate) => {
            if (selectedDate) onEndTimeChange(selectedDate);
          }}
        />
        {errors.endTime ? <Text style={matchStyles.errorInline}>{errors.endTime}</Text> : null}
        {errors.timeRange ? <Text style={matchStyles.errorInline}>{errors.timeRange}</Text> : null}
      </View>

      <Form.Input label="Venue" placeholder="Optional" value={venue} onChangeText={onVenueChange} />
      <Form.Link label="Add Venue" onPress={onAddVenue} />
    </Form.Section>
  );
}
