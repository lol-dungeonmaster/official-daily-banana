document.addEventListener("DOMContentLoaded", () => {
  const posts = document.querySelectorAll(".post-entry");
  const activeTagsContainer = document.getElementById("active-tags-container");

  // Get active tags from URL
  function getActiveTags() {
    const params = new URLSearchParams(window.location.search);
    const tagsParam = params.get("tags");
    if (!tagsParam) return [];
    return tagsParam.split(",").filter((t) => t.trim() !== "");
  }

  function setActiveTags(tags) {
    const url = new URL(window.location);
    if (tags.length === 0) {
      url.searchParams.delete("tags");
    } else {
      url.searchParams.set("tags", tags.join(","));
    }
    window.history.pushState({}, "", url);
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
    const navTop = document.querySelector(".nav-top-wrapper");
    const navLink = document.querySelector(".nav-top-link");
    const tagsContainer = document.getElementById("active-tags-container");
    const currentTags = getActiveTags();

    if (!navTop || !navLink || !tagsContainer) return;
    if (window.innerWidth <= 768) {
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
    activeTagsContainer.innerHTML = "";

    // To preserve specific color styling, we need to know if it's topic/setting/style.
    // The easiest way is to find a rendered tag in the DOM with that data-tag and copy its class.
    currentTags.forEach((tag) => {
      let cssClass = "tag-style"; // default
      const example = document.querySelector(
        `.post-tags-container .tag[data-tag="${tag}"]`,
      );
      if (example) {
        if (example.classList.contains("tag-topic")) cssClass = "tag-topic";
        else if (example.classList.contains("tag-setting"))
          cssClass = "tag-setting";
      }

      const span = document.createElement("span");
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

      if (currentTags.length === 0 || matchesAll) {
        post.classList.remove("hidden");
      } else {
        post.classList.add("hidden");
      }
    });

    renderActiveTags();
    checkWrap();
  }

  // Attach click handlers to all tags in posts
  document.querySelectorAll(".post-tags-container .tag").forEach((tagEl) => {
    tagEl.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTag(tagEl.getAttribute("data-tag"));
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener("popstate", () => {
    applyFilters();
  });

  // Initial load
  applyFilters();

  // Enable CSS transitions after initial layout paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const navTop = document.querySelector(".nav-top-wrapper");
      if (navTop) navTop.classList.add("ready");
    });
  });

  // Re-evaluate wrap state on window resize
  window.addEventListener("resize", checkWrap);
});
