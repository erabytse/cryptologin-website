/**
 * CryptoLogin - Landing Page Scripts
 */

document.addEventListener('DOMContentLoaded', () => {

    // ================================================================
    // NAVIGATION SMOOTH SCROLL
    // ================================================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ================================================================
    // HEADER SCROLL EFFECT
    // ================================================================

    let lastScroll = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            header.style.boxShadow = 'none';
        }
        lastScroll = currentScroll;
    });

    // ================================================================
    // DEMO NAVIGATION
    // ================================================================

    const demoLink = document.querySelector('a[href="#demo"]');
    if (demoLink) {
        demoLink.addEventListener('click', (e) => {
            e.preventDefault();
            const demoSection = document.getElementById('demo');
            if (demoSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = demoSection.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    console.log('🔐 CryptoLogin - Landing Page loaded');
});