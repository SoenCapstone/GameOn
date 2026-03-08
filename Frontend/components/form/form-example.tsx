import React, { useState } from "react";
import { Form } from "@/components/form/form";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { AccentColors } from "@/constants/colors";

const visibilityOptions = ["Public", "Private", "Friends Only"] as const;
const themeOptions = ["System", "Light", "Dark"] as const;
const languageOptions = ["English", "French", "Spanish", "Arabic"] as const;
const roleOptions = ["Captain", "Player", "Substitute", "Coach"] as const;

export function FormExample() {
  const [birthDate, setBirthDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [accentColor, setAccentColor] = useState<string>(AccentColors.blue);
  const [visibility, setVisibility] = useState<string>("Public");
  const [theme, setTheme] = useState<string>("System");
  const [language, setLanguage] = useState<string>("English");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);
  const [teamRole, setTeamRole] = useState<string>("Player");
  const [teamRole2, setTeamRole2] = useState<string>("Captain");
  const [teamRole3, setTeamRole3] = useState<string>("Coach");

  return (
    <Form accentColor={AccentColors.orange}>
      {/* Profile Section */}
      <Form.Section header="Profile">
        <Form.Profile
          title="Alex Johnson"
          subtitle="alex.johnson@gameon.com"
          image={{
            uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
          }}
        />
      </Form.Section>

      {/* Account Details */}
      <Form.Section
        header="Account Details"
        footer="Your personal information is encrypted and secure."
      >
        <Form.Input label="Full Name" placeholder="Enter your name" />
        <Form.Input label="Email" placeholder="name@example.com" />
        <Form.Input label="Username" placeholder="@username" />
        <Form.DateTime
          label="Date of Birth"
          mode="date"
          value={birthDate}
          onChange={(_event, selectedDate) =>
            selectedDate && setBirthDate(selectedDate)
          }
        />
      </Form.Section>

      {/* Bio Section */}
      <Form.Section header="About You">
        <Form.TextArea placeholder="Write something about yourself..." />
      </Form.Section>

      {/* Preferences */}
      <Form.Section header="Preferences">
        <Form.Menu
          label="Visibility"
          options={visibilityOptions}
          value={visibility}
          onValueChange={setVisibility}
        />
        <Form.Menu
          label="Theme"
          options={themeOptions}
          value={theme}
          onValueChange={setTheme}
        />
        <Form.Menu
          label="Language"
          options={languageOptions}
          value={language}
          onValueChange={setLanguage}
        />
        <Form.Color
          label="Accent Color"
          selection={accentColor}
          onValueChanged={setAccentColor}
          onChangeText={setAccentColor}
        />
      </Form.Section>

      {/* MenuCardItem examples */}
      <Form.Section
        header="Team Squad"
        footer="Assign roles to each team member."
      >
        <MenuCardItem
          title="Alex Johnson"
          subtitle="alex.johnson@gameon.com"
          image={{
            uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
          }}
          options={[...roleOptions]}
          value={teamRole}
          onValueChange={setTeamRole}
        />
        <MenuCardItem
          title="Sam Rivera"
          subtitle="sam.rivera@gameon.com"
          image={{
            uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
          }}
          options={[...roleOptions]}
          value={teamRole2}
          onValueChange={setTeamRole2}
        />
        <MenuCardItem
          title="Jordan Lee"
          subtitle="jordan.lee@gameon.com"
          image={{
            uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
          }}
          options={[...roleOptions]}
          value={teamRole3}
          onValueChange={setTeamRole3}
        />
      </Form.Section>

      {/* Toggles */}
      <Form.Section
        header="Settings"
        footer="Manage your notification and privacy settings."
      >
        <Form.Switch
          label="Push Notifications"
          value={notifications}
          onValueChange={setNotifications}
        />
        <Form.Switch
          label="Dark Mode"
          value={darkMode}
          onValueChange={setDarkMode}
        />
        <Form.Switch
          label="Share Location"
          value={locationSharing}
          onValueChange={setLocationSharing}
        />
      </Form.Section>

      {/* Schedule */}
      <Form.Section header="Schedule Event">
        <Form.Input label="Event Name" placeholder="Team Practice" />
        <Form.DateTime
          label="Event Time"
          mode="time"
          value={eventTime}
          onChange={(_event, selectedDate) =>
            selectedDate && setEventTime(selectedDate)
          }
        />
      </Form.Section>

      {/* App Icon */}
      <Form.Section header="App Icon">
        <Form.Icon />
      </Form.Section>

      {/* Links & Actions */}
      <Form.Section>
        <Form.Link label="Privacy Policy" onPress={() => {}} />
        <Form.Link label="Terms of Service" onPress={() => {}} />
        <Form.Link label="Help & Support" onPress={() => {}} />
      </Form.Section>

      {/* Action Buttons */}
      <Form.Section>
        <Form.Button button="Sign Out" color={AccentColors.red} />
      </Form.Section>
    </Form>
  );
}
