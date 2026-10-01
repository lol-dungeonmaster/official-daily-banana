import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { initAiStudio } from "../assets/js/ai-studio.js";

const flushPromises = () => new Promise(setImmediate);

describe("ai-studio.js", () => {
  let dom, win, doc, instance;

  beforeEach(() => {
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html><body>
        <div id="indicator-basic"></div><div id="indicator-image"></div><div id="indicator-delay"></div>
        <button id="gemini-key-btn"></button><div id="gemini-popover"></div><input id="gemini-key-input" />
        <button id="gemini-key-confirm"></button><button id="gemini-key-cancel"></button><button id="gemini-key-eye"></button>
        <div class="gemini-icon"></div>
        <button id="ledger-btn"></button><div id="ledger-popover" class="show"></div>
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
            
            <div class="collapsible-code">
                <pre style="display:block">
                    <code data-active-tab="1">
                        <div class="sub-prompt" data-index="0">Base</div>
                        <div class="sub-prompt" data-index="1">[EVENT MODIFIERS] step2</div>
                    </code><span class="token-estimator"></span>
                </pre><button class="reveal-btn">Reveal 2</button>
            </div>
            
            <div class="collapsible-code">
                <div class="generate-ui-container"></div>
            </div>
        </article>
        
        <article>
            <div class="collapsible-code">
                <pre style="display:block"><code>non multi-step prompt that is long enough</code></pre><button class="reveal-btn">Reveal 3</button>
            </div>
        </article>
        
        <span title="Copy"></span>
        <span title="Expand"></span>
        <span class="close-lightbox"></span>
      </body></html>
    `,
      { runScripts: "dangerously", url: "http://localhost" },
    );
    win = dom.window;
    doc = win.document;

    win.fetch = vi.fn().mockImplementation(async (url, opts) => {
      if (url.includes("models?key="))
        return {
          ok: !url.includes("BADKEY") && !url.includes("API_ERROR_400"),
          json: async () => ({}),
        };

      if (url.includes("generateContent")) {
        if (url.includes("BILLING_ERROR"))
          return { ok: false, status: 403, text: async () => "billing" };
        if (url.includes("API_ERROR_429"))
          return { ok: false, status: 429, text: async () => "rate limit" };
        if (url.includes("API_ERROR_400"))
          return { ok: false, status: 400, text: async () => "invalid key" };
        if (url.includes("API_ERROR_401"))
          return { ok: false, status: 401, text: async () => "unauthorized" };
        if (url.includes("API_ERROR_500"))
          return {
            ok: false,
            status: 500,
            text: async () => "server error",
            json: async () => ({ error: { message: "srv" } }),
          };

        if (
          url.includes("flash-lite-image") ||
          url.includes("flash-image") ||
          url.includes("pro-image") ||
          url.includes("imagen")
        ) {
          if (url.includes("IMG_ERR_JSON"))
            return {
              ok: false,
              status: 500,
              json: async () => ({ error: { message: "Img err" } }),
            };
          if (url.includes("IMG_ERR_NO_JSON"))
            return { ok: false, status: 500, json: async () => ({}) };
          if (url.includes("IMG_TEXT"))
            return {
              ok: true,
              json: async () => ({
                candidates: [
                  { content: { parts: [{ text: "text_as_image_mock" }] } },
                ],
                usageMetadata: { promptTokenCount: 15 },
              }),
            };
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        inlineData: { mimeType: "image/png", data: "iVBORw0K" },
                      },
                    ],
                  },
                },
              ],
              usageMetadata: { promptTokenCount: 12 },
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 10 },
            candidates: [
              { content: { parts: [{ text: "Mocked variant content" }] } },
            ],
          }),
        };
      }

      if (url.includes("countTokens")) {
        if (url.includes("TOKEN_ERR")) return { ok: false, status: 500 };
        return { ok: true, json: async () => ({ totalTokens: 42 }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    win.console.error = vi.fn();

    win.sessionStoreMockState = "cached";
    let store = {};
    Object.defineProperty(win, "sessionStorage", {
      value: {
        getItem: vi.fn((key) => {
          if (
            win.sessionStoreMockState === "empty" &&
            (key.startsWith("custom_") || key.includes("odb_tab_variant_"))
          )
            return null;
          if (
            win.sessionStoreMockState === "invalid_json" &&
            (key.startsWith("custom_") || key.startsWith("variant_"))
          )
            return "invalid json string";
          if (
            win.sessionStoreMockState === "custom" &&
            key.includes("odb_tab_variant_")
          )
            return "custom";
          if (key.includes("odb_tab_variant_")) return "variant";
          if (key.includes("odb_tab_custom_")) return "custom";
          if (key.startsWith("custom_"))
            return JSON.stringify({ text: "cached custom", tokens: 5 });
          if (key.startsWith("variant_"))
            return JSON.stringify({ text: "cached variant", tokens: 8 });
          return store[key] || null;
        }),
        setItem: vi.fn((key, value) => {
          store[key] = value ? value.toString() : "";
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
    win.clearTimeout = vi.fn((id) => {
      if (id) win._timeouts[id - 1] = null;
    });
    win._runTimeouts = () => {
      win._timeouts.forEach((cb) => {
        if (cb) cb();
      });
      win._timeouts = [];
    };
    win.requestAnimationFrame = vi.fn((cb) => {
      cb();
    });

    Object.defineProperty(win, "innerHeight", { value: 1000 });
    Object.assign(global.navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue() },
    });
    Object.defineProperty(win.HTMLElement.prototype, "getBoundingClientRect", {
      value: () => ({ top: -100, bottom: -10, left: 0, right: 100 }),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Precise Fetch Fuzzer v4", async () => {
    let simulatedTime = 0;
    vi.spyOn(Date, "now").mockImplementation(() => {
      simulatedTime += 10000;
      return simulatedTime;
    });

    win.sessionStorage.setItem("gemini_api_key", "GOODKEY");
    instance = initAiStudio(win, doc);
    await flushPromises();
    win._runTimeouts();

    const fire = (el, ev) => {
      if (el)
        try {
          el.dispatchEvent(new win.Event(ev, { bubbles: true }));
        } catch (e) {}
    };

    const input = doc.getElementById("gemini-key-input");
    const confirmBtn = doc.getElementById("gemini-key-confirm");
    const eyeBtn = doc.getElementById("gemini-key-eye");

    const keys = [
      "BILLING_ERROR",
      "API_ERROR_429",
      "API_ERROR_400",
      "API_ERROR_401",
      "API_ERROR_500",
      "IMG_TEXT",
      "IMG_ERR_JSON",
      "IMG_ERR_NO_JSON",
      "TOKEN_ERR",
      "GOODKEY",
      "BADKEY",
      "AIzaSy123456789012345678901234567",
      "",
    ];

    for (const state of ["cached", "empty", "invalid_json", "custom"]) {
      win.sessionStoreMockState = state;

      for (const key of keys) {
        input.value = key;
        fire(input, "input");
        fire(confirmBtn, "click");
        await flushPromises();
        win._runTimeouts();

        win.sessionStorage.setItem("gemini_api_key", key);

        doc.querySelectorAll("pre").forEach((p) => fire(p, "tabchanged"));

        doc.querySelectorAll(".btn-variant").forEach((b) => {
          b.disabled = false;
          fire(b, "click");
        });
        await flushPromises();
        win._runTimeouts();

        doc.querySelectorAll(".btn-generate-image").forEach((b) => {
          b.disabled = false;
          const v = b
            .closest(".generate-ui-container")
            ?.querySelector(".btn-variant");
          if (v) v.classList.add("expanded");
          fire(b, "click");
        });
        await flushPromises();
        win._runTimeouts();

        doc.querySelectorAll(".btn-custom").forEach((b) => {
          b.disabled = false;
          fire(b, "click");
        });
        await flushPromises();
        win._runTimeouts();

        doc.querySelectorAll(".custom-edit-area").forEach((t) => {
          t.textContent = "New Prompt " + key;
          fire(t, "input");
        });
        await flushPromises();
        win._runTimeouts();

        if (instance.logAudit)
          instance.logAudit("info", "Leak " + key + " inside");
        await flushPromises();
        win._runTimeouts();
      }
    }

    input.value = "AIzaSy123456789012345678901234567";
    input.dataset.realKey = "AIzaSy123456789012345678901234567";
    fire(eyeBtn, "click");
    input.value = "AIzaSy123456789012345678901234567";
    fire(eyeBtn, "click");
    input.value = "something else";
    fire(eyeBtn, "click");

    // Make logAudit push info logs when ledger-tab active="info"
    doc.querySelectorAll(".ledger-tab").forEach((b) => fire(b, "click"));
    if (instance.logAudit) instance.logAudit("info", "Another info log");
    doc.getElementById("ledger-btn").click();

    doc.querySelectorAll("*").forEach((el) => {
      [
        "click",
        "mouseover",
        "mouseout",
        "scroll",
        "closeAllPopovers",
        "tabchanged",
        "load",
        "error",
        "copy",
        "cut",
        "dblclick",
      ].forEach((type) => {
        fire(el, type);
      });
    });

    await flushPromises();
    win._runTimeouts();
  }, 60000);
});
