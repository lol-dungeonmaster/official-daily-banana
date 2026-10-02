import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { initAiStudio } from "../assets/js/ai-studio.js";

const flushPromises = () => new Promise(setImmediate);

describe("ai-studio.js", () => {
  let dom, win, doc, instance;
  let fetchMock;

  beforeEach(() => {
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html><body>
        <div id="indicator-basic"></div><div id="indicator-image"></div><div id="indicator-delay"></div>
        <button id="gemini-key-btn"></button><div id="gemini-popover"></div><input id="gemini-key-input" />
        <button id="gemini-key-confirm"></button><button id="gemini-key-cancel"></button><button id="gemini-key-eye"></button>
        <div class="gemini-icon"></div>
        <button id="ledger-btn"></button><div id="ledger-popover"></div>
        <div class="ledger-tab active" data-tab="info"></div><div class="ledger-tab" data-tab="warn"></div><div class="ledger-tab" data-tab="error"></div><div class="ledger-tab" data-tab="all"></div>
        <div id="ledger-content"></div><div id="ledger-badge"></div><button id="ledger-clear-btn"></button>
        
        <article data-tags="multi-step">
            <div class="collapsible-code">
                <pre style="display:block">
                    <code data-active-tab="1" data-prefix="$">
                        <div class="sub-prompt" data-index="0">Base</div>
                        <div class="sub-prompt" data-index="1">[EVENT MODIFIERS] step2</div>
                        <div class="negative-prompt-container"><strong>Neg</strong></div>
                    </code><span class="token-estimator">10</span>
                </pre><button class="reveal-btn">Reveal</button>
            </div>
        </article>
        <article>
            <div class="collapsible-code">
                <pre style="display:block"><code>non multi-step prompt</code></pre><button class="reveal-btn">Reveal</button>
            </div>
        </article>
      </body></html>
    `,
      { runScripts: "dangerously", url: "http://localhost" },
    );
    win = dom.window;
    doc = win.document;

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    win.fetch = fetchMock;

    let store = {};
    Object.defineProperty(win, "sessionStorage", {
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      },
      writable: true,
      configurable: true,
    });

    win._timeouts = [];
    win.setTimeout = vi.fn((cb, ms) => {
      win._timeouts.push(cb);
      return win._timeouts.length;
    });
    win.clearTimeout = vi.fn();
    win.runTimeouts = () => {
      win._timeouts.forEach((cb) => cb && cb());
      win._timeouts = [];
    };
    win.requestAnimationFrame = vi.fn((cb) => cb());

    Object.defineProperty(win.HTMLElement.prototype, "getBoundingClientRect", {
      value: () => ({ top: 10, bottom: 20, left: 0, right: 100 }),
      writable: true,
    });
    Object.defineProperty(win, "innerHeight", { value: 1000 });

    // Custom Event support for document
    Object.defineProperty(win, "CustomEvent", {
      value: class CustomEvent extends win.Event {
        constructor(type, eventInitDict) {
          super(type, eventInitDict);
          this.detail = eventInitDict?.detail;
        }
      },
    });

    Object.assign(global.navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize without errors", () => {
    expect(() => initAiStudio(win, doc)).not.toThrow();
  });

  describe("API Key Management", () => {
    it("should open popover when key button is clicked", () => {
      initAiStudio(win, doc);
      const btn = doc.getElementById("gemini-key-btn");
      const popover = doc.getElementById("gemini-popover");

      btn.click();
      expect(popover.classList.contains("show")).toBe(true);
    });

    it("should toggle popover visibility correctly", () => {
      initAiStudio(win, doc);
      const popover = doc.getElementById("gemini-popover");
      const cancel = doc.getElementById("gemini-key-cancel");

      popover.classList.add("show");
      cancel.click();
      expect(popover.classList.contains("show")).toBe(false);
    });

    it("should close popover on closeAllPopovers event", () => {
      initAiStudio(win, doc);
      const popover = doc.getElementById("gemini-popover");
      popover.classList.add("show");
      doc.dispatchEvent(new win.CustomEvent("closeAllPopovers"));
      expect(popover.classList.contains("show")).toBe(false);
    });

    it("should validate and store a correct API key", async () => {
      initAiStudio(win, doc);
      const input = doc.getElementById("gemini-key-input");
      const confirmBtn = doc.getElementById("gemini-key-confirm");
      const icon = doc.querySelector(".gemini-icon");

      input.value = "VALID_KEY_123456";
      input.dispatchEvent(new win.Event("input"));

      // Setup successful validation fetch
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Models
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      }); // Billing (mock active billing via 400 on empty payload)

      confirmBtn.click();
      await flushPromises(); // Await fetch
      win.runTimeouts(); // Min delay
      await flushPromises();

      expect(win.sessionStorage.getItem("gemini_api_key")).toBe(
        "VALID_KEY_123456",
      );
      expect(win.sessionStorage.getItem("has_billing")).toBe("true");
      expect(icon.classList.contains("activated")).toBe(true);

      // Verify injectGenerateUI was called on active pre blocks
      const genContainer = doc.querySelector(".generate-ui-container");
      expect(genContainer).not.toBeNull();
    });

    it("should reject an invalid API key", async () => {
      initAiStudio(win, doc);
      const input = doc.getElementById("gemini-key-input");
      const confirmBtn = doc.getElementById("gemini-key-confirm");

      input.value = "INVALID_KEY";
      input.dispatchEvent(new win.Event("input"));

      // Mock failure
      fetchMock.mockResolvedValueOnce({ ok: false });

      confirmBtn.click();
      await flushPromises();
      win.runTimeouts();
      await flushPromises();

      expect(win.sessionStorage.getItem("gemini_api_key")).toBeNull();
    });

    it("should clear API key on explicit empty confirm", async () => {
      win.sessionStorage.setItem("gemini_api_key", "EXISTING_KEY");
      initAiStudio(win, doc);
      const input = doc.getElementById("gemini-key-input");
      const confirmBtn = doc.getElementById("gemini-key-confirm");

      // Force empty key by overriding disable
      input.value = "";
      input.dispatchEvent(new win.Event("input"));
      confirmBtn.disabled = false;
      confirmBtn.click();

      await flushPromises();
      win.runTimeouts();

      expect(win.sessionStorage.getItem("gemini_api_key")).toBeNull();
    });

    it("should obfuscate key on eye button click", () => {
      initAiStudio(win, doc);
      const input = doc.getElementById("gemini-key-input");
      const eyeBtn = doc.getElementById("gemini-key-eye");

      input.dataset.realKey = "SUPER_SECRET_LONG_API_KEY_1234";
      input.value = "SUPER_SECRET_LONG_API_KEY_1234";

      eyeBtn.click();
      expect(input.value).toContain("▪");

      eyeBtn.click();
      expect(input.value).toBe("SUPER_SECRET_LONG_API_KEY_1234");
    });

    it("should allow editing key on double click", () => {
      win.sessionStorage.setItem("gemini_api_key", "EXISTING_KEY");
      initAiStudio(win, doc);
      const btn = doc.getElementById("gemini-key-btn");
      const input = doc.getElementById("gemini-key-input");

      btn.click();
      expect(input.readOnly).toBe(true);

      input.dispatchEvent(new win.Event("dblclick"));

      expect(input.readOnly).toBe(false);
      expect(input.value).toBe("");
    });
  });

  describe("Ledger System", () => {
    it("should log info and open popover correctly", () => {
      initAiStudio(win, doc);
      const btn = doc.getElementById("ledger-btn");
      const popover = doc.getElementById("ledger-popover");

      btn.click();
      expect(popover.classList.contains("show")).toBe(true);
    });

    it("should render logs into ledger content", () => {
      const logs = [
        {
          timestamp: new Date().toISOString(),
          type: "info",
          message: "Test Log 1",
        },
        {
          timestamp: new Date().toISOString(),
          type: "error",
          message: "Test Log 2",
        },
      ];
      win.sessionStorage.setItem("odb_audit_log", JSON.stringify(logs));

      initAiStudio(win, doc);
      const btn = doc.getElementById("ledger-btn");
      btn.click();

      const content = doc.getElementById("ledger-content");
      expect(content.textContent).toContain("Test Log 1");

      // Switch tab
      const errTab = doc.querySelector('.ledger-tab[data-tab="error"]');
      errTab.click();
      expect(content.textContent).toContain("Test Log 2");
      expect(content.textContent).not.toContain("Test Log 1");
    });

    it("should redact API keys in audit logs", async () => {
      initAiStudio(win, doc);
      const input = doc.getElementById("gemini-key-input");
      const confirmBtn = doc.getElementById("gemini-key-confirm");

      input.value = "AIzaSy_MY_SECRET_KEY";
      input.dispatchEvent(new win.Event("input"));

      // Make it fail so it logs "Not Authorized" and potentially the key
      fetchMock.mockResolvedValueOnce({ ok: false });
      confirmBtn.click();
      await flushPromises();
      win.runTimeouts();
      await flushPromises();

      const logsStr = win.sessionStorage.getItem("odb_audit_log");
      expect(logsStr).not.toBeNull();
      expect(logsStr).not.toContain("AIzaSy_MY_SECRET_KEY");
    });

    it("should clear logs on clear button click", () => {
      win.sessionStorage.setItem("odb_audit_log", "[{}]");
      initAiStudio(win, doc);
      const clearBtn = doc.getElementById("ledger-clear-btn");

      clearBtn.click();
      expect(win.sessionStorage.getItem("odb_audit_log")).toBeNull();
    });
  });

  describe("Generate UI", () => {
    beforeEach(async () => {
      win.sessionStorage.setItem("gemini_api_key", "VALID_KEY");
      win.sessionStorage.setItem("has_billing", "true");
      initAiStudio(win, doc);

      const input = doc.getElementById("gemini-key-input");
      const confirmBtn = doc.getElementById("gemini-key-confirm");
      input.value = "VALID_KEY";
      input.dispatchEvent(new win.Event("input"));

      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });

      confirmBtn.click();
      await flushPromises();
      win.runTimeouts();
      await flushPromises();

      vi.spyOn(Date, "now").mockReturnValue(1000000000); // stable date
    });

    it("should display generate UI controls", () => {
      const variantBtn = doc.querySelector(".btn-variant");
      const customBtn = doc.querySelector(".btn-custom");

      expect(variantBtn).not.toBeNull();
      expect(customBtn).not.toBeNull();
    });

    it("should handle custom tab and token counting", async () => {
      const customBtn = doc.querySelector(".btn-custom");

      // Mock countTokens
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalTokens: 42 }),
      });

      customBtn.click();
      await flushPromises();

      const editArea = doc.querySelector(".custom-edit-area");
      expect(editArea).not.toBeNull();

      // Test editing and debounced token counting
      editArea.textContent = "New text";
      editArea.dispatchEvent(new win.Event("input"));

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalTokens: 45 }),
      });

      win.runTimeouts(); // Trigger debounce
      await flushPromises();

      // Test error in countTokens
      editArea.textContent = "Error text";
      editArea.dispatchEvent(new win.Event("input"));

      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      win.runTimeouts();
      await flushPromises();
    });

    it("should handle variant generation click and caching", async () => {
      const variantBtn = doc.querySelector(".btn-variant");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Mocked variant" }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
      });

      variantBtn.click();
      await flushPromises();

      const outputArea = doc.querySelector(".variant-output");
      expect(outputArea.textContent).toContain("Mocked variant");

      // Test caching by clicking away and back
      const customBtn = doc.querySelector(".btn-custom");
      customBtn.click();
      variantBtn.click(); // Should load from cache

      // Test rate limiting (debounce)
      vi.spyOn(Date, "now").mockReturnValue(1000000001); // 1ms later
      const variantBtn2 = doc.querySelectorAll(".btn-variant")[1];
      variantBtn2.click(); // Should hit debounce
    });

    it("should handle image generation click with error and success", async () => {
      // Find non-multi-step article
      const normalPre = doc.querySelector(
        'article:not([data-tags="multi-step"]) pre',
      );
      const genContainer = normalPre
        .closest(".collapsible-code")
        .querySelector(".generate-ui-container");
      const variantBtn = genContainer.querySelector(".btn-variant");
      const customBtn = genContainer.querySelector(".btn-custom");
      const imgBtn = genContainer.querySelector(".btn-generate-image");

      // Expand custom to enable image generation
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalTokens: 10 }),
      }); // For token counting
      customBtn.click();
      await flushPromises();

      // Failure case
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Failed" } }),
      });

      imgBtn.click();
      await flushPromises();

      // Success case
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { data: "base64img", mimeType: "image/jpeg" } },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 10 },
        }),
      });

      imgBtn.click();
      await flushPromises();
      win.runTimeouts();
    });

    it("should handle multi-step image generation pipeline", async () => {
      // Find the multi-step article generate btn
      const multiStepPre = doc.querySelector(
        'article[data-tags="multi-step"] pre',
      );
      const genContainer = multiStepPre
        .closest(".collapsible-code")
        .querySelector(".generate-ui-container");
      const variantBtn = genContainer.querySelector(".btn-variant");
      variantBtn.classList.add("expanded");
      const imgBtn = genContainer.querySelector(".btn-generate-image");

      // Pipeline step 1
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "base64" }] } }],
        }),
      });
      // Pipeline step 2
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ inlineData: { data: "base64" } }] } },
          ],
        }),
      });

      imgBtn.click();
      await flushPromises();

      const lightbox = doc.querySelector(".ai-studio-lightbox");
      expect(lightbox).not.toBeNull();
      lightbox.click();
      win.runTimeouts();
    });

    it("should render dropdowns correctly", () => {
      const modelDropdown = doc.querySelector(".model-select-btn");
      const modelMenu = doc.querySelector(".model-options-menu");

      expect(modelDropdown).not.toBeNull();
      modelDropdown.click();
      expect(modelMenu.classList.contains("show")).toBe(true);

      const option = modelMenu.querySelector(".model-option");
      option.click();
      expect(modelMenu.classList.contains("show")).toBe(false);
      expect(win.sessionStorage.getItem("preferred_model")).not.toBeNull();
    });

    it("should render image dropdowns correctly", () => {
      const imgDropdown = doc.querySelector(".image-model-select-btn");
      const imgMenu = doc.querySelector(".image-model-options-menu");

      imgDropdown.click();
      expect(imgMenu.classList.contains("show")).toBe(true);

      const option = imgMenu.querySelector(".image-model-option");
      option.click();
      expect(imgMenu.classList.contains("show")).toBe(false);
      expect(
        win.sessionStorage.getItem("preferred_image_model"),
      ).not.toBeNull();
    });

    it("should handle tab changed events", () => {
      const pre = doc.querySelector("pre");
      pre.dispatchEvent(new win.Event("tabchanged"));

      const variantBtn = doc.querySelector(".btn-variant");
      expect(variantBtn.classList.contains("expanded")).toBe(false);
    });

    it("should handle window scrolling popover close", () => {
      const popover = doc.getElementById("gemini-popover");
      popover.classList.add("show");

      Object.defineProperty(popover, "getBoundingClientRect", {
        value: () => ({ top: -100, bottom: -10 }),
      });

      win.dispatchEvent(new win.Event("scroll"));
      expect(popover.classList.contains("show")).toBe(false);
    });

    it("should block image generation on free tier", () => {
      win.sessionStorage.setItem("has_billing", "false");
      initAiStudio(win, doc);

      // Force injection
      const input = doc.getElementById("gemini-key-input");
      const confirmBtn = doc.getElementById("gemini-key-confirm");
      input.value = "VALID_KEY";
      input.dispatchEvent(new win.Event("input"));
      confirmBtn.click();

      const normalPre = doc.querySelector(
        'article:not([data-tags="multi-step"]) pre',
      );
      const genContainer = normalPre
        .closest(".collapsible-code")
        .querySelector(".generate-ui-container");
      const imgBtn = genContainer.querySelector(".btn-generate-image");
      const variantBtn = genContainer.querySelector(".btn-variant");
      variantBtn.classList.add("expanded");

      imgBtn.click(); // Should return early
      expect(imgBtn.style.cursor).toBe("not-allowed");
    });

    it("should handle copy button click in variant output", async () => {
      const variantBtn = doc.querySelector(".btn-variant");
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: "Mocked variant to copy" }] } },
          ],
        }),
      });

      variantBtn.click();
      await flushPromises();

      const outputArea = doc.querySelector(".variant-output");
      const copyBtn = outputArea.querySelector(
        "span[title='Copy to clipboard']",
      );
      expect(copyBtn).not.toBeNull();

      copyBtn.click();
      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();

      // trigger hover
      copyBtn.dispatchEvent(new win.Event("mouseover"));
      copyBtn.dispatchEvent(new win.Event("mouseout"));
    });

    it("should fetch variant with negative prompt", async () => {
      const multiStepPre = doc.querySelector(
        'article[data-tags="multi-step"] pre',
      );
      const genContainer = multiStepPre
        .closest(".collapsible-code")
        .querySelector(".generate-ui-container");
      const variantBtn = genContainer.querySelector(".btn-variant");

      // trigger tab change to set activeTabIdx > 0
      const code = multiStepPre.querySelector("code");
      code.dataset.activeTab = "1";

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Mocked variant" }] } }],
        }),
      });

      variantBtn.click();
      await flushPromises();

      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
