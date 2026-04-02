// ===== Main Application Logic =====
document.addEventListener('DOMContentLoaded', () => {
    // Set current year
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Initialize all modules
    initTypingAnimation();
    initScrollAnimations();
    initNavigation();
    initMobileMenu();
    initPaletteToggle();
    initInteractiveGraphBackground();
    initProjectCardHover();
    initKonamiCode();
    initGravityToggle();

    // Force scroll to top on page load
    window.scrollTo(0, 0);
});

// ===== Typing Animation =====
function initTypingAnimation() {
    const typedIntro = document.getElementById('typed-intro');
    if (!typedIntro) return;

    const text = "echo 'ML Engineer | 3D Vision · RAGs · Multimodal'";
    let index = 0;

    function typeText() {
        if (index < text.length) {
            typedIntro.textContent += text.charAt(index);
            index++;
            setTimeout(typeText, Math.random() * 40 + 40);
        }
    }

    typeText();
}

// ===== Scroll-Triggered Animations =====
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// ===== Navigation Active State =====
function initNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        if (current !== '') {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }
    });

    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Close mobile menu if open
                const navMenu = document.getElementById('nav-menu');
                if (navMenu) navMenu.classList.remove('open');
            }
        });
    });
}

// ===== Mobile Hamburger Menu =====
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        const icon = hamburger.querySelector('i');
        if (navMenu.classList.contains('open')) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('open');
            const icon = hamburger.querySelector('i');
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });
}

// ===== Theme Toggle (Dark ↔ Light) =====
function initPaletteToggle() {
    const btn = document.getElementById('theme-mode-btn');
    if (!btn) return;
    const icon = btn.querySelector('i');

    // Restore saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    btn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');

        if (isLight) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        }

        reinitBackground();
    });
}

// ===== Interactive Graph Background with Signal Propagation =====
let backgroundAnimationId = null;

function initInteractiveGraphBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'graph-background';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let nodes = [];
    const mouse = { x: -1000, y: -1000 };
    const nodeCount = 200;
    const maxConnectDistance = 240;
    const hoverRadius = 180;
    let gravityActive = false;
    const GRAVITY = 0.12;
    const BOUNCE_DAMPING = 0.7;
    const FLOAT_BACK_SPEED = 0.002;

    // ── Signal Propagation State ──
    // Each signal: { fromIdx, toIdx, progress (0→1), strength (0→1), hops }
    let signals = [];
    // Track which edges have active signals to prevent duplicates
    // Each node flash: { idx, strength, decay }
    let nodeFlashes = [];
    const SIGNAL_SPEED = 0.025;       // Progress per frame (0→1)
    const SIGNAL_DECAY = 0.82;        // Strength multiplier per hop
    const MAX_HOPS = 2;              // Max hops before signal dies
    const CLICK_RADIUS = 80;          // How close click needs to be to a node
    const FLASH_DECAY = 0.04;         // How fast node flashes fade

    function setCanvasSize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function randomVelocity() {
        return (Math.random() - 0.5) * 0.3;
    }

    function createNodes() {
        nodes = Array.from({ length: nodeCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: randomVelocity(),
            vy: randomVelocity(),
            baseRadius: Math.random() * 2.2 + 1.8,
            glow: Math.random() * 0.4 + 0.25
        }));
        signals = [];
        nodeFlashes = [];
    }

    function getAccentRGB() {
        const style = getComputedStyle(document.body);
        const accent = style.getPropertyValue('--accent').trim();
        if (accent.startsWith('#')) {
            const r = parseInt(accent.slice(1, 3), 16);
            const g = parseInt(accent.slice(3, 5), 16);
            const b = parseInt(accent.slice(5, 7), 16);
            return { r, g, b };
        }
        return { r: 59, g: 130, b: 246 };
    }

    // Find connected neighbors for a node (within maxConnectDistance)
    function getNeighbors(nodeIdx) {
        const neighbors = [];
        const a = nodes[nodeIdx];
        for (let j = 0; j < nodes.length; j++) {
            if (j === nodeIdx) continue;
            const b = nodes[j];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (distance < maxConnectDistance) {
                neighbors.push(j);
            }
        }
        return neighbors;
    }

    // Fire a signal from a node to all its neighbors
    function fireSignalFromNode(nodeIdx, strength, hops, fromIdx) {
        if (hops >= MAX_HOPS || strength < 0.05) return;

        const neighbors = getNeighbors(nodeIdx);
        for (const neighborIdx of neighbors) {
            // Don't send signal back to where it came from
            if (neighborIdx === fromIdx) continue;

            signals.push({
                fromIdx: nodeIdx,
                toIdx: neighborIdx,
                progress: 0,
                strength: strength,
                hops: hops
            });
        }

        // Flash the source node
        nodeFlashes.push({ idx: nodeIdx, strength: Math.min(strength * 1.2, 1) });
    }

    // Handle click — find nearest node, start propagation
    function handleClick(clickX, clickY) {
        let nearestIdx = -1;
        let nearestDist = Infinity;

        for (let i = 0; i < nodes.length; i++) {
            const d = Math.hypot(nodes[i].x - clickX, nodes[i].y - clickY);
            if (d < nearestDist) {
                nearestDist = d;
                nearestIdx = i;
            }
        }

        if (nearestIdx >= 0 && nearestDist < CLICK_RADIUS) {
            fireSignalFromNode(nearestIdx, 1.0, 0, -1);
        }
    }

    function drawFrame() {
        ctx.clearRect(0, 0, width, height);
        const accentRGB = getAccentRGB();

        // ── Update & move nodes ──
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];

            if (gravityActive) {
                // Apply gravity
                a.vy += GRAVITY;
                a.x += a.vx;
                a.y += a.vy;

                // Bounce off bottom
                if (a.y >= height - a.baseRadius) {
                    a.y = height - a.baseRadius;
                    a.vy *= -BOUNCE_DAMPING;
                    // Add slight horizontal scatter on bounce
                    a.vx += (Math.random() - 0.5) * 0.3;
                }
                // Bounce off sides
                if (a.x <= 0 || a.x >= width) a.vx *= -1;
                // Clamp top
                if (a.y <= 0) { a.y = 0; a.vy *= -0.5; }
            } else {
                // Normal floating — if gravity was just turned off, slowly restore
                if (Math.abs(a.vy) > 0.5) {
                    a.vy *= 0.96; // Gradually dampen high velocities from gravity
                }
                a.x += a.vx;
                a.y += a.vy;
                if (a.x <= 0 || a.x >= width) a.vx *= -1;
                if (a.y <= 0 || a.y >= height) a.vy *= -1;
            }
        }

        // ── Draw base edges ──
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const distance = Math.hypot(a.x - b.x, a.y - b.y);
                if (distance < maxConnectDistance) {
                    const alpha = (1 - distance / maxConnectDistance) * 0.35;
                    ctx.strokeStyle = `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${alpha})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // ── Update & draw signals ──
        const newSignals = [];
        for (const sig of signals) {
            sig.progress += SIGNAL_SPEED;

            if (sig.progress >= 1) {
                // Signal arrived — propagate to neighbors
                fireSignalFromNode(sig.toIdx, sig.strength * SIGNAL_DECAY, sig.hops + 1, sig.fromIdx);
                continue; // Remove this signal
            }

            // Calculate signal position along the edge
            const fromNode = nodes[sig.fromIdx];
            const toNode = nodes[sig.toIdx];
            if (!fromNode || !toNode) continue;

            const sx = fromNode.x + (toNode.x - fromNode.x) * sig.progress;
            const sy = fromNode.y + (toNode.y - fromNode.y) * sig.progress;

            // Draw glowing trail on the edge behind the signal
            const trailLength = 0.25;
            const trailStart = Math.max(0, sig.progress - trailLength);
            const tx1 = fromNode.x + (toNode.x - fromNode.x) * trailStart;
            const ty1 = fromNode.y + (toNode.y - fromNode.y) * trailStart;

            const gradient = ctx.createLinearGradient(tx1, ty1, sx, sy);
            gradient.addColorStop(0, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, 0)`);
            gradient.addColorStop(1, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${sig.strength * 0.8})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2.5 * sig.strength + 0.5;
            ctx.beginPath();
            ctx.moveTo(tx1, ty1);
            ctx.lineTo(sx, sy);
            ctx.stroke();

            // Draw the signal head — bright white core with accent outer glow
            const headRadius = 3 + sig.strength * 3;

            // Outer glow
            ctx.beginPath();
            const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, headRadius * 3);
            glowGrad.addColorStop(0, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${sig.strength * 0.4})`);
            glowGrad.addColorStop(1, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, 0)`);
            ctx.fillStyle = glowGrad;
            ctx.arc(sx, sy, headRadius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Bright core
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${sig.strength * 0.9})`;
            ctx.arc(sx, sy, headRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            newSignals.push(sig);
        }
        signals = newSignals;

        // ── Update & draw node flashes ──
        const newFlashes = [];
        for (const flash of nodeFlashes) {
            flash.strength -= FLASH_DECAY;
            if (flash.strength <= 0) continue;

            const node = nodes[flash.idx];
            if (!node) continue;

            const flashRadius = 6 + flash.strength * 8;

            // Glow ring
            ctx.beginPath();
            const ringGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, flashRadius);
            ringGrad.addColorStop(0, `rgba(255, 255, 255, ${flash.strength * 0.7})`);
            ringGrad.addColorStop(0.3, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${flash.strength * 0.5})`);
            ringGrad.addColorStop(1, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, 0)`);
            ctx.fillStyle = ringGrad;
            ctx.arc(node.x, node.y, flashRadius, 0, Math.PI * 2);
            ctx.fill();

            newFlashes.push(flash);
        }
        nodeFlashes = newFlashes;

        // ── Draw base nodes ──
        for (const node of nodes) {
            const distanceToMouse = Math.hypot(node.x - mouse.x, node.y - mouse.y);
            const influence = Math.max(0, 1 - distanceToMouse / hoverRadius);
            const radius = node.baseRadius + influence * 5;
            const alpha = 0.45 + influence * 0.4 + node.glow * 0.15;

            ctx.beginPath();
            ctx.fillStyle = `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${alpha})`;
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        backgroundAnimationId = requestAnimationFrame(drawFrame);
    }

    // ── Event Listeners ──
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener('resize', () => {
        setCanvasSize();
        createNodes();
    });

    // Click handler — listens on document since canvas is pointer-events:none
    document.addEventListener('click', (e) => {
        // Don't trigger on interactive elements
        const tag = e.target.tagName.toLowerCase();
        const isInteractive = tag === 'a' || tag === 'button' || tag === 'input' ||
            e.target.closest('a') || e.target.closest('button') || e.target.closest('.palette-toggle');
        if (isInteractive) return;

        handleClick(e.clientX, e.clientY);
    });

    // Store references for reinit
    window._bgSetCanvasSize = setCanvasSize;
    window._bgCreateNodes = createNodes;

    // Expose gravity toggle
    window._bgToggleGravity = () => {
        gravityActive = !gravityActive;
        return gravityActive;
    };

    setCanvasSize();
    createNodes();
    drawFrame();
}

function reinitBackground() {
    // No need to recreate canvas — just let drawFrame pick up new accent color
}

// ===== Project Card Hover Effect =====
function initProjectCardHover() {
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
                const xPercent = Math.floor((x / rect.width) * 100);
                const yPercent = Math.floor((y / rect.height) * 100);
                card.style.background = `radial-gradient(circle at ${xPercent}% ${yPercent}%, var(--bg-card-hover), var(--bg-card))`;
            } else {
                card.style.background = 'var(--bg-card)';
            }
        });
    });
}

// ===== Easter Egg: Konami Code → Matrix Rain =====
function initKonamiCode() {
    const konamiSequence = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
    ];
    let konamiIndex = 0;
    let matrixActive = false;

    document.addEventListener('keydown', (e) => {
        const expected = konamiSequence[konamiIndex];
        if (e.key === expected || e.key.toLowerCase() === expected) {
            konamiIndex++;
            if (konamiIndex === konamiSequence.length) {
                konamiIndex = 0;
                if (!matrixActive) triggerMatrixRain();
            }
        } else {
            konamiIndex = 0;
        }
    });

    function triggerMatrixRain() {
        matrixActive = true;

        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain';
        canvas.style.cssText = `
            position: fixed; inset: 0; width: 100%; height: 100%;
            z-index: 9999; pointer-events: none; opacity: 0;
            transition: opacity 0.5s ease;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // ML-themed terms
        const mlTerms = [
            'gradient', 'backprop', 'loss', 'epoch', 'batch',
            'relu', 'softmax', 'conv2d', 'dropout', 'lstm',
            'attention', 'encoder', 'decoder', 'latent', 'embed',
            'nerf', 'splatting', 'diffusion', 'vae', 'gan',
            'transformer', 'resnet', 'unet', 'bert', 'clip',
            'psnr', 'ssim', 'rouge', 'f1', 'accuracy',
            'tensor', 'cuda', 'optim', 'sgd', 'adam',
            '∇', 'θ', 'λ', 'σ', 'μ', 'α', 'β', 'ε',
            '0', '1', 'x', 'w', 'b', 'y', 'ŷ'
        ];

        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(0).map(() => Math.random() * -50);
        const columnTerms = new Array(columns).fill('').map(() =>
            mlTerms[Math.floor(Math.random() * mlTerms.length)]
        );
        const columnCharIdx = new Array(columns).fill(0);

        // Get accent color
        const style = getComputedStyle(document.body);
        const accent = style.getPropertyValue('--accent').trim();

        // Fade in
        requestAnimationFrame(() => canvas.style.opacity = '0.85');

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < drops.length; i++) {
                const term = columnTerms[i];
                const charIdx = columnCharIdx[i] % term.length;
                const char = term[charIdx];

                // Head character — bright white
                ctx.fillStyle = '#ffffff';
                ctx.font = `${fontSize}px 'Space Mono', monospace`;
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                // Trail character (slightly behind) — accent colored
                if (drops[i] > 1) {
                    ctx.fillStyle = accent || '#3B82F6';
                    ctx.globalAlpha = 0.6;
                    const prevChar = term[(charIdx - 1 + term.length) % term.length];
                    ctx.fillText(prevChar, i * fontSize, (drops[i] - 1) * fontSize);
                    ctx.globalAlpha = 1;
                }

                columnCharIdx[i]++;

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                    columnTerms[i] = mlTerms[Math.floor(Math.random() * mlTerms.length)];
                    columnCharIdx[i] = 0;
                }
                drops[i]++;
            }
        }

        const matrixInterval = setInterval(drawMatrix, 45);

        // Stop after 6 seconds
        setTimeout(() => {
            canvas.style.opacity = '0';
            setTimeout(() => {
                clearInterval(matrixInterval);
                canvas.remove();
                matrixActive = false;
            }, 600);
        }, 6000);
    }
}

// ===== Easter Egg: Gravity Toggle (press G) =====
function initGravityToggle() {
    let gravityOn = false;

    document.addEventListener('keydown', (e) => {
        // Don't trigger when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'g' || e.key === 'G') {
            if (window._bgToggleGravity) {
                gravityOn = window._bgToggleGravity();
            }
        }
    });
}