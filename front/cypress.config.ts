import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    supportFile: "tests/e2e/support/e2e.{js,jsx,ts,tsx}",
    specPattern: "tests/e2e/specs/**/*.cy.{js,jsx,ts,tsx}",
    videosFolder: "tests/e2e/videos",
    screenshotsFolder: "tests/e2e/screenshots",
    baseUrl: "http://localhost:5173",
    // The Ionic app takes a while to boot (bundle download + hydrate +
    // mount the router outlet). The 4s default is not enough: the
    // specs failed with "element never found" while the app was still
    // mounting.
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 60000,
    viewportWidth: 1280,
    viewportHeight: 900,
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },
});
