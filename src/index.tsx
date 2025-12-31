import { createRoot } from "react-dom/client";
import "./global.css";
import { App } from "./App";

const domNode = document.getElementById("root")!;
const root = createRoot(domNode);

root.render(<App />);
