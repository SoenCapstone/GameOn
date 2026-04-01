import {
  StyleSheet,
  View,
  Text,
  PressableProps,
  Pressable,
} from "react-native";
import { Image, ImageSource } from "expo-image";
import { BlurView } from "expo-blur";
import { MenuPicker } from "@/components/ui/menu-picker";
import { SFSymbols7_0 } from "sf-symbols-typescript";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface MenuCardPickerProps {
  readonly placeholder?: string;
  readonly options: readonly string[];
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly menuTitle?: string;
  readonly disabled?: boolean;
}

interface MenuCardButtonProps extends PressableProps {
  readonly label?: string;
  readonly icon?: SFSymbols7_0;
  readonly color?: string;
  readonly size?: number;
}

interface MenuCardItemProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly image: ImageSource;
  readonly square?: boolean;
  readonly menu?: Readonly<MenuCardPickerProps>;
  readonly button?: Readonly<MenuCardButtonProps>;
}

export function MenuCardItem({
  title,
  subtitle,
  image,
  square = false,
  menu,
  button,
}: Readonly<MenuCardItemProps>) {
  const buttonColor = button?.color ?? "#929298";
  return (
    <BlurView
      tint={"systemUltraThinMaterialDark"}
      style={[styles.item, square && styles.squareItem]}
    >
      <View style={[styles.container, square && styles.squareContainer]}>
        <Image
          source={image}
          style={[
            styles.image,
            square && styles.squareImage,
            square ? styles.square : styles.circle,
          ]}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      {menu ? (
        <MenuPicker
          title={menu.menuTitle}
          placeholder={menu.placeholder}
          options={menu.options}
          value={menu.value}
          onValueChange={menu.onValueChange}
          disabled={menu.disabled ?? false}
        />
      ) : button ? (
        <Pressable {...button} style={styles.pressable}>
          {({ pressed }) => (
            <>
              {button.icon ? (
                <IconSymbol
                  style={[styles.icon, pressed && styles.pressed]}
                  name={button.icon}
                  color={buttonColor}
                  size={button.size ?? 24}
                />
              ) : (
                <Text
                  style={[
                    { color: buttonColor },
                    styles.label,
                    pressed && styles.pressed,
                  ]}
                >
                  {button.label}
                </Text>
              )}
            </>
          )}
        </Pressable>
      ) : null}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 80,
    borderRadius: 33,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  squareItem: {
    paddingLeft: 24,
  },
  container: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  squareContainer: {
    gap: 16,
  },
  info: {
    gap: 2,
    maxWidth: 200,
  },
  name: {
    fontSize: 16,
    fontWeight: 600,
    color: "white",
  },
  email: {
    fontSize: 14,
    color: "rgba(235,235,245,0.6)",
  },
  image: {
    height: 50,
    width: 50,
  },
  squareImage: {
    height: 44,
    width: 44,
  },
  square: {
    borderRadius: 0,
  },
  circle: {
    borderRadius: "100%",
  },
  icon: {
    alignSelf: "flex-end",
  },
  label: {
    textAlign: "right",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 500,
  },
  pressable: {
    flex: 1,
    paddingRight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
