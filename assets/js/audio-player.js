document.addEventListener("DOMContentLoaded", () => {
  const downloadsSection = document.getElementById("downloads");
  if (!downloadsSection) return;

  // Inject custom CSS for hover glow
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    #flow-music-player a svg {
      opacity: 0.8;
      transition: all 0.3s ease;
    }
    #flow-music-player a:hover svg {
      opacity: 1;
      filter: drop-shadow(0 0 8px #00ff88);
    }
    .track-option {
      padding: 6px 12px;
      cursor: pointer;
      color: #cbcbcb;
      font-size: 0.85em;
      font-family: Monaco, "Bitstream Vera Sans Mono", "Lucida Console", Terminal, monospace;
      transition: background 0.2s;
    }
    .track-option:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }
  `;
  document.head.appendChild(styleEl);

  const playIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;"><path d="M8 5v14l11-7z"/></svg>`;
  const pauseIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  const stopIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;"><path d="M6 6h12v12H6z"/></svg>`;
  const downloadIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
  const spaceIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

  // Create Player Container
  const playerContainer = document.createElement("div");
  playerContainer.id = "flow-music-player";
  playerContainer.className = "toggle-group";
  playerContainer.style.cssText = "display: inline-flex; align-items: stretch; gap: 0; height: 38px; pointer-events: none; opacity: 0.5; transition: opacity 0.3s ease;";

  // Audio Element (hidden)
  const audioEl = document.createElement("audio");
  audioEl.id = "flow-audio-el";
  playerContainer.appendChild(audioEl);

  // Play/Pause Button
  const playBtn = document.createElement("a");
  playBtn.className = "btn";
  playBtn.style.cssText = "margin: 0; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; border-right: none; border-top-right-radius: 0; border-bottom-right-radius: 0;";
  playBtn.innerHTML = playIcon;
  playBtn.title = "Play";
  playBtn.href = "javascript:void(0)";

  // Stop Button
  const stopBtn = document.createElement("a");
  stopBtn.className = "btn";
  stopBtn.style.cssText = "margin: 0; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; border-radius: 0; border-right: none;";
  stopBtn.innerHTML = stopIcon;
  stopBtn.title = "Stop";
  stopBtn.href = "javascript:void(0)";

  // Custom Track Dropdown Container
  const dropdownContainer = document.createElement("div");
  dropdownContainer.style.cssText = "position: relative; display: inline-flex; align-items: stretch;";

  // Dropdown Button
  const trackBtn = document.createElement("a");
  trackBtn.className = "btn";
  trackBtn.style.cssText = "margin: 0; padding: 0 6px; display: inline-flex; align-items: center; justify-content: space-between; gap: 4px; border-radius: 0; border-right: none; font-size: 0.85em; font-family: Monaco, 'Bitstream Vera Sans Mono', 'Lucida Console', Terminal, monospace; cursor: pointer; text-decoration: none; overflow: hidden;";
  
  // Track Label Scroller
  const labelMask = document.createElement("div");
  labelMask.style.cssText = "width: 100px; overflow: hidden; white-space: nowrap; display: inline-flex; align-items: center;";
  const trackLabel = document.createElement("span");
  trackLabel.className = "track-label";
  trackLabel.style.cssText = "display: inline-block;";
  trackLabel.textContent = "Loading...";
  labelMask.appendChild(trackLabel);

  const caret = document.createElement("span");
  caret.style.cssText = "font-size: 0.8em; opacity: 0.7; pointer-events: none;";
  caret.textContent = "▼";

  trackBtn.appendChild(labelMask);
  trackBtn.appendChild(caret);

  // Dropdown Menu
  const trackMenu = document.createElement("div");
  trackMenu.className = "fade-dropdown";
  trackMenu.style.cssText = " position: absolute; top: 100%; left: 0; margin-top: 4px; background: rgba(0, 49, 43, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px 0; flex-direction: column; z-index: 2000; min-width: max-content; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";

  dropdownContainer.appendChild(trackBtn);
  dropdownContainer.appendChild(trackMenu);

  // Download Button
  const downloadBtn = document.createElement("a");
  downloadBtn.className = "btn";
  downloadBtn.style.cssText = "margin: 0; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; border-radius: 0; border-right: none; text-decoration: none;";
  downloadBtn.innerHTML = downloadIcon;
  downloadBtn.title = "Download";
  downloadBtn.setAttribute("download", "");

  // Space Button
  const spaceBtn = document.createElement("a");
  spaceBtn.className = "btn";
  spaceBtn.style.cssText = "margin: 0; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; border-top-left-radius: 0; border-bottom-left-radius: 0; text-decoration: none;";
  spaceBtn.innerHTML = spaceIcon;
  spaceBtn.title = "Remix this track";
  spaceBtn.target = "_blank";

  // Append controls to container
  playerContainer.appendChild(playBtn);
  playerContainer.appendChild(stopBtn);
  playerContainer.appendChild(dropdownContainer);
  playerContainer.appendChild(downloadBtn);
  playerContainer.appendChild(spaceBtn);

  // Append immediately so it renders instantly alongside other header controls
  downloadsSection.appendChild(playerContainer);

  // Toggle Dropdown
  trackBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    trackMenu.classList.toggle("show");
  });
  document.addEventListener("click", () => {
    trackMenu.classList.remove("show");
  });

  // Track active animation to cancel it on switch
  let currentAnimation = null;

  // Load JSON and initialize
  fetch("assets/data/tracks.json")
    .then(response => response.json())
    .then(tracks => {
      if (!tracks || tracks.length === 0) {
        playerContainer.style.display = "none";
        return;
      }

      // Re-enable player container now that loading is complete
      playerContainer.style.pointerEvents = "auto";
      playerContainer.style.opacity = "1";

      // Populate custom dropdown menu
      tracks.forEach((track, index) => {
        const option = document.createElement("div");
        option.className = "track-option";
        option.textContent = track.title;
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          loadTrack(index);
          trackMenu.classList.remove("show");
        });
        trackMenu.appendChild(option);
      });

      // Function to load a track
      const loadTrack = (index) => {
        const track = tracks[index];
        trackLabel.textContent = track.title;
        
        // Handle Scrolling Logic
        if (currentAnimation) currentAnimation.cancel();
        trackLabel.style.transform = "translateX(0)";
        
        // Wait a tick for the DOM to update width
        setTimeout(() => {
          const overflowDistance = trackLabel.scrollWidth - labelMask.clientWidth;
          if (overflowDistance > 0) {
            // It overflows, so let's set up a seamless infinite scroll.
            const originalText = track.title;
            const spacer = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"; // 6 spaces
            
            trackLabel.innerHTML = `<span id="scroll-part-1">${originalText}${spacer}</span><span>${originalText}</span>`;
            
            // Wait another tick for the DOM to render the new innerHTML
            setTimeout(() => {
              const part1 = trackLabel.querySelector("#scroll-part-1");
              if (!part1) return;
              const loopDistance = part1.offsetWidth;
              
              currentAnimation = trackLabel.animate([
                { transform: 'translateX(0)' },
                { transform: `translateX(-${loopDistance}px)` }
              ], {
                duration: loopDistance * 45, // Speed based on length (slower)
                direction: 'normal',
                iterations: Infinity,
                easing: 'linear',
                delay: 1000 // Wait 1 second before first scroll
              });
            }, 20);
          }
        }, 50);
        
        // Stop any currently playing track
        audioEl.pause();
        audioEl.currentTime = 0;
        playBtn.innerHTML = playIcon;
        playBtn.title = "Play";
        
        // Update DOM elements
        audioEl.src = track.file;
        downloadBtn.href = track.file;
        spaceBtn.href = track.space_url;
      };

      // Load initial track
      loadTrack(0);

      // Handle Play/Pause
      playBtn.addEventListener("click", () => {
        if (audioEl.paused) {
          audioEl.play().catch(err => console.error("Playback failed:", err));
          playBtn.innerHTML = pauseIcon;
          playBtn.title = "Pause";
        } else {
          audioEl.pause();
          playBtn.innerHTML = playIcon;
          playBtn.title = "Play";
        }
      });

      // Handle Stop
      stopBtn.addEventListener("click", () => {
        audioEl.pause();
        audioEl.currentTime = 0;
        playBtn.innerHTML = playIcon;
        playBtn.title = "Play";
      });

      // Handle audio ending naturally
      audioEl.addEventListener("ended", () => {
        playBtn.innerHTML = playIcon;
        playBtn.title = "Play";
        audioEl.currentTime = 0;
      });
    })
    .catch(err => {
      console.error("Failed to load Flow Music tracks:", err);
      trackLabel.textContent = "Error";
    });
});
