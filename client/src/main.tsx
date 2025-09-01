import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import posthog from 'posthog-js';

// Initialize PostHog with the provided API key and host
posthog.init('phc_2jUnDMt7gEMy2NZgH6e09AhCS7UbusZYfqRg9bgW906', {
  api_host: 'https://us.i.posthog.com',
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
