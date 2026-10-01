import { describe, it, expect, vi, beforeEach } from "vitest";
import { initLayoutHacks } from "../assets/js/layout-hacks.js";

describe("layout-hacks.js", () => {
  let sessionStorageMock;

  beforeEach(() => {
    sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    window = {
      sessionStorage: sessionStorageMock,
    };

    document.body.innerHTML = "";
  });

  it("runs safely when #downloads section is missing", () => {
    initLayoutHacks(window, document);
    expect(document.body.id).toBe("top");
    expect(document.getElementById("prompt-width-standard")).toBeNull();
  });

  it("injects UI but skips github button if missing", () => {
    document.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(window, document);

    expect(document.getElementById("gemini-key-btn")).not.toBeNull();
    // GitHub button wasn't there so it wasn't modified
  });

  it("injects UI and modifies github button if present", () => {
    document.body.innerHTML = `
      <div id="downloads">
        <a class="btn-github">Old Text</a>
      </div>
    `;
    initLayoutHacks(window, document);

    const ghBtn = document.querySelector(".btn-github");
    expect(ghBtn.innerHTML).toContain("<svg");
    expect(ghBtn.innerHTML).toContain("View on GitHub");
  });

  it("binds prompt width toggles and updates body classes", () => {
    document.body.innerHTML = `
      <div id="downloads"></div>
    `;
    // Initialize to create the buttons
    initLayoutHacks(window, document);

    const btnStandard = document.getElementById("prompt-width-standard");
    const btnWide = document.getElementById("prompt-width-wide");
    const btnWider = document.getElementById("prompt-width-wider");

    // Test Standard
    btnStandard.click();
    expect(document.body.classList.contains("prompt-width-standard")).toBe(
      true,
    );
    expect(btnStandard.classList.contains("prompt-btn-active")).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "odb_prompt_width",
      "standard",
    );

    // Test Wide
    btnWide.click();
    expect(document.body.classList.contains("prompt-width-wide")).toBe(true);
    expect(document.body.classList.contains("prompt-width-standard")).toBe(
      false,
    );
    expect(btnWide.classList.contains("prompt-btn-active")).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "odb_prompt_width",
      "wide",
    );

    // Test Wider
    btnWider.click();
    expect(document.body.classList.contains("prompt-width-standard")).toBe(
      false,
    );
    expect(document.body.classList.contains("prompt-width-wide")).toBe(false);
    expect(btnWider.classList.contains("prompt-btn-active")).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "odb_prompt_width",
      "wider",
    );
  });

  it("restores standard width from sessionStorage", () => {
    sessionStorageMock.getItem.mockReturnValue("standard");
    document.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(window, document);

    expect(document.body.classList.contains("prompt-width-standard")).toBe(
      true,
    );
  });

  it("restores wider width from sessionStorage", () => {
    sessionStorageMock.getItem.mockReturnValue("wider");
    document.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(window, document);

    const btnWider = document.getElementById("prompt-width-wider");
    expect(btnWider.classList.contains("prompt-btn-active")).toBe(true);
  });

  it("defaults to wide width if sessionStorage is empty", () => {
    sessionStorageMock.getItem.mockReturnValue(null);
    document.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(window, document);

    expect(document.body.classList.contains("prompt-width-wide")).toBe(true);
  });
});
