document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("gemini-key-btn");
  const popover = document.getElementById("gemini-popover");
  const input = document.getElementById("gemini-key-input");
  const confirmBtn = document.getElementById("gemini-key-confirm");

  // Instantly unactivate the icon if the user starts typing a new key
  input.addEventListener("input", () => {
    if (sessionStorage.getItem("gemini_api_key")) {
      if (input.value.trim() !== sessionStorage.getItem("gemini_api_key")) {
        icon.classList.remove("activated");
      } else {
        icon.classList.add("activated");
      }
    }
  });

  const ledgerBtn = document.getElementById("ledger-btn");
  const ledgerPopover = document.getElementById("ledger-popover");
  const ledgerTabs = document.querySelectorAll(".ledger-tab");
  const ledgerContent = document.getElementById("ledger-content");

  let currentLedgerTab = "info";

  const ledgerBadge = document.getElementById("ledger-badge");
  if (ledgerBadge && sessionStorage.getItem("odb_ledger_unread") === "true") {
    ledgerBadge.style.display = "block";
  }

  function renderLedger() {
    if (!ledgerContent) return;
    try {
      const logs = JSON.parse(sessionStorage.getItem("odb_audit_log") || "[]");

      const counts = { info: 0, warn: 0, error: 0 };
      logs.forEach((l) => {
        if (counts[l.type] !== undefined) counts[l.type]++;
      });
      ledgerTabs.forEach((tab) => {
        const t = tab.getAttribute("data-tab");
        const title = t.charAt(0).toUpperCase() + t.slice(1);
        tab.textContent = `${title} (${counts[t]})`;
      });

      const filtered = logs.filter((l) => l.type === currentLedgerTab);
      ledgerContent.textContent = "";
      if (filtered.length === 0) {
        ledgerContent.textContent = "No records found.";
        return;
      }
      filtered.reverse().forEach((l) => {
        const div = document.createElement("div");
        div.style.cssText =
          "margin-bottom: 8px; border-bottom: 1px solid #444; padding-bottom: 8px;";

        const timeDiv = document.createElement("div");
        timeDiv.style.cssText = "color: #888; margin-bottom:2px;";
        timeDiv.textContent = new Date(l.timestamp).toLocaleString();
        div.appendChild(timeDiv);

        const msgDiv = document.createElement("div");
        const lines = l.message.split("\n");
        lines.forEach((line, i) => {
          msgDiv.appendChild(document.createTextNode(line));
          if (i < lines.length - 1)
            msgDiv.appendChild(document.createElement("br"));
        });
        div.appendChild(msgDiv);

        ledgerContent.appendChild(div);
      });
    } catch (e) {}
  }

  function logAudit(type, message) {
    try {
      const logs = JSON.parse(sessionStorage.getItem("odb_audit_log") || "[]");
      const key = sessionStorage.getItem("gemini_api_key");
      let redacted = false;
      if (key && key.length > 5 && message.includes(key)) {
        message = message.split(key).join("[REDACTED_API_KEY]");
        redacted = true;
      }
      if (/AIzaSy[\w-]{33}/.test(message)) {
        message = message.replace(/AIzaSy[\w-]{33}/g, "[REDACTED_API_KEY]");
        redacted = true;
      }
      logs.push({ timestamp: new Date().toISOString(), type, message });
      if (redacted) {
        logs.push({
          timestamp: new Date().toISOString(),
          type: "error",
          message:
            "CRITICAL SECURITY TRIPWIRE: A system process attempted to leak an API key into the audit logs. The key was successfully intercepted and redacted.",
        });
      }
      if (logs.length > 50) logs.shift();
      sessionStorage.setItem("odb_audit_log", JSON.stringify(logs));
      if (ledgerPopover && ledgerPopover.classList.contains("show")) {
        renderLedger();
      } else {
        sessionStorage.setItem("odb_ledger_unread", "true");
        if (ledgerBadge) ledgerBadge.style.display = "block";
      }
    } catch (e) {}
  }

  if (ledgerBtn && ledgerPopover) {
    ledgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other popover
      if (popover) popover.classList.remove("show");
      ledgerPopover.classList.toggle("show");
      if (ledgerPopover.classList.contains("show")) {
        renderLedger();
        sessionStorage.removeItem("odb_ledger_unread");
        if (ledgerBadge) ledgerBadge.style.display = "none";
      }
    });

    ledgerTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.stopPropagation();
        ledgerTabs.forEach((t) => {
          t.classList.remove("active");
          t.style.background = "transparent";
          t.style.color = "";
          t.style.borderColor = "transparent";
        });
        tab.classList.add("active");
        tab.style.background = "rgba(0,255,136,0.1)";
        tab.style.color = "#00ff88";
        tab.style.borderColor = "rgba(0,255,136,0.3)";
        currentLedgerTab = tab.getAttribute("data-tab");
        renderLedger();
      });
    });

    ledgerPopover.addEventListener("click", (e) => e.stopPropagation());
    const clearBtn = document.getElementById("ledger-clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sessionStorage.removeItem("odb_audit_log");
        renderLedger();
      });
    }

    // Close on scroll if open
    window.addEventListener(
      "scroll",
      () => {
        if (ledgerPopover.classList.contains("show")) {
          ledgerPopover.classList.remove("show");
        }
      },
      { passive: true },
    );
  }

  // Hook clicking outside for ledger
  document.addEventListener("click", () => {
    if (ledgerPopover) ledgerPopover.classList.remove("show");
  });

  const cancelBtn = document.getElementById("gemini-key-cancel");
  const icon = document.querySelector(".gemini-icon");

  const toast = document.createElement("div");
  toast.id = "ai-toast";
  document.body.appendChild(toast);

  function showToast(message, isWarning = false) {
    logAudit(isWarning ? "error" : "info", message);

    toast.textContent = message;
    toast.style.background = isWarning ? "#ff4444" : "#00ff88";
    toast.style.color = isWarning ? "#fff" : "#000";
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const existingKey = sessionStorage.getItem("gemini_api_key");
    if (existingKey) {
      input.value = existingKey;
      confirmBtn.disabled = false;
    } else {
      input.value = "";
      confirmBtn.disabled = true;
    }
    popover.classList.toggle("show");
  });

  popover.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  window.addEventListener("scroll", () => {
    if (popover.classList.contains("show")) {
      const rect = popover.getBoundingClientRect();
      if (rect.bottom < 0) {
        popover.classList.remove("show");
      }
    }
  });

  document.addEventListener("click", () => {
    popover.classList.remove("show");
  });

  input.addEventListener("input", () => {
    confirmBtn.disabled = input.value.trim() === "";
  });

  cancelBtn.addEventListener("click", () => {
    popover.classList.remove("show");
  });

  confirmBtn.addEventListener("click", async () => {
    const key = input.value.trim();

    // STRIDE Mitigation: Client-Side Throttling
    confirmBtn.disabled = true;
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Wait...";
    setTimeout(() => {
      confirmBtn.disabled = input.value.trim() === "";
      confirmBtn.textContent = originalText;
    }, 3000);

    if (!key) {
      sessionStorage.removeItem("gemini_api_key");
      document.querySelector(".gemini-icon").classList.remove("activated");
      document
        .querySelectorAll(".generate-ui-container")
        .forEach((el) => el.remove());
      showToast("Key Removed", true);
      popover.classList.remove("show");
      return;
    }

    confirmBtn.textContent = "Verifying...";
    confirmBtn.disabled = true;

    try {
      // 1. Verify the key is structurally valid by checking the master endpoint
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      );

      if (res.ok) {
        // 2. The key is valid! Now force Google to evaluate billing status by sending a dummy generation POST request.
        // If billing is disabled, Google intercepts and throws 403 Forbidden.
        // If billing is active, the request passes to the model, which throws 400 Bad Request due to the empty payload.
        const billingRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "test prompt" }] }],
            }),
          },
        );

        let hasBilling = true;
        if (!billingRes.ok) {
          const errText = await billingRes.text();
          // 429 Quota Exceeded is thrown because free-tier keys have 0 RPM for image models.
          // The error message typically includes a prompt to set up a billing account.
          if (
            errText.toLowerCase().includes("billing") ||
            billingRes.status === 403 ||
            billingRes.status === 429
          ) {
            hasBilling = false;
          }
        }

        sessionStorage.setItem("gemini_api_key", key);
        icon.classList.add("activated");
        popover.classList.remove("show");

        document.querySelectorAll(".collapsible-code pre").forEach((pre) => {
          if (pre.style.display === "block") {
            injectGenerateUI(pre.closest(".collapsible-code"));
          }
        });

        if (hasBilling) {
          showToast("Authorized");
        } else {
          logAudit("warn", "Valid Key, but Nano Banana requires billing.");
          toast.textContent = "Valid Key, but Nano Banana requires billing.";
          toast.style.background = "#ffcc00";
          toast.style.color = "#000";
          toast.classList.add("show");

          let toast2 = document.getElementById("ai-toast-2");
          if (!toast2) {
            toast2 = document.createElement("div");
            toast2.id = "ai-toast-2";
            toast2.style.cssText =
              "position: fixed; bottom: 70px; right: 20px; background: #ff4444; color: #fff; padding: 10px 20px; border-radius: 4px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 9999; opacity: 0; transform: translateY(20px); transition: all 0.3s ease; pointer-events: none;";
            document.body.appendChild(toast2);
          }
          toast2.textContent = "Image generation is disabled.";
          void toast2.offsetWidth;
          toast2.style.opacity = "1";
          toast2.style.transform = "translateY(0)";

          setTimeout(() => {
            toast.classList.remove("show");
            toast2.style.opacity = "0";
            toast2.style.transform = "translateY(20px)";
          }, 5000);
        }
      } else {
        // Entirely invalid key
        sessionStorage.removeItem("gemini_api_key");
        icon.classList.remove("activated");
        document
          .querySelectorAll(".generate-ui-container")
          .forEach((el) => el.remove());
        showToast("Not Authorized", true);
      }
    } catch (e) {
      showToast("Network Error", true);
    } finally {
      confirmBtn.textContent = "Confirm";
      confirmBtn.disabled = false;
    }
  });

  function injectGenerateUI(block) {
    if (!sessionStorage.getItem("gemini_api_key")) return;
    if (block.querySelector(".generate-ui-container")) return;

    const pre = block.querySelector("pre");
    if (!pre) return;

    // Use textContent for stable hashing, avoiding innerText formatting quirks
    const promptText = pre.textContent.trim();

    // Create a 32-bit hash for the persistence key
    let hash = 0;
    for (let i = 0; i < promptText.length; i++) {
      hash = (hash << 5) - hash + promptText.charCodeAt(i);
      hash |= 0;
    }
    const storageKey = "variant_" + hash;

    const container = document.createElement("div");
    container.className = "generate-ui-container";
    container.style.cssText =
      "margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); display: flex; flex-direction: column; gap: 10px;";

    const controls = document.createElement("div");
    controls.style.cssText =
      "display: flex; align-items: center; flex-wrap: wrap; gap: 10px;";

    // NATIVE BUTTON CLASSES: These inherit .collapsible-code button styles
    const savedModel =
      sessionStorage.getItem("preferred_model") || "gemini-2.5-flash-lite";
    const savedLabel =
      sessionStorage.getItem("preferred_model_label") || "2.5 Flash Lite (Eco)";

    controls.innerHTML = `
      <strong style="color: #cbcbcb; font-family: inherit; font-size: 20px;">Generate:</strong>
      <button class="btn-variant">Variant</button>
      <button class="btn-custom" disabled title="Coming soon" style="cursor: not-allowed; opacity: 0.5;">Custom</button>
      <div class="model-dropdown-container" style="position: relative; display: inline-flex; align-items: center; margin: 0; padding: 0;">
        <div role="button" class="model-select-btn" style="background: rgba(0,0,0,0.1); border: 1px solid #838383; border-radius: 4px; color: #cbcbcb; padding: 4px 8px; font-family: inherit; font-size: 20px; line-height: normal; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 5px; margin: 0;">
          <span class="model-label">${savedLabel}</span>
          <span style="font-size: 12px; pointer-events: none;">▼</span>
        </div>
        <div class="model-options-menu" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: rgba(0, 49, 43, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px 0; flex-direction: column; gap: 0; z-index: 100; min-width: max-content; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <div class="model-option" data-value="gemini-2.5-flash-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px;">2.5 Flash Lite (Eco)</div>
          <div class="model-option" data-value="gemini-3.1-flash-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px;">3.1 Flash Lite (Fast)</div>
          <div class="model-option" data-value="gemini-3.5-flash-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px;">3.5 Flash Lite (Fast)</div>
          <div class="model-option" data-value="gemini-2.5-flash" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px;">2.5 Flash (Balanced)</div>
        </div>
      </div>
    `;
    container.appendChild(controls);

    const dropdownBtn = controls.querySelector(".model-select-btn");
    const dropdownMenu = controls.querySelector(".model-options-menu");
    const modelLabel = controls.querySelector(".model-label");
    let currentModel = savedModel;

    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.style.display =
        dropdownMenu.style.display === "none" ? "flex" : "none";
    });

    controls.querySelectorAll(".model-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        currentModel = opt.getAttribute("data-value");
        modelLabel.textContent = opt.textContent;
        sessionStorage.setItem("preferred_model", currentModel);
        sessionStorage.setItem("preferred_model_label", opt.textContent);
        dropdownMenu.style.display = "none";
      });
      opt.addEventListener(
        "mouseover",
        () => (opt.style.background = "rgba(255,255,255,0.1)"),
      );
      opt.addEventListener(
        "mouseout",
        () => (opt.style.background = "transparent"),
      );
    });

    document.addEventListener("click", () => {
      if (dropdownMenu) dropdownMenu.style.display = "none";
    });

    const outputArea = document.createElement("div");
    outputArea.className = "variant-output";
    outputArea.style.cssText =
      "display: none; position: relative; padding: 10px; padding-right: 35px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); border-radius: 4px; color: #fff; font-size: 0.9em; line-height: 1.5; font-family: Monaco, 'Bitstream Vera Sans Mono', monospace;";
    container.appendChild(outputArea);

    const variantBtn = controls.querySelector(".btn-variant");
    const customBtn = controls.querySelector(".btn-custom");

    // Restore cached variant if it exists
    const savedVariant = sessionStorage.getItem(storageKey);
    const addCopyButton = (text) => {
      const copyBtn = document.createElement("span");
      copyBtn.textContent = "✂️";
      copyBtn.title = "Copy to clipboard";
      copyBtn.style.cssText =
        "position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; cursor: pointer; padding: 4px; font-size: 14px; transition: background 0.2s;";
      copyBtn.onmouseover = () =>
        (copyBtn.style.background = "rgba(0,0,0,0.6)");
      copyBtn.onmouseout = () => (copyBtn.style.background = "rgba(0,0,0,0.3)");
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.textContent = "✓";
        setTimeout(() => (copyBtn.innerHTML = "✂️"), 1500);
      };
      outputArea.appendChild(copyBtn);
    };

    if (savedVariant) {
      variantBtn.classList.add("expanded");
      outputArea.style.display = "block";
      outputArea.textContent = savedVariant;
      addCopyButton(savedVariant);
    }

    variantBtn.addEventListener("click", async (e) => {
      // Toggle arrows
      variantBtn.classList.add("expanded");
      if (customBtn) customBtn.classList.remove("expanded");

      // Start marching ants animation
      variantBtn.classList.add("btn-generating");
      variantBtn.disabled = true;
      variantBtn.title = "Generating variant...";

      outputArea.style.display = "block";
      outputArea.textContent = "...";

      try {
        const key = sessionStorage.getItem("gemini_api_key");
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text:
                        "You are an expert AI prompt engineer. First, deeply analyze the core subject and intent of the following image generation prompt. Then, deliberately construct a new, grounded variation by thoughtfully reimagining the atmospheric lighting, artistic medium, or stylistic execution while preserving the original core subject. Output ONLY the final raw prompt text, with no introductory or concluding commentary.\n\n" +
                        promptText,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.2 },
            }),
          },
        );

        if (res.ok) {
          const data = await res.json();
          const variant = data.candidates[0].content.parts[0].text;
          outputArea.textContent = variant;
          addCopyButton(variant);
          // Persist the generated variant
          sessionStorage.setItem(storageKey, variant);
        } else {
          const errText = await res.text();
          console.error("Gemini API Error [" + res.status + "]:", errText);
          if (res.status === 429) {
            showToast("Rate limit reached. Please wait a moment.", true);
          } else if (
            res.status === 400 ||
            res.status === 401 ||
            res.status === 403
          ) {
            sessionStorage.removeItem("gemini_api_key");
            document
              .querySelector(".gemini-icon")
              .classList.remove("activated");
            document
              .querySelectorAll(".generate-ui-container")
              .forEach((el) => el.remove());
            showToast("Key Revoked or Invalid.", true);
          } else {
            showToast("Failed to generate variant. API Error.", true);
          }
          outputArea.style.display = "none";
        }
      } catch (err) {
        console.error("Gemini API Network Exception:", err);
        showToast("Network Error during generation.", true);
        outputArea.style.display = "none";
      } finally {
        // Stop marching ants
        variantBtn.classList.remove("btn-generating");
        variantBtn.disabled = false;
        variantBtn.removeAttribute("title");
      }
    });

    pre.appendChild(container);
  }

  document.addEventListener("click", (e) => {
    const revealBtn = e.target.closest(".collapsible-code button");
    if (revealBtn) {
      const block = revealBtn.closest(".collapsible-code");
      setTimeout(() => {
        const pre = block.querySelector("pre");
        if (pre && pre.style.display === "block") {
          injectGenerateUI(block);
        }
      }, 10);
    }
  });

  if (sessionStorage.getItem("gemini_api_key")) {
    icon.classList.add("activated");
    document.querySelectorAll(".collapsible-code pre").forEach((pre) => {
      if (pre.style.display === "block") {
        injectGenerateUI(pre.closest(".collapsible-code"));
      }
    });
  }
});
// stride-ignore: Hardcoded UI template HTML is safe from XSS
