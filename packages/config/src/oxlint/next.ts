import { defineConfig } from "oxlint"

import { reactConfig } from "./react.ts"

export const nextConfig = defineConfig({
  extends: [reactConfig],
  plugins: ["nextjs"],
  rules: {
    "nextjs/no-img-element": "off",
  },
})
