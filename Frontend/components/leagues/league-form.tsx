import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import { images } from "@/constants/images";
import { PickedLogo } from "@/utils/team-league-form";
import {
  cityOptions,
  getCityByLabel,
  getLevelByLabel,
  getSportByLabel,
  levelOptions,
  Option,
  sportOptions,
} from "@/constants/form-constants";

interface LeagueFormValues {
  readonly leagueName: string;
  readonly selectedSport: Option | null;
  readonly selectedLevel: Option | null;
  readonly region: string;
  readonly location: string;
}

interface LeagueFormLogo {
  readonly pickedLogo: PickedLogo | null;
  readonly logoUri?: string;
}

interface LeagueFormOnChange {
  readonly onLeagueNameChange: (name: string) => void;
  readonly onSportChange: (sport: Option | null) => void;
  readonly onLevelChange: (level: Option | null) => void;
  readonly onLocationChange: (location: string) => void;
  readonly onPickLogo: () => void;
  readonly onRemoveLogo: () => void;
}

interface LeagueFormProps {
  readonly values: LeagueFormValues;
  readonly logo: LeagueFormLogo;
  readonly onChange: LeagueFormOnChange;
}

export function LeagueForm({
  values,
  logo,
  onChange,
}: Readonly<LeagueFormProps>) {
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
          placeholder="Enter league name"
          value={values.leagueName}
          onChangeText={onChange.onLeagueNameChange}
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
          label="Level"
          options={levelOptions}
          value={values.selectedLevel?.label ?? "Optional"}
          onValueChange={(label) => {
            if (label === "Optional") {
              onChange.onLevelChange(null);
              return;
            }

            const option = getLevelByLabel(label);
            if (option) {
              onChange.onLevelChange(option);
            }
          }}
        />
        <Form.Input
          label="Region"
          placeholder="Enter region"
          value={values.region}
          editable={false}
        />
        <Form.Menu
          label="Location"
          options={cityOptions}
          value={values.location || "City"}
          onValueChange={(label) => {
            if (label === "City") {
              onChange.onLocationChange("");
              return;
            }

            const option = getCityByLabel(label);
            if (option) {
              onChange.onLocationChange(option.label);
            }
          }}
        />
      </Form.Section>
    </>
  );
}
