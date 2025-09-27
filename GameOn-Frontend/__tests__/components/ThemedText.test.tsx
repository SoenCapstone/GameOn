import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../../components/themed-text';

// Mock the useThemeColor hook
jest.mock('../../hooks/use-theme-color', () => ({
  useThemeColor: () => '#000000',
}));

describe('ThemedText', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders with different text types', () => {
    const { getByText } = render(
      <ThemedText type="title">Title Text</ThemedText>
    );
    expect(getByText('Title Text')).toBeTruthy();
  });

  it('renders with subtitle type', () => {
    const { getByText } = render(
      <ThemedText type="subtitle">Subtitle Text</ThemedText>
    );
    expect(getByText('Subtitle Text')).toBeTruthy();
  });

  it('accepts custom styles', () => {
    const customStyle = { fontSize: 20 };
    const { getByText } = render(
      <ThemedText style={customStyle}>Styled Text</ThemedText>
    );
    expect(getByText('Styled Text')).toBeTruthy();
  });
});