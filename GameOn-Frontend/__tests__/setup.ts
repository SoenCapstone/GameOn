import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    runOnJS: (fn: any) => fn,
  },
  useSharedValue: (value: any) => ({ value }),
  useAnimatedStyle: (fn: any) => fn,
  withTiming: (value: any) => value,
  withSpring: (value: any) => value,
  withDelay: (delay: number, animation: any) => animation,
  runOnUI: (fn: any) => fn,
  Easing: {
    bezier: () => ({ factory: () => (t: number) => t }),
  },
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    name: 'GameOn',
    slug: 'GameOn',
  },
  executionEnvironment: 'standalone',
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: any) => children,
}));

export {};