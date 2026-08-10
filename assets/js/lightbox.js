document.addEventListener("DOMContentLoaded", function() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const lightboxLink = document.getElementById('lightbox-link');

    // 1. Attach click event to all images (including gallery and lazy images)
    document.querySelectorAll('img:not(#lightbox-img)').forEach(img => {
        img.style.cursor = 'zoom-in'; // Visual hint that image is clickable
        
        img.addEventListener('click', () => {
            lightboxImg.src = img.src; // Set the lightbox image to the clicked image's source
            lightboxLink.href = img.src; 
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling while open
        });
    });

    // 2. Close lightbox when clicking the X button
    closeBtn.addEventListener('click', closeLightbox);

    // 3. Close lightbox when clicking anywhere on the dark background
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // 4. Close lightbox when pressing the "Escape" key
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
});
