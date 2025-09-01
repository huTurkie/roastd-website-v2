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
            const section2 = document.getElementById('section-2');
            if (section2) {
                section2.scrollIntoView({
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
