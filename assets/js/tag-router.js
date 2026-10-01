function initTagRouter(win, doc) {
  const posts = doc.querySelectorAll(".post-entry");
  const activeTagsContainer = doc.getElementById("active-tags-container");

  // Get active tags from URL
  function getActiveTags() {
    const params = new URLSearchParams(win.location.search);
    const tagsParam = params.get("tags");
    if (!tagsParam) return [];
    return tagsParam.split(",").filter((t) => t.trim() !== "");
  }

  function setActiveTags(tags) {
    const url = new URL(win.location);
    if (tags.length === 0) {
      url.searchParams.delete("tags");
    } else {
      url.searchParams.set("tags", tags.join(","));
    }
    win.history.pushState({}, "", url);
    applyFilters();
  }

  function toggleTag(tag) {
    let currentTags = getActiveTags();
    if (currentTags.includes(tag)) {
      currentTags = currentTags.filter((t) => t !== tag);
    } else {
      currentTags.push(tag);
    }
    setActiveTags(currentTags);
  }

  function checkWrap() {
    const navTop = doc.querySelector(".nav-top-wrapper");
    const navLink = doc.querySelector(".nav-top-link");
    const tagsContainer = doc.getElementById("active-tags-container");
    const currentTags = getActiveTags();

    if (!navTop || !navLink || !tagsContainer) return;
    if (win.innerWidth <= 768) {
      navTop.classList.add("has-tags");
      navTop.classList.remove("tags-wrapped");
      return;
    }

    if (currentTags.length === 0) {
      navTop.classList.remove("has-tags", "tags-wrapped");
      return;
    }

    navTop.classList.remove("tags-wrapped");
    navTop.classList.add("has-tags");

    // Force synchronous layout recalculation
    const currentHeight = navTop.offsetHeight;

    // The nav-top-wrapper base height is 96px + 48px padding = 144px.
    // If it exceeds this, the tags have natively wrapped to a new line,
    // OR they have stacked vertically taller than the logo.
    if (currentHeight > 155) {
      navTop.classList.add("tags-wrapped");
    }
  }

  function renderActiveTags() {
    if (!activeTagsContainer) return;
    const currentTags = getActiveTags();
    activeTagsContainer.textContent = "";

    // To preserve specific color styling, we need to know if it's topic/setting/style.
    // The easiest way is to find a rendered tag in the DOM with that data-tag and copy its class.
    currentTags.forEach((tag) => {
      let cssClass = "tag-style"; // default
      const example = doc.querySelector(
        `.post-tags-container .tag[data-tag="${tag}"]`,
      );
      if (example) {
        if (example.classList.contains("tag-topic")) cssClass = "tag-topic";
        else if (example.classList.contains("tag-setting"))
          cssClass = "tag-setting";
      }

      const span = doc.createElement("span");
      span.className = `tag ${cssClass}`;
      span.title = "Click to remove filter";
      span.textContent = tag;
      span.onclick = (e) => {
        e.preventDefault();
        toggleTag(tag);
      };
      activeTagsContainer.appendChild(span);
    });
  }

  function applyFilters() {
    const currentTags = getActiveTags();

    posts.forEach((post) => {
      const postTagsStr = post.getAttribute("data-tags") || "";
      const postTags = postTagsStr.split(",").map((t) => t.trim());

      // Check if ALL current tags are in postTags (AND logic)
      const matchesAll = currentTags.every((t) => postTags.includes(t));

      // Get the h2 ID to find the matching TOC link
      const heading = post.querySelector("h2");
      const tocLink = heading
        ? doc.querySelector(`.nav-days-grid a[href="#${heading.id}"]`)
        : null;

      if (currentTags.length === 0 || matchesAll) {
        post.classList.remove("hidden");
        if (tocLink) tocLink.style.display = "";
      } else {
        post.classList.add("hidden");
        if (tocLink) tocLink.style.display = "none";
      }
    });

    // Hide empty month containers in the TOC
    doc.querySelectorAll(".nav-month").forEach((monthDiv) => {
      const grid = monthDiv.querySelector(".nav-days-grid");
      if (grid) {
        const visibleLinks = Array.from(grid.querySelectorAll("a")).filter(
          (a) => a.style.display !== "none",
        );
        if (visibleLinks.length === 0) {
          monthDiv.style.display = "none";
        } else {
          monthDiv.style.display = "";
        }
      }
    });

    renderActiveTags();
    checkWrap();
  }

  // Attach click handlers to all tags in posts
  doc.querySelectorAll(".post-tags-container .tag").forEach((tagEl) => {
    tagEl.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTag(tagEl.getAttribute("data-tag"));
    });
  });

  // Handle browser back/forward buttons
  win.addEventListener("popstate", () => {
    applyFilters();
  });

  // Initial load
  applyFilters();

  // Enable CSS transitions after initial layout paint
  win.requestAnimationFrame(() => {
    win.requestAnimationFrame(() => {
      const navTop = doc.querySelector(".nav-top-wrapper");
      if (navTop) navTop.classList.add("ready");
    });
  });

  // Re-evaluate wrap state on window resize
  win.addEventListener("resize", checkWrap);
}

/* v8 ignore next 7 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initTagRouter };
} else {
  document.addEventListener("DOMContentLoaded", function () {
    initTagRouter(window, document);
  });
}
