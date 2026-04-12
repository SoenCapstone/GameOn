import type { ReactNode } from "react";
import { ActivityIndicator, ImageSourcePropType } from "react-native";
import { Stack } from "expo-router";
import { SFSymbols7_0 } from "sf-symbols-typescript";

type FormToolbarProps = {
  readonly title: string;
  readonly onSubmit: () => void;
  readonly loading: boolean;
  readonly icon?: SFSymbols7_0 | ImageSourcePropType;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly menu?: ReactNode;
};

export function FormToolbar({
  title,
  onSubmit,
  loading,
  icon,
  label = "Save",
  disabled = false,
  menu,
}: Readonly<FormToolbarProps>) {
  return (
    <>
      <Stack.Screen.Title>{title}</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        {menu}
        {loading ? (
          <Stack.Toolbar.View>
            <ActivityIndicator color="white" size="small" />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button
            icon={icon}
            disabled={disabled}
            onPress={onSubmit}
          >
            {label}
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    </>
  );
}
