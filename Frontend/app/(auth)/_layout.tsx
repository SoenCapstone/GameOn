import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
