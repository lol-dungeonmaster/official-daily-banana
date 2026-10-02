import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 60,
        statements: 80,
        "assets/js/ai-studio.js": {
          lines: 80,
          functions: 75,
          branches: 60,
          statements: 80,
        },
      },
      include: [
        "assets/js/lazyimage.js",
        "assets/js/tag-router.js",
        "assets/js/lightbox.js",
        "assets/js/collapse.js",
        "assets/js/audio-player.js",
        "assets/js/layout-hacks.js",
        "assets/js/ai-studio.js",
      ],
    },
  },
});
