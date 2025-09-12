// Smooth animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Add entrance animations to floating elements
    const floatingElements = document.querySelectorAll('.floating-element');
    floatingElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.2}s`;
        element.style.opacity = '0';
        element.style.animation = `slideInUp 1s ease-out ${index * 0.2}s forwards, float 6s ease-in-out ${index * 0.2 + 1}s infinite`;
    });

    // Enhanced button interactions
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
        });

        ctaButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });

        ctaButton.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    // Parallax effect for floating elements
    window.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        floatingElements.forEach((element, index) => {
            const speed = (index + 1) * 0.02;
            const x = (mouseX - 0.5) * speed * 100;
            const y = (mouseY - 0.5) * speed * 100;
            
            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Scroll indicator functionality
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const section3 = document.getElementById('section-3');
            if (section3) {
                section3.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // Add scroll-based animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });

    // Mobile touch interactions
    if ('ontouchstart' in window && ctaButton) {
        ctaButton.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });

        ctaButton.addEventListener('touchend', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }

    // Add dynamic glow effect to button
    function addButtonGlow() {
        const glowElement = document.querySelector('.button-glow');
        if (glowElement) {
            setInterval(() => {
                glowElement.style.left = '-100%';
                setTimeout(() => {
                    glowElement.style.left = '100%';
                }, 100);
            }, 3000);
        }
    }

    if (document.querySelector('.button-glow')) {
        addButtonGlow();
    }

    // Responsive navigation
    function handleResponsiveNav() {
        const navbar = document.querySelector('.navbar');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
        });
    }

    handleResponsiveNav();

    // Mobile hamburger menu functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on nav links
        const mobileNavLinks = navMenu.querySelectorAll('.nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside or pressing escape
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Performance optimization: Debounce resize events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Handle window resize
    const handleResize = debounce(() => {
        // Recalculate positions for floating elements on resize
        floatingElements.forEach((element, index) => {
            element.style.transition = 'all 0.3s ease';
        });
    }, 250);

    window.addEventListener('resize', handleResize);
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: slideInUp 0.8s ease-out forwards;
    }
`;
document.head.appendChild(style);

// Preload assets for better performance
function preloadAssets() {
    const links = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ];
    
    links.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });
}

preloadAssets();

// Transformation Button Functionality
document.addEventListener('DOMContentLoaded', function() {
    const transformButton = document.getElementById('transformButton');
    const transformDropdown = document.getElementById('transformDropdown');
    
    if (transformButton && transformDropdown) {
        // Toggle dropdown on button click
        transformButton.addEventListener('click', function(e) {
            e.stopPropagation();
            transformDropdown.classList.toggle('show');
        });
        
        // Handle option selection
        const transformOptions = document.querySelectorAll('.transform-option');
        transformOptions.forEach(option => {
            option.addEventListener('click', function() {
                console.log('Selected transformation:', this.textContent);
                // You can add functionality here to handle the selected option
                transformDropdown.classList.remove('show');
                
                // Add a brief visual feedback
                this.style.background = 'linear-gradient(45deg, rgba(255, 64, 129, 0.2), rgba(255, 107, 53, 0.2))';
                setTimeout(() => {
                    this.style.background = '';
                }, 300);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!transformButton.contains(e.target) && !transformDropdown.contains(e.target)) {
                transformDropdown.classList.remove('show');
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                transformDropdown.classList.remove('show');
            }
        });
    }
});

// Add error handling for external resources
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'LINK') {
        console.warn('Failed to load external resource:', e.target.href);
        // Fallback to system fonts if Google Fonts fail
        if (e.target.href.includes('fonts.googleapis.com')) {
            document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        }
    }
});

// Roast Section JavaScript Functionality - Updated prompts
document.addEventListener('DOMContentLoaded', function() {
    // FORCE REMOVE ANY HEADING ELEMENTS ABOVE PICTURE
    const headingElements = document.querySelectorAll('#roast-toast-heading, .roast-toast-heading');
    headingElements.forEach(el => el.remove());
    
    // Check for any dynamically created heading elements and remove them
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.id === 'roast-toast-heading' || node.classList.contains('roast-toast-heading')) {
                        node.remove();
                    }
                    // Also check children
                    const children = node.querySelectorAll('#roast-toast-heading, .roast-toast-heading');
                    children.forEach(child => child.remove());
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Counter animation for roast section
    let roastCounter = 274;
    const roastCounterElement = document.getElementById('roastCounter');
    
    if (roastCounterElement) {
        setInterval(() => {
            const increment = Math.random() > 0.5 ? 1 : 2;
            roastCounter += increment;
            roastCounterElement.textContent = roastCounter;
        }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
    }



    // Rotating images for roast section - alternating pattern
    const roastImage = document.getElementById('roast-image');
    const images = [
        'attached_assets/main pic web_1757164517069.jpeg',           // Main
        'attached_assets/turn them into. superhero_1757165647938.jpeg', // Superhero
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/celeberty_1757274702358.jpeg',             // Celebrity for a day
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/Forest_1757275254455.jpeg',                // Forest fairy
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/pixar style_1757272721657.jpeg',           // Pixar-style character
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/fantacy world_1757274575009.jpeg',         // Fantasy world
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/meme_1757273737145.jpeg',                  // Meme character
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/sport _1757274331156.jpeg',                // Sports scene
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/add magical effect arond them_1757164700641.jpeg', // Magical
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/robot1_1757273401284.jpeg', // Robot
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/movie1_1757278409724.jpeg',                // Movie poster
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/outer space_1757213156762.jpeg',           // Outer space
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/historical figure_1757270390879.jpeg',     // Historical figure
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/Giant_1757271069633.jpeg',                 // Giant scene
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/Tiny_1757271458272.jpeg',                  // Tiny scene
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/cartoon_1757271945448.jpeg',               // Cartoon character
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/put them inside a painting_1757167446469.jpeg', // Famous painting
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/animie_1757276904300.jpeg',                // Anime character
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/vallian_1757275900151.jpeg',               // Villain
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/methical_1757275625337.jpeg',              // Mythical creature
        'attached_assets/main pic web_1757164517069.jpeg',           // Main again
        'attached_assets/swap their outfit_1757168196283.jpeg'      // Outfit swap
    ];
    let currentImageIndex = 0;
    
    if (roastImage) {
        setInterval(() => {
            roastImage.style.opacity = '0';
            setTimeout(() => {
                currentImageIndex = (currentImageIndex + 1) % images.length;
                roastImage.src = images[currentImageIndex] + '?v=' + Date.now();
                roastImage.style.opacity = '1';
            }, 300);
        }, 3000); // Change every 3 seconds
    }

    // Rotating placeholder text for roast section - synchronized with images
    const roastPromptInput = document.querySelector('.roast-prompt-input');
    
    if (roastPromptInput) {
        // Synchronized prompts that match the alternating pattern
        const synchronizedPrompts = [
            "Enter your roast or transformation prompt here...", // Main image
            "Turn them into a superhero 🦸",                    // Superhero image
            "Enter your roast or transformation prompt here...", // Main image again
            "Make them a celebrity for a day 🌟",              // Celebrity for a day image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn her into a beautiful forest fairy in an enchanted glade 🧚", // Forest fairy image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn them into a Pixar-style character 🎥",        // Pixar-style character image
            "Enter your roast or transformation prompt here...", // Main image again
            "Put them in a fantasy world 🏰",                  // Fantasy world image
            "Enter your roast or transformation prompt here...", // Main image again
            "Transform them into a meme character 😂",          // Meme character image
            "Enter your roast or transformation prompt here...", // Main image again
            "Put them in a sports scene ⚽",                    // Sports scene image
            "Enter your roast or transformation prompt here...", // Main image again
            "Add a magical effect around them ✨",               // Magical effect image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn them into a robot 🤖",                        // Robot image
            "Enter your roast or transformation prompt here...", // Main image again
            "Put them in a movie poster 🎬",                   // Movie poster image
            "Enter your roast or transformation prompt here...", // Main image again
            "Put them in outer space 🚀",                     // Outer space image
            "Enter your roast or transformation prompt here...", // Main image again
            "Make them a historical figure 👑",                 // Historical figure image
            "Enter your roast or transformation prompt here...", // Main image again
            "Make them giant in a scene 🔍",                    // Giant scene image
            "Enter your roast or transformation prompt here...", // Main image again
            "Make them tiny in a scene 🔍",                     // Tiny scene image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn them into a cartoon character 📺",             // Cartoon character image
            "Enter your roast or transformation prompt here...", // Main image again
            "Put them in a famous painting 🖼️",                // Famous painting image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn them into an anime character 🎌",            // Anime character image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn them into a villain 😈",                     // Villain image
            "Enter your roast or transformation prompt here...", // Main image again
            "Turn them into mythical creature 🐉",              // Mythical creature image
            "Enter your roast or transformation prompt here...", // Main image again
            "Swap their outfit with someone famous 👗"          // Outfit swap image
        ];
        
        let promptIndex = 0;
        let placeholderInterval;
        
        function startPlaceholderRotation() {
            if (!roastPromptInput.value) {
                placeholderInterval = setInterval(() => {
                    promptIndex = (promptIndex + 1) % synchronizedPrompts.length;
                    roastPromptInput.placeholder = synchronizedPrompts[promptIndex];
                }, 3000); // Change every 3 seconds to match image rotation
            }
        }
        
        function stopPlaceholderRotation() {
            clearInterval(placeholderInterval);
        }
        
        // Start rotation initially
        startPlaceholderRotation();
        
        // Stop rotation when user starts typing, restart when input is cleared
        roastPromptInput.addEventListener('input', function() {
            if (this.value) {
                stopPlaceholderRotation();
            } else {
                startPlaceholderRotation();
            }
        });
    }

    // Roast Transform Button Functionality
    const roastTransformButton = document.getElementById('roastTransformButton');
    const roastTransformDropdown = document.getElementById('roastTransformDropdown');
    
    if (roastTransformButton && roastTransformDropdown && roastPromptInput) {
        // Toggle dropdown on button click
        roastTransformButton.addEventListener('click', function(e) {
            e.stopPropagation();
            roastTransformDropdown.classList.toggle('show');
        });
        
        // Handle option selection
        const roastTransformOptions = document.querySelectorAll('.roast-transform-option');
        roastTransformOptions.forEach(option => {
            option.addEventListener('click', function() {
                roastPromptInput.value = this.textContent;
                roastTransformDropdown.classList.remove('show');
                roastPromptInput.focus();
                
                // Add a brief visual feedback
                this.style.background = 'linear-gradient(45deg, rgba(255, 64, 129, 0.2), rgba(255, 107, 53, 0.2))';
                setTimeout(() => {
                    this.style.background = '';
                }, 300);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!roastTransformButton.contains(e.target) && !roastTransformDropdown.contains(e.target)) {
                roastTransformDropdown.classList.remove('show');
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                roastTransformDropdown.classList.remove('show');
            }
        });
    }

    // Roast Submit Button
    const roastSubmitBtn = document.querySelector('.roast-submit-btn');
    if (roastSubmitBtn && roastPromptInput) {
        roastSubmitBtn.addEventListener('click', function() {
            const promptText = roastPromptInput.value.trim();
            
            if (!promptText) {
                alert('Please enter a prompt first!');
                return;
            }
            
            // Disable button to prevent multiple submissions
            this.disabled = true;
            this.textContent = 'Sending...';
            
            // Simulate sending (since this is pure UI)
            setTimeout(() => {
                alert('Sent to inbox! 💌');
                roastPromptInput.value = '';
                this.textContent = 'Sent! ✔️';
                
                setTimeout(() => {
                    this.disabled = false;
                    this.textContent = 'Send';
                }, 2000);
            }, 1000);
        });
    }

    // Get Messages Button
    const roastGetMessagesBtn = document.querySelector('.roast-get-messages-btn');
    if (roastGetMessagesBtn) {
        roastGetMessagesBtn.addEventListener('click', function() {
            // Scroll to the hero section (section-2)
            const heroSection = document.getElementById('section-2');
            if (heroSection) {
                heroSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
});
