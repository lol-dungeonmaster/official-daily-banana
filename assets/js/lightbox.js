document.addEventListener("DOMContentLoaded", function() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const lightboxLink = document.getElementById('lightbox-link');
    const lightboxNextBtn = document.getElementById('lightbox-next-btn');

    let currentGalleryBtn = null;

    // 1. Attach click event to all images (including gallery and lazy images, excluding nav/UI icons)
    document.querySelectorAll('img:not(#lightbox-img):not(.no-lightbox)').forEach(img => {
        img.style.cursor = 'zoom-in'; // Visual hint that image is clickable
        
        img.addEventListener('click', () => {
            lightboxImg.src = img.src; // Set the lightbox image to the clicked image's source
            lightboxLink.href = img.src; 
            
            // Check for gallery frame to show/hide next button
            if (lightboxNextBtn) {
                const galleryFrame = img.closest('.gallery-frame');
                if (galleryFrame && galleryFrame.querySelectorAll('.gallery-img').length > 1) {
                    lightboxNextBtn.style.display = 'inline-flex';
                    const prevH2 = galleryFrame.previousElementSibling;
                    if (prevH2 && prevH2.tagName === 'H2') {
                        currentGalleryBtn = prevH2.querySelector('.toggle-btn');
                    } else {
                        currentGalleryBtn = null;
                    }
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
                const h2 = currentGalleryBtn.closest('h2');
                const galleryFrame = h2 ? h2.nextElementSibling : null;
                if (galleryFrame && galleryFrame.classList.contains('gallery-frame')) {
                    const activeImg = galleryFrame.querySelector('.gallery-img.active');
                    if (activeImg) {
                        // Create a temporary clone for the crossfade effect
                        const clone = lightboxImg.cloneNode();
                        clone.removeAttribute('id'); // Prevent ID collision
                        clone.style.position = 'absolute';
                        clone.style.top = '0';
                        clone.style.left = '0';
                        clone.style.width = '100vw';
                        clone.style.height = '100vh';
                        clone.style.objectFit = 'contain';
                        clone.style.pointerEvents = 'none'; // Don't block clicks
                        clone.style.transition = 'opacity 0.5s ease-in-out';
                        clone.style.zIndex = '10'; // ensure it's on top of the underlying image
                        lightboxImg.parentElement.appendChild(clone);

                        // Swap the underlying image instantly
                        lightboxImg.src = activeImg.src;
                        lightboxLink.href = activeImg.src;

                        // Force the browser to register the clone's initial state before fading
                        void clone.offsetWidth;

                        // Trigger the fade-out on the clone
                        clone.style.opacity = '0';
                        setTimeout(() => clone.remove(), 500);
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
