import { createRoot } from "react-dom/client";
import "./global.css";
import { App } from "./App";

const domNode = document.getElementById("root");
if (domNode === null) {
  throw new Error("Root element not found");
}
const root = createRoot(domNode);

root.render(<App />);
