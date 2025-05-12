// src/WritebackTableComponent.jsx
import React, { useState, useEffect } from "react";

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
};

const WritebackTableComponent = ({ layout }) => {
  // State for the table data
  const [tableData, setTableData] = useState([]);
  // State for the column headers
  const [headers, setHeaders] = useState([]);

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
          return row.map((cell) => cell.qText);
        });
        setTableData(data);
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
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={tdStyle}>
                    {cell}
                  </td>
                ))}
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
