import { View } from "react-native";
import React from "react";

type HeaderProps = {
    left?: React.ReactNode;
    center: React.ReactNode;
    right?: React.ReactNode;
};

const containerStyle = {
    width: "100%" as const,
    height: "100%" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
};

const leftStyle = {
    flex: 1,
    alignItems: "flex-start" as const,
};

const centerStyle = {
    flex: 1,
    alignItems: "center" as const,
};

const rightStyle = {
    flex: 1,
    alignItems: "flex-end" as const,
};

export default function Header({ left, center, right }: Readonly<HeaderProps>) {
    return (
        <View style={containerStyle}>
            <View style={leftStyle}>{left}</View>
            <View style={centerStyle}>{center}</View>
            <View style={rightStyle}>{right}</View>
        </View>
    );
}
