document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".collapsible-code").forEach((container) => {
    const button = container.querySelector("button");
    const pre = container.querySelector("pre");

    pre.style.display = "none";
    pre.style.position = "relative"; // Ensure absolute copy button anchors to pre
    const codeBlock = pre.querySelector("code");
    if (codeBlock) {
      codeBlock.style.display = "block";
      codeBlock.style.paddingRight = "40px";
      codeBlock.style.boxSizing = "border-box";
    }

    // Inject copy to clipboard button for base prompt
    const copyBtn = document.createElement("span");
    copyBtn.textContent = "✂️";
    copyBtn.title = "Copy to clipboard";
    copyBtn.style.cssText =
      "position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; cursor: pointer; padding: 4px; font-size: 14px; transition: background 0.2s; z-index: 10;";
    copyBtn.onmouseover = () => (copyBtn.style.background = "rgba(0,0,0,0.6)");
    copyBtn.onmouseout = () => (copyBtn.style.background = "rgba(0,0,0,0.3)");
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      // Extract clean text content, excluding the button's own text and any generated variants
      const clone = pre.cloneNode(true);
      
      const btnInClone = clone.querySelector("span[title='Copy to clipboard']");
      if (btnInClone) btnInClone.remove();
      
      const variantContainer = clone.querySelector(".generate-ui-container");
      if (variantContainer) variantContainer.remove();
      
      navigator.clipboard.writeText(clone.textContent.trim());
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
});
