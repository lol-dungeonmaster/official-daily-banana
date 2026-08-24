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
      <a href="javascript:void(0)" id="ledger-btn" class="btn btn-ledger" style="position: relative; padding: 6px 10px; margin-left: 5px;" title="Logs">
        <span id="ledger-badge" style="display: none; position: absolute; top: 2px; right: 2px; width: 8px; height: 8px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 5px #00ff88;"></span>
        <svg class="ledger-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      </a>
      <div id="ledger-popover" class="gemini-popover" style="right: 0; width: max-content; min-width: 450px; max-width: calc(100vw - 20px); max-height: calc(100vh - 100px); display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: flex-start; align-items: center; gap: 8px; margin-bottom: 5px;">
          <label style="font-size:0.85em; color:#fff; margin:0;">Logs</label>
          <a href="javascript:void(0)" id="ledger-clear-btn" title="Clear Ledger" style="color: #888; transition: color 0.2s; display: flex; align-items: center;" onmouseover="this.style.color='#ff4444'" onmouseout="this.style.color='#888'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width: 20px; height: 20px; shape-rendering: crispEdges;">
              <rect x="6" y="1" width="4" height="2"/>
              <rect x="2" y="3" width="12" height="2"/>
              <rect x="3" y="6" width="10" height="9"/>
              <rect x="5" y="7" width="1" height="7" fill="rgba(0,0,0,0.5)"/>
              <rect x="7" y="7" width="2" height="7" fill="rgba(0,0,0,0.5)"/>
              <rect x="10" y="7" width="1" height="7" fill="rgba(0,0,0,0.5)"/>
              <rect x="3" y="14" width="10" height="1" fill="rgba(0,0,0,0.3)"/>
            </svg>
          </a>
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px; flex-shrink: 0;">
          <button class="btn ledger-tab active" data-tab="info" style="flex: 1; padding: 5px; font-size: 0.8em; margin: 0; background: rgba(0,255,136,0.1); color: #00ff88; border-color: rgba(0,255,136,0.3);">Info</button>
          <button class="btn ledger-tab" data-tab="warn" style="flex: 1; padding: 5px; font-size: 0.8em; margin: 0;">Warn</button>
          <button class="btn ledger-tab" data-tab="error" style="flex: 1; padding: 5px; font-size: 0.8em; margin: 0;">Error</button>
        </div>
        <div id="ledger-content" style="flex: 1; overflow-y: auto; font-size: 0.8em; color: #ccc; line-height: 1.4; word-wrap: break-word; min-height: 150px; max-height: 60vh;">
        </div>
      </div>

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
// stride-ignore: Hardcoded UI template HTML is safe from XSS
