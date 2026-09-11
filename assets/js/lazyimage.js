document.addEventListener("DOMContentLoaded", function () {
  const lazyImages = document.querySelectorAll(".lazy-img");
  let isInitialLoad = true;
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      const img = entry.target;
      
      if (entry.isIntersecting) {
        if (isInitialLoad) {
          // Instant load for the first images seen on page load (handles anchor links perfectly)
          img.onload = () => { img.classList.add("loaded"); };
          img.src = img.dataset.src;
          observer.unobserve(img);
        } else {
          // Debounce for all subsequent scrolls
          img.dataset.scrollTimeout = setTimeout(() => {
            img.onload = () => { img.classList.add("loaded"); };
            img.src = img.dataset.src;
            observer.unobserve(img);
          }, 500);
        }
      } else {
        // If image leaves viewport before 500ms, the user is rapid-scrolling. Cancel request!
        if (img.dataset.scrollTimeout) {
          clearTimeout(img.dataset.scrollTimeout);
          delete img.dataset.scrollTimeout;
        }
      }
    });
    
    // After processing the initial batch of elements on page load, turn off instant loading
    isInitialLoad = false;
  }, {
    rootMargin: "100px 0px", // Pre-fetch slightly before it enters the viewport
    threshold: 0
  });

  lazyImages.forEach((img) => observer.observe(img));
});
