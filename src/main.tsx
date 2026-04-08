import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";
import { getAppName } from "./lib/branding";

document.title = getAppName() + " - Management Portal";

// Register push notification service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-push.js").catch((err) => {
    console.log("Push SW registration failed:", err);
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
