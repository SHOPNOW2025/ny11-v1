import { defineConfig } from 'vite';

const config = defineConfig({
  define: {
    'process.env.GEMINI_API_KEY': undefined,
  },
});

console.log("Config define:", config.define);
