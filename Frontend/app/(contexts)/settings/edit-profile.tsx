import { useState, useLayoutEffect, useCallback } from "react";
import { useRouter, useNavigation } from "expo-router";
import { images } from "@/constants/images";
import { AccentColors } from "@/constants/colors";
import { ContentArea } from "@/components/ui/content-area";
import { useUser } from "@clerk/clerk-expo";
import { Form } from "@/components/form/form";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import {
  handleSaveProfile,
  pickImage,
} from "@/components/UserProfile/profile-utils";

function EditProfileHeader({ onSave }: { onSave: () => void }) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="Edit Profile" />}
      right={<Button type="custom" label="Save" onPress={onSave} />}
    />
  );
}

export default function EditProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState(user?.firstName!);
  const [lastName, setLastName] = useState(user?.lastName!);
  const [email] = useState<string>(user?.primaryEmailAddress?.emailAddress!);
  const [image, setImage] = useState<
    { uri: string; mimeType?: string } | number | null
  >(user?.hasImage ? { uri: user.imageUrl } : null);

  const handleSave = useCallback(async () => {
    await handleSaveProfile({
      user,
      firstName,
      lastName,
      email,
      image,
      router,
    });
  }, [user, firstName, lastName, email, image, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <EditProfileHeader onSave={handleSave} />,
    });
  }, [navigation, handleSave]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "orange", mode: "form" }}
    >
      <Form accentColor={AccentColors.orange}>
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
