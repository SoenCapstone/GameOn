import { Platform, Pressable, Text, View, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { User } from "@/components/sign-up/models";
import { styles } from "./sign-up/styles";

export const DatePicker: React.FC<{
  showDob: boolean;
  setShowDob: React.Dispatch<React.SetStateAction<boolean>>;
  values: User;
  setFieldValue: any;
}> = ({ showDob, setShowDob, values, setFieldValue }) => {
  return (
    <>
      {Platform.OS === "ios" && (
        <Modal visible={showDob} animationType="slide" transparent>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowDob(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalToolbar}>
              <Pressable onPress={() => setShowDob(false)}>
                <Text style={styles.modalAction}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Select Date</Text>
              <Pressable onPress={() => setShowDob(false)}>
                <Text style={styles.modalAction}>Done</Text>
              </Pressable>
            </View>

            <DateTimePicker
              mode="date"
              display="spinner"
              value={
                values.birth && !Number.isNaN(new Date(values.birth).getTime())
                  ? new Date(values.birth)
                  : new Date()
              }
              maximumDate={new Date()}
              onChange={(_, date) => {
                if (date) setFieldValue("birth", date.toISOString());
              }}
              style={{ width: "100%" }}
            />
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showDob && (
        <DateTimePicker
          mode="date"
          display="calendar"
          value={
            values.birth && !Number.isNaN(new Date(values.birth).getTime())
              ? new Date(values.birth)
              : new Date()
          }
          maximumDate={new Date()}
          onChange={(_, date) => {
            setShowDob(false);
            if (date) setFieldValue("birth", date.toISOString());
          }}
        />
      )}
    </>
  );
};
