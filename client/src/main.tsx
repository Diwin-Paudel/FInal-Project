import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap";
document.head.appendChild(link);

// Material Icons
const iconsLink = document.createElement("link");
iconsLink.rel = "stylesheet";
iconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
document.head.appendChild(iconsLink);

// Title
const titleElement = document.createElement("title");
titleElement.textContent = "FoodExpress - Food Delivery Platform";
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
