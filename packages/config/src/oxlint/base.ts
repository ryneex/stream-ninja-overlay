import { defineConfig } from "oxlint"

export const baseConfig = defineConfig({
  plugins: ["typescript", "oxc", "unicorn"],
  categories: {
    correctness: "error",
  },
})
