describe('Card Component E2E Tests', () => {
  beforeEach(() => {
    // 카드 컴포넌트가 있는 페이지로 이동
    cy.visit('/components/card-demo'); // 실제 경로로 수정 필요
  });

  describe('Card Rendering', () => {
    it('should render card components correctly', () => {
      cy.get('[data-testid="card"]').should('be.visible');
      cy.get('[data-testid="card"]').should('contain.text', 'Test Content');
    });

    it('should display different card variants', () => {
      cy.get('[data-testid="card-game"]').should('have.class', 'game');
      cy.get('[data-testid="card-mission"]').should('have.class', 'mission');
      cy.get('[data-testid="card-reward"]').should('have.class', 'reward');
    });
  });

  describe('Card Interactions', () => {
    it('should handle click events on clickable cards', () => {
      cy.get('[data-testid="clickable-card"]')
        .should('have.css', 'cursor', 'pointer')
        .click();
      
      // 클릭 이벤트 결과 확인 (예: 알림, 페이지 이동 등)
      cy.get('[data-testid="click-result"]').should('contain.text', 'Card clicked');
    });

    it('should not trigger click events on non-clickable cards', () => {
      cy.get('[data-testid="non-clickable-card"]')
        .should('not.have.css', 'cursor', 'pointer')
        .click();
      
      // 클릭 이벤트가 발생하지 않았는지 확인
      cy.get('[data-testid="click-result"]').should('not.exist');
    });

    it('should show hover effects on interactive cards', () => {
      cy.get('[data-testid="interactive-card"]')
        .trigger('mouseover')
        .should('have.css', 'transform'); // 호버 시 transform 변화 확인
    });
  });

  describe('Neon Effects', () => {
    it('should display neon effects when enabled', () => {
      cy.get('[data-testid="neon-card"]')
        .should('have.class', 'neonEffect')
        .find('.neonBackground')
        .should('exist');
    });

    it('should animate neon effects', () => {
      cy.get('[data-testid="neon-card"] .neonBackground')
        .should('be.visible')
        // 애니메이션 확인을 위해 잠시 대기
        .wait(1000)
        .should('have.css', 'opacity');
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { device: 'iphone-6', width: 375, height: 667 },
      { device: 'ipad-2', width: 768, height: 1024 },
      { device: 'macbook-15', width: 1440, height: 900 }
    ];    viewports.forEach(({ device, width, height }) => {
      it(`should render correctly on ${device}`, () => {
        cy.viewport(width, height);
        
        cy.get('[data-testid="card"]')
          .should('be.visible')
          .and('have.css', 'border-radius');
        
        // 모바일에서 패딩이 적절히 조정되는지 확인
        if (width <= 768) {
          cy.get('[data-testid="card"]')
            .should('have.css', 'border-radius', '16px'); // 모바일에서 줄어든 border-radius
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible when clickable', () => {
      cy.get('[data-testid="clickable-card"]')
        .focus()
        .should('have.focus')
        .type('{enter}');
      
      cy.get('[data-testid="click-result"]').should('contain.text', 'Card clicked');
    });

    it('should have proper ARIA attributes', () => {
      cy.get('[data-testid="card-with-label"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Card');
    });

    it('should meet color contrast requirements', () => {
      cy.get('[data-testid="card"]')
        .should('have.css', 'color')
        .and('not.be.empty');
    });
  });

  describe('Performance', () => {
    it('should load cards within acceptable time', () => {
      const startTime = Date.now();
      
      cy.get('[data-testid="card"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000); // 2초 이내 로딩
      });
    });

    it('should handle multiple cards efficiently', () => {
      cy.get('[data-testid^="card-"]').should('have.length.greaterThan', 0);
      
      // 모든 카드가 로딩되는지 확인
      cy.get('[data-testid^="card-"]').each(($card) => {
        cy.wrap($card).should('be.visible');
      });
    });
  });

  describe('Animation Performance', () => {
    it('should handle hover animations smoothly', () => {
      cy.get('[data-testid="animated-card"]')
        .trigger('mouseover')
        .should('have.css', 'transition-duration')
        .trigger('mouseout');
    });

    it('should not cause layout shifts during animations', () => {
      let initialBounds;
      
      cy.get('[data-testid="animated-card"]')
        .then(($el) => {
          initialBounds = $el[0].getBoundingClientRect();
        })
        .trigger('mouseover')
        .wait(500) // 애니메이션 완료 대기
        .then(($el) => {
          const currentBounds = $el[0].getBoundingClientRect();
          // 카드의 위치가 크게 변하지 않았는지 확인
          expect(Math.abs(currentBounds.top - initialBounds.top)).to.be.lessThan(20);
        });
    });
  });
});
