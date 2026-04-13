import React from "react";
import { ActivityIndicator } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { FollowToolbar } from "@/components/follow/follow-toolbar";

jest.mock("expo-router", () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  const Toolbar = ({ children }: { children?: React.ReactNode }) => (
    <View testID="stack-toolbar">{children}</View>
  );

  const ToolbarView = ({ children }: { children?: React.ReactNode }) => (
    <View testID="stack-toolbar-view">{children}</View>
  );

  const ToolbarButton = ({
    children,
    onPress,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable onPress={onPress} testID="stack-toolbar-button">
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </Pressable>
  );

  const ToolbarMenu = ({ children }: { children?: React.ReactNode }) => (
    <View testID="stack-toolbar-menu">{children}</View>
  );

  const ToolbarLabel = ({ children }: { children?: React.ReactNode }) => (
    <Text testID="stack-toolbar-label">{children}</Text>
  );

  const ToolbarMenuAction = ({
    children,
    onPress,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    destructive?: boolean;
  }) => (
    <Pressable onPress={onPress} testID="stack-toolbar-menu-action">
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </Pressable>
  );

  Toolbar.View = ToolbarView;
  Toolbar.Button = ToolbarButton;
  Toolbar.Menu = ToolbarMenu;
  Toolbar.Label = ToolbarLabel;
  Toolbar.MenuAction = ToolbarMenuAction;

  return { Stack: { Toolbar } };
});

describe("FollowToolbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an activity indicator while followLoading", () => {
    const onFollow = jest.fn();
    const onUnfollow = jest.fn();

    const { UNSAFE_root, queryByText } = render(
      <FollowToolbar
        followLoading
        isFollowing={false}
        onFollow={onFollow}
        onUnfollow={onUnfollow}
      />,
    );

    expect(UNSAFE_root.findAllByType(ActivityIndicator).length).toBe(1);
    expect(queryByText("Follow")).toBeNull();
    expect(queryByText("Following")).toBeNull();
    expect(onFollow).not.toHaveBeenCalled();
    expect(onUnfollow).not.toHaveBeenCalled();
  });

  it("renders Follow button when not loading and not following", () => {
    const onFollow = jest.fn();
    const onUnfollow = jest.fn();

    const { getByText } = render(
      <FollowToolbar
        followLoading={false}
        isFollowing={false}
        onFollow={onFollow}
        onUnfollow={onUnfollow}
      />,
    );

    fireEvent.press(getByText("Follow"));

    expect(onFollow).toHaveBeenCalledTimes(1);
    expect(onUnfollow).not.toHaveBeenCalled();
  });

  it("invokes async onFollow without throwing", () => {
    const onFollow = jest.fn().mockResolvedValue(undefined);
    const onUnfollow = jest.fn();

    const { getByText } = render(
      <FollowToolbar
        followLoading={false}
        isFollowing={false}
        onFollow={onFollow}
        onUnfollow={onUnfollow}
      />,
    );

    fireEvent.press(getByText("Follow"));

    expect(onFollow).toHaveBeenCalledTimes(1);
  });

  it("renders Following menu with Unfollow when isFollowing", () => {
    const onFollow = jest.fn();
    const onUnfollow = jest.fn();

    const { getByText } = render(
      <FollowToolbar
        followLoading={false}
        isFollowing
        onFollow={onFollow}
        onUnfollow={onUnfollow}
      />,
    );

    expect(getByText("Following")).toBeTruthy();

    fireEvent.press(getByText("Unfollow"));

    expect(onUnfollow).toHaveBeenCalledTimes(1);
    expect(onFollow).not.toHaveBeenCalled();
  });

  it("invokes async onUnfollow without throwing", () => {
    const onFollow = jest.fn();
    const onUnfollow = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <FollowToolbar
        followLoading={false}
        isFollowing
        onFollow={onFollow}
        onUnfollow={onUnfollow}
      />,
    );

    fireEvent.press(getByText("Unfollow"));

    expect(onUnfollow).toHaveBeenCalledTimes(1);
  });
});
