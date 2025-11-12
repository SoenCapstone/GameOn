import { authStyles } from "@/constants/auth-styles";
import { Text, View } from "react-native";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AccentColors } from "@/constants/colors";
import { LabeledInput } from "@/components/auth/input-label";
import { useState } from "react";
import {
  formatDate,
  parseDate,
  autoFormatDateInput,
} from "@/components/sign-up/utils";

export const SignUpDatePicker: React.FC = () => {
  const { errors, touched, setFieldValue } = useFormikContext<User>();

  const [textValue, setTextValue] = useState("");
  const [pickerDate, setPickerDate] = useState(new Date());

  const handlePickerChange = (_: any, date?: Date) => {
    if (date) {
      setPickerDate(date);
      setTextValue(formatDate(date));
      setFieldValue("birth", date.toISOString());
    }
  };

  const handleTextChange = (text: string) => {
    const formattedText = autoFormatDateInput(text);
    setTextValue(formattedText);

    const parsedDate = parseDate(formattedText);
    if (parsedDate && parsedDate <= new Date()) {
      setPickerDate(parsedDate);
      setFieldValue("birth", parsedDate.toISOString());
    }
  };

  return (
    <View>
      <LabeledInput
        style={{ paddingRight: 6 }}
        label="Date of Birth"
        placeholder="DD/MM/YYYY"
        value={textValue}
        onChangeText={handleTextChange}
        onBlur={() => {}}
        keyboardType="numeric"
        rightIcon={
          <DateTimePicker
            accentColor={AccentColors.red}
            mode="date"
            display="compact"
            value={pickerDate}
            maximumDate={new Date()}
            onChange={handlePickerChange}
          />
        }
      />
      {touched.birth && errors.birth ? (
        <Text style={authStyles.errorText}>{errors.birth}</Text>
      ) : null}
    </View>
  );
};
