// src/index.js
import React from "react";
import * as ReactDOM from "react-dom";
import { useElement, useLayout, useSelections } from "@nebula.js/stardust";
import properties from "./object-properties";
import data from "./data";
import ext from "./ext";

// Import our WritebackTableComponent
import WritebackTableComponent from "./WritebackTableComponent";

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
      const layout = useLayout();
      const selections = useSelections();

      try {
        // Use the classic render method WITHOUT JSX
        ReactDOM.render(
          React.createElement(WritebackTableComponent, {
            layout,
            selections,
          }),
          element
        );

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
        element.innerHTML = "<div>Error rendering Writeback Table!</div>";
        return () => {
          element.innerHTML = "";
        };
      }
    },
  };
}
