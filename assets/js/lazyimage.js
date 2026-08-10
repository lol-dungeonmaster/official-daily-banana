document.addEventListener("DOMContentLoaded", function() {
    const lazyImages = document.querySelectorAll('.lazy-img');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // Move data-src to src
                img.classList.add('loaded'); // Trigger fade-in
                observer.unobserve(img); // Stop watching this image
            }
        });
  });

  lazyImages.forEach(img => observer.observe(img));
});
