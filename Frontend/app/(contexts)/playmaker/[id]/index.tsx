import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable,
  Text,
  Alert,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { PlayMakerArea } from "@/components/play-maker/play-maker-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import type { Shape } from "@/components/play-maker/model";

import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "../../../../hooks/use-axios-clerk";

function toBackendPayload(shapes: Shape[]) {
  return shapes.map((s: any) => {
    const t = String(s.type).toLowerCase();

    if (t === "arrow") {
      return {
        type: "arrow",
        id: s.id,
        from: { id: s.from?.id ?? s.fromId ?? s.from },
        to: { id: s.to?.id ?? s.toId ?? s.to },
      };
    }

    return {
      type: "person",
      id: s.id,
      x: s.x,
      y: s.y,
      size: s.size,
      ...(s.associatedPlayerId ? { associatedPlayerId: s.associatedPlayerId } : {}),
    };
  });
}

export default function PlayMaker() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  return (
    <TeamDetailProvider id={id}>
      <PlayMakerContent />
    </TeamDetailProvider>
  );
}

function PlayMakerContent() {
  const { isLoading, refreshing, onRefresh, title, id: teamId } =
    useTeamDetailContext();



  const navigation = useNavigation();
  const api = useAxiosWithClerk();

  const latestShapesRef = useRef<Shape[]>([]);
  const [saving, setSaving] = useState(false);

  const handleShapesChange = useCallback((shapes: Shape[]) => {
    latestShapesRef.current = shapes;
  }, []);

  const onSave = useCallback(async () => {
    const shapes = latestShapesRef.current;

    if (!shapes || shapes.length === 0) {
      Alert.alert("Nothing to save", "Add some shapes on the board first.");
      return;
    }

    setSaving(true);

    try {
      const payload = toBackendPayload(shapes);


      const route = GO_TEAM_SERVICE_ROUTES.CREATE_PLAY(teamId);


      const token = await api.defaults.headers?.Authorization;


      const res = await api.post(route, payload);

      const playId =
        typeof res.data === "string"
          ? res.data.replaceAll('"', "")
          : String(res.data);

      Alert.alert("Saved", "Your play was saved successfully.");
    } catch (e: any) {
      const status = e?.response?.status;

      const backendMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === "string" ? e.response.data : null);

      const msg =
        backendMsg ||
        e?.message ||
        (status ? `Save failed (${status})` : "Save failed");

      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }, [api, teamId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title={`${title} Playmaker`} />}
          right={
            <Pressable
              onPress={saving ? undefined : onSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && !saving && { opacity: 0.7 },
                saving && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.saveText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          }
        />
      ),
    });
  }, [navigation, title, onSave, saving]);

  return (
    <ContentArea
      paddingBottom={60}
      backgroundProps={{ preset: "red" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      <PlayMakerArea styles={styles} onShapesChange={handleShapesChange} />
      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  saveButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: 10,
  },
  saveText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  hint: {
    color: "white",
    opacity: 0.85,
    paddingTop: 10,
    paddingBottom: 8,
  },
  boardWrapper: { height: "50%" },
  shapeArea: {
    height: "7%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  panelArea: { height: "43%" },
});