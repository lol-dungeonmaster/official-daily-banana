import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      },
      include: ['assets/js/lazyimage.js', 'assets/js/tag-router.js', 'assets/js/lightbox.js', 'assets/js/collapse.js', 'assets/js/audio-player.js']
    }
  }
});
