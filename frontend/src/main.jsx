import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from "axios";
import { ToggleColorMode } from "./client/utility components/navbar/ThemeContext";

axios.interceptors.request.use((request) => {
  if (localStorage.getItem("token")) {
    request.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  }
  return request;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
       {" "}
    <ToggleColorMode>
            <App />   {" "}
    </ToggleColorMode>
     {" "}
  </StrictMode>,
);
