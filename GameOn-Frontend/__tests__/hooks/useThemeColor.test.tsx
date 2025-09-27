import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Mock the useColorScheme hook
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

// Mock Colors from theme constants
jest.mock('@/constants/theme', () => ({
  Colors: {
    light: {
      text: '#11181C',
      background: '#fff',
      tint: '#0a7ea4',
      icon: '#687076',
    },
    dark: {
      text: '#ECEDEE',
      background: '#151718',
      tint: '#fff',
      icon: '#9BA1A6',
    },
  },
}));

describe('useThemeColor', () => {
  it('returns light color when in light mode', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );

    expect(result.current).toBe('#ff0000');
  });

  it('returns dark color when in dark mode', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );

    expect(result.current).toBe('#00ff00');
  });

  it('falls back to theme color when prop colors not provided', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const { result } = renderHook(() => useThemeColor({}, 'text'));

    expect(result.current).toBe('#11181C');
  });

  it('falls back to light theme when scheme is null', () => {
    (useColorScheme as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() =>
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );

    expect(result.current).toBe('#ff0000');
  });
});