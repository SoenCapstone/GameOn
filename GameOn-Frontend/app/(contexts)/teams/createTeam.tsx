import React, { useState } from "react";
import { View, Text, TextInput, Switch, Pressable, ScrollView,} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import PickerModal, { Option } from "@/components/ui/pickerModal";
import { useRouter } from "expo-router";
import { createTeamStyles as styles } from "./teamsStyles";
import ContentArea from "@/components/content-area";
import { Background } from "@/components/background";

export default function CreateTeamScreen() {
    const router = useRouter();

    type Option = { id: string; label: string };
    type PickerType = "sport" | "scope" | "city";

    const SCOPE_OPTIONS: Option[] = [
    { id: "casual", label: "Casual" },
    { id: "managed", label: "Managed" },
    { id: "league_ready", label: "League Ready" },
    ];

    //Mock data for now
    // TODO: hook into sports table later
    const MOCK_SPORTS: Option[] = [
    { id: "soccer", label: "Soccer" },
    { id: "basketball", label: "Basketball" },
    { id: "volleyball", label: "Volleyball" },
    ];

    // TODO: figure out how to set cities
    const MOCK_CITIES: Option[] = [
    { id: "mtl", label: "Montreal" },
    { id: "tor", label: "Toronto" },
    { id: "van", label: "Vancouver" },
    ];

    const [teamName, setTeamName] = useState("");
    const [selectedSport, setSelectedSport] = useState<Option | null>(null);
    const [selectedScope, setSelectedScope] = useState<Option>(SCOPE_OPTIONS[0]);
    const [selectedCity, setSelectedCity] = useState<Option | null>(null);
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(true);

    const [openPicker, setOpenPicker] = useState<PickerType | null>(null);

    const sportLabel = selectedSport?.label ?? "None";
    const scopeLabel = selectedScope.label;
    const cityLabel = selectedCity?.label ?? "City";

    const handleCreateTeam = () => {
        // TODO: hook into backend later
        console.log("Create team payload:", {
            teamName,
            sportId: selectedSport?.id,
            scopeId: selectedScope.id,
            cityId: selectedCity?.id,
            isPublic,
            logoUri,
        });
        router.back();
    };

    const pickerConfig: Record<
        PickerType,
        { title: string; options: Option[]; setter: (option: Option) => void }
        > = {
            sport: {
                title: "Select Sport",
                options: MOCK_SPORTS,
                setter: setSelectedSport,
            },
            scope: {
                title: "Select Scope",
                options: SCOPE_OPTIONS,
                setter: setSelectedScope,
            },
            city: {
                title: "Select City",
                options: MOCK_CITIES,
                setter: setSelectedCity,
            },
        };

    const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

    const handlePickLogo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            alert("We need access to your photos to upload a logo.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setLogoUri(result.assets[0].uri);
        }
    };
    
    return (
        <ContentArea>
            <Background preset="red" mode="default" />
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >

                {/* Upload logo */}
                <View style={styles.logoSection}>
                    <Pressable style={styles.logoCircle} onPress={handlePickLogo}>
                        {logoUri ? (
                        <Image
                            source={{ uri: logoUri }}
                            style={styles.logoImage}
                            contentFit="cover"
                        />
                        ) : (
                        <Text style={styles.logoIcon}>📷</Text>
                        )}
                    </Pressable>

                    <Pressable onPress={handlePickLogo}>
                        <Text style={styles.uploadText}>
                        {logoUri ? "Change Logo" : "Upload Logo"}
                        </Text>
                    </Pressable>
                </View>

                {/* Name */}
                <View style={styles.fieldGroup}>
                <View style={styles.chip}>
                    <Text style={styles.chipText}>Name</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                    placeholder="Team Name"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.textInput}
                    value={teamName}
                    onChangeText={setTeamName}
                    />
                    {teamName.length > 0 && (
                    <Pressable
                        style={styles.clearButton}
                        onPress={() => setTeamName("")}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </Pressable>
                    )}
                </View>
                </View>

                {/* Details card */}
                <View style={styles.fieldGroup}>
                <View style={styles.chip}>
                    <Text style={styles.chipText}>Details</Text>
                </View>

                <View style={styles.detailsCard}>
                    {/* Sports */}
                    <Pressable
                        style={styles.detailRow}
                        onPress={() => setOpenPicker("sport")}
                    >
                        <Text style={styles.detailLabel}>Sports</Text>
                        <Text style={styles.detailValue}>{sportLabel} ⌵</Text>
                    </Pressable>

                    <View style={styles.divider} />

                    {/* Scope */}
                    <Pressable
                        style={styles.detailRow}
                        onPress={() => setOpenPicker("scope")}
                    >
                        <Text style={styles.detailLabel}>Scope</Text>
                        <Text style={styles.detailValue}>{scopeLabel} ⌵</Text>
                    </Pressable>

                    <View style={styles.divider} />

                    {/* Location / City */}
                    <Pressable
                        style={styles.detailRow}
                        onPress={() => setOpenPicker("city")}
                    >
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue}>{cityLabel} ⌵</Text>
                    </Pressable>
                </View>
                </View>

                {/* Visibility */}
                <View style={styles.fieldGroup}>
                <View style={styles.chip}>
                    <Text style={styles.chipText}>Visibility</Text>
                </View>

                <View style={styles.visibilityCard}>
                    <Text style={styles.visibilityLabel}>
                    Apply for Public Team
                    </Text>
                    <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{
                        false: "rgba(255,255,255,0.2)",
                        true: "rgba(3, 180, 70, 0.7)",
                    }}
                    thumbColor="#ffffff"
                    />
                </View>
                </View>

                <Pressable style={styles.createButton} onPress={handleCreateTeam}>
                <Text style={styles.createButtonText}>Create Team</Text>
                </Pressable>
                <PickerModal
                    visible={openPicker !== null}
                    title={currentConfig?.title ?? ""}
                    options={currentConfig?.options ?? []}
                    onClose={() => setOpenPicker(null)}
                    onSelect={(option) => {
                        if (!openPicker) return;
                        pickerConfig[openPicker].setter(option);
                        setOpenPicker(null);
                    }}
                    />

            </ScrollView>
        </ContentArea>
    );
}
