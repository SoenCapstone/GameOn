import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import { images } from "@/constants/images";
import { PickedLogo } from "@/utils/team-league-form";
import { StyleSheet, Text } from "react-native";
import {
  cityOptions,
  getCityByLabel,
  getScopeByLabel,
  getSportByLabel,
  Option,
  scopeOptions,
  sportOptions,
} from "@/constants/form-constants";

interface TeamFormValues {
  readonly teamName: string;
  readonly selectedSport: Option | undefined;
  readonly selectedScope: Option | undefined;
  readonly selectedCity: Option | undefined;
  readonly selectedAllowedRegions: string[];
}

interface TeamFormLogo {
  readonly pickedLogo: PickedLogo | null;
  readonly logoUri?: string | null;
}

interface TeamFormOnChange {
  readonly onTeamNameChange: (name: string) => void;
  readonly onSportChange: (sport: Option | undefined) => void;
  readonly onScopeChange: (scope: Option) => void;
  readonly onCityChange: (city: Option | undefined) => void;
  readonly onAllowedRegionsChange: (regions: string[]) => void;
  readonly onPickLogo: () => void;
  readonly onRemoveLogo: () => void;
}

interface TeamFormProps {
  readonly values: TeamFormValues;
  readonly logo: TeamFormLogo;
  readonly onChange: TeamFormOnChange;
  readonly allowedRegionsError?: string;
}

export function TeamForm({
  values,
  logo,
  onChange,
  allowedRegionsError,
}: Readonly<TeamFormProps>) {
  const pickedLogoImage = logo.pickedLogo
    ? { uri: logo.pickedLogo.uri }
    : undefined;
  const uploadedLogoImage = logo.logoUri ? { uri: logo.logoUri } : undefined;
  const logoImage = pickedLogoImage ?? uploadedLogoImage ?? images.defaultLogo;

  return (
    <>
      <Form.Section>
        <Form.Image logo image={logoImage} onPress={onChange.onPickLogo} />
        <Button
          type="custom"
          label="Remove logo"
          onPress={onChange.onRemoveLogo}
        />
      </Form.Section>

      <Form.Section footer="Only images with transparent background are supported.">
        <Form.Input
          label="Name"
          placeholder="Enter team name"
          value={values.teamName}
          onChangeText={onChange.onTeamNameChange}
        />
        <Form.Menu
          label="Sport"
          placeholder="Select sport"
          options={sportOptions}
          value={values.selectedSport?.label}
          onValueChange={(label) => {
            const option = getSportByLabel(label);
            if (option) {
              onChange.onSportChange(option);
            }
          }}
        />
        <Form.Menu
          label="Scope"
          placeholder="Select scope"
          options={scopeOptions}
          value={values.selectedScope?.label}
          onValueChange={(label) => {
            const option = getScopeByLabel(label);
            if (option) {
              onChange.onScopeChange(option);
            }
          }}
        />
        <Form.Menu
          label="Location"
          placeholder="Select city"
          options={cityOptions}
          value={values.selectedCity?.label}
          onValueChange={(label) => {
            const option = getCityByLabel(label);
            if (option) {
              onChange.onCityChange(option);
            }
          }}
        />
      </Form.Section>

      <Form.Section
        header="Allowed Regions"
        footer="Select the cities/regions where your team can play. This is required to schedule team matches."
      >
        <Form.Multiselect
          options={cityOptions}
          selected={values.selectedAllowedRegions}
          onSelected={onChange.onAllowedRegionsChange}
        />
        {allowedRegionsError ? (
          <Text style={styles.errorText}>{allowedRegionsError}</Text>
        ) : null}
      </Form.Section>
    </>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginHorizontal: 16,
    color: "#ffb5b5",
    fontSize: 13,
    lineHeight: 18,
  },
});
