import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // Set base to your repository name for GitHub Pages. Replace 'keiho-gacha-tw' if repo name differs.
  base: "/keiho-gacha-tw/",
  plugins: [vue()],
});
