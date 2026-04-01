import React from "react";
import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

export const mockAlert = jest.fn();
const authTestQueryClients: QueryClient[] = [];

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  const Toolbar = ({
    children,
  }: {
    children?: React.ReactNode;
  }) => children ?? null;
  Toolbar.displayName = "Stack.Toolbar";

  const ToolbarButton = ({
    children,
    onPress,
    testID,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    testID?: string;
  }) => (
    <Pressable onPress={onPress} testID={testID}>
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </Pressable>
  );
  ToolbarButton.displayName = "Stack.Toolbar.Button";
  Toolbar.Button = ToolbarButton;

  const ToolbarView = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  ToolbarView.displayName = "Stack.Toolbar.View";
  Toolbar.View = ToolbarView;

  const ToolbarSpacer = () => null;
  ToolbarSpacer.displayName = "Stack.Toolbar.Spacer";
  Toolbar.Spacer = ToolbarSpacer;

  const Screen = ({ children }: { children?: React.ReactNode }) =>
    children ?? null;
  Screen.displayName = "Stack.Screen";

  const ScreenBackButton = ({ children }: { children?: React.ReactNode }) =>
    children ?? null;
  ScreenBackButton.displayName = "Stack.Screen.BackButton";
  Screen.BackButton = ScreenBackButton;

  const ScreenTitle = ({ children }: { children?: React.ReactNode }) =>
    children ?? null;
  ScreenTitle.displayName = "Stack.Screen.Title";
  Screen.Title = ScreenTitle;

  return {
    Link: ({ children }: { children?: React.ReactNode }) => children ?? null,
    router: {
      push: jest.fn(),
      replace: jest.fn(),
    },
    Stack: {
      Screen,
      Toolbar,
    },
  };
});

jest.mock("@/constants/images", () => ({
  images: { logo: 1 },
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

jest.mock("@/components/auth/password-visibility-toggle", () => ({
  PasswordVisibilityToggle: () => null,
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({
    children,
    toolbar,
  }: {
    children?: React.ReactNode;
    toolbar?: React.ReactNode;
  }) => {
    const { View } = jest.requireActual("react-native");
    return (
      <View>
        {children}
        {toolbar}
      </View>
    );
  },
}));

jest.mock("@/components/ui/background", () => ({
  Background: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

export function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

  authTestQueryClients.push(queryClient);

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

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
    delete process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL;
    delete process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;

    for (const queryClient of authTestQueryClients) {
      queryClient.clear();
    }
    authTestQueryClients.length = 0;
  });
};
