import { defineConfig } from "oxlint"

import { baseConfig } from "./base.ts"

export const reactConfig = defineConfig({
  extends: [baseConfig],
  plugins: ["react"],
  rules: {
    "react/rules-of-hooks": "error",
    "react/set-state-in-effect": "off",
    "react/immutability": "off",
  },
})
