import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import { images } from "@/constants/images";
import { PickedLogo } from "@/utils/team-league-form";
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
  readonly selectedSport: Option | null;
  readonly selectedScope: Option;
  readonly selectedCity: Option | null;
}

interface TeamFormLogo {
  readonly pickedLogo: PickedLogo | null;
  readonly logoUri?: string | null;
}

interface TeamFormOnChange {
  readonly onTeamNameChange: (name: string) => void;
  readonly onSportChange: (sport: Option | null) => void;
  readonly onScopeChange: (scope: Option) => void;
  readonly onCityChange: (city: Option | null) => void;
  readonly onPickLogo: () => void;
  readonly onRemoveLogo: () => void;
}

interface TeamFormProps {
  readonly values: TeamFormValues;
  readonly logo: TeamFormLogo;
  readonly onChange: TeamFormOnChange;
}

export function TeamForm({ values, logo, onChange }: Readonly<TeamFormProps>) {
  return (
    <>
      <Form.Section>
        <Form.Image
          logo
          image={
            logo.pickedLogo
              ? { uri: logo.pickedLogo.uri }
              : logo.logoUri
                ? { uri: logo.logoUri }
                : images.defaultLogo
          }
          onPress={onChange.onPickLogo}
        />
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
          options={sportOptions}
          value={values.selectedSport?.label ?? "None"}
          onValueChange={(label) => {
            if (label === "None") {
              onChange.onSportChange(null);
              return;
            }

            const option = getSportByLabel(label);
            if (option) {
              onChange.onSportChange(option);
            }
          }}
        />
        <Form.Menu
          label="Scope"
          options={scopeOptions}
          value={values.selectedScope.label}
          onValueChange={(label) => {
            const option = getScopeByLabel(label);
            if (option) {
              onChange.onScopeChange(option);
            }
          }}
        />
        <Form.Menu
          label="Location"
          options={cityOptions}
          value={values.selectedCity?.label ?? "City"}
          onValueChange={(label) => {
            if (label === "Select location") {
              onChange.onCityChange(null);
              return;
            }

            const option = getCityByLabel(label);
            if (option) {
              onChange.onCityChange(option);
            }
          }}
        />
      </Form.Section>
    </>
  );
}
