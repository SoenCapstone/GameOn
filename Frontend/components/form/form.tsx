import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AccentColorProvider } from "@/contexts/accent-color-context";
import { FormSection } from "@/components/form/form-section";
import { InputItem } from "@/components/form/input-item";
import { SwitchItem } from "@/components/form/switch-item";
import { LinkItem } from "@/components/form/link-item";
import { DateTimeItem } from "@/components/form/date-time-item";
import { ButtonItem } from "@/components/form/button-item";
import { MenuItem } from "@/components/form/menu-item";
import { ColorItem } from "@/components/form/color-item";
import { TextAreaItem } from "@/components/form/text-area-item";
import { ProfileItem } from "@/components/form/profile-item";
import { IconItem } from "@/components/form/icon-item";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { ImageItem } from "@/components/form/image-item";

interface FormProps {
  readonly children: ReactNode;
  readonly accentColor: string;
}

export function Form({ children, accentColor }: Readonly<FormProps>) {
  return (
    <AccentColorProvider color={accentColor}>
      <View style={styles.form}>{children}</View>
    </AccentColorProvider>
  );
}

Form.Section = FormSection;
Form.Input = InputItem;
Form.Switch = SwitchItem;
Form.Link = LinkItem;
Form.DateTime = DateTimeItem;
Form.Button = ButtonItem;
Form.Menu = MenuItem;
Form.Color = ColorItem;
Form.TextArea = TextAreaItem;
Form.Profile = ProfileItem;
Form.Icon = IconItem;
Form.MenuCard = MenuCardItem;
Form.Image = ImageItem;

const styles = StyleSheet.create({
  form: { gap: 22 },
});
