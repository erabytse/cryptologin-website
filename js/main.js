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

    // ================================================================
    // COMPTEUR DE CARACTÈRES (pour la landing page)
    // ================================================================

    // Si la page contient un champ de secret
    const secretInputLanding = document.querySelector('#demoSecret');
    const charCounterLanding = document.getElementById('charCounter');

    if (secretInputLanding && charCounterLanding) {
        function updateCharCounter() {
            const length = secretInputLanding.value.length;
            const minLength = 32;
            
            charCounterLanding.textContent = `${length}/${minLength}`;
            charCounterLanding.className = 'char-counter';
            
            if (length === 0) {
                // neutre
            } else if (length >= minLength) {
                charCounterLanding.classList.add('valid');
            } else if (length >= minLength * 0.7) {
                charCounterLanding.classList.add('warning');
            } else {
                charCounterLanding.classList.add('invalid');
            }
        }
        
        secretInputLanding.addEventListener('input', updateCharCounter);
        updateCharCounter();
    }
});