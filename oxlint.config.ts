import { defineConfig } from "oxlint"

import { baseConfig } from "./packages/config/src/oxlint/base.ts"

export default defineConfig({
  extends: [baseConfig],
  options: {
    typeAware: true,
    typeCheck: true,
  },
})
