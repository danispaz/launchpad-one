import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Tailwind v4 uses @tailwindcss/vite which handles plugins differently, 
  // but if the project is configured with a hidden tailwind.config.ts or 
  // if we need to force-enable a plugin that hasn't been auto-detected:
  // @ts-ignore
  tailwindcss: {
    plugins: [
      require('@tailwindcss/typography'),
    ],
  },
});
