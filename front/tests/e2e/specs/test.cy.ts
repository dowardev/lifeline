describe('Anonymous boot (LBDS-199)', () => {
  it('mounts the home app-shell page without SSO auth', () => {
    // The `/home` app-shell route must be reachable anonymously instead of
    // redirecting to SSO login, so the app is usable with no SSO configured.
    cy.visit('/home')
    cy.url().should('include', '/home')
    // The app shell mounted: `ion-app` wraps the split pane, and the
    // routed page renders as a `.ion-page` DIV (Ionic Vue replaces the
    // `ion-page` tag with the div the component renders).
    cy.get('ion-app').should('exist')
    cy.get('.ion-page').should('exist')
    cy.get('.widget-grid-section').should('exist')
  })
})