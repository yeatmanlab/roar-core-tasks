import { defineConfig } from 'cypress';

const baseUrl = process.env.CYPRESS_BASE_URL || (process.env.CI ? process.env.CI_PULL_REQUEST || 'http://localhost:8000' : 'http://localhost:8000');

export default defineConfig({
  projectId: 'g63x9c',
  e2e: {
    experimentalRunAllSpecs: true,
    retries: 2,
    // eslint-disable-next-line no-unused-vars
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      baseUrl,
      timeout: 10000,
    },
  },
});