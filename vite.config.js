import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function forwardPublicHost(proxy) {
  proxy.on("proxyReq", (proxyRequest, request) => {
    proxyRequest.setHeader("x-forwarded-host", request.headers.host);
    proxyRequest.setHeader(
      "x-forwarded-proto",
      request.headers["x-forwarded-proto"] ?? "http",
    );
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        configure: forwardPublicHost,
      },
      "/sitemap.xml": {
        target: "http://localhost:3001",
        configure: forwardPublicHost,
      },
      "/robots.txt": {
        target: "http://localhost:3001",
        configure: forwardPublicHost,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
});
