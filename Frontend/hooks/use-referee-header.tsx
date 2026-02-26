import { useLayoutEffect, useCallback } from "react";
import { Router, useRouter, useNavigation } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

async function handleSave(
    canSave: boolean,
    title: string,
    saveItems: () => Promise<void>,
    router: Router,
): Promise<void> {
    if (!canSave) {
        alert(`Please select at least one ${title.toLowerCase()}`);
        return;
    }
    try {
        await saveItems();
        router.back();
    } catch (error) {
        console.error(`Failed to update ${title.toLowerCase()}:`, error);
        alert(`Failed to update ${title.toLowerCase()}`);
    }
}

interface UseRefereeHeaderParams {
    title: string;
    canSave: boolean;
    saving: boolean;
    saveItems: () => Promise<void>;
}

export function useRefereeHeader({
    title,
    canSave,
    saving,
    saveItems,
}: UseRefereeHeaderParams) {
    const router = useRouter();
    const navigation = useNavigation();

    const onSave = useCallback(
        () => handleSave(canSave, title, saveItems, router),
        [canSave, title, saveItems, router],
    );

    const headerTitle = useCallback(
        () => (
            <Header
                left={<Button type="back" />}
                center={<PageTitle title={title} />}
                right={
                    <Button
                        type="custom"
                        label="Save"
                        onPress={onSave}
                        loading={saving}
                        isInteractive={!saving}
                    />
                }
            />
        ),
        [onSave, title, saving],
    );

    useLayoutEffect(() => {
        navigation.setOptions({ headerTitle });
    }, [navigation, headerTitle]);
}
