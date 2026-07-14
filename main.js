// ===== Main Application Logic =====
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // Initialize core components
    initNavigation();
    initThemeToggle();
    initForest();
    initResumeDownload();
});

// ===== Navigation Scroll Spy & Smooth Scroll =====
function initNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav a');

    if (sections.length === 0 || navLinks.length === 0) return;

    // Update active nav link on scroll
    function updateActiveLink() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            // Subtract small offset (e.g. 100px) to activate link slightly before reaching section top
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Fallback for bottom of the page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            currentSectionId = sections[sections.length - 1].getAttribute('id');
        }

        if (currentSectionId) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    }

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Scroll target offset to leave breathing room at the top
                const targetOffset = targetSection.offsetTop - 40;

                window.scrollTo({
                    top: targetOffset,
                    behavior: 'smooth'
                });

                // Update URL hash without jumping
                history.pushState(null, null, targetId);

                // Update active link manually
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Listen to scroll events (throttled slightly using requestAnimationFrame)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(updateActiveLink);
    });

    // Run once on load to set initial active section
    updateActiveLink();
}

// ===== Minimalist Theme Toggle (Light / Dark Mode) =====
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;

    // Helper to update button text/icon
    function updateToggleButton(isDark) {
        if (isDark) {
            themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            themeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }

    // Determine initial theme: check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    if (shouldBeDark) {
        document.body.classList.add('dark-mode');
        updateToggleButton(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateToggleButton(false);
    }

    // Click handler to toggle mode
    themeBtn.addEventListener('click', () => {
        const isDarkNow = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        updateToggleButton(isDarkNow);
    });
}

// ===== Dynamic Tree-Planting Forest =====
function initForest() {
    const visitCountEl = document.getElementById('visit-count');
    const treeCountEl = document.getElementById('tree-count');
    const animalCountEl = document.getElementById('animal-count');
    const forestDisplay = document.getElementById('forest-display');

    if (!visitCountEl || !treeCountEl || !animalCountEl || !forestDisplay) return;

    // Use a unique namespace/key for the website on Abacus API
    const abacusUrl = 'https://api.counterapi.dev/v1/badhri7-github-io/visits/up'; // Let's also check abacus.jasoncameron.dev
    const jasoncameronUrl = 'https://abacus.jasoncameron.dev/hit/badhri7-github-io/visits';
    const baseOffset = 0; // Baseline visits set to 0
    const visitsPerTree = 1;
    const visitsPerAnimal = 5;

    function renderForest(visits) {
        visitCountEl.textContent = visits.toLocaleString();
        
        const treeCount = Math.floor(visits / visitsPerTree);
        treeCountEl.textContent = treeCount.toLocaleString();

        const animalCount = Math.floor(visits / visitsPerAnimal);
        animalCountEl.textContent = animalCount.toLocaleString();

        forestDisplay.innerHTML = '';
        
        // Limit visual rendering to prevent layout clutter
        const maxTreesToDraw = Math.min(treeCount, 100);
        const maxAnimalsToDraw = Math.min(animalCount, 25);

        // Build list of forest elements deterministically to avoid layout shifts on refresh
        const forestItems = [];
        const animalTypes = ['otter', 'frog', 'crow', 'dove', 'kiwi-bird', 'fish'];
        
        // Distribute animals evenly among the trees
        const animalInterval = maxAnimalsToDraw > 0 ? Math.floor(maxTreesToDraw / maxAnimalsToDraw) : 0;
        let animalAddedCount = 0;

        for (let i = 0; i < maxTreesToDraw; i++) {
            forestItems.push({ type: 'tree' });
            
            // Intersperse animal if interval matches
            if (animalInterval > 0 && (i + 1) % animalInterval === 0 && animalAddedCount < maxAnimalsToDraw) {
                const kind = animalTypes[animalAddedCount % animalTypes.length];
                forestItems.push({ type: 'animal', kind: kind });
                animalAddedCount++;
            }
        }
        
        // Append any remaining animals
        while (animalAddedCount < maxAnimalsToDraw) {
            const kind = animalTypes[animalAddedCount % animalTypes.length];
            forestItems.push({ type: 'animal', kind: kind });
            animalAddedCount++;
        }

        // Render each item with staggered animations
        forestItems.forEach((item, index) => {
            const el = document.createElement('i');
            let baseTransform = '';

            if (item.type === 'tree') {
                el.className = 'fas fa-tree';
                
                // Vary size and opacity for trees
                const size = Math.random() * 0.4 + 0.8; // 0.8rem to 1.2rem
                const opacity = Math.random() * 0.4 + 0.6; // 60% to 100%
                
                el.style.fontSize = `${size}rem`;
                el.style.opacity = opacity;
            } else {
                // Wildlife item
                el.className = `fas fa-${item.kind}`;
                
                // Color and vertical positioning based on fauna species
                if (item.kind === 'otter') {
                    el.style.color = '#a1887f'; // Soft Brown
                    el.style.fontSize = '0.75rem';
                } else if (item.kind === 'frog') {
                    el.style.color = '#81c784'; // Forest Frog Green
                    el.style.fontSize = '0.65rem';
                } else if (item.kind === 'crow') {
                    el.style.color = '#546e7a'; // Slate Grey
                    el.style.fontSize = '0.75rem';
                    baseTransform = 'translateY(-12px)';
                } else if (item.kind === 'dove') {
                    el.style.color = '#cfd8dc'; // Off-White/Light Grey
                    el.style.fontSize = '0.75rem';
                    baseTransform = 'translateY(-16px)';
                } else if (item.kind === 'kiwi-bird') {
                    el.style.color = '#d7ccc8'; // Soft light brown
                    el.style.fontSize = '0.7rem';
                } else if (item.kind === 'fish') {
                    el.style.color = '#90caf9'; // Soft Blue
                    el.style.fontSize = '0.65rem';
                    baseTransform = 'translateY(4px)';
                }
                
                el.style.opacity = '0.9';
            }

            // Organic layout offsets
            const offsetMargin = Math.random() * 2 - 1; // -1px to 1px
            el.style.marginLeft = `${offsetMargin}px`;
            el.style.marginRight = `${offsetMargin}px`;

            // Prepare for staggered scale-in animation
            el.style.transform = `${baseTransform} scale(0)`.trim();
            el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease';

            forestDisplay.appendChild(el);

            setTimeout(() => {
                el.style.transform = `${baseTransform} scale(1)`.trim();
            }, index * 20);
        });
    }

    // Fetch count from Abacus API
    fetch(jasoncameronUrl)
        .then(response => {
            if (!response.ok) throw new Error('API server returned error');
            return response.json();
        })
        .then(data => {
            const totalCount = (data.value || 0) + baseOffset;
            renderForest(totalCount);
        })
        .catch(error => {
            console.warn('Visitor counter API unavailable, running date-based fallback estimator:', error);
            
            // Fallback: estimate count based on date if API is down
            const startDate = new Date('2026-07-01');
            const today = new Date();
            const daysDiff = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
            
            // Baseline offset + 5 estimated visits per day + slight variance
            const estimatedVisits = baseOffset + (daysDiff * 5) + Math.floor(Math.random() * 5);
            renderForest(estimatedVisits);
        });
}

// ===== Resume & Scuba Cat Download Trigger =====
function initResumeDownload() {
    const resumeBtn = document.getElementById('resume-download-btn');
    if (!resumeBtn) return;

    resumeBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default inline navigation

        // Trigger ML_resume.pdf download programmatically
        const pdfLink = document.createElement('a');
        pdfLink.href = 'ML_resume.pdf';
        pdfLink.download = 'ML_resume.pdf';
        document.body.appendChild(pdfLink);
        pdfLink.click();
        document.body.removeChild(pdfLink);

        // Show the overlay diving cat animation on screen
        showScubaCatOverlay();
    });
}

function showScubaCatOverlay() {
    if (document.getElementById('scuba-cat-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'scuba-cat-overlay';
    overlay.innerHTML = `
        <div class="scuba-cat-modal">
            <img src="scuba_cat.gif" alt="Scuba Cat">
            <p>Scuba Cat is diving to retrieve your resume...</p>
        </div>
    `;
    document.body.appendChild(overlay);

    // Fade in
    setTimeout(() => {
        overlay.classList.add('active');
    }, 50);

    // Fade out and remove
    setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }, 4500);
}