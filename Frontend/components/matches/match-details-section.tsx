import { Form } from "@/components/form/form";
import { isToday } from "@/utils/date";

export function MatchDetailsSection(props: {
  readonly date: Date;
  readonly startTimeValue: Date;
  readonly venue: string;
  readonly venueOptions?: string[];
  readonly onDateChange: (date: Date) => void;
  readonly onStartTimeChange: (date: Date) => void;
  readonly onVenueChange: (value: string) => void;
  readonly onAddVenue: () => void;
}) {
  const {
    date,
    startTimeValue,
    venue,
    venueOptions = [],
    onDateChange,
    onStartTimeChange,
    onVenueChange,
    onAddVenue,
  } = props;
  const uniqueVenueOptions = Array.from(
    new Set(venue ? [...venueOptions, venue] : venueOptions),
  );

  const now = new Date();

  return (
    <Form.Section header="Match Details">
      <Form.DateTime
        label="Date"
        value={date}
        mode="date"
        display="default"
        minimumDate={now}
        onChange={(_event, selectedDate) => {
          if (selectedDate) onDateChange(selectedDate);
        }}
      />

      <Form.DateTime
        label="Start Time"
        value={startTimeValue}
        mode="time"
        display="default"
        minimumDate={isToday(date) ? now : undefined}
        onChange={(_event, selectedDate) => {
          if (selectedDate) onStartTimeChange(selectedDate);
        }}
      />

      <Form.Menu
        label="Venue"
        options={uniqueVenueOptions}
        value={venue}
        placeholder={
          venueOptions.length === 0 ? "No venues available" : "Select venue"
        }
        onValueChange={onVenueChange}
        disabled={uniqueVenueOptions.length === 0 && !venue}
      />
      <Form.Button button="Add Venue" onPress={onAddVenue} />
    </Form.Section>
  );
}
