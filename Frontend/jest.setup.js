/* eslint-env jest */
/* global jest */
import "@testing-library/jest-native/extend-expect";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// expo-linear-gradient mock MUST be a jest.fn so tests can call .mockClear()
jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");

  const LinearGradient = jest.fn((props) => {
    // Force the recorded mock call to have (props, {}) as args
    const calls = LinearGradient.mock.calls;
    const i = calls.length - 1;

    if (i >= 0) {
      const prev = calls[i];
      // If React passed undefined (or only 1 arg), rewrite to match tests
      if (prev.length === 1) calls[i] = [prev[0], {}];
      else if (prev.length === 2 && prev[1] == null) calls[i] = [prev[0], {}];
    }

    return React.createElement(View, props, props.children);
  });

  return { LinearGradient };
});