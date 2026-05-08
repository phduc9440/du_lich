import React from "react";

interface CustomDeviderProps {
  type?: "horizontal" | "vertical";
  width?: number | string;
  height?: number | string;
  color?: string;
  thickness?: number;
  margin?: string | number;
  children?: React.ReactNode;
}

const CustomDevider: React.FC<CustomDeviderProps> = ({
  type = "horizontal",
  width,
  height,
  color = "#d9d9d9",
  thickness = 1,
  margin = "16px 0",
  children,
}) => {
  if (type === "vertical") {
    return (
      <div
        style={{
          display: "inline-block",
          width: thickness,
          height: height || "100%",
          backgroundColor: color,
          margin,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        width: width || "100%",
        height: thickness,
        backgroundColor: color,
        margin,
      }}
    >
      {children}
    </div>
  );
};

export default CustomDevider;
