import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initAudioPlayer } from "../assets/js/audio-player.js";

describe("audio-player.js", () => {
  let fetchMock;
  let consoleErrorMock;
  let getBoundingClientRectMock;
  let cancelAnimationMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    consoleErrorMock = vi.fn();
    cancelAnimationMock = vi.fn();

    getBoundingClientRectMock = vi.fn(() => ({
      top: 10,
      bottom: 20,
    }));

    // Setup window mock
    window = {
      innerHeight: 1000,
      addEventListener: vi.fn(),
      fetch: fetchMock,
      console: {
        error: consoleErrorMock,
      },
    };

    // Create base DOM
    document.body.innerHTML = `
      <section id="downloads"></section>
    `;

    // Mock HTMLMediaElement prototype
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.load = vi.fn();

    // Mock animate
    HTMLElement.prototype.animate = vi.fn(() => ({
      cancel: cancelAnimationMock,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns early if #downloads section is missing", () => {
    document.body.innerHTML = "";
    initAudioPlayer(window, document);
    // The script adds event listeners BEFORE checking for #downloads
    expect(window.addEventListener).toHaveBeenCalled();
  });

  it("initializes and handles empty track list gracefully", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    });

    initAudioPlayer(window, document);
    await new Promise((r) => setTimeout(r, 0));

    const container = document.getElementById("flow-music-player");
    expect(container.style.display).toBe("none");
  });

  it("handles fetch failure gracefully", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    initAudioPlayer(window, document);
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleErrorMock).toHaveBeenCalled();
    const container = document.getElementById("flow-music-player");
    expect(container).not.toBeNull();
  });

  it("loads tracks and builds dropdown menu", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          { title: "Track 1", file: "t1.mp3", space_url: "s1" },
          { title: "Track 2", file: "t2.mp3", space_url: "s2" },
        ]),
    });

    vi.useFakeTimers();
    initAudioPlayer(window, document);

    await vi.runAllTimersAsync();

    const container = document.getElementById("flow-music-player");
    expect(container.style.opacity).toBe("1");

    const trackMenu = document.querySelector(".fade-dropdown");
    expect(trackMenu.children.length).toBe(2);

    // Test track menu selection
    trackMenu.children[1].click(); // Click Track 2
    expect(trackMenu.classList.contains("show")).toBe(false);

    vi.useRealTimers();
  });

  it("handles play, pause, and stop controls", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          { title: "Track 1", file: "t1.mp3", space_url: "s1" },
        ]),
    });

    vi.useFakeTimers();
    initAudioPlayer(window, document);
    await vi.runAllTimersAsync();

    const playBtn = document.querySelector("a[title='Play']");
    const stopBtn = document.querySelector("a[title='Stop']");
    const audioEl = document.getElementById("flow-audio-el");

    // Test play
    Object.defineProperty(audioEl, "paused", {
      value: true,
      configurable: true,
    });
    playBtn.click();
    await vi.runAllTimersAsync();
    expect(audioEl.play).toHaveBeenCalled();
    expect(playBtn.title).toBe("Pause");

    // Test pause
    Object.defineProperty(audioEl, "paused", {
      value: false,
      configurable: true,
    });
    playBtn.click();
    expect(audioEl.pause).toHaveBeenCalled();
    expect(playBtn.title).toBe("Play");

    // Test stop
    stopBtn.click();
    expect(audioEl.pause).toHaveBeenCalledTimes(3);
    expect(audioEl.load).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("handles track ending event", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          { title: "Track 1", file: "t1.mp3", space_url: "s1" },
        ]),
    });

    vi.useFakeTimers();
    initAudioPlayer(window, document);
    await vi.runAllTimersAsync();

    const audioEl = document.getElementById("flow-audio-el");
    audioEl.dispatchEvent(new Event("ended"));
    expect(audioEl.load).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("handles dropdown toggles, body clicks, and popovers", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          { title: "Track 1", file: "t1.mp3", space_url: "s1" },
        ]),
    });

    vi.useFakeTimers();
    initAudioPlayer(window, document);
    await vi.runAllTimersAsync();

    const trackBtn = document.querySelector("a[title='Change track']");
    const trackMenu = document.querySelector(".fade-dropdown");

    // Hover effects
    trackBtn.dispatchEvent(new Event("mouseover"));
    trackBtn.dispatchEvent(new Event("mouseout"));

    // Toggle Dropdown
    trackBtn.click();
    expect(trackMenu.classList.contains("show")).toBe(true);
    trackBtn.click(); // Click when already open to hit !wasOpen == false branch

    // Close All Popovers
    document.dispatchEvent(new Event("closeAllPopovers"));
    expect(trackMenu.classList.contains("show")).toBe(false);

    // Click Body
    trackBtn.click();
    document.dispatchEvent(new Event("click"));
    expect(trackMenu.classList.contains("show")).toBe(false);

    // Scroll event when open
    trackBtn.click();
    const scrollHandler = window.addEventListener.mock.calls.find(
      (c) => c[0] === "scroll",
    )[1];

    // Mock rect to be out of bounds
    trackMenu.getBoundingClientRect = vi.fn(() => ({ top: -100, bottom: -50 }));
    scrollHandler();
    scrollHandler(); // Scroll again while closed to hit trackMenu.classList.contains('show') == false branch
    expect(trackMenu.classList.contains("show")).toBe(false);

    vi.useRealTimers();
  });

  it("handles long track names with scrolling animation", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          {
            title: "Very Long Track Name That Overflows",
            file: "t1.mp3",
            space_url: "s1",
          },
        ]),
    });

    vi.useFakeTimers();

    // Mock getters for all HTMLElements globally since the nodes are created dynamically
    const scrollWidthSpy = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockReturnValue(200);
    const clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(100);
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockReturnValue(150);

    initAudioPlayer(window, document);
    await vi.runAllTimersAsync();

    // Test that the animation was created
    const label = document.querySelector(".track-label");
    expect(label.innerHTML).toContain("scroll-part-1");
    expect(HTMLElement.prototype.animate).toHaveBeenCalled();

    // Load track again to test animation cancellation
    const trackMenu = document.querySelector(".fade-dropdown");
    trackMenu.children[0].click();
    await vi.runAllTimersAsync();

    expect(cancelAnimationMock).toHaveBeenCalled();

    scrollWidthSpy.mockRestore();
    clientWidthSpy.mockRestore();
    offsetWidthSpy.mockRestore();
    vi.useRealTimers();
  });

  it("handles playback failure gracefully", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          { title: "Track 1", file: "t1.mp3", space_url: "s1" },
        ]),
    });

    vi.useFakeTimers();
    initAudioPlayer(window, document);
    await vi.runAllTimersAsync();

    const playBtn = document.querySelector("a[title='Play']");
    const audioEl = document.getElementById("flow-audio-el");

    // Mock play to reject
    audioEl.play.mockRejectedValueOnce(new Error("Autoplay blocked"));
    Object.defineProperty(audioEl, "paused", {
      value: true,
      configurable: true,
    });

    playBtn.click();
    await vi.runAllTimersAsync();

    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Playback failed:",
      expect.any(Error),
    );
    vi.useRealTimers();
  });
});
