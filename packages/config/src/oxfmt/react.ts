import { defineConfig } from "oxfmt"

import { baseConfig } from "./base.ts"

export const reactConfig = defineConfig({
  ...baseConfig,
  sortTailwindcss: {
    functions: ["cn", "tw"],
  },
})
