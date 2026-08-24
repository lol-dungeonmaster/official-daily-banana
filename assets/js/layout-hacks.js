document.addEventListener("DOMContentLoaded", () => {
  // dynamically modify the github pages default layout so it bypasses build restrictions
  const downloadsSection = document.getElementById("downloads");
  if (downloadsSection) {
    downloadsSection.style.cssText =
      "position: relative; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;";

    // Upgrade the default GitHub button
    const githubBtn = downloadsSection.querySelector(".btn-github");
    if (githubBtn) {
      githubBtn.innerHTML = `<svg class="github-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>View on GitHub`;
    }

    // Inject AI Studio Button
    const aiContainer = document.createElement("div");
    aiContainer.style.cssText = "position: relative; display: inline-block;";
    aiContainer.innerHTML = `
      <a href="javascript:void(0)" id="gemini-key-btn" class="btn btn-gemini">
        <svg class="gemini-icon" viewBox="0 0 25 25" fill="currentColor"><path d="M19 2.5C19.5 5.5 21.5 7.5 24.5 8C21.5 8.5 19.5 10.5 19 13.5C18.5 10.5 16.5 8.5 13.5 8C16.5 7.5 18.5 5.5 19 2.5ZM9.5 5C10.1 9.7 13.8 13.4 18.5 14C13.8 14.6 10.1 18.3 9.5 23C8.9 18.3 5.2 14.6 0.5 14C5.2 13.4 8.9 9.7 9.5 5Z" /></svg>
        AI Studio
      </a>
      <div id="gemini-popover" class="gemini-popover">
        <label style="font-size:0.85em; margin-bottom: 5px; color:#fff;">Gemini / Nano Banana API Key</label>
        <input type="text" id="gemini-key-input" placeholder="AIzaSy..." style="padding: 8px; border-radius: 4px; border: 1px solid #555; background: rgba(0,0,0,0.3); color: #fff; width: 330px;" />
        <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
          <button id="gemini-key-cancel" class="btn" style="padding: 6px 12px; font-size:0.8em; margin:0;">Cancel</button>
          <button id="gemini-key-confirm" class="btn" style="padding: 6px 12px; font-size:0.8em; margin:0;">Confirm</button>
        </div>
      </div>
    `;
    downloadsSection.appendChild(aiContainer);
  }

  document.body.id = "top";
});
