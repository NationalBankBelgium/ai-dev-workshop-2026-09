import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile({ useRecommendedBuildConfig: true, deleteInlinedFiles: true })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
