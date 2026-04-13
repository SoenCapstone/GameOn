import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { images } from "@/constants/images";
import { AccentColors } from "@/constants/colors";
import { ContentArea } from "@/components/ui/content-area";
import { useUser } from "@clerk/clerk-expo";
import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import { handleSaveProfile } from "@/components/user-profile/profile-utils";
import { pickImage } from "@/utils/pick-image";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { FormToolbar } from "@/components/form/form-toolbar";
import { usePostHog } from "posthog-react-native";

export default function Edit() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const posthog = usePostHog();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email] = useState<string>(
    user?.primaryEmailAddress?.emailAddress ?? "",
  );
  const [image, setImage] = useState<
    { uri: string; mimeType?: string } | number | null
  >(user?.hasImage ? { uri: user.imageUrl } : null);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      await handleSaveProfile({
        api,
        user: user ?? null,
        firstName,
        lastName,
        email,
        image,
        router,
      });
    },
    onSuccess: () => {
      posthog.capture("profile_updated", {
        has_image: image !== null,
      });
    },
  });

  const handleSave = useCallback(() => {
    saveProfileMutation.mutate();
  }, [saveProfileMutation]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <ContentArea
      background={{ preset: "blue", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Edit Profile"
          loading={saveProfileMutation.isPending}
          onSubmit={handleSave}
        />
      }
    >
      <Form accentColor={AccentColors.blue}>
        <Form.Section>
          <Form.Image
            image={image ?? images.defaultProfile}
            onPress={() => pickImage(setImage)}
          />
          <Button
            type="custom"
            label="Delete Image"
            onPress={() => setImage(null)}
          />
        </Form.Section>
        <Form.Section>
          <Form.Input
            label="First Name"
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Form.Input
            label="Last Name"
            placeholder="Enter last name"
            value={lastName}
            onChangeText={setLastName}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
