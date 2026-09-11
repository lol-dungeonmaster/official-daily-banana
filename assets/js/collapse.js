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

      // Enhanced Regex: Case-insensitive (/i) to catch [NEGATIVE] as well as [Negative]
      const negativeRegex = /(?:<strong>)?(?:\[[^\]]*negative[^\]]*\]|negative\s*prompt\s*:)(?:<\/strong>)?\s*(?:<br\s*\/?>)?\s*([\s\S]*?)\s*(?=(?:<strong>)?(?:\[|\bnegative\b)|$)/i;
      
      // Iterate over each child node (usually <p> tags) to keep negative prompts coupled to their original paragraphs
      Array.from(codeBlock.children).forEach((child) => {
        let match;
        while ((match = child.innerHTML.match(negativeRegex))) {
          const fullMatch = match[0];
          const negativeText = match[1].replace(/<[^>]+>/g, '').trim();
          
          // Remove the negative prompt segment from the child's HTML
          child.innerHTML = child.innerHTML.replace(fullMatch, '');
          
          let targetNode = child;
          
          // If stripping the negative prompt left the paragraph completely empty (meaning it was isolated in its own <p> tag)
          if (child.innerHTML.replace(/<[^>]+>/g, '').trim() === '') {
             // Redirect the target to the preceding paragraph (the positive prompt it belongs to)
             targetNode = child.previousElementSibling || child;
             child.remove(); // Safely destroy the empty paragraph so it doesn't leave a gap
          }
          
          // Build the isolated UI container (styles handled by style.scss)
          const negContainer = document.createElement("div");
          negContainer.className = "negative-prompt-container";
          
          negContainer.innerHTML = `<strong style="color: #ff4a4a;">Negative prompt:</strong>\n${negativeText}`;
          
          // Insert the negative prompt container immediately ABOVE the target paragraph, with its CSS arrow pointing down to it
          if (targetNode.parentNode) {
            targetNode.parentNode.insertBefore(negContainer, targetNode);
          }
        }
      });
    }

    // Inject copy to clipboard button for base prompt
    // Extract clean text content, excluding the button's own text and any generated variants/negatives
    const extractCleanText = () => {
      const clone = pre.cloneNode(true);
      
      const btnInClone = clone.querySelector("span[title='Copy to clipboard']");
      if (btnInClone) btnInClone.remove();
      const tokensInClone = clone.querySelector(".token-estimator");
      if (tokensInClone) tokensInClone.remove();
      
      const variantContainers = clone.querySelectorAll(".generate-ui-container");
      variantContainers.forEach(c => c.remove());

      const negativeContainers = clone.querySelectorAll(".negative-prompt-container");
      negativeContainers.forEach(c => c.remove());
      
      let formattedText = "";
      const codeClone = clone.querySelector("code");
      if (codeClone) {
        codeClone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
        const chunks = [];
        codeClone.childNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent.trim();
            text = text.replace(/[ \t]+/g, ' '); 
            if (text) chunks.push(text);
          }
        });
        formattedText = chunks.join("\n\n");
      } else {
        formattedText = clone.textContent.trim();
      }
      return formattedText;
    };

    const copyBtn = document.createElement("span");
    copyBtn.textContent = "✂️";
    copyBtn.title = "Copy to clipboard";
    copyBtn.style.cssText =
      "position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; cursor: pointer; padding: 4px; font-size: 14px; transition: background 0.2s; z-index: 10;";
    copyBtn.onmouseover = () => (copyBtn.style.background = "rgba(0,0,0,0.6)");
    copyBtn.onmouseout = () => (copyBtn.style.background = "rgba(0,0,0,0.3)");
    
    const tokenLabel = document.createElement("div");
    tokenLabel.className = "token-estimator";
    tokenLabel.textContent = "";
    tokenLabel.style.cssText = "position: absolute; top: 35px; right: 5px; width: 24px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.8); pointer-events: none; font-family: inherit; z-index: 10;";
    pre.appendChild(tokenLabel);

    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(extractCleanText());
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
