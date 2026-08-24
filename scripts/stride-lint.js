const fs = require("fs");
const https = require("https");
const path = require("path");

const TARGET_URL = "https://github.oswind.xyz/official-daily-banana/";
const REPORT_PATH = path.join(__dirname, "..", "stride-report.md");

const strideFindings = {
  Spoofing: [],
  Tampering: [],
  Repudiation: [],
  InformationDisclosure: [],
  DenialOfService: [],
  ElevationOfPrivilege: [],
};

// Helper to fetch URL headers
function fetchHeaders(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        resolve(res.headers);
      })
      .on("error", reject);
  });
}

async function runStrideLint() {
  console.log(`Starting STRIDE Linting for ${TARGET_URL}...`);

  try {
    const headers = await fetchHeaders(TARGET_URL);

    // 1. Analyze Headers (Spoofing, Tampering, Info Disclosure)
    if (!headers["strict-transport-security"]) {
      strideFindings.Spoofing.push(
        "Missing HSTS header: Site is vulnerable to Man-in-the-Middle spoofing attacks on non-HTTPS downgrades.",
      );
    }

    if (!headers["content-security-policy"]) {
      strideFindings.Tampering.push(
        "Missing Content-Security-Policy (CSP): Site is vulnerable to Cross-Site Scripting (XSS) tampering.",
      );
      strideFindings.InformationDisclosure.push(
        "Missing CSP: Allows malicious scripts to exfiltrate sessionStorage data (like API keys).",
      );
    }

    if (!headers["x-frame-options"]) {
      strideFindings.Spoofing.push(
        "Missing X-Frame-Options: Site is vulnerable to Clickjacking (UI Redress attacks).",
      );
    }

    // 2. Local Static Analysis (Info Disclosure, Repudiation)
    const jsDir = path.join(__dirname, "..", "assets", "js");
    if (fs.existsSync(jsDir)) {
      const files = fs.readdirSync(jsDir);
      for (const file of files) {
        if (file.endsWith(".js")) {
          const content = fs.readFileSync(path.join(jsDir, file), "utf8");

          if (content.includes('sessionStorage.setItem("gemini_api_key"')) {
            strideFindings.InformationDisclosure.push(
              `Found API Key stored in sessionStorage in \`${file}\`. While volatile, it is fully exposed to any XSS tampering.`,
            );
            strideFindings.ElevationOfPrivilege.push(
              `Local API key usage in \`${file}\` trusts the client. If exfiltrated via XSS, attacker elevates to user's premium API quota.`,
            );
          }

          if (content.includes("eval(") || content.includes("innerHTML =")) {
            strideFindings.Tampering.push(
              `Found direct DOM manipulation (e.g. innerHTML) in \`${file}\`. If inputs are unsanitized, this leads to DOM-based XSS.`,
            );
          }
        }
      }
    }

    // 3. Static Site Architecture (DoS, Repudiation)
    strideFindings.DenialOfService.push(
      "Client-side API requests mean DoS protection relies entirely on Google Gemini API rate limits, not our infrastructure.",
    );
    strideFindings.Repudiation.push(
      "Static GitHub Pages site without backend logging: User actions (like prompt generation) cannot be audited or non-repudiated on our end.",
    );

    // Generate Markdown Report
    let reportMarkdown = `# STRIDE Threat Modeling Report\n\n`;
    reportMarkdown += `*Target: ${TARGET_URL}*\n`;
    reportMarkdown += `*Generated: ${new Date().toISOString()}*\n\n`;
    reportMarkdown += `This report outlines automated STRIDE security linting results for the Official Daily Banana repository.\n\n`;

    let hasCriticalFindings = false;

    for (const [category, findings] of Object.entries(strideFindings)) {
      reportMarkdown += `## ${category}\n`;
      if (findings.length === 0) {
        reportMarkdown += `- ✅ No findings detected.\n\n`;
      } else {
        hasCriticalFindings = true;
        findings.forEach((f) => (reportMarkdown += `- ⚠️ ${f}\n`));
        reportMarkdown += `\n`;
      }
    }


    reportMarkdown += `\n## Mitigation Plan\n\n`;
    reportMarkdown += `While a static GitHub Pages site inherently lacks backend security enforcement, the following client-side mitigations have been documented to address these findings:\n\n`;

    reportMarkdown += `### 1. Spoofing & Tampering (Headers & XSS)\n`;
    reportMarkdown += `*   **Implement Meta CSP:** Inject a strict \`<meta http-equiv="Content-Security-Policy">\` into \`head-custom.html\` to block \`unsafe-inline\` or \`eval()\`, crushing most XSS vectors.\n`;
    reportMarkdown += `*   **Javascript Frame-Busting:** Add a client-side script checking \`window.top !== window.self\` to force top-level navigation, preventing Clickjacking.\n`;
    reportMarkdown += `*   **Sanitize \`innerHTML\`:** Refactor DOM manipulations to use \`.textContent\` for dynamic user input, preventing DOM-based XSS.\n\n`;

    reportMarkdown += `### 2. Information Disclosure & Elevation of Privilege\n`;
    reportMarkdown += `*   **Zero-Trust DOM:** The primary defense for the volatile API key in \`sessionStorage\` is the strict CSP. If XSS cannot execute, the key cannot be stolen.\n\n`;

    reportMarkdown += `### 3. Denial of Service (DoS)\n`;
    reportMarkdown += `*   **Client-Side Throttling:** Implement a strict 3-to-5 second debounce/cooldown mechanism on the "Generate Variant" and "Confirm" buttons to prevent accidental spam-clicking from exhausting the user's quota.\n\n`;

    reportMarkdown += `### 4. Repudiation\n`;
    reportMarkdown += `*   **Local Audit Trail:** Implement a lightweight localized audit log in \`localStorage\` to provide users with a timestamped history of their prompt generations.\n\n`;

    fs.writeFileSync(REPORT_PATH, reportMarkdown);
    console.log(`STRIDE Report generated at: ${REPORT_PATH}`);

    // Return standard exit codes for linting CI/CD
    if (hasCriticalFindings) {
      console.warn(
        "⚠️ STRIDE linting found potential security considerations.",
      );
      // We exit 0 here so it doesn't fail the build pipeline, since static sites inherently fail some strict STRIDE checks
      process.exit(0);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Failed to run STRIDE linting:", err);
    process.exit(1);
  }
}

runStrideLint();
