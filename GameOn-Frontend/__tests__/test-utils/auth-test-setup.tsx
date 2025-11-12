import { Alert } from "react-native";

export const mockAlert = jest.fn();

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children ?? null,
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("@/constants/images", () => ({
  images: { logo: 1 },
}));

jest.mock("@/constants/auth-styles", () => ({
  authStyles: {
    safe: { flex: 1 },
    topGradient: {},
    hero: {},
    container: {},
    label: {},
    inputWrap: {},
    input: {},
    rightIcon: {},
    errorText: {},
  },
}));

jest.mock("@/constants/auth-layout", () => ({
  getAuthHeroLayout: () => ({
    FORM_PADDING_TOP: 0,
    TOP_GRADIENT_H: 0,
    RENDER_W: 0,
    RENDER_H: 0,
  }),
}));

jest.mock("@/components/auth/input-label", () => {
  const React = require("react");
  const { Text, TextInput, View } = require("react-native");
  return {
    LabeledInput: ({
      label,
      placeholder,
      value,
      onChangeText,
      onBlur,
      secureTextEntry,
      keyboardType,
      autoCapitalize,
      error,
      testID,
    }: any) => (
      <View>
        <Text>{label}</Text>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          testID={testID || `input-${placeholder}`}
        />
        {error ? <Text testID={`error-${label}`}>{error}</Text> : null}
      </View>
    ),
  };
});

jest.mock("@/components/auth/submit-auth-button", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  const { useFormikContext } = require("formik");

  return {
    SubmitAuthButton: ({ actionMessage }: any) => {
      const { handleSubmit } = useFormikContext();
      return (
        <TouchableOpacity onPress={handleSubmit} testID="submit-button">
          <Text>{actionMessage}</Text>
        </TouchableOpacity>
      );
    },
  };
});

jest.mock("@/components/auth/password-visibility-toggle", () => ({
  PasswordVisbilityToggle: () => null,
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: any) => children ?? null,
}));

jest.mock("@/components/ui/background", () => ({
  Background: ({ children }: any) => children ?? null,
}));

export const setupAuthTestHooks = () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(Alert, "alert").mockImplementation(mockAlert);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
};
