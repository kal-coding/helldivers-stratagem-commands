// esbuild.config.js
const esbuild = require("esbuild");
const fs = require("fs");

// Create dist/media directory if it doesn't exist
if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist");
}
if (!fs.existsSync("dist/media")) {
  fs.mkdirSync("dist/media");
}

esbuild.build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  platform: "node",
  format: "cjs",
  sourcemap: true,
  target: ["node16"],   // Node target
}).catch(() => process.exit(1));

esbuild.build({
  entryPoints: ["media/script.ts"],
  bundle: true,
  outfile: "dist/media/script.js",
  platform: "browser",  // <— tells esbuild it's browser code
  sourcemap: true,
  target: ["es2020"],   // modern JS
}).catch(() => process.exit(1));

// copy CSS
if (fs.existsSync("media/style.css")) {
  fs.copyFileSync("media/style.css", "dist/media/style.css");
}