import { ImageResponse } from "next/og";

// 🔧 Standard favicon layout square specifications
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#24211e", // Site background color
          borderRadius: "50%",        // Forces a clean circular edge boundary crop
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            display: "flex",
            // Injecting the raw asset direct as a dynamic background-image fill
            backgroundImage: "url(http://localhost:3000/opengraph-image.png)",
            backgroundPosition: "center",
            backgroundSize: "130% 130%", // Perfectly trims off margins to emphasize your cute bee
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}