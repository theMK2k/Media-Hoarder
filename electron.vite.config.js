import { defineConfig } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import electronRenderer from "vite-plugin-electron-renderer";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      commonjsOptions: {
        // Transform CommonJS modules to ES modules
        transformMixedEsModules: true,
      },
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.js"),
        },
        // Only externalize actual npm packages, not local source files
        external: [
          "electron",
          "@electron/remote",
          "@electron/remote/main",
          "@ghostery/adblocker-electron",
          "better-sqlite3",
          "lodash",
          "fs-extra",
          "jsonfile",
          "mkdirp",
          "requestretry",
          "filenamify",
          "string-hash-64",
        ],
      },
    },
    resolve: {
      alias: {
        // Allow main process to import from src/ directory
        "@": resolve(__dirname, "src"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.js"),
        },
        external: ["electron"],
      },
    },
  },
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    build: {
      outDir: resolve(__dirname, "dist/renderer"),
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
        // Externalize native modules and their dependencies
        external: [
          "sqlite3",
          "better-sqlite3",
          "@mapbox/node-pre-gyp",
          "mock-aws-s3",
          "aws-sdk",
          "nock",
          // requestretry and its problematic dependencies
          "requestretry",
          "request",
          "http-signature",
          "assert-plus",
          // Other CommonJS modules that don't work with Vite
          "xml2js",
          "fs-extra",
          "graceful-fs",
        ],
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src/renderer"),
        "@helpers": resolve(__dirname, "src/helpers"),
      },
    },
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
      }),
      // Enable Node.js integration in renderer (for Electron apps with nodeIntegration: true)
      electronRenderer({
        nodeIntegration: true,
        // Handle native modules and problematic CommonJS packages
        resolve: {
          sqlite3: { type: "cjs" },
          "better-sqlite3": { type: "cjs" },
          requestretry: { type: "cjs" },
          request: { type: "cjs" },
        },
      }),
    ],
    // Copy static files from public directory
    publicDir: resolve(__dirname, "public"),
    // Exclude native modules from dependency optimization
    optimizeDeps: {
      exclude: [
        "sqlite3",
        "better-sqlite3",
        "@mapbox/node-pre-gyp",
        "requestretry",
        "request",
        "xml2js",
        "fs-extra",
        "graceful-fs",
      ],
    },
  },
});
