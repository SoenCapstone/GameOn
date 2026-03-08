import { AxiosInstance } from "axios";
import { Alert } from "react-native";
import {
  getLogoFileExtension,
  isAllowedLogoMimeType,
} from "@/utils/logo-upload";
import { pickImage } from "@/utils/pick-image";

export type PickedLogo = {
  uri: string;
  mimeType: string;
};

const UNSUPPORTED_FORMAT_TITLE = "Unsupported format";
const UNSUPPORTED_FORMAT_MESSAGE =
  "Only images with transparent background are supported for logos.";
const DEFAULT_LOGO_MIME_TYPE = "image/png";

const normalizeMimeType = (mimeType: string | null | undefined): string =>
  (mimeType ?? DEFAULT_LOGO_MIME_TYPE).toLowerCase().trim();

const buildLogoFormData = (pickedLogo: PickedLogo): FormData => {
  const formData = new FormData();
  formData.append("file", {
    uri: pickedLogo.uri,
    type: pickedLogo.mimeType,
    name: `logo.${getLogoFileExtension(pickedLogo.mimeType)}`,
  } as unknown as Blob);
  return formData;
};

export const pickLogo = async (
  setPickedLogo: (pickedLogo: PickedLogo) => void,
): Promise<void> => {
  await pickImage((img) => {
    if (!isAllowedLogoMimeType(img.mimeType)) {
      Alert.alert(UNSUPPORTED_FORMAT_TITLE, UNSUPPORTED_FORMAT_MESSAGE);
      return;
    }

    setPickedLogo({
      uri: img.uri,
      mimeType: normalizeMimeType(img.mimeType),
    });
  });
};

export const uploadLogo = async (
  api: AxiosInstance,
  uploadRoute: string,
  pickedLogo: PickedLogo,
): Promise<string> => {
  const response = await api.post(uploadRoute, buildLogoFormData(pickedLogo));
  return (response.data as { publicUrl?: string })?.publicUrl ?? "";
};

export const clearLogoSelection = (
  setPickedLogo: (pickedLogo: PickedLogo | null) => void,
  setLogoUri: (uri: string) => void,
): void => {
  setPickedLogo(null);
  setLogoUri("");
};
