import { useState, useCallback } from "react";
import { useRouter, Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { ActivityIndicator } from "react-native";
import { images } from "@/constants/images";
import { AccentColors } from "@/constants/colors";
import { ContentArea } from "@/components/ui/content-area";
import { useUser } from "@clerk/clerk-expo";
import { Form } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import { handleSaveProfile } from "@/components/user-profile/profile-utils";
import { pickImage } from "@/utils/pick-image";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

function EditProfileToolbar({
  onSave,
  isSaving,
}: Readonly<{ onSave: () => void; isSaving: boolean }>) {
  return (
    <>
      <Stack.Screen.Title>Edit Profile</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        {isSaving ? (
          <Stack.Toolbar.View>
            <ActivityIndicator color="white" size="small" />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button onPress={onSave}>Save</Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function Edit() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const api = useAxiosWithClerk();

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
  });

  const handleSave = useCallback(() => {
    saveProfileMutation.mutate();
  }, [saveProfileMutation]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <ContentArea
      background={{ preset: "blue", mode: "form" }}
      toolbar={
        <EditProfileToolbar
          isSaving={saveProfileMutation.isPending}
          onSave={handleSave}
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
