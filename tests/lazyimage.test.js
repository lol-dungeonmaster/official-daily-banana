import { describe, it, expect, vi, beforeEach } from "vitest";
import { initLazyImages } from "../assets/js/lazyimage.js";

describe("lazyimage.js", () => {
  let mockObserve;
  let mockUnobserve;
  let MockObserver;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();

    MockObserver = class {
      constructor(callback) {
        this.observe = mockObserve;
        this.unobserve = mockUnobserve;
        this.trigger = callback; // expose callback for manual triggering
      }
    };

    document.body.innerHTML = `
      <img class="lazy-img" data-src="test1.jpg" />
      <img class="lazy-img" data-src="test2.jpg" />
    `;
    vi.useFakeTimers();
  });

  it("observes all lazy images", () => {
    initLazyImages(document, MockObserver);
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it("instantly loads images on initial load if intersecting", () => {
    const obs = initLazyImages(document, MockObserver);
    const img = document.querySelector(".lazy-img");

    obs.trigger(
      [
        {
          isIntersecting: true,
          target: img,
        },
      ],
      obs,
    );

    expect(img.src).toContain("test1.jpg");
    expect(mockUnobserve).toHaveBeenCalledWith(img);

    img.onload();
    expect(img.classList.contains("loaded")).toBe(true);
  });

  it("debounces images on subsequent scrolls", () => {
    const obs = initLazyImages(document, MockObserver);
    const img = document.querySelectorAll(".lazy-img")[1];

    obs.trigger([], obs);

    obs.trigger(
      [
        {
          isIntersecting: true,
          target: img,
        },
      ],
      obs,
    );

    expect(img.src).not.toContain("test2.jpg");

    vi.advanceTimersByTime(500);
    expect(img.src).toContain("test2.jpg");
    expect(mockUnobserve).toHaveBeenCalledWith(img);

    img.onload();
    expect(img.classList.contains("loaded")).toBe(true);
  });

  it("cancels debounce if image leaves viewport early", () => {
    const obs = initLazyImages(document, MockObserver);
    const img = document.querySelectorAll(".lazy-img")[1];

    obs.trigger([], obs);

    obs.trigger(
      [
        {
          isIntersecting: true,
          target: img,
        },
      ],
      obs,
    );

    expect(img.dataset.scrollTimeout).toBeDefined();

    obs.trigger(
      [
        {
          isIntersecting: false,
          target: img,
        },
      ],
      obs,
    );

    expect(img.dataset.scrollTimeout).toBeUndefined();

    vi.advanceTimersByTime(500);
    expect(img.src).not.toContain("test2.jpg");
  });

  it("does nothing if image leaves viewport but no timeout exists", () => {
    const obs = initLazyImages(document, MockObserver);
    const img = document.querySelectorAll(".lazy-img")[1];

    obs.trigger([], obs);

    obs.trigger(
      [
        {
          isIntersecting: false,
          target: img,
        },
      ],
      obs,
    );

    expect(img.dataset.scrollTimeout).toBeUndefined();
  });
});
