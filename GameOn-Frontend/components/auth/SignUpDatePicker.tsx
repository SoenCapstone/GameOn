import { authStyles } from "@/constants/auth-styles";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { DatePicker } from "@/components/date-picker";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import { DATE_UP_BIRTH_MESSAGE } from "@/components/sign-up/constants";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

export const SignUpDatePicker: React.FC<{
  setShowDob: React.Dispatch<React.SetStateAction<boolean>>;
  showDob: boolean;
}> = ({ setShowDob, showDob }) => {
  const { values, errors, touched, setFieldValue } = useFormikContext<User>();
  const InputField = isLiquidGlassAvailable() ? GlassView : BlurView;

  return (
    <View style={{ gap: 10 }}>
      <Text style={authStyles.label}>{DATE_UP_BIRTH_MESSAGE}</Text>
      <InputField
        intensity={90}
        tint="dark"
        style={[
          styles.InputField,
          isLiquidGlassAvailable() ? null : styles.blur,
        ]}
      >
        <Pressable
          onPress={() => setShowDob(true)}
          style={authStyles.inputWrap}
        >
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
      </InputField>
    </View>
  );
};

const styles = StyleSheet.create({
  InputField: {
    width: "100%",
    height: 48,
    borderRadius: 100,
    alignSelf: "center",
    backgroundColor: "rgba(40, 40, 40, 0.08)",
    overflow: "hidden",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  blur: {
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "rgba(191,191,191,0.2)",
    borderWidth: 1,
  },
});
