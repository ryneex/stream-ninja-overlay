import { createRoot } from "react-dom/client"

import { App } from "@/app"
import { RootProviders } from "@/components/providers/root-providers"

import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <RootProviders>
    <App />
  </RootProviders>,
)
