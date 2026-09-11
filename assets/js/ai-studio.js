document.addEventListener("DOMContentLoaded", () => {

  const updateIndicators = () => {
    const indBasic = document.getElementById("indicator-basic");
    const indImage = document.getElementById("indicator-image");
    const indDelay = document.getElementById("indicator-delay");
    if (!indBasic || !indImage || !indDelay) return;
    const existingKey = sessionStorage.getItem("gemini_api_key");
    if (existingKey) {
      indBasic.textContent = "✅";
      const hasBilling = sessionStorage.getItem("has_billing") !== "false";
      indImage.textContent = hasBilling ? "✅" : "❌";
      indDelay.textContent = hasBilling ? "3s" : "5s";
    } else {
      indBasic.textContent = "❌";
      indImage.textContent = "❌";
      indDelay.textContent = "--s";
    }
  };


  document.addEventListener("closeAllPopovers", () => {
    if (popover) popover.classList.remove("show");
    if (ledgerPopover) ledgerPopover.classList.remove("show");
    document.querySelectorAll(".model-options-menu, .image-model-options-menu").forEach(m => m.classList.remove("show"));
  });

  window.addEventListener("scroll", () => {
    document.querySelectorAll(".model-options-menu.show").forEach((menu) => {
      const rect = menu.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        menu.classList.remove("show");
      }
    });
  }, { passive: true });

  const btn = document.getElementById("gemini-key-btn");
  const popover = document.getElementById("gemini-popover");
  const input = document.getElementById("gemini-key-input");
  const confirmBtn = document.getElementById("gemini-key-confirm");
  const eyeBtn = document.getElementById("gemini-key-eye");

  const getObfuscatedKey = (k) => {
    if (!k || k.length < 10) return k;
    const half = Math.floor(k.length / 2);
    return k.substring(0, half) + "▪".repeat(17);
  };

  if (input) {
    input.addEventListener("copy", (e) => e.preventDefault());
    input.addEventListener("cut", (e) => e.preventDefault());
  }

  let eyeTimeout;
  if (eyeBtn) {
    eyeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const real = input.dataset.realKey;
      if (!real) return;
      if (input.value === real && real !== getObfuscatedKey(real)) {
        input.value = getObfuscatedKey(real);
        clearTimeout(eyeTimeout);
      } else {
        input.value = real;
        clearTimeout(eyeTimeout);
        eyeTimeout = setTimeout(() => {
          if (input.dataset.realKey === real) {
            input.value = getObfuscatedKey(real);
          }
        }, 5000);
      }
    });
  }

  if (input) {
  input.addEventListener("dblclick", () => {
    const existingKey = sessionStorage.getItem("gemini_api_key");
    if (existingKey && input.readOnly) {
      input.readOnly = false;
      input.style.cursor = "text";
      input.title = "";
      input.value = "";
      input.dataset.realKey = "";
      confirmBtn.disabled = true;
      input.focus();
    }
  });

  // Handle fresh inputs after double-click clears the box
  input.addEventListener("input", () => {
    input.dataset.realKey = input.value;
    
    const currentRealKey = input.dataset.realKey;
    confirmBtn.disabled = currentRealKey.trim() === "";

    const existingKey = sessionStorage.getItem("gemini_api_key");
    if (existingKey) {
      if (currentRealKey.trim() !== existingKey) {
        icon.classList.remove("activated");
      } else {
        icon.classList.add("activated");
      }
    }
  });

  }

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
      const wasOpen = ledgerPopover.classList.contains("show");
      document.dispatchEvent(new CustomEvent("closeAllPopovers"));
      if (!wasOpen) {
        ledgerPopover.classList.add("show");
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

    // Close on scroll if off screen
    window.addEventListener(
      "scroll",
      () => {
        if (ledgerPopover.classList.contains("show")) {
          const rect = ledgerPopover.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            ledgerPopover.classList.remove("show");
          }
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
    const wasOpen = popover.classList.contains("show");
    document.dispatchEvent(new CustomEvent("closeAllPopovers"));
    if (wasOpen) return;

    const existingKey = sessionStorage.getItem("gemini_api_key");
    if (existingKey) {
      input.dataset.realKey = existingKey;
      input.value = getObfuscatedKey(existingKey);
      confirmBtn.disabled = false;
      input.readOnly = true;
      input.style.cursor = "pointer";
      input.title = "Double-click to edit key";
    } else {
      input.dataset.realKey = "";
      input.value = "";
      confirmBtn.disabled = true;
      input.readOnly = false;
      input.style.cursor = "text";
      input.title = "";
    }
    updateIndicators();
    popover.classList.add("show");
  });

  popover.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  window.addEventListener("scroll", () => {
    if (popover.classList.contains("show")) {
      const rect = popover.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        popover.classList.remove("show");
      }
    }
  }, { passive: true });

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
    const key = (input.dataset.realKey || input.value).trim();

    // STRIDE Mitigation: Promise-based Minimum Delay
    const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));

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
        sessionStorage.setItem("has_billing", hasBilling ? "true" : "false");
        updateIndicators();
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
      await minDelay;
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
    const customStorageKey = "custom_" + hash;

    const extractCleanText = () => {
      const clone = pre.cloneNode(true);
      clone.querySelectorAll(".generate-ui-container, .negative-prompt-container, span[title='Copy to clipboard'], .token-estimator").forEach(c => c.remove());
      const codeClone = clone.querySelector("code");
      if (codeClone) {
        codeClone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
        const chunks = [];
        codeClone.childNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            let t = node.textContent.trim().replace(/[ \t]+/g, ' ');
            if (t) chunks.push(t);
          }
        });
        return chunks.join("\n\n");
      }
      return clone.textContent.trim();
    };

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
      sessionStorage.getItem("preferred_model_label") || "<span>2.5 Flash Lite</span> <span>($<span style=\"opacity: 0.3\">$$$</span>)</span>";

    const hasBilling = sessionStorage.getItem("has_billing") !== "false";
    const imgTooltip = hasBilling ? "Change image model" : "No image generation with free tier";
    const cameraTooltip = hasBilling ? "Generate image" : "No image generation with free tier";
    const imgOpacity = hasBilling ? "1" : "0.5";
    const imgCursor = hasBilling ? "pointer" : "not-allowed";
    
    const savedImgModel = sessionStorage.getItem("preferred_image_model") || "nano-banana-2-lite";
    const savedImgLabel = sessionStorage.getItem("preferred_image_model_label") || "<span>NB 2 Lite</span> <span>($<span style=\"opacity: 0.3\">$$$</span>)</span>";

    controls.innerHTML = `
      <strong style="color: #cbcbcb; font-family: inherit; font-size: 20px;">Generate:</strong>
      <button class="btn-variant" title="Create variant">Variant</button>
      <button class="btn-custom" title="Create edit">Custom</button>
      
      <!-- Text Model Dropdown -->
      <div class="model-dropdown-container" style="position: relative; display: inline-flex; align-items: center; margin: 0; padding: 0;">
        <div role="button" title="Change model" class="model-select-btn" style="background: rgba(0,0,0,0.1); border: 1px solid #838383; border-radius: 4px; color: #cbcbcb; padding: 4px 8px; font-family: inherit; font-size: 20px; line-height: normal; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 5px; margin: 0;">
          <div class="model-label" style="display: flex; justify-content: space-between; gap: 15px; width: 100%;">${savedLabel}</div>
          <span class="model-caret" style="font-size: 12px; pointer-events: none; transition: all 0.2s ease;">▼</span>
        </div>
        <div class="model-options-menu fade-dropdown" style=" position: absolute; top: 100%; left: 0; margin-top: 4px; background: rgba(0, 49, 43, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px 0; flex-direction: column; gap: 0; z-index: 2000; min-width: max-content; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <div class="model-option" data-value="gemini-2.5-flash-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>2.5 Flash Lite</span> <span>($<span style="opacity: 0.3">$$$</span>)</span></div>
          <div class="model-option" data-value="gemini-3.1-flash-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>3.1 Flash Lite</span> <span>($$<span style="opacity: 0.3">$$</span>)</span></div>
          <div class="model-option" data-value="gemini-3.5-flash-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>3.5 Flash Lite</span> <span>($$$<span style="opacity: 0.3">$</span>)</span></div>
          <div class="model-option" data-value="gemini-2.5-flash" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>2.5 Flash</span> <span>($$$$)</span></div>
        </div>
      </div>
      
      <!-- Image Model Dropdown -->
      <div class="image-model-dropdown-container" style="position: relative; display: inline-flex; align-items: center; margin: 0; padding: 0;">
        <div role="button" title="${imgTooltip}" class="image-model-select-btn" style="opacity: ${imgOpacity}; background: rgba(0,0,0,0.1); border: 1px solid #838383; border-radius: 4px; color: #cbcbcb; padding: 4px 8px; font-family: inherit; font-size: 20px; line-height: normal; box-sizing: border-box; cursor: ${imgCursor}; display: flex; align-items: center; gap: 5px; margin: 0;">
          <div class="image-model-label" style="display: flex; justify-content: space-between; gap: 15px; width: 100%;">${savedImgLabel}</div>
          <span class="image-model-caret" style="font-size: 12px; pointer-events: none; transition: all 0.2s ease;">▼</span>
        </div>
        <div class="image-model-options-menu fade-dropdown" style=" position: absolute; top: 100%; left: 0; margin-top: 4px; background: rgba(0, 49, 43, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px 0; flex-direction: column; gap: 0; z-index: 2000; min-width: max-content; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <div class="image-model-option" data-value="nano-banana-2-lite" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>NB 2 Lite</span> <span>($<span style="opacity: 0.3">$$$</span>)</span></div>
          <div class="image-model-option" data-value="nano-banana-2" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>NB 2</span> <span>($$<span style="opacity: 0.3">$$</span>)</span></div>
          <div class="image-model-option" data-value="nano-banana-pro" style="padding: 4px 12px; cursor: pointer; color: #cbcbcb; font-family: inherit; font-size: 16px; border-radius: 2px; display: flex; justify-content: space-between; gap: 15px;"><span>NB Pro</span> <span>($$$$)</span></div>
        </div>
      </div>
      
      <button class="btn-generate-image" title="${cameraTooltip}" style="opacity: ${imgOpacity}; background: transparent; border: none; color: #cbcbcb; padding: 4px; cursor: ${imgCursor}; display: flex; align-items: center; justify-content: center; margin: 0; margin-left: 10px; transition: color 0.2s, filter 0.2s;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></button>
    `;
    container.appendChild(controls);

    const dropdownBtn = controls.querySelector(".model-select-btn");
    const dropdownMenu = controls.querySelector(".model-options-menu");
    const modelLabel = controls.querySelector(".model-label");
    let currentModel = savedModel;
    
    const imgDropdownBtn = controls.querySelector(".image-model-select-btn");
    const imgDropdownMenu = controls.querySelector(".image-model-options-menu");
    const imgModelLabel = controls.querySelector(".image-model-label");
    let currentImgModel = savedImgModel;

    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = dropdownMenu.classList.contains("show");
      document.dispatchEvent(new CustomEvent("closeAllPopovers"));
      if (!wasOpen) dropdownMenu.classList.add("show");
    });
    
    const imgGenerateBtn = controls.querySelector(".btn-generate-image");
    
    const updateCameraBtnState = () => {
      const hasBilling = sessionStorage.getItem("has_billing") !== "false";
      if (!hasBilling) {
         imgGenerateBtn.style.opacity = "0.5";
         imgGenerateBtn.style.cursor = "not-allowed";
         imgGenerateBtn.title = "No image generation with free tier";
         return;
      }
      
      if (customBtn.classList.contains("expanded") || variantBtn.classList.contains("expanded")) {
         imgGenerateBtn.style.opacity = "1";
         imgGenerateBtn.style.cursor = "pointer";
         imgGenerateBtn.title = "Generate image";
      } else {
         imgGenerateBtn.style.opacity = "0.5";
         imgGenerateBtn.style.cursor = "not-allowed";
         imgGenerateBtn.title = "Create a prompt first";
      }
    };

    
    imgDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (sessionStorage.getItem("has_billing") === "false") return;
      const wasOpen = imgDropdownMenu.classList.contains("show");
      document.dispatchEvent(new CustomEvent("closeAllPopovers"));
      if (!wasOpen) imgDropdownMenu.classList.add("show");
    });

    controls.querySelectorAll(".model-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        currentModel = opt.getAttribute("data-value");
        modelLabel.innerHTML = opt.innerHTML;
        sessionStorage.setItem("preferred_model", currentModel);
        sessionStorage.setItem("preferred_model_label", opt.innerHTML);
        dropdownMenu.classList.remove("show");
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
    
    controls.querySelectorAll(".image-model-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        currentImgModel = opt.getAttribute("data-value");
        imgModelLabel.innerHTML = opt.innerHTML;
        sessionStorage.setItem("preferred_image_model", currentImgModel);
        sessionStorage.setItem("preferred_image_model_label", opt.innerHTML);
        imgDropdownMenu.classList.remove("show");
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
      if (dropdownMenu) dropdownMenu.classList.remove("show");
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
    const addCopyButton = (text, exactTokens = null) => {
      const copyBtn = document.createElement("span");
      copyBtn.textContent = "✂️";
      copyBtn.title = "Copy to clipboard";
      copyBtn.style.cssText =
        "position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; cursor: pointer; padding: 4px; font-size: 14px; transition: background 0.2s;";
      copyBtn.onmouseover = () =>
        (copyBtn.style.background = "rgba(0,0,0,0.6)");
      copyBtn.onmouseout = () => (copyBtn.style.background = "rgba(0,0,0,0.3)");
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(typeof text === 'function' ? text() : text);
        copyBtn.textContent = "✓";
        setTimeout(() => (copyBtn.innerHTML = "✂️"), 1500);
      };
      outputArea.appendChild(copyBtn);
      
      const tokenLabel = document.createElement("div");
      tokenLabel.className = "variant-token-estimator";
      if (exactTokens !== null) {
          tokenLabel.textContent = exactTokens;
      }
      tokenLabel.style.cssText = "position: absolute; top: 35px; right: 5px; width: 24px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.8); pointer-events: none; font-family: inherit;";
      outputArea.appendChild(tokenLabel);
    };

    const extractNegativeText = () => {
      const clone = pre.cloneNode(true);
      const negContainers = clone.querySelectorAll(".negative-prompt-container");
      let negText = "";
      negContainers.forEach(c => {
         const strong = c.querySelector("strong");
         if (strong) strong.remove();
         negText += c.textContent.trim() + " ";
      });
      return negText.trim();
    };

    const renderVariant = () => {
      sessionStorage.setItem("odb_tab_" + storageKey, "variant");
      variantBtn.classList.add("expanded");
      customBtn.classList.remove("expanded");
      variantBtn.title = "Press to generate";
      customBtn.title = "Create edit";
      updateCameraBtnState();
      outputArea.innerHTML = "";
      const savedVariantData = sessionStorage.getItem(storageKey);
      if (savedVariantData) {
        let parsed = null;
        try {
          parsed = JSON.parse(savedVariantData);
        } catch (e) {
          parsed = { text: savedVariantData, baseTokens: null, variantTokens: null };
        }
        outputArea.style.display = "block";
        outputArea.textContent = parsed.text;
        addCopyButton(parsed.text, parsed.variantTokens);
        if (parsed.baseTokens) {
          const baseTokenUI = pre.querySelector(".token-estimator");
          if (baseTokenUI) baseTokenUI.textContent = parsed.baseTokens;
        }
        return true; // Successfully loaded from cache
      }
      return false; // Needs generation
    };

    const renderCustom = async () => {
      sessionStorage.setItem("odb_tab_" + storageKey, "custom");
      customBtn.classList.add("expanded");
      variantBtn.classList.remove("expanded");
      customBtn.title = "Edit the prompt";
      updateCameraBtnState();
      variantBtn.title = "Create variant";
      updateCameraBtnState();
      outputArea.innerHTML = "";
      outputArea.style.display = "block";
      
      const cleanPrompt = extractCleanText();
      const cleanNegative = extractNegativeText();
      
      // Inject editable area
      const editArea = document.createElement("div");
      editArea.className = "custom-edit-area";
      editArea.contentEditable = "plaintext-only";
      editArea.style.cssText = "outline: none; min-height: 20px; width: 100%; white-space: pre-wrap;";
      outputArea.appendChild(editArea);
      

      
      const cachedCustom = sessionStorage.getItem(customStorageKey);
      let customTokens = null;
      
      if (cachedCustom) {
        let parsed = null;
        try {
          parsed = JSON.parse(cachedCustom);
        } catch (e) {
          parsed = { text: cachedCustom, tokens: null };
        }
        editArea.textContent = parsed.text;
        customTokens = parsed.tokens;
      } else {
        editArea.textContent = cleanPrompt;
        const baseTokenUI = pre.querySelector(".token-estimator");
        if (baseTokenUI && baseTokenUI.textContent) {
           customTokens = parseInt(baseTokenUI.textContent);
           sessionStorage.setItem(customStorageKey, JSON.stringify({text: cleanPrompt, tokens: customTokens}));
        } else {
           // We don't know the exact count, run countTokens just for the base prompt
           const key = sessionStorage.getItem("gemini_api_key");
           if (key) {
               editArea.style.opacity = "0.5";
               try {
                 logAudit("info", "Counting base prompt tokens...");
                 const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:countTokens?key=${key}`, {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({ contents: [{ parts: [{ text: cleanPrompt + (cleanNegative ? "\nNegative prompt:\n" + cleanNegative : "") }] }] })
                 });
                 if (res.ok) {
                   const countData = await res.json();
                   customTokens = countData.totalTokens;
                   logAudit("info", `API Usage: ${customTokens} tokens counted`);
                   sessionStorage.setItem(customStorageKey, JSON.stringify({text: cleanPrompt, tokens: customTokens}));
                   if (baseTokenUI) baseTokenUI.textContent = customTokens;
                 } else {
                   logAudit("warn", `API Error [${res.status}] during token count`);
                 }
               } catch(e) {
                   logAudit("warn", "Network Exception during token count");
               }
               editArea.style.opacity = "1";
           }
        }
      }
      
      addCopyButton(() => editArea.textContent, customTokens);
      
      // Debounced exact token counting for edits
      let customTypingTimeout = null;
      let lastText = editArea.textContent;
      
      const onCustomInput = () => {
         const currentText = editArea.textContent;
         if (currentText === lastText) return;
         const currentNegative = extractNegativeText();
         
         const hasBilling = sessionStorage.getItem("has_billing") !== "false";
         const debounceMs = hasBilling ? 3000 : 5000;
         
         if (customTypingTimeout) clearTimeout(customTypingTimeout);
         
         customTypingTimeout = setTimeout(async () => {
            const key = sessionStorage.getItem("gemini_api_key");
            if (!key) return;
            
            // Strictly obey global delay
            const now = Date.now();
            window._lastVariantTime = window._lastVariantTime || 0;
            if (now - window._lastVariantTime < debounceMs) return; // Drop if another API call just happened
            
            window._lastVariantTime = now; // Lock global API usage
            
            try {
               logAudit("info", "Counting prompt edit tokens...");
               const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:countTokens?key=${key}`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ contents: [{ parts: [{ text: currentText + (currentNegative ? "\nNegative prompt:\n" + currentNegative : "") }] }] })
               });
               if (res.ok) {
                 const countData = await res.json();
                 const exactTokens = countData.totalTokens;
                 logAudit("info", `API Usage: ${exactTokens} tokens counted`);
                 lastText = currentText;
                 
                 sessionStorage.setItem(customStorageKey, JSON.stringify({text: currentText, tokens: exactTokens}));
                 
                 const label = outputArea.querySelector('.variant-token-estimator');
                 if (label) label.textContent = exactTokens;
               } else {
                 logAudit("warn", `API Error [${res.status}] during token count`);
               }
            } catch(e) {
               logAudit("warn", "Network Exception during token count");
            }
         }, debounceMs);
      };
      
      editArea.addEventListener("input", onCustomInput);
    };

    // Wire up Image Generation
    imgGenerateBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const hasBilling = sessionStorage.getItem("has_billing") !== "false";
      if (!hasBilling) return; // Disabled on free tier
      
      if (!customBtn.classList.contains("expanded") && !variantBtn.classList.contains("expanded")) {
          // Do nothing if neither is expanded
          return;
      }
      
      const key = sessionStorage.getItem("gemini_api_key");
      if (!key) return;
      
      // Determine what prompt to send
      let activePromptText = "";
      if (customBtn.classList.contains("expanded")) {
         const editArea = outputArea.querySelector(".custom-edit-area");
         activePromptText = editArea ? editArea.textContent.trim() : extractCleanText();
      } else if (variantBtn.classList.contains("expanded")) {
         const clone = outputArea.cloneNode(true);
         clone.querySelectorAll("span[title='Copy to clipboard'], .variant-token-estimator").forEach(c => c.remove());
         activePromptText = clone.textContent.trim();
      }
      
      const activeNegativeText = extractNegativeText();
      
      // Lock UI
      imgGenerateBtn.disabled = true;
      imgGenerateBtn.style.opacity = "0.8";
      imgGenerateBtn.classList.add("btn-generating");
      imgGenerateBtn.title = "Please wait...";
      
      logAudit("info", `Generating image with ${currentImgModel}...`);
      if (activeNegativeText) {
          logAudit("info", `Negative Prompt applied: "${activeNegativeText}"`);
      }
      
      try {
         const payload = {
             contents: [{ parts: [{ text: activePromptText }] }]
         };
         
         if (activeNegativeText) {
             // Standard Gemini generateContent schema does not support negativePrompt in generationConfig.
             // Instead, we isolate it in the systemInstruction layer to strictly separate it from the core prompt text!
             payload.systemInstruction = {
                 parts: [{ text: `DO NOT generate any of the following elements: ${activeNegativeText}` }]
             };
         }
         
         let targetModel = "gemini-3.1-flash-lite-image";
         if (currentImgModel === "nano-banana-2") targetModel = "gemini-3.1-flash-image";
         if (currentImgModel === "nano-banana-pro") targetModel = "gemini-3.1-pro-image";
         
         const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(payload)
         });
         
         if (res.ok) {
             const data = await res.json();
             
             let inputTokens = "Unknown";
             let outputTokens = "Unknown";
             if (data.usageMetadata) {
                 inputTokens = data.usageMetadata.promptTokenCount || inputTokens;
             }
             
             logAudit("info", `API Usage: ${inputTokens} input tokens, 1 image generated`);
             
             let imgSrc = "";
             try {
                const part = data.candidates[0].content.parts[0];
                if (part.inlineData) {
                    imgSrc = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                } else if (part.text) {
                    imgSrc = part.text; 
                }
             } catch(e) {}
             
             if (imgSrc) {
                 // Display full-screen lightbox
                 const lightbox = document.createElement("div");
                 lightbox.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 9999; cursor: pointer; opacity: 0; transition: opacity 0.3s ease;";
                 
                 const imgDisplay = document.createElement("img");
                 imgDisplay.src = imgSrc;
                 imgDisplay.style.cssText = "max-width: 90%; max-height: 90%; border: 2px solid #00ff88; box-shadow: 0 0 30px rgba(0, 255, 136, 0.4); border-radius: 4px;";
                 
                 lightbox.appendChild(imgDisplay);
                 document.body.appendChild(lightbox);
                 
                 // Fade in
                 requestAnimationFrame(() => lightbox.style.opacity = "1");
                 
                 lightbox.addEventListener("click", () => {
                     lightbox.style.opacity = "0";
                     
                     // Trigger background download on close
                     const a = document.createElement("a");
                     a.href = imgSrc;
                     a.download = `generated_${currentImgModel}_${Date.now()}.png`;
                     document.body.appendChild(a);
                     a.click();
                     document.body.removeChild(a);
                     
                     setTimeout(() => {
                         lightbox.remove();
                         showToast("Image downloaded to default location", false);
                     }, 300);
                 });
             }
         } else {
             const err = await res.json();
             showToast(`API Error [${res.status}]: ${err.error ? err.error.message : "Unknown error"}`, true);
         }
      } catch(e) {
         showToast(`Network Error: ${e.message}`, true);
      } finally {
         imgGenerateBtn.classList.remove("btn-generating");
         imgGenerateBtn.disabled = false;
         updateCameraBtnState();
      }
    });

    // Initial Load: Restore tab state, fallback to Variant if exists
    updateCameraBtnState();
    const activeTab = sessionStorage.getItem("odb_tab_" + storageKey);
    if (activeTab === "custom") {
       renderCustom();
    } else if (activeTab === "variant" || sessionStorage.getItem(storageKey)) {
       renderVariant();
    }

    customBtn.addEventListener("click", () => {
       if (!customBtn.classList.contains("expanded")) {
           renderCustom();
       }
    });

    variantBtn.addEventListener("click", async (e) => {
      // If we are just toggling back from custom and have a cache, just render it
      if (!variantBtn.classList.contains("expanded") && sessionStorage.getItem(storageKey)) {
          renderVariant();
          return;
      }
      
      // Global Debounce Lock (Cross-Entry Protection)
      const hasBilling = sessionStorage.getItem("has_billing") !== "false";
      const debounceMs = hasBilling ? 3000 : 5000;
      const now = Date.now();
      window._lastVariantTime = window._lastVariantTime || 0;
      
      if (now - window._lastVariantTime < debounceMs) {
         const remaining = Math.ceil((debounceMs - (now - window._lastVariantTime)) / 1000);
         showToast(hasBilling ? `Please wait ${remaining}s.` : `Free Tier cooldown. Please wait ${remaining}s.`, true);
         return;
      }
      window._lastVariantTime = now;

      // Toggle arrows
      variantBtn.classList.add("expanded");
      if (customBtn) customBtn.classList.remove("expanded");

      // Start marching ants animation
      variantBtn.classList.add("btn-generating");
      variantBtn.disabled = true;
      variantBtn.title = "Generating variant...";

      outputArea.style.display = "block";
      outputArea.innerHTML = "";
      outputArea.textContent = "...";
      
      // Transfer known base tokens from Custom cache before generating
      const cachedCustom = sessionStorage.getItem(customStorageKey);
      if (cachedCustom) {
         try {
           const parsedCustom = JSON.parse(cachedCustom);
           const baseTokenUI = pre.querySelector(".token-estimator");
           if (baseTokenUI && parsedCustom.tokens) {
               baseTokenUI.textContent = parsedCustom.tokens;
           }
         } catch(e) {}
      }

      try {
        const key = sessionStorage.getItem("gemini_api_key");
        logAudit("info", `Generating variant using ${currentModel}...`);
        
        const sysInstruction = "You are an introspective, expert AI prompt engineer. Deliberately construct a new, grounded variation of the following image generation prompt by thoughtfully reimagining the medium, setting, and event modifiers while strictly preserving the original core subject. Output ONLY the final raw prompt text, with no introductory or concluding commentary.\n\n";
        
        // Hardcoded token count for the system instruction (must be updated if the instruction string above ever changes)
        const sysTokens = 48;
        
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: sysInstruction + promptText }] }],
              generationConfig: { temperature: 0.6 },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const variant = data.candidates[0].content.parts[0].text.trim();

          outputArea.innerHTML = "";
          outputArea.textContent = variant;
          
          let exactBase = null;
          let exactVariant = null;
          if (data.usageMetadata) {
            exactBase = data.usageMetadata.promptTokenCount - sysTokens;
            exactVariant = data.usageMetadata.candidatesTokenCount;
            logAudit("info", `API Usage: ${data.usageMetadata.promptTokenCount} input tokens (${sysTokens} system), ${data.usageMetadata.candidatesTokenCount} output tokens`);
          }
          
          addCopyButton(variant, exactVariant);
          
          // Persist the generated variant as JSON
          sessionStorage.setItem(storageKey, JSON.stringify({
            text: variant,
            baseTokens: exactBase,
            variantTokens: exactVariant
          }));
          
          // Update base prompt UI
          if (exactBase) {
            const baseTokenUI = pre.querySelector(".token-estimator");
            if (baseTokenUI) baseTokenUI.textContent = exactBase;
          }
        } else {
          const errText = await res.text();
          console.error("Gemini API Error [" + res.status + "]:", errText);
          if (res.status === 429) {
            sessionStorage.setItem("has_billing", "false");
            showToast("Rate limit reached. Switching to 5s cooldown.", true);
          } else if (
            res.status === 400 ||
            res.status === 401 ||
            res.status === 403
          ) {
            showToast("Invalid API Key.", true);
            sessionStorage.removeItem("gemini_api_key");
            document.querySelectorAll(".generate-ui-container").forEach((el) => {
              el.style.display = "none";
            });
            openKeyModal(true);
          } else {
            showToast("API Error. Check console.", true);
          }
        }
      } catch (e) {
        console.error("Gemini API Network Exception:", e);
        showToast("Network Error", true);
      } finally {
        variantBtn.classList.remove("btn-generating");
        variantBtn.disabled = false;
        variantBtn.title = "Press to generate";
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
        if (pre && pre.style.display === "block" && !block.querySelector(".generate-ui-container")) {
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
