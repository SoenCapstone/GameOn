import { authStyles } from "@/constants/auth-styles";
import { View, Pressable, Text } from "react-native";
import { DatePicker } from "@/components/date-picker";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import { DATE_UP_BIRTH_MESSAGE } from "@/components/sign-up/constants";

export const SignUpDatePicker: React.FC<{
  setShowDob: React.Dispatch<React.SetStateAction<boolean>>;
  showDob: boolean;
}> = ({ setShowDob, showDob }) => {
  const { values, errors, touched, setFieldValue } = useFormikContext<User>();
  return (
    <View style={{ gap: 8 }}>
      <Text style={authStyles.label}>{DATE_UP_BIRTH_MESSAGE}</Text>
      <Pressable onPress={() => setShowDob(true)} style={authStyles.inputWrap}>
        <Text style={{ color: "#fff", opacity: 0.85 }}>
          {(() => {
            const d = new Date(values.birth);
            return Number.isNaN(d.getTime())
              ? "Select your date of birth"
              : d.toLocaleDateString();
          })()}
        </Text>
      </Pressable>
      <DatePicker
        showDob={showDob}
        setShowDob={setShowDob}
        values={values}
        setFieldValue={setFieldValue}
      />
      {touched.birth && errors.birth ? (
        <Text style={authStyles.errorText}>{errors.birth}</Text>
      ) : null}
    </View>
  );
};
