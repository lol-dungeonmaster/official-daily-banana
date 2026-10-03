function initCollapse(win, doc) {
  doc.querySelectorAll(".collapsible-code").forEach((container) => {
    const button = container.querySelector("button");
    const pre = container.querySelector("pre");
    const article = container.closest("article");
    const hasMultiStep =
      article &&
      article.dataset.tags &&
      article.dataset.tags.includes("multi-step");

    pre.style.display = "none";
    pre.style.position = "relative";
    const codeBlock = pre.querySelector("code");

    if (codeBlock) {
      codeBlock.style.display = "block";
      codeBlock.style.paddingRight = "40px";
      codeBlock.style.boxSizing = "border-box";

      // --- 1. Carousel Parsing Logic ---
      const paragraphs = Array.from(codeBlock.children).filter(
        (el) => el.tagName === "P" || el.textContent.trim() !== "",
      );

      const isSubheading = (el) => {
        const em =
          el.querySelector("strong em") || el.querySelector("em strong");
        if (em && em.textContent.trim() === el.textContent.trim()) return true;
        return false;
      };
      const isHeader = (el) => {
        const strong = el.querySelector("strong");
        if (!strong) return false;
        return strong.textContent
          .trim()
          .match(
            /^(Scene \d+|Variant [A-Z0-9]|\d+\.\s+[A-Za-z0-9]|[A-Za-z0-9\s]+:\s*\[|[A-Za-z0-9\s]+:)/i,
          );
      };

      let basePrompt = [];
      let scenes = [];
      let currentScene = null;
      let appendixElements = [];

      paragraphs.forEach((p, index) => {
        if (
          p.textContent.includes("Appendix:") ||
          p.textContent.includes("**Appendix")
        ) {
          appendixElements.push(p);
        } else if (isHeader(p) && appendixElements.length === 0) {
          currentScene = { header: p, content: [] };
          let j = index - 1;
          const yanked = [];
          while (j >= 0 && isSubheading(paragraphs[j])) {
            const prevP = paragraphs[j];
            if (scenes.length > 0) {
              const lastScene = scenes[scenes.length - 1];
              const idx = lastScene.content.indexOf(prevP);
              /* v8 ignore next */
              if (idx !== -1) lastScene.content.splice(idx, 1);
            } else {
              const idx = basePrompt.indexOf(prevP);
              /* v8 ignore next */
              if (idx !== -1) basePrompt.splice(idx, 1);
            }
            yanked.unshift(prevP);
            j--;
          }
          currentScene.content.push(...yanked);
          scenes.push(currentScene);
        } else {
          if (appendixElements.length > 0) {
            appendixElements.push(p);
          } else if (currentScene) {
            currentScene.content.push(p);
          } else {
            basePrompt.push(p);
          }
        }
      });

      if (scenes.length > 1) {
        const tabBar = doc.createElement("div");
        tabBar.className = "prompt-tab-bar";
        tabBar.style.cssText =
          "display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;";

        const tabs = [];
        const contents = [];

        scenes.forEach((scene, index) => {
          const tab = doc.createElement("button");
          tab.className = "prompt-tab-btn";
          tab.textContent = scene.header.textContent
            .replace(/(:|\().*/, "")
            .trim();
          tab.style.cssText =
            "background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;";

          const contentDiv = doc.createElement("div");
          contentDiv.className = "sub-prompt";
          contentDiv.dataset.index = index;
          contentDiv.style.display = index === 0 ? "block" : "none";

          /* v8 ignore next 3 */
          if (hasMultiStep) {
            basePrompt.forEach((bp) =>
              contentDiv.appendChild(bp.cloneNode(true)),
            );
          }
          contentDiv.appendChild(scene.header.cloneNode(true));
          scene.content.forEach((p) =>
            contentDiv.appendChild(p.cloneNode(true)),
          );

          scene.header.remove();
          scene.content.forEach((p) => p.remove());

          /* v8 ignore next */ codeBlock.insertBefore(
            contentDiv,
            appendixElements.length > 0 ? appendixElements[0] : null,
          );
          tabs.push(tab);
          contents.push(contentDiv);
          tabBar.appendChild(tab);

          tab.onclick = () => {
            tabs.forEach((t) => {
              t.style.background = "rgba(0,0,0,0.3)";
              t.style.border = "1px solid rgba(255,255,255,0.2)";
            });
            tab.style.background = "rgba(0,255,136,0.1)";
            tab.style.border = "1px solid rgba(0,255,136,0.3)";
            contents.forEach((c) => (c.style.display = "none"));
            contentDiv.style.display = "block";
            codeBlock.dataset.activeTab = index;
            pre.dispatchEvent(new Event("tabchanged"));
          };
        });

        /* v8 ignore next 3 */
        if (hasMultiStep) {
          basePrompt.forEach((p) => p.remove());
        }

        // --- NEW: Clean up orphaned whitespace TextNodes ---
        const codeEl = pre.querySelector("code");
        if (codeEl) {
          Array.from(codeEl.childNodes).forEach((node) => {
            if (
              node.nodeType === Node.TEXT_NODE &&
              node.textContent.trim() === ""
            ) {
              node.remove();
            }
          });
        }

        codeBlock.dataset.activeTab = 0;
        tabs[0].onclick();
        codeBlock.insertBefore(tabBar, codeBlock.firstChild);
      }

      // --- 2. Negative Prompt Hoisting ---
      const negativeRegex =
        /(?:<strong>)?(?:\[[^\]]*negative[^\]]*\]|negative\s*prompt\s*:)(?:<\/strong>)?\s*(?:<br\s*\/?>)?\s*([\s\S]*?)\s*(?=(?:<strong>)?(?:\[|\bnegative\b)|$)/i;

      const elementsToProcess =
        scenes.length > 1
          ? Array.from(codeBlock.querySelectorAll(".sub-prompt > p"))
          : Array.from(codeBlock.children);

      elementsToProcess.forEach((child) => {
        let match;
        while ((match = child.innerHTML.match(negativeRegex))) {
          const fullMatch = match[0];
          const negativeText = match[1].replace(/<[^>]+>/g, "").trim();

          child.innerHTML = child.innerHTML.replace(fullMatch, "");
          let targetNode = child;
          let parent = child.parentNode;

          if (child.innerHTML.replace(/<[^>]+>/g, "").trim() === "") {
            targetNode = child.previousElementSibling || child;
            child.remove();
          }

          const negContainer = doc.createElement("div");
          negContainer.className = "negative-prompt-container";
          negContainer.innerHTML = `<strong style="color: #ff4a4a;">Negative prompt:</strong>\n${negativeText}`;

          if (targetNode && targetNode.parentNode) {
            targetNode.parentNode.insertBefore(negContainer, targetNode);
          } else /* v8 ignore next 3 */ if (parent) {
            parent.insertBefore(negContainer, parent.firstChild);
          }
        }
      });
    }

    const extractCleanText = () => {
      const clone = pre.cloneNode(true);

      const btnInClone = clone.querySelector("span[title='Copy to clipboard']");
      /* v8 ignore next */
      if (btnInClone) btnInClone.remove();
      const tokensInClone = clone.querySelector(".token-estimator");
      /* v8 ignore next */
      if (tokensInClone) tokensInClone.remove();

      clone
        .querySelectorAll(".generate-ui-container, .negative-prompt-container")
        .forEach((c) => c.remove());

      let formattedText = "";
      const codeClone = clone.querySelector("code");

      if (codeClone) {
        // If there's an active tab, only copy that tab
        const activeTabIdx = codeClone.dataset.activeTab;
        let nodesToCopy = codeClone.childNodes;
        if (activeTabIdx !== undefined) {
          const activeSubPrompt = codeClone.querySelector(
            `.sub-prompt[data-index="${activeTabIdx}"]`,
          );
          /* v8 ignore next 3 */
          if (activeSubPrompt) {
            nodesToCopy = activeSubPrompt.childNodes;
          }
        }

        const chunks = [];
        nodesToCopy.forEach((node) => {
          /* v8 ignore next */
          if (
            node.nodeType === Node.ELEMENT_NODE ||
            node.nodeType === Node.TEXT_NODE
          ) {
            if (node.tagName === "BR") {
              chunks.push("\n");
            } else if (node.tagName === "P" || node.tagName === "DIV") {
              let text = node.textContent.replace(/[ \t]+/g, " ").trim();
              if (text) chunks.push(text);
            } else {
              let text = node.textContent.trim();
              if (text) chunks.push(text);
            }
          }
        });
        formattedText = chunks.join("\n\n");
      } else {
        formattedText = clone.textContent.trim();
      }

      // Cut off Appendix
      const appendixMatch = formattedText.match(/(\*\*|)Appendix:/i);
      if (appendixMatch) {
        formattedText = formattedText.substring(0, appendixMatch.index).trim();
      }

      return formattedText;
    };

    const copyBtn = doc.createElement("span");
    copyBtn.textContent = "✂️";
    copyBtn.title = "Copy to clipboard";
    copyBtn.style.cssText =
      "position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; cursor: pointer; padding: 4px; font-size: 14px; transition: background 0.2s; z-index: 10;";
    copyBtn.onmouseover = () => (copyBtn.style.background = "rgba(0,0,0,0.6)");
    copyBtn.onmouseout = () => (copyBtn.style.background = "rgba(0,0,0,0.3)");

    const tokenLabel = doc.createElement("div");
    tokenLabel.className = "token-estimator";
    tokenLabel.textContent = "";
    tokenLabel.style.cssText =
      "position: absolute; top: 35px; right: 5px; width: 24px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.8); pointer-events: none; font-family: inherit; z-index: 10;";
    pre.appendChild(tokenLabel);

    copyBtn.onclick = (e) => {
      e.stopPropagation();
      win.navigator.clipboard.writeText(extractCleanText());
      copyBtn.textContent = "✓";
      setTimeout(() => (copyBtn.innerHTML = "✂️"), 1500);
    };
    pre.appendChild(copyBtn);

    button.addEventListener("click", () => {
      const isOpen = pre.style.display === "block";
      pre.style.display = isOpen ? "none" : "block";
      button.classList.toggle("expanded", !isOpen);
    });
  });
}

/* v8 ignore next 7 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { initCollapse };
} else {
  document.addEventListener("DOMContentLoaded", function () {
    initCollapse(window, document);
  });
}
