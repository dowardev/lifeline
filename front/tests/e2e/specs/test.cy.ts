describe('Anonymous boot (LBDS-199)', () => {
  it('mounts the home app-shell page without SSO auth', () => {
    // The `/home` app-shell route must be reachable anonymously instead of
    // redirecting to SSO login, so the app is usable with no SSO configured.
    cy.visit('/home')
    cy.url().should('include', '/home')
    cy.get('ion-page').should('exist')
  })
})