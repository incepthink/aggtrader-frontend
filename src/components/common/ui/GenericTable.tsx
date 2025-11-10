// src/componentscommon/ui/GenericTable.tsx
import React from "react";
import GlowBox from "./GlowBox";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface GenericTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  hoverable?: boolean;
  className?: string;
}

const GenericTable = <T,>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available",
  hoverable = true,
  className = "",
}: GenericTableProps<T>) => {
  const getAlignment = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-teal-900/30">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-sm font-medium text-gray-400 ${getAlignment(
                  column.align
                )}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                className={`border-b border-teal-900/20 ${
                  hoverable
                    ? "hover:bg-teal-900/10 transition-colors cursor-pointer"
                    : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm text-gray-200 ${getAlignment(
                      column.align
                    )}`}
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GenericTable;
