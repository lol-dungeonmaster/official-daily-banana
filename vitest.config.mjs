import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
        'assets/js/ai-studio.js': {
          lines: 88,
          functions: 90,
          branches: 73,
          statements: 88
        }
      },
      include: ['assets/js/lazyimage.js', 'assets/js/tag-router.js', 'assets/js/lightbox.js', 'assets/js/collapse.js', 'assets/js/audio-player.js', 'assets/js/layout-hacks.js', 'assets/js/ai-studio.js']
    }
  }
});
