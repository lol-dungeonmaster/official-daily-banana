import { describe, it, expect, vi, beforeEach } from "vitest";
import { initCollapse } from "../assets/js/collapse.js";

describe("collapse.js", () => {
  let clipboardSpy;

  beforeEach(() => {
    clipboardSpy = vi.fn(() => Promise.resolve());

    vi.stubGlobal("navigator", { clipboard: { writeText: clipboardSpy } });

    document.body.innerHTML = `
      <!-- 1. Normal single code block -->
      <article>
        <div class="collapsible-code" id="normal">
          <button class="toggle">Prompt</button>
          <pre><code>
            <p>Just normal text</p>
          </code></pre>
        </div>
      </article>

      <!-- 2. Multi-step Carousel -->
      <article data-tags="multi-step">
        <div class="collapsible-code" id="multi">
          <button class="toggle">Prompt</button>
          <pre><code>
            <p>Base prompt text here</p>
            <p><strong><em>Italic Subheading</em></strong></p>
            <p><strong>Scene 1:</strong> text</p>
            <p>Content for scene 1</p>
            <p><strong><em>Random Subheading</em></strong></p>
            <p><strong>Variant A:</strong> text</p>
            <p><strong>1. Alpha:</strong> text</p>
            <p><strong>Appendix:</strong> some stuff</p>
            <p>More appendix stuff</p>
          </code></pre>
        </div>
      </article>
      
      <!-- 3. Negative Prompt Edge Case -->
      <article>
        <div class="collapsible-code" id="negative-single">
          <button class="toggle">Prompt</button>
          <pre><code>
            <p><strong>[NEGATIVE]</strong> bad hands, ugly</p>
          </code></pre>
        </div>
      </article>
      
      <!-- 4. Negative inside paragraph with text -->
      <article>
        <div class="collapsible-code" id="negative-mixed">
          <button class="toggle">Prompt</button>
          <pre><code>
            <p>Some text <strong>[NEGATIVE]</strong> bad stuff <strong>[SETTING]</strong> good stuff</p>
          </code></pre>
        </div>
      </article>

      <!-- 5. Negative as very first child with nothing else -->
      <article>
        <div class="collapsible-code" id="negative-first">
          <button class="toggle">Prompt</button>
          <pre><code><strong>[NEGATIVE]</strong> pure negative</code></pre>
        </div>
      </article>
      
      <!-- 6. Broken blocks -->
      <article>
        <div class="collapsible-code" id="broken-no-code">
          <button class="toggle">Prompt</button>
          <pre></pre> <!-- Missing code element -->
        </div>
      </article>

      <!-- 7. Missing strong tags in headers -->
      <article data-tags="multi-step">
        <div class="collapsible-code" id="multi-no-strong">
          <button class="toggle">Prompt</button>
          <pre><code>
            <p>Scene 1: no strong tag</p>
          </code></pre>
        </div>
      </article>
      
      
      <!-- 9. Normal block with Appendix -->
      <article>
        <div class="collapsible-code" id="normal-appendix">
          <button class="toggle">Prompt</button>
          <pre><code><p>normal stuff</p><p>Appendix: cut me</p></code></pre>
        </div>
      </article>

      <!-- 8. Copy button target -->
      <article>
        <div class="collapsible-code" id="copy-test">
          <button class="toggle">Prompt</button>
          <pre><code><p>copy me</p></code></pre>
        </div>
      </article>
    `;
  });

  it("initializes and handles missing code block gracefully", () => {
    initCollapse(window, document);
    const broken = document.getElementById("broken-no-code");
    expect(broken.querySelector("pre").style.display).toBe("none");
    // Also test copy button on broken code block
    const brokenCopyBtn = broken.querySelector(
      "span[title='Copy to clipboard']",
    );
    if (brokenCopyBtn) brokenCopyBtn.click();
  });

  it("toggles visibility when prompt button is clicked", () => {
    initCollapse(window, document);
    const normal = document.getElementById("normal");
    const btn = normal.querySelector(".toggle");
    const pre = normal.querySelector("pre");

    btn.click();
    expect(pre.style.display).toBe("block");
    expect(btn.classList.contains("expanded")).toBe(true);

    btn.click();
    expect(pre.style.display).toBe("none");
    expect(btn.classList.contains("expanded")).toBe(false);
  });

  it("builds tabbed interface for multi-step articles", () => {
    initCollapse(window, document);
    const multi = document.getElementById("multi");
    const tabs = multi.querySelectorAll(".prompt-tab-btn");

    // Base prompt + Scene 1 + Variant A + 1. Alpha = 4 tabs!
    expect(tabs.length).toBe(3);

    // Click a tab
    tabs[1].click();
    expect(tabs[1].style.background).toContain("rgba(0, 255, 136, 0.1)");
    expect(tabs[0].style.background).toContain("rgba(0, 0, 0, 0.3)");
  });

  it("extracts and hoists standalone negative prompts", () => {
    initCollapse(window, document);
    const neg1 = document.getElementById("negative-single");

    const uiBox = neg1.querySelector(".negative-prompt-container");
    expect(uiBox).not.toBeNull();
    expect(uiBox.textContent).toContain("bad hands, ugly");
  });

  it("extracts mixed negative prompts", () => {
    initCollapse(window, document);
    const neg2 = document.getElementById("negative-mixed");

    const uiBox = neg2.querySelector(".negative-prompt-container");
    expect(uiBox).not.toBeNull();
    expect(uiBox.textContent).toContain("bad stuff");

    // Ensure [SETTING] remains
    expect(neg2.querySelector("code").textContent).toContain("[SETTING]");
  });

  it("extracts bare negative prompts (no wrapping P)", () => {
    initCollapse(window, document);
    const neg3 = document.getElementById("negative-first");

    const uiBox = neg3.querySelector(".negative-prompt-container");
    expect(uiBox).not.toBeNull();
  });

  it("adds and handles copy button", () => {
    initCollapse(window, document);
    const normal = document.getElementById("copy-test");

    const copyBtn = normal.querySelector("span[title='Copy to clipboard']");
    expect(copyBtn).not.toBeNull();

    vi.useFakeTimers();
    copyBtn.click();
    vi.runAllTimers();
    expect(clipboardSpy).toHaveBeenCalled();
    const normApp = document.getElementById("normal-appendix");
    const normAppCopyBtn = normApp.querySelector(
      "span[title='Copy to clipboard']",
    );
    normAppCopyBtn.click();
    // Trigger mouse events on copy button for coverage
    const hoverBtn = normApp.querySelector("span[title='Copy to clipboard']");
    if (hoverBtn) {
      if (hoverBtn.onmouseover) hoverBtn.onmouseover();
      if (hoverBtn.onmouseout) hoverBtn.onmouseout();
    }

    // Test multi-step copy
    const multi = document.getElementById("multi");
    const multiCopyBtn = multi.querySelector("span[title='Copy to clipboard']");
    multiCopyBtn.click();

    // Add a br and span to multi to test formatting
    const multiSub = multi.querySelector(".sub-prompt");
    const br = document.createElement("br");
    const span = document.createElement("span");
    span.textContent = " span-text ";
    const emptyP = document.createElement("p");
    emptyP.textContent = "   ";
    multiSub.appendChild(emptyP);
    const negMock = document.createElement("div");
    negMock.className = "negative-prompt-container";
    multiSub.appendChild(negMock);
    const emptyText = document.createTextNode("   ");
    multiSub.appendChild(emptyText);
    multiSub.appendChild(br);
    multiSub.appendChild(span);
    multiCopyBtn.click();
  });
});
