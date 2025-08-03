// cypress/support/component.ts

// Import global styles or component-specific styles if needed
import '../../styles/globals.css';

// Component testing support
import { mount } from 'cypress/react18';

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

export {};
