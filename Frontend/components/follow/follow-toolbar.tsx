import { ActivityIndicator } from "react-native";
import { Stack } from "expo-router";

type FollowToolbarProps = {
  readonly followLoading: boolean;
  readonly isFollowing: boolean;
  readonly onFollow: () => void | Promise<void>;
  readonly onUnfollow: () => void | Promise<void>;
};

export function FollowToolbar({
  followLoading,
  isFollowing,
  onFollow,
  onUnfollow,
}: FollowToolbarProps) {
  return (
    <Stack.Toolbar placement="right">
      {followLoading ? (
        <Stack.Toolbar.View>
          <ActivityIndicator color="white" size="small" />
        </Stack.Toolbar.View>
      ) : isFollowing ? (
        <Stack.Toolbar.Menu>
          <Stack.Toolbar.Label>Following</Stack.Toolbar.Label>
          <Stack.Toolbar.MenuAction
            destructive
            onPress={() => {
              void onUnfollow();
            }}
          >
            Unfollow
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      ) : (
        <Stack.Toolbar.Button
          onPress={() => {
            void onFollow();
          }}
        >
          Follow
        </Stack.Toolbar.Button>
      )}
    </Stack.Toolbar>
  );
}
