import type { Preview } from '@storybook/react';
import '../styles/global.css';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) => React.createElement(
      Provider,
      { store },
      React.createElement(Story)
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'iphone13',
      viewports: {
        iphone13: {
          name: 'iPhone 13',
          styles: {
            width: '390px',
            height: '844px',
          },
          type: 'mobile',
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
