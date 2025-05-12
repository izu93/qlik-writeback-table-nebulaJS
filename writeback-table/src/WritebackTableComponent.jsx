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
  // Reference to track if selections are active
  const isSelectionActive = useRef(false);

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

        // Only clear pending selections if we're not in selection mode
        if (!isSelectionActive.current) {
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
  }, [layout]);

  // Monitor selections API state
  useEffect(() => {
    if (selections) {
      // Function to handle when selection mode begins
      const handleActivated = () => {
        console.log("Selection mode activated");
        isSelectionActive.current = true;
      };

      // Function to handle when selection mode ends
      const handleConfirmed = () => {
        console.log("Selections confirmed");
        isSelectionActive.current = false;
        setPendingSelections({});
      };

      const handleCanceled = () => {
        console.log("Selections canceled");
        isSelectionActive.current = false;
        setPendingSelections({});
      };

      // Set up listeners
      selections.on("activated", handleActivated);
      selections.on("deactivated", handleCanceled);
      selections.on("confirmed", handleConfirmed);
      selections.on("canceled", handleCanceled);

      // Cleanup listeners on unmount
      return () => {
        selections.off("activated", handleActivated);
        selections.off("deactivated", handleCanceled);
        selections.off("confirmed", handleConfirmed);
        selections.off("canceled", handleCanceled);
      };
    }
  }, [selections]);

  // Handle cell click for selections
  const handleCellClick = (rowIndex, colIndex, qElemNumber) => {
    // Only make selections on dimensions (not measures) and if the element is selectable
    if (
      colIndex < (layout?.qHyperCube?.qDimensionInfo?.length || 0) &&
      qElemNumber !== -1
    ) {
      console.log(`Selecting dimension ${colIndex}, element ${qElemNumber}`);

      // Update pending selections immediately for visual feedback
      const cellKey = `${rowIndex}-${colIndex}`;

      // Set the selection active flag
      isSelectionActive.current = true;

      // Update UI immediately
      setPendingSelections((prev) => {
        // Toggle pending selection
        if (prev[cellKey]) {
          const newPending = { ...prev };
          delete newPending[cellKey];
          return newPending;
        } else {
          return {
            ...prev,
            [cellKey]: true,
          };
        }
      });

      try {
        // Check if selections object is available
        if (selections) {
          // Use simple selection method for dimension values
          selections.select({
            method: "selectHyperCubeValues",
            params: ["/qHyperCubeDef", colIndex, [qElemNumber], false],
          });
        }
      } catch (error) {
        console.error("Error making selection:", error);
        // Clear pending selection if there was an error
        setPendingSelections((prev) => {
          const newPending = { ...prev };
          delete newPending[cellKey];
          return newPending;
        });
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
                    (isSelectionActive.current && cell.qState === "X");

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
