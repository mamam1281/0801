// cypress/support/commands.ts

// Custom commands for testing glassmorphism and neon effects
Cypress.Commands.add('testGlassmorphism', (selector: string) => {
  cy.get(selector).should(($el) => {
    const styles = window.getComputedStyle($el[0]);
    
    // Test backdrop-filter blur effect
    expect(styles.backdropFilter).to.include('blur');
    
    // Test background opacity/transparency
    const bgColor = styles.backgroundColor;
    expect(bgColor).to.match(/rgba?\(/); // Should have rgba or rgb
    
    // Test border styling for glassmorphism
    expect(styles.border).to.not.be.empty;
  });
});

Cypress.Commands.add('testNeonEffect', (selector: string) => {
  cy.get(selector).should(($el) => {
    const styles = window.getComputedStyle($el[0]);
    
    // Test for box-shadow (neon glow)
    expect(styles.boxShadow).to.not.equal('none');
    expect(styles.boxShadow).to.include('rgb');
  });
});

Cypress.Commands.add('testA11y', () => {
  // Basic accessibility tests
  cy.get('[role]').should('exist');
  cy.get('button, [role="button"]').each(($btn) => {
    cy.wrap($btn).should('have.attr', 'aria-label').or('contain.text');
  });
});

Cypress.Commands.add('testResponsive', () => {
  // Test mobile viewport
  cy.viewport(375, 667);
  cy.get('[data-testid="card"]').should('be.visible');
  
  // Test tablet viewport
  cy.viewport(768, 1024);
  cy.get('[data-testid="card"]').should('be.visible');
  
  // Test desktop viewport
  cy.viewport(1280, 720);
  cy.get('[data-testid="card"]').should('be.visible');
});

// Add other useful commands
Cypress.Commands.add('waitForAnimation', (duration: number = 300) => {
  cy.wait(duration);
});

export {};
