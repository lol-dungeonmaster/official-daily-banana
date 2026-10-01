import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initAiStudio } from '../assets/js/ai-studio.js';

describe('ai-studio.js', () => {
  let mockWindow;
  let mockDocument;
  let sessionStorageMock;
  let storageData;
  
  beforeEach(() => {
    storageData = {};
    sessionStorageMock = {
      getItem: vi.fn(k => storageData[k] || null),
      setItem: vi.fn((k, v) => { storageData[k] = v; }),
      removeItem: vi.fn(k => { delete storageData[k]; })
    };

    mockWindow = {
      sessionStorage: sessionStorageMock,
      addEventListener: vi.fn(),
      fetch: vi.fn(),
      console: {
        error: vi.fn(),
        warn: vi.fn(),
        log: vi.fn()
      },
      setTimeout: (cb, ms) => setTimeout(cb, ms),
      clearTimeout: (id) => clearTimeout(id),
      innerHeight: 1000
    };
    
    document.body.innerHTML = `
      <div id="downloads"></div>
      <div class="gallery-frame" data-prompt="Test prompt" data-tags="tag1 tag2">
        <a href="#test">
          <img src="test.jpg" alt="Test image" />
        </a>
      </div>
      <div id="gemini-key-btn"></div>
      <div id="gemini-popover"></div>
      <input id="gemini-key-input" />
      <button id="gemini-key-confirm"></button>
      <button id="gemini-key-cancel"></button>
      <div id="gemini-key-eye"></div>
      <span id="indicator-basic"></span>
      <span id="indicator-image"></span>
      <span id="indicator-delay"></span>
      <div id="ledger-btn"></div>
      <div id="ledger-popover"></div>
      <div id="ledger-content"></div>
      <span id="ledger-badge"></span>
      <button id="ledger-clear-btn"></button>
      <div id="ai-toast-2"></div>
      <svg class="gemini-icon"></svg>
    `;
    mockDocument = document;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes basic UI elements safely', () => {
    initAiStudio(mockWindow, mockDocument);
    expect(mockWindow.addEventListener).toHaveBeenCalled();
  });
});
