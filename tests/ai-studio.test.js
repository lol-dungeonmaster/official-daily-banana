import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { initAiStudio } from '../assets/js/ai-studio.js';

const flushPromises = () => new Promise(setImmediate);

describe('ai-studio.js', () => {
  let dom;
  let win;
  let doc;
  let instance;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head></head>
      <body>
        <div id="indicator-basic"></div>
        <div id="indicator-image"></div>
        <div id="indicator-delay"></div>
        
        <button id="gemini-key-btn"></button>
        <div id="gemini-popover"></div>
        <input id="gemini-key-input" />
        <button id="gemini-key-confirm"></button>
        <button id="gemini-key-cancel"></button>
        <button id="gemini-key-eye"></button>
        
        <div class="gemini-icon"></div>
        
        <button id="ledger-btn"></button>
        <div id="ledger-popover" class="show"></div>
        <div class="ledger-tab" data-tab="info"></div>
        <div class="ledger-tab" data-tab="warn"></div>
        <div class="ledger-tab" data-tab="error"></div>
        <div id="ledger-content"></div>
        <div id="ledger-badge"></div>
        <button id="ledger-clear-btn"></button>
        
        <article data-tags="multi-step">
            <div class="collapsible-code">
                <pre><code><div class="sub-prompt" data-index="0"><p>Test prompt</p><div class="negative-prompt-container"><strong>Neg:</strong>Bad thing</div>[EVENT MODIFIERS] event1</div><div class="sub-prompt" data-index="1"><p>Test prompt 2</p><div class="negative-prompt-container"><strong>Neg:</strong>Bad thing 2</div>[EVENT MODIFIERS] event2</div></code><span class="token-estimator">10</span></pre>
                <button>Reveal</button>
            </div>
        </article>
      </body>
      </html>
    `, { runScripts: 'dangerously' });
    win = dom.window;
    doc = win.document;
    
    win.fetch = vi.fn();
    win.console.error = vi.fn();
    
    // Setup generic mock for Date
    const originalDate = global.Date;
    
    let store = {};
    Object.defineProperty(win, 'sessionStorage', {
      value: {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
      },
      writable: true
    });
    
    win._timeouts = [];
    win.setTimeout = vi.fn((cb, ms) => { 
        win._timeouts.push(cb); 
        return win._timeouts.length; 
    });
    win.clearTimeout = vi.fn((id) => {
        if(id) {
           win._timeouts[id-1] = null;
        }
    });
    win._runTimeouts = () => {
        win._timeouts.forEach(cb => { if(cb) cb() });
        win._timeouts = [];
    };

    win.requestAnimationFrame = vi.fn((cb) => { cb(); });

    Object.defineProperty(win, 'innerHeight', { value: 1000 });
    
    // Navigator Clipboard
    win.navigator.clipboard = { writeText: vi.fn() };

    instance = initAiStudio(win, doc);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Functionality & DOM', () => {
      it('Utility and ledger', async () => {
          expect(instance.getObfuscatedKey('abc')).toBe('abc');
          expect(instance.getObfuscatedKey('abcdefghijkl')).toBe('abcdef' + '▪'.repeat(17));
          
          instance.showToast('Test');
          instance.showToast('Test Warn', true);
          
          win.sessionStorage.setItem('odb_audit_log', JSON.stringify([{ type: 'info', message: 'Hello' }]));
          instance.renderLedger();
          
          doc.dispatchEvent(new win.CustomEvent("closeAllPopovers"));
      });
  });

});
