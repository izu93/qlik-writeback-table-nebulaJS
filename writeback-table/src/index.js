// src/index.js
import React from "react";
import * as ReactDOM from "react-dom"; // Using old ReactDOM import
import { useElement } from "@nebula.js/stardust";
import properties from "./object-properties";
import data from "./data";
import ext from "./ext";

// Simple component using React.createElement instead of JSX
const HelloComponent = () => {
  return React.createElement("div", null, "Hello Writeback Table!");
};

/**
 * Entrypoint for your sense visualization
 * @param {object} galaxy Contains global settings from the environment.
 */
export default function supernova(galaxy) {
  return {
    qae: {
      properties,
      data,
    },
    ext: ext(galaxy),
    component() {
      const element = useElement();

      try {
        // Use the classic render method (not createRoot)
        ReactDOM.render(React.createElement(HelloComponent), element);

        // Return a cleanup function to unmount React when needed
        return () => {
          try {
            ReactDOM.unmountComponentAtNode(element);
          } catch (e) {
            console.error("Error unmounting React:", e);
            // Fallback cleanup
            element.innerHTML = "";
          }
        };
      } catch (e) {
        console.error("Error rendering React:", e);
        // Fallback to direct DOM manipulation
        element.innerHTML = "<div>Hello Writeback Table!</div>";
        return () => {
          element.innerHTML = "";
        };
      }
    },
  };
}
