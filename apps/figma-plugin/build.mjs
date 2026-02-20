import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const watch = process.argv.includes("--watch");

fs.mkdirSync("dist", { recursive: true });

// copia ui.html in dist
fs.copyFileSync(path.join("src", "ui.html"), path.join("dist", "ui.html"));

const common = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  platform: "browser",
  format: "iife",
  target: ["es2017"],                 // ✅ compat Figma
  supported: {                        // ✅ forza downlevel
    "optional-chain": false,
    "nullish-coalescing": false
  }
};

if (watch) {
  const ctx = await esbuild.context(common);
  await ctx.watch();
  console.log("Watching...");
} else {
  await esbuild.build(common);
  console.log("Built.");
}
