import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/**", "bin/**", "node_modules/**", "src/app/**"]),
]);
