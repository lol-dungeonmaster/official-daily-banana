import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTagRouter } from '../assets/js/tag-router.js';

describe('tag-router.js', () => {
  let mockWindow;
  let mockDocument;
  
  beforeEach(() => {
    mockWindow = {
      location: new URL('http://localhost/?tags=style1,topic1'),
      history: {
        pushState: vi.fn((state, title, url) => {
          mockWindow.location = new URL(url.toString());
        })
      },
      innerWidth: 1024,
      addEventListener: vi.fn(),
      requestAnimationFrame: vi.fn((cb) => {
        cb(); // Execute immediately for tests
      })
    };
    
    // Set up full JSDOM structure to hit every branch
    document.body.innerHTML = `
      <div class="nav-top-wrapper">
        <a class="nav-top-link">Link</a>
        <div id="active-tags-container"></div>
      </div>
      
      <div class="nav-month">
        <div class="nav-days-grid">
          <a href="#post1">Post 1</a>
          <a href="#post2">Post 2</a>
        </div>
      </div>
      
      <div class="nav-month" id="empty-month">
        <div class="nav-days-grid">
          <a href="#post3">Post 3</a>
        </div>
      </div>

      <div class="nav-month">
        <!-- Month with no grid -->
      </div>
      
      <article class="post-entry" data-tags="style1, topic1">
        <h2 id="post1">Post 1</h2>
        <div class="post-tags-container">
          <span class="tag tag-style" data-tag="style1">style1</span>
          <span class="tag tag-topic" data-tag="topic1">topic1</span>
        </div>
      </article>
      
      
      <article class="post-entry" data-tags="style1, setting1">
        <h2 id="post2">Post 2</h2>
        <div class="post-tags-container">
          <span class="tag tag-style" data-tag="style1">style1</span>
          <span class="tag tag-setting" data-tag="setting1">setting1</span>
          <span class="tag tag-unknown" data-tag="unknown1">unknown1</span>
        </div>
      </article>

      <article class="post-entry" data-tags="other">
        <h2 id="post3">Post 3</h2>
      </article>

      <article class="post-entry">
        <!-- Missing data-tags attribute entirely -->
        <h2 id="missing-tags">Post Missing Tags</h2>
      </article>
      
      <article class="post-entry" data-tags="style1">
        <!-- Missing H2 entirely -->
      </article>

      <article class="post-entry" data-tags="style1">
        <h2 id="post-no-toc">Post No TOC</h2>
        <!-- H2 exists, but no matching TOC link in the nav grid -->
      </article>
`;
    
    mockDocument = document;
    // Mock offsetHeight for wrapping tests
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 100
    });
  });

  it('filters posts based on initial URL parameters', () => {
    initTagRouter(mockWindow, mockDocument);
    
    // URL has style1,topic1 -> post1 matches, post2 hidden, post3 hidden
    const post1 = mockDocument.querySelector('article[data-tags="style1, topic1"]');
    const post2 = mockDocument.querySelector('article[data-tags="style1, setting1"]');
    
    expect(post1.classList.contains('hidden')).toBe(false);
    expect(post2.classList.contains('hidden')).toBe(true);
  });
  
  it('toggles tags correctly (adds and removes)', () => {
    // Start with empty URL
    mockWindow.location = new URL('http://localhost/');
    initTagRouter(mockWindow, mockDocument);
    
    const style1Btn = mockDocument.querySelector('.tag[data-tag="style1"]');
    
    // Click to add
    style1Btn.click();
    expect(mockWindow.location.searchParams.get('tags')).toBe('style1');
    
    // Click again to remove
    style1Btn.click();
    expect(mockWindow.location.searchParams.get('tags')).toBeNull();
  });
  
  it('renders active tags with correct css classes and allows removal', () => {
    mockWindow.location = new URL('http://localhost/?tags=style1,topic1,setting1,unknown1');
    initTagRouter(mockWindow, mockDocument);
    
    const container = mockDocument.getElementById('active-tags-container');
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(4);
    
    expect(spans[0].className).toBe('tag tag-style'); // Default / matched style
    expect(spans[1].className).toBe('tag tag-topic');
    expect(spans[2].className).toBe('tag tag-setting');
    expect(spans[3].className).toBe('tag tag-style'); // Fallback when example has unknown class
    
    // Click active tag to remove
    spans[1].click();
    expect(mockWindow.location.searchParams.get('tags')).toBe('style1,setting1,unknown1');
  });
  
  it('handles mobile wrap logic (innerWidth <= 768)', () => {
    mockWindow.innerWidth = 500;
    mockWindow.location = new URL('http://localhost/?tags=style1');
    initTagRouter(mockWindow, mockDocument);
    
    const navTop = mockDocument.querySelector('.nav-top-wrapper');
    expect(navTop.classList.contains('has-tags')).toBe(true);
    expect(navTop.classList.contains('tags-wrapped')).toBe(false);
  });
  
  it('handles desktop wrap logic (height > 155)', () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 160 // > 155
    });
    mockWindow.location = new URL('http://localhost/?tags=style1');
    initTagRouter(mockWindow, mockDocument);
    
    const navTop = mockDocument.querySelector('.nav-top-wrapper');
    expect(navTop.classList.contains('tags-wrapped')).toBe(true);
  });
  
  it('removes wrap logic if no tags are active', () => {
    mockWindow.location = new URL('http://localhost/');
    initTagRouter(mockWindow, mockDocument);
    
    const navTop = mockDocument.querySelector('.nav-top-wrapper');
    expect(navTop.classList.contains('tags-wrapped')).toBe(false);
    expect(navTop.classList.contains('has-tags')).toBe(false);
  });
  
  it('hides empty nav-month containers', () => {
    mockWindow.location = new URL('http://localhost/?tags=impossible_tag');
    initTagRouter(mockWindow, mockDocument);
    
    const emptyMonth = mockDocument.getElementById('empty-month');
    expect(emptyMonth.style.display).toBe('none');
  });
  
  it('gracefully exits checkWrap if missing DOM elements', () => {
    mockDocument.querySelector('.nav-top-wrapper').remove();
    mockWindow.location = new URL('http://localhost/?tags=style1');
    expect(() => initTagRouter(mockWindow, mockDocument)).not.toThrow();
  });
  
  it('gracefully exits renderActiveTags if missing container', () => {
    mockDocument.getElementById('active-tags-container').remove();
    mockWindow.location = new URL('http://localhost/?tags=style1');
    expect(() => initTagRouter(mockWindow, mockDocument)).not.toThrow();
  });
  
  it('simulates popstate and resize events', () => {
    initTagRouter(mockWindow, mockDocument);
    
    const popstateCb = mockWindow.addEventListener.mock.calls.find(c => c[0] === 'popstate')[1];
    const resizeCb = mockWindow.addEventListener.mock.calls.find(c => c[0] === 'resize')[1];
    
    expect(popstateCb).toBeDefined();
    expect(resizeCb).toBeDefined();
    
    // Execute them to ensure no throw
    popstateCb();
    resizeCb();
  });
});
