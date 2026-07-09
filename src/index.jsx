import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";   // design tokens (must load before component styles)
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
