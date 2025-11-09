import { authStyles } from "@/constants/auth-styles";
import { Pressable, Text } from "react-native";
import { DatePicker } from "@/components/date-picker";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import { DATE_UP_BIRTH_MESSAGE } from "@/components/sign-up/constants";
import { BlurView } from "expo-blur";  

export const SignUpDatePicker: React.FC<{
  setShowDob: React.Dispatch<React.SetStateAction<boolean>>;
  showDob: boolean;
}> = ({ setShowDob, showDob }) => {
  const { values, errors, touched, setFieldValue } = useFormikContext<User>();
  return (
    <BlurView
      intensity={90}
      tint="dark"
      style={[
        authStyles.inputWrap,
        {
          backgroundColor: "rgba(40, 40, 40, 0.08)",
          overflow: "hidden",
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: "rgba(255,255,255,0.25)",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        }
      ]}
    >
      <Text style={authStyles.label}>{DATE_UP_BIRTH_MESSAGE}</Text>
      <Pressable onPress={() => setShowDob(true)} style={authStyles.inputWrap}>
        <Text style={{ color: "#8e8c8cff", opacity: 0.85 }}>
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
    </BlurView>
  );
};
