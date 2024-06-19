import { defineConfig } from 'cypress';

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
      baseUrl: process.env.CYPRESS_BASE_URL ?? 'https://roar-tasks-staging--pr1-enh-roar-inference-muunidg9.web.app',
      timeout: 10000,
    },
  },
});