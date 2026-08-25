/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/components/MoonlightSplash', () => {
  const ReactLocal = require('react');
  return function MockMoonlightSplash() {
    return ReactLocal.createElement('View', null);
  };
});

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});
