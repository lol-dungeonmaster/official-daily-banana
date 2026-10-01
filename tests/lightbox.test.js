import { describe, it, expect, vi, beforeEach } from "vitest";
import { initLightbox } from "../assets/js/lightbox.js";

describe("lightbox.js", () => {
  beforeEach(() => {
    window = {
      getComputedStyle: vi.fn(() => ({ objectFit: "contain" })),
    };

    document.body.innerHTML = `
      <div id="lightbox">
        <img id="lightbox-img" src="" />
        <a id="lightbox-link" href=""></a>
        <button class="lightbox-close">X</button>
        <div id="lightbox-toggle-group">
          <button id="lightbox-prev-btn">Prev</button>
          <button id="lightbox-next-btn">Next</button>
        </div>
      </div>

      <!-- Normal image -->
      <img id="img-normal" src="normal.jpg" />
      
      <!-- No-upscale image -->
      <img id="img-no-upscale" class="no-upscale" src="no-upscale.jpg" />
      
      <!-- Excluded images -->
      <img id="img-excluded" class="no-lightbox" src="ex.jpg" />

      <!-- Single Image Gallery (No toggle) -->
      <h2>Header</h2>
      <div class="gallery-frame">
        <img id="img-single-gallery" class="gallery-img" src="single.jpg" />
      </div>

      <!-- Standard Gallery -->
      <h2>
        <button class="toggle-prev">Prev</button>
        <button class="toggle-next">Next</button>
      </h2>
      <div class="gallery-frame" id="std-gallery">
        <img class="gallery-img active no-upscale" src="gal1.jpg" />
        <img class="gallery-img" src="gal2.jpg" />
      </div>

      <!-- Weird Gallery (H4 instead of H2/H3) -->
      <h4><button class="toggle-next">Next</button></h4>
      <div class="gallery-frame">
        <img class="gallery-img" src="w1.jpg" />
        <img class="gallery-img" src="w2.jpg" />
      </div>
      
      
      <!-- Missing gallery-frame class -->
      <h2><button class="toggle-next">Next</button></h2>
      <div class="broken-gallery">
        <img class="gallery-img broken-img" src="w1.jpg" />
        <img class="gallery-img" src="w2.jpg" />
      </div>

      <!-- Weird Gallery (No active image) -->
      <h2><button class="toggle-next">Next</button></h2>
      <div class="gallery-frame" id="no-active-gallery">
        <!-- Missing .active class -->
        <img class="gallery-img" src="w1.jpg" />
        <img class="gallery-img" src="w2.jpg" />
      </div>
    `;

    vi.useFakeTimers();
  });

  it("opens lightbox for normal image", () => {
    initLightbox(window, document);
    const img = document.getElementById("img-normal");
    img.click();

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxLink = document.getElementById("lightbox-link");

    expect(lightbox.classList.contains("active")).toBe(true);
    expect(lightboxImg.src).toContain("normal.jpg");
    expect(lightboxLink.href).toContain("normal.jpg");
    expect(lightboxImg.classList.contains("no-upscale")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("adds no-upscale class if source image has it", () => {
    initLightbox(window, document);
    document.getElementById("img-no-upscale").click();
    expect(
      document.getElementById("lightbox-img").classList.contains("no-upscale"),
    ).toBe(true);
  });

  it("does not attach clicks to excluded images", () => {
    initLightbox(window, document);
    document.getElementById("img-excluded").click();
    expect(
      document.getElementById("lightbox").classList.contains("active"),
    ).toBe(false);
  });

  it("hides toggle group for single image gallery", () => {
    initLightbox(window, document);
    document.getElementById("img-single-gallery").click();
    expect(document.getElementById("lightbox-toggle-group").style.display).toBe(
      "none",
    );
  });

  it("shows toggle group and registers buttons for standard gallery", () => {
    initLightbox(window, document);
    const galImg = document.querySelector("#std-gallery .gallery-img");
    galImg.click();

    expect(document.getElementById("lightbox-toggle-group").style.display).toBe(
      "flex",
    );

    // Test navigation
    const nextBtn = document.getElementById("lightbox-next-btn");
    const prevBtn = document.getElementById("lightbox-prev-btn");

    // Also ensure we remove no-upscale when navigating to an image without it
    const activeImg = document.querySelector(".gallery-img.active");
    activeImg.classList.remove("no-upscale");

    // Mock the click on the gallery's native toggle buttons
    const nativeNext = document.querySelector("h2 .toggle-next");
    nativeNext.click = vi.fn();

    nextBtn.click();
    expect(nativeNext.click).toHaveBeenCalled();

    const nativePrev = document.querySelector("h2 .toggle-prev");
    nativePrev.click = vi.fn();
    prevBtn.click();
    expect(nativePrev.click).toHaveBeenCalled();

    // Add it back and navigate again to hit the positive branch in handleLightboxNav
    activeImg.classList.add("no-upscale");
    nextBtn.click();

    // Fast-forward fade transition
    vi.advanceTimersByTime(500);
  });

  it("handles gallery with wrong header type (H4)", () => {
    initLightbox(window, document);
    const wImg = document.querySelectorAll(
      "h4 + .gallery-frame .gallery-img",
    )[0];
    wImg.click();

    expect(document.getElementById("lightbox-toggle-group").style.display).toBe(
      "flex",
    );

    const nextBtn = document.getElementById("lightbox-next-btn");
    nextBtn.click(); // Should do nothing gracefully because btn is null
  });

  it("handles gallery missing active image gracefully", () => {
    initLightbox(window, document);
    const wImg = document.querySelector("#no-active-gallery .gallery-img");
    wImg.click();

    const nextBtn = document.getElementById("lightbox-next-btn");
    nextBtn.click(); // Should not throw
  });

  it("handles missing next/prev buttons gracefully", () => {
    document.getElementById("lightbox-next-btn").remove();
    document.getElementById("lightbox-prev-btn").remove();
    initLightbox(window, document);

    const galImg = document.querySelector("#std-gallery .gallery-img");
    galImg.click(); // Should not throw when attempting to check UI state
  });

  it("closes lightbox via close button", () => {
    initLightbox(window, document);
    document.getElementById("img-normal").click();
    document.querySelector(".lightbox-close").click();

    expect(
      document.getElementById("lightbox").classList.contains("active"),
    ).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("closes lightbox via background click", () => {
    initLightbox(window, document);
    document.getElementById("img-normal").click();

    // Simulate click on lightbox background
    const lightbox = document.getElementById("lightbox");
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", {
      value: lightbox,
      enumerable: true,
    });
    lightbox.dispatchEvent(event);

    expect(lightbox.classList.contains("active")).toBe(false);
  });

  it("does NOT close lightbox via content click", () => {
    initLightbox(window, document);
    document.getElementById("img-normal").click();

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", {
      value: lightboxImg,
      enumerable: true,
    });
    lightbox.dispatchEvent(event);

    expect(lightbox.classList.contains("active")).toBe(true);
  });

  it("closes lightbox via Escape key", () => {
    initLightbox(window, document);
    document.getElementById("img-normal").click();

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(
      document.getElementById("lightbox").classList.contains("active"),
    ).toBe(false);
  });

  it("ignores other keydown events", () => {
    initLightbox(window, document);
    document.getElementById("img-normal").click();

    const event = new KeyboardEvent("keydown", { key: "Enter" });
    document.dispatchEvent(event);

    expect(
      document.getElementById("lightbox").classList.contains("active"),
    ).toBe(true);
  });

  it("handles gallery with missing gallery-frame class gracefully", () => {
    initLightbox(window, document);
    const wImg = document.querySelector(".broken-img");
    wImg.click();

    const nextBtn = document.getElementById("lightbox-next-btn");
    nextBtn.click(); // Should not throw
  });

  it("hits false branch when gallery-frame class is removed after opening", () => {
    initLightbox(window, document);
    const galImg = document.querySelector("#std-gallery .gallery-img");
    galImg.click(); // Opens lightbox, wires up nextBtn to the H2

    // Mutate the DOM to remove the class
    const gallery = document.getElementById("std-gallery");
    gallery.classList.remove("gallery-frame");

    // Click next btn
    const nextBtn = document.getElementById("lightbox-next-btn");
    nextBtn.click(); // Should hit the false branch for classList.contains!
  });
});
