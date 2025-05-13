// src/WritebackTableComponent.jsx
import React, { useState, useEffect, useRef } from "react";

// Basic inline styles for the table
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
  fontFamily: "QlikView Sans, sans-serif",
};

const thStyle = {
  backgroundColor: "#f2f2f2",
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  cursor: "pointer",
};

const selectedStyle = {
  ...tdStyle,
  backgroundColor: "#a6d8a8", // Light green background for selected cells
  fontWeight: "bold",
};

const pendingSelectionStyle = {
  ...tdStyle,
  backgroundColor: "#d8e4bc", // Light yellow-green for pending selections
  fontWeight: "bold",
};

const WritebackTableComponent = ({ layout, selections }) => {
  // State for the table data
  const [tableData, setTableData] = useState([]);
  // State for the column headers
  const [headers, setHeaders] = useState([]);
  // State to track selected cells (confirmed)
  const [selectedCells, setSelectedCells] = useState({});
  // State to track cells that have been clicked but not yet confirmed
  const [pendingSelections, setPendingSelections] = useState({});
  // Track the current dimension being selected
  const [currentDimension, setCurrentDimension] = useState(null);
  // Values currently selected (before confirmation)
  const [currentValues, setCurrentValues] = useState([]);

  // Extract data from the hypercube when the layout changes
  useEffect(() => {
    if (layout && layout.qHyperCube) {
      console.log("HyperCube detected:", layout.qHyperCube);

      // Extract the column headers
      const headers = layout.qHyperCube.qDimensionInfo
        .map((dim) => dim.qFallbackTitle)
        .concat(
          layout.qHyperCube.qMeasureInfo.map(
            (measure) => measure.qFallbackTitle
          )
        );
      setHeaders(headers);

      // Extract the data rows if data pages exist
      if (
        layout.qHyperCube.qDataPages &&
        layout.qHyperCube.qDataPages.length > 0
      ) {
        const data = layout.qHyperCube.qDataPages[0].qMatrix.map((row) => {
          return row.map((cell) => ({
            value: cell.qText,
            qElemNumber: cell.qElemNumber,
            qState: cell.qState,
          }));
        });
        setTableData(data);

        // Update selected state based on qState
        const newSelectedCells = {};
        data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell.qState === "S") {
              newSelectedCells[`${rowIndex}-${colIndex}`] = true;
            }
          });
        });
        setSelectedCells(newSelectedCells);

        // Only clear pending if not in active selection mode
        if (!selections?.isActive()) {
          setPendingSelections({});
        }
      } else {
        console.log("No data pages found in hypercube");
        setTableData([]);
      }
    } else {
      console.log("No hypercube found in layout");
      setHeaders([]);
      setTableData([]);
    }
  }, [layout, selections]);

  // Monitor selections API state
  useEffect(() => {
    if (selections) {
      const onDeactivated = () => {
        console.log("Selection mode deactivated");
        setPendingSelections({});
        setCurrentDimension(null);
        setCurrentValues([]);
      };

      const onCanceled = () => {
        console.log("Selections canceled");
        setPendingSelections({});
        setCurrentDimension(null);
        setCurrentValues([]);
      };

      const onConfirmed = () => {
        console.log("Selections confirmed");
        setPendingSelections({});
        setCurrentDimension(null);
        setCurrentValues([]);
      };

      // Set up listeners
      selections.on("deactivated", onDeactivated);
      selections.on("canceled", onCanceled);
      selections.on("confirmed", onConfirmed);

      // Cleanup on unmount
      return () => {
        selections.off("deactivated", onDeactivated);
        selections.off("canceled", onCanceled);
        selections.off("confirmed", onConfirmed);
      };
    }
  }, [selections]);

  // Handle cell click for selections
  const handleCellClick = (rowIndex, colIndex, qElemNumber) => {
    // Only make selections on dimensions (not measures) and if element is selectable
    if (
      colIndex < (layout?.qHyperCube?.qDimensionInfo?.length || 0) &&
      qElemNumber !== -1
    ) {
      console.log(`Clicking dimension ${colIndex}, element ${qElemNumber}`);

      // If we're starting a new selection or changing dimensions
      if (currentDimension === null || currentDimension !== colIndex) {
        if (selections && !selections.isActive()) {
          // Begin a new selection
          console.log(`Beginning selection on dimension ${colIndex}`);
          selections.begin(
            ["/qHyperCubeDef/qDimensionInfo/", colIndex].join("")
          );

          // Set the current dimension
          setCurrentDimension(colIndex);

          // Initialize with this value
          setCurrentValues([qElemNumber]);

          // Clear any previous pending selections
          setPendingSelections({});

          // Add this cell to pending selections
          setPendingSelections({ [`${rowIndex}-${colIndex}`]: true });

          // Make the actual selection
          selections.select({
            method: "selectHyperCubeValues",
            params: ["/qHyperCubeDef", colIndex, [qElemNumber], false],
          });
        }
      } else if (currentDimension === colIndex) {
        // We're adding/removing from existing selection on same dimension
        console.log(
          `Adding/removing value ${qElemNumber} on dimension ${colIndex}`
        );

        // Toggle this value
        let newValues = [...currentValues];
        const idx = newValues.indexOf(qElemNumber);

        if (idx === -1) {
          // Add the value
          newValues.push(qElemNumber);
        } else {
          // Remove the value
          newValues.splice(idx, 1);
        }

        // Update current values
        setCurrentValues(newValues);

        // Toggle this cell in pending selections
        setPendingSelections((prev) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          const newPending = { ...prev };

          if (newPending[cellKey]) {
            delete newPending[cellKey];
          } else {
            newPending[cellKey] = true;
          }

          return newPending;
        });

        // Update the selection in Qlik
        if (selections) {
          selections.select({
            method: "selectHyperCubeValues",
            params: ["/qHyperCubeDef", colIndex, newValues, false],
          });
        }
      }
    } else {
      console.log("Cell is not selectable or is a measure");
    }
  };

  // If no headers, display a message
  if (headers.length === 0) {
    return (
      <div>
        <h3>Qlik Writeback Table</h3>
        <p>Please add dimensions and measures to see data.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Qlik Writeback Table</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} style={thStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  // Determine cell styling based on selection state
                  const isSelected =
                    selectedCells[`${rowIndex}-${colIndex}`] ||
                    cell.qState === "S";
                  const isPendingSelection =
                    pendingSelections[`${rowIndex}-${colIndex}`] ||
                    (currentDimension === colIndex &&
                      currentValues.includes(cell.qElemNumber)) ||
                    cell.qState === "X";

                  let cellStyle = tdStyle;
                  if (isSelected) {
                    cellStyle = selectedStyle;
                  } else if (isPendingSelection) {
                    cellStyle = pendingSelectionStyle;
                  }

                  return (
                    <td
                      key={colIndex}
                      style={cellStyle}
                      onClick={() =>
                        handleCellClick(rowIndex, colIndex, cell.qElemNumber)
                      }
                      title={`Element: ${cell.qElemNumber}, State: ${cell.qState}`}
                    >
                      {cell.value}
                    </td>
                  );
                })}
              </tr>
            ))}
            {tableData.length === 0 && (
              <tr>
                <td colSpan={headers.length} style={tdStyle}>
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WritebackTableComponent;
