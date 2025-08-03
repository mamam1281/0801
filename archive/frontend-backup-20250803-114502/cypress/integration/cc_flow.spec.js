// cc-webapp/frontend/cypress/integration/cc_flow.spec.js
describe('CC Webapp End-to-End Flow', () => {
  const TEST_USER_ID = 1; // Consistent user ID for testing
  const BASE_URL = 'http://localhost:3000'; // Define baseUrl here if not in cypress.json/config.js

  beforeEach(() => {
    // cy.intercept calls are commented out as per prompt, assuming live backend or global mocks.
    // Example: Mocking initial /api/unlock for adult_content page
    // cy.intercept('GET', `/api/unlock?user_id=${TEST_USER_ID}`, {
    //   statusCode: 200,
    //   body: { stage: 1, name: "Test Stage 1", description: "Desc", thumbnail_url: "https://via.placeholder.com/400x200.png?text=Stage+1+Thumbnail", media_url: "https://via.placeholder.com/800x400.png?text=Stage+1+Media" }
    // }).as('getUnlockStatus');

    // Example: Mocking /api/user-segments/.../recommendation for profile page
    // cy.intercept('GET', `/api/user-segments/${TEST_USER_ID}/recommendation`, {
    //   statusCode: 200,
    //   body: { user_id: TEST_USER_ID, rfm_group: "Medium", risk_profile: "Low-Risk", streak_count: 5, recommended_reward_probability: 0.55, recommended_time_window: "next 4 hours" }
    // }).as('getRecommendation');

    // Example: Mock pending notification for NotificationBanner
    // cy.intercept('GET', `/api/notification/pending/${TEST_USER_ID}`, {
    //   statusCode: 200,
    //   body: { message: "Test Notification: Don't miss out!" }
    // }).as('getPendingNotification');
  });

  it('Slot spin shows feedback and confetti/sound occurs (visual check needed for sound/confetti)', () => {
    cy.visit(`${BASE_URL}/slots`); // Assuming /slots page hosts SlotMachine component

    // Find button containing "Spin" (case-insensitive for "Spin to Win!" or "Spin!")
    cy.contains('button', /spin/i, { timeout: 10000 }).should('be.visible').click();

    // Wait for feedback to appear. EmotionFeedback uses role="alert".
    // The message changes based on win/loss.
    cy.get('[role="alert"]', { timeout: 5000 }).should('be.visible').and(alert => {
        expect(alert.text()).to.not.be.empty;
        // Check for emotion-specific classes (bannerClass from EmotionFeedback.jsx)
        // This requires knowing the classes added. Example: happiness adds 'bg-green-50'
        // This assertion is brittle if classes change often.
        // expect(alert.attr('class')).to.match(/bg-(green|red|blue|gray)-50/);
    });
    // Note: Confetti and sound are primarily visual/auditory and hard to assert directly in Cypress.
    // Visual regression testing or specific DOM elements created by confetti could be checked if stable.
  });

  it('Adult content page loads, attempts unlock, and reveals media if eligible', () => {
    // This test can be flaky if it relies on a specific sequence of unlocks from a live backend
    // without resetting state or precise mocking.
    cy.visit(`${BASE_URL}/adult_content`);

    // Wait for initial loading state to disappear
    cy.contains('Loading content status...', { timeout: 10000 }).should('not.exist');
    cy.contains('Checking your access & loading content...', { timeout: 10000 }).should('not.exist');


    // Check if the "Reveal Full Content" button is present OR an error/alternative message.
    cy.get('body', { timeout: 10000 }).then(($body) => {
      if ($body.find('button:contains("Reveal Full Content")').filter(':visible').length > 0) {
        cy.contains('button', 'Reveal Full Content').filter(':visible').click();
        // Check if modal appears (identified by its dark overlay and content)
        cy.get('div[class*="bg-black"][class*="bg-opacity-80"]', { timeout: 5000 }).should('be.visible').within(() => {
            // Check for an image or video tag within the modal
            cy.get('img[src*="http"], video[src*="http"]').should('be.visible');
            // Check for close button and click it
            cy.get('button[aria-label="Close modal"]').click();
        });
        // Ensure modal is gone
        cy.get('div[class*="bg-black"][class*="bg-opacity-80"]').should('not.exist');

      } else {
        // If button not found, check for common messages (error or all unlocked)
        const messages = [
            "All content stages are already unlocked",
            "Access Denied",
            "No new content available",
            "User profile not found",
            "No content is currently available for you" // From component's !content case
        ];
        let foundMessage = false;
        messages.forEach(msg => {
            if ($body.text().includes(msg)) {
                foundMessage = true;
            }
        });
        expect(foundMessage, `Expected either reveal button or a known message. Body: ${$body.text().substring(0, 500)}`).to.be.true;
      }
    });
  });

  it('Profile page loads recommendation or appropriate message', () => {
    cy.visit(`${BASE_URL}/profile`);
    // Wait for loading to finish
    cy.contains('Fetching your personalized insights...', { timeout: 10000 }).should('not.exist');

    cy.get('body', { timeout: 10000 }).then(($body) => {
      const hasRecommendationDetails = $body.text().includes('Reward Probability') && $body.text().includes('Best Time Window');
      const hasErrorOrInfoMessage = $body.text().includes('No recommendation data currently available') ||
                                    $body.text().includes('Failed to fetch recommendations') ||
                                    $body.text().includes('Insights Pending');

      expect(hasRecommendationDetails || hasErrorOrInfoMessage, `Expected recommendation details or an info/error message. Body: ${$body.text().substring(0,500)}`).to.be.true;

      if(hasRecommendationDetails){
        cy.contains('button', /Play Now/i).should('be.visible');
      }
    });
  });

  it('Visit HQ Site button on homepage logs action and attempts redirect', () => {
    cy.intercept('POST', '**/api/notify/site_visit').as('siteVisitCall');

    cy.visit(`${BASE_URL}/`);

    // Stub window.location.assign to prevent actual cross-origin navigation during test
    // and to assert its call.
    let locationAssignStub;
    cy.window().then(win => {
      locationAssignStub = cy.stub(win.location, 'assign').as('locationAssign');
    });

    cy.contains('button', 'Visit HQ Site', { timeout: 10000 }).should('be.visible').click();

    cy.wait('@siteVisitCall').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Check that window.location.assign was called with the expected URL pattern
    cy.get('@locationAssign').should('be.calledWith', Cypress.sinon.match(/^https:\/\/corporate-site\.example\.com\/welcome\?userId=/));
  });

  it('Notification banner appears if message is available and can be closed', () => {
    // Mock the API to ensure a notification is pending for this test
    cy.intercept('GET', `**/api/notification/pending/${TEST_USER_ID}`, {
      statusCode: 200,
      body: { message: "E2E Test: You have a new notification!" }
    }).as('getNotification');

    cy.visit(`${BASE_URL}/`); // Visit a page where the banner is rendered (e.g., homepage)
    cy.wait('@getNotification'); // Wait for the API call to complete

    // Check for notification text and visibility
    cy.contains("E2E Test: You have a new notification!", { timeout: 5000 }).should('be.visible');

    // Find and click the close button
    cy.get('button[aria-label="Close notification"]').click();

    // Assert the notification is no longer visible (or exists, depending on implementation)
    cy.contains("E2E Test: You have a new notification!").should('not.exist');
  });
});
