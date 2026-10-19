import { defineConfig } from "oxfmt"

export const baseConfig = defineConfig({
  semi: false,
  printWidth: 100,
  tabWidth: 2,
  endOfLine: "lf",
  sortImports: true,
})
