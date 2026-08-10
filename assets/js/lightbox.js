document.addEventListener("DOMContentLoaded", function() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const lightboxLink = document.getElementById('lightbox-link');
    const lightboxNextBtn = document.getElementById('lightbox-next-btn');

    let currentGalleryBtn = null;

    // 1. Attach click event to all images (including gallery and lazy images)
    document.querySelectorAll('img:not(#lightbox-img)').forEach(img => {
        img.style.cursor = 'zoom-in'; // Visual hint that image is clickable
        
        img.addEventListener('click', () => {
            lightboxImg.src = img.src; // Set the lightbox image to the clicked image's source
            lightboxLink.href = img.src; 
            
            // Check for gallery frame to show/hide next button
            if (lightboxNextBtn) {
                const galleryFrame = img.closest('.gallery-frame');
                if (galleryFrame && galleryFrame.querySelectorAll('.gallery-img').length > 1) {
                    lightboxNextBtn.style.display = 'inline-flex';
                    currentGalleryBtn = galleryFrame.querySelector('.toggle-btn');
                } else {
                    lightboxNextBtn.style.display = 'none';
                    currentGalleryBtn = null;
                }
            }

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling while open
        });
    });

    if (lightboxNextBtn) {
        lightboxNextBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing lightbox
            if (currentGalleryBtn) {
                currentGalleryBtn.click(); // Trigger the gallery's native toggle function
                // Update lightbox image source based on the newly active image
                const galleryFrame = currentGalleryBtn.closest('.gallery-frame');
                if (galleryFrame) {
                    const activeImg = galleryFrame.querySelector('.gallery-img.active');
                    if (activeImg) {
                        lightboxImg.src = activeImg.src;
                        lightboxLink.href = activeImg.src;
                    }
                }
            }
        });
    }

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
