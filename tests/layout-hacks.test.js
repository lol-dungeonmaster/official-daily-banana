import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initLayoutHacks } from '../assets/js/layout-hacks.js';

describe('layout-hacks.js', () => {
  let mockWindow;
  let mockDocument;
  let sessionStorageMock;

  beforeEach(() => {
    sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn()
    };

    mockWindow = {
      sessionStorage: sessionStorageMock
    };
    
    document.body.innerHTML = '';
    mockDocument = document;
  });

  it('runs safely when #downloads section is missing', () => {
    initLayoutHacks(mockWindow, mockDocument);
    expect(mockDocument.body.id).toBe("top");
    expect(mockDocument.getElementById("prompt-width-standard")).toBeNull();
  });

  it('injects UI but skips github button if missing', () => {
    mockDocument.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(mockWindow, mockDocument);
    
    expect(mockDocument.getElementById("gemini-key-btn")).not.toBeNull();
    // GitHub button wasn't there so it wasn't modified
  });

  it('injects UI and modifies github button if present', () => {
    mockDocument.body.innerHTML = `
      <div id="downloads">
        <a class="btn-github">Old Text</a>
      </div>
    `;
    initLayoutHacks(mockWindow, mockDocument);
    
    const ghBtn = mockDocument.querySelector(".btn-github");
    expect(ghBtn.innerHTML).toContain("<svg");
    expect(ghBtn.innerHTML).toContain("View on GitHub");
  });

  it('binds prompt width toggles and updates body classes', () => {
    mockDocument.body.innerHTML = `
      <div id="downloads"></div>
    `;
    // Initialize to create the buttons
    initLayoutHacks(mockWindow, mockDocument);
    
    const btnStandard = mockDocument.getElementById("prompt-width-standard");
    const btnWide = mockDocument.getElementById("prompt-width-wide");
    const btnWider = mockDocument.getElementById("prompt-width-wider");
    
    // Test Standard
    btnStandard.click();
    expect(mockDocument.body.classList.contains("prompt-width-standard")).toBe(true);
    expect(btnStandard.classList.contains("prompt-btn-active")).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("odb_prompt_width", "standard");
    
    // Test Wide
    btnWide.click();
    expect(mockDocument.body.classList.contains("prompt-width-wide")).toBe(true);
    expect(mockDocument.body.classList.contains("prompt-width-standard")).toBe(false);
    expect(btnWide.classList.contains("prompt-btn-active")).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("odb_prompt_width", "wide");
    
    // Test Wider
    btnWider.click();
    expect(mockDocument.body.classList.contains("prompt-width-standard")).toBe(false);
    expect(mockDocument.body.classList.contains("prompt-width-wide")).toBe(false);
    expect(btnWider.classList.contains("prompt-btn-active")).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("odb_prompt_width", "wider");
  });

  it('restores standard width from sessionStorage', () => {
    sessionStorageMock.getItem.mockReturnValue("standard");
    mockDocument.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(mockWindow, mockDocument);
    
    expect(mockDocument.body.classList.contains("prompt-width-standard")).toBe(true);
  });

  it('restores wider width from sessionStorage', () => {
    sessionStorageMock.getItem.mockReturnValue("wider");
    mockDocument.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(mockWindow, mockDocument);
    
    const btnWider = mockDocument.getElementById("prompt-width-wider");
    expect(btnWider.classList.contains("prompt-btn-active")).toBe(true);
  });

  it('defaults to wide width if sessionStorage is empty', () => {
    sessionStorageMock.getItem.mockReturnValue(null);
    mockDocument.body.innerHTML = '<div id="downloads"></div>';
    initLayoutHacks(mockWindow, mockDocument);
    
    expect(mockDocument.body.classList.contains("prompt-width-wide")).toBe(true);
  });
});
