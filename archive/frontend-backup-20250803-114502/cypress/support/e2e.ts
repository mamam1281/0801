// cypress/support/e2e.ts

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global types
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to test glassmorphism effect
       * @example cy.testGlassmorphism('[data-testid="card"]')
       */
      testGlassmorphism(selector: string): Chainable<Element>;
      
      /**
       * Custom command to test neon effects
       * @example cy.testNeonEffect('[data-testid="card"]')
       */
      testNeonEffect(selector: string): Chainable<Element>;
      
      /**
       * Custom command to test accessibility
       * @example cy.testA11y()
       */
      testA11y(): Chainable<Element>;
      
      /**
       * Custom command to test responsive design
       * @example cy.testResponsive()
       */
      testResponsive(): Chainable<Element>;
    }
  }
}

// Prevent TypeScript from reading file as legacy script
export {};
