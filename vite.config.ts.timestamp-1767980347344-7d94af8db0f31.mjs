// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Jeeva%20surya/Documents/Clarity-OCR-New/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Jeeva%20surya/Documents/Clarity-OCR-New/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Jeeva%20surya/Documents/Clarity-OCR-New/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Jeeva surya\\Documents\\Clarity-OCR-New";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      // ⬇️ NEW: Fixes Google Auth Popup & COOP Errors
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Embedder-Policy": "unsafe-none"
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        // ⬇️ Essential for PDF.js worker loading in Phase 2
        "pdfjs-dist": path.resolve(__vite_injected_original_dirname, "node_modules/pdfjs-dist")
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
    },
    define: {
      // ⬇️ Allows accessing app version in code
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify((/* @__PURE__ */ new Date()).toISOString())
    },
    optimizeDeps: {
      // ⬇️ Pre-bundles PDF.js to prevent "require is not defined" errors
      // include: ["pdfjs-dist"], 
      exclude: ["pdfjs-dist", "lucide-react"]
      // Exclude icons from optimization to allow tree-shaking
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          // ⬇️ Separates PDF logic into its own chunk for performance
          manualChunks: {
            pdfjs: ["pdfjs-dist"],
            vendor: ["react", "react-dom", "react-router-dom", "firebase/app"]
          }
        }
      },
      // ⬇️ Increases chunk size warning limit (PDF workers are large)
      chunkSizeWarningLimit: 1600
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKZWV2YSBzdXJ5YVxcXFxEb2N1bWVudHNcXFxcQ2xhcml0eS1PQ1ItTmV3XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKZWV2YSBzdXJ5YVxcXFxEb2N1bWVudHNcXFxcQ2xhcml0eS1PQ1ItTmV3XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9KZWV2YSUyMHN1cnlhL0RvY3VtZW50cy9DbGFyaXR5LU9DUi1OZXcvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIGhvc3Q6IFwiOjpcIixcclxuICAgICAgcG9ydDogODA4MCxcclxuICAgICAgLy8gXHUyQjA3XHVGRTBGIE5FVzogRml4ZXMgR29vZ2xlIEF1dGggUG9wdXAgJiBDT09QIEVycm9yc1xyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeVwiOiBcInNhbWUtb3JpZ2luLWFsbG93LXBvcHVwc1wiLFxyXG4gICAgICAgIFwiQ3Jvc3MtT3JpZ2luLUVtYmVkZGVyLVBvbGljeVwiOiBcInVuc2FmZS1ub25lXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgICAvLyBcdTJCMDdcdUZFMEYgRXNzZW50aWFsIGZvciBQREYuanMgd29ya2VyIGxvYWRpbmcgaW4gUGhhc2UgMlxyXG4gICAgICAgIFwicGRmanMtZGlzdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIm5vZGVfbW9kdWxlcy9wZGZqcy1kaXN0XCIpLFxyXG4gICAgICB9LFxyXG4gICAgICBleHRlbnNpb25zOiBbXCIudHNcIiwgXCIudHN4XCIsIFwiLmpzXCIsIFwiLmpzeFwiLCBcIi5qc29uXCJdLFxyXG4gICAgfSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICAvLyBcdTJCMDdcdUZFMEYgQWxsb3dzIGFjY2Vzc2luZyBhcHAgdmVyc2lvbiBpbiBjb2RlXHJcbiAgICAgIF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXHJcbiAgICAgIF9fQlVJTERfVElNRV9fOiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpLFxyXG4gICAgfSxcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICAvLyBcdTJCMDdcdUZFMEYgUHJlLWJ1bmRsZXMgUERGLmpzIHRvIHByZXZlbnQgXCJyZXF1aXJlIGlzIG5vdCBkZWZpbmVkXCIgZXJyb3JzXHJcbiAgICAgIC8vIGluY2x1ZGU6IFtcInBkZmpzLWRpc3RcIl0sIFxyXG4gICAgICBleGNsdWRlOiBbXCJwZGZqcy1kaXN0XCIsIFwibHVjaWRlLXJlYWN0XCJdLCAvLyBFeGNsdWRlIGljb25zIGZyb20gb3B0aW1pemF0aW9uIHRvIGFsbG93IHRyZWUtc2hha2luZ1xyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogXCJkaXN0XCIsXHJcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgLy8gXHUyQjA3XHVGRTBGIFNlcGFyYXRlcyBQREYgbG9naWMgaW50byBpdHMgb3duIGNodW5rIGZvciBwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgIHBkZmpzOiBbXCJwZGZqcy1kaXN0XCJdLFxyXG4gICAgICAgICAgICB2ZW5kb3I6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiLCBcImZpcmViYXNlL2FwcFwiXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgLy8gXHUyQjA3XHVGRTBGIEluY3JlYXNlcyBjaHVuayBzaXplIHdhcm5pbmcgbGltaXQgKFBERiB3b3JrZXJzIGFyZSBsYXJnZSlcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNjAwLFxyXG4gICAgfSxcclxuICB9O1xyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXdVLFNBQVMsY0FBYyxlQUFlO0FBQzlXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQTtBQUFBLE1BRU4sU0FBUztBQUFBLFFBQ1AsOEJBQThCO0FBQUEsUUFDOUIsZ0NBQWdDO0FBQUEsTUFDbEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUM1QyxFQUFFLE9BQU8sT0FBTztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQTtBQUFBLFFBRXBDLGNBQWMsS0FBSyxRQUFRLGtDQUFXLHlCQUF5QjtBQUFBLE1BQ2pFO0FBQUEsTUFDQSxZQUFZLENBQUMsT0FBTyxRQUFRLE9BQU8sUUFBUSxPQUFPO0FBQUEsSUFDcEQ7QUFBQSxJQUNBLFFBQVE7QUFBQTtBQUFBLE1BRU4saUJBQWlCLEtBQUssVUFBVSxRQUFRLElBQUksbUJBQW1CO0FBQUEsTUFDL0QsZ0JBQWdCLEtBQUssV0FBVSxvQkFBSSxLQUFLLEdBQUUsWUFBWSxDQUFDO0FBQUEsSUFDekQ7QUFBQSxJQUNBLGNBQWM7QUFBQTtBQUFBO0FBQUEsTUFHWixTQUFTLENBQUMsY0FBYyxjQUFjO0FBQUE7QUFBQSxJQUN4QztBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBO0FBQUEsVUFFTixjQUFjO0FBQUEsWUFDWixPQUFPLENBQUMsWUFBWTtBQUFBLFlBQ3BCLFFBQVEsQ0FBQyxTQUFTLGFBQWEsb0JBQW9CLGNBQWM7QUFBQSxVQUNuRTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
