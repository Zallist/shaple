import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * @param {{
 *  tailwindConfig?: string;
 *  inputCSS?: string;
 *  assetsDir?: string;
 *  publicPath?: string; // for use in HTML (e.g.: "/static/assets/")
 *  buildDir?: string; // build output directory to scan for HTML files
 *  injectInHTML = boolean;
 * }} options
 */
export default function TailwindLegacyPlugin(options = {}) {
  const {
    tailwindConfig = "tailwind.config.legacy.js",
    inputCSS = "input.css",
    assetsDir = "dist/assets",
    publicPath = "/static/assets/",
    buildDir = "dist",
    injectInHTML = true,
  } = options;

  return {
    name: "vite:tailwind-legacy",

    async closeBundle() {
      console.log("⚙️ [Tailwind Legacy] Post-build started...");

      if (!fs.existsSync(tailwindConfig)) {
        console.error(`❌ File ${tailwindConfig} not found`);
        return;
      }

      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
        console.log(`✅ Directory ${assetsDir} created`);
      }

      fs.writeFileSync(
        inputCSS,
        "@tailwind base;\n@tailwind components;\n@tailwind utilities;"
      );
      console.log(`✅ ${inputCSS} created`);

      try {
        execSync(
          `npx tailwindcss@3.4.1 -c ${tailwindConfig} -i ${inputCSS} -o ${path.join(assetsDir, "output.css")} --minify`,
          { stdio: "inherit" }
        );
        console.log("✅ Legacy CSS generated");
      } catch (err) {
        console.error("❌ Error generating legacy CSS", err.message);
        return;
      }

      const browserCheckScript = `
        const MIN_CHROME = 111;
        const MIN_SAFARI = 16.4;
        const MIN_FIREFOX = 128;

        function isLegacyBrowser() {
          const ua = navigator.userAgent;

          const chrome = ua.match(/Chrome\\/([0-9]+)/);
          if (chrome && parseInt(chrome[1]) < MIN_CHROME) return true;

          const safari = ua.match(/Version\\/([0-9.]+).*Safari/);
          if (safari && parseFloat(safari[1]) < MIN_SAFARI) return true;

          const firefox = ua.match(/Firefox\\/([0-9]+)/);
          if (firefox && parseInt(firefox[1]) < MIN_FIREFOX) return true;

          return false;
        }

        function checkBrowser() {
          if (isLegacyBrowser()) {
            document.querySelectorAll('link[rel="stylesheet"][href^="${publicPath}output.css"], style').forEach(el => el.remove());
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '${publicPath}output.css';
            document.head.appendChild(link);
          }
        }

        checkBrowser();
        document.addEventListener('DOMContentLoaded', checkBrowser);
      `.trim();

      const browserCheckPath = path.join(assetsDir, "browser-check.js");
      fs.writeFileSync(browserCheckPath, browserCheckScript);
      console.log("✅ browser-check.js created");
      if (injectInHTML) {
        const buildOutputDir = path.join(process.cwd(), buildDir);
        if (fs.existsSync(buildOutputDir)) {
          injectScript(buildOutputDir, publicPath);
          console.log("✅ browser-check.js injected into HTML files");
        } else {
          console.warn(`⚠️ Build directory ${buildOutputDir} not found. Skipping HTML injection.`);
          console.warn("ℹ️ Make sure the buildDir option points to your build output directory.");
        }
      } else {
        console.log("ℹ️ HTML injection disabled (injectInHTML: false)");
      }
    },
  };
}

function injectScript(dir, publicPath) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      injectScript(fullPath, publicPath);
    } else if (file.endsWith(".html")) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes("browser-check.js")) {
        content = content.replace(
          /<\/body>/i,
          `<script src="${publicPath}browser-check.js"></script>\n</body>`
        );
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`📄 Script injected into: ${fullPath}`);
      }
    }
  }
}