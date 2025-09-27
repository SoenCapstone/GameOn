import React from 'react';
import { render } from '@testing-library/react-native';
import { ExternalLink } from '../../components/external-link';

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    AUTOMATIC: 'automatic',
  },
}));

// Simple test without complex Link mocking
describe('ExternalLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const component = render(
      <ExternalLink href="https://example.com">Visit Example</ExternalLink>
    );
    expect(component).toBeTruthy();
  });

  it('accepts different href values', () => {
    const component = render(
      <ExternalLink href="https://github.com">GitHub</ExternalLink>
    );
    expect(component).toBeTruthy();
  });
});