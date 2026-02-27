import { Alert } from "react-native";

export const mockAlert = jest.fn();

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children?: React.ReactNode }) => children ?? null,
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

jest.mock("@/components/auth/labeled-input", () => {
  const { View, Text, TextInput } = jest.requireActual("react-native");
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
    }: {
      label?: string;
      placeholder?: string;
      value?: string;
      onChangeText?: (text: string) => void;
      onBlur?: () => void;
      secureTextEntry?: boolean;
      keyboardType?: import("react-native").KeyboardTypeOptions;
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      error?: string;
      testID?: string;
    }) => (
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
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  const { useFormikContext } = jest.requireActual("formik");
  return {
    SubmitAuthButton: ({ actionMessage }: { actionMessage?: string }) => {
      const { handleSubmit } = useFormikContext();
      return (
        <TouchableOpacity onPress={() => handleSubmit()} testID="submit-button">
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
  ContentArea: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

jest.mock("@/components/ui/background", () => ({
  Background: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
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
