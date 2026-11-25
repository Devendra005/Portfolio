document.documentElement.classList.add('js');

const typingElement = document.getElementById('typing-text');
if (typingElement && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const phrases = ['AI Enthusiast', 'Data Science Learner', 'Future Innovator', 'Python Developer'];
  let phraseIndex = 0;
  let characterIndex = 0;
  let deleting = false;

  function type() {
    const phrase = phrases[phraseIndex];
    typingElement.textContent = deleting
      ? phrase.substring(0, characterIndex - 1)
      : phrase.substring(0, characterIndex + 1);
    characterIndex += deleting ? -1 : 1;

    if (!deleting && characterIndex === phrase.length) {
      deleting = true;
      window.setTimeout(type, 1800);
      return;
    }
    if (deleting && characterIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
    window.setTimeout(type, deleting ? 55 : 90);
  }

  type();
}

window.addEventListener('scroll', () => {
  const scrollBar = document.getElementById('scroll-bar');
  if (scrollBar) {
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = `${scrollRange > 0 ? (window.scrollY / scrollRange) * 100 : 0}%`;
  }
  document.getElementById('site-header')?.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
  const clearPointerGlow = () => {
    document.body.style.removeProperty('--pointer-x');
    document.body.style.removeProperty('--pointer-y');
  };

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    document.body.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.body.style.setProperty('--pointer-y', `${event.clientY}px`);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', clearPointerGlow);
}

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(element => {
    const siblings = [...element.parentElement.children].filter(sibling =>
      sibling.matches('.reveal, .reveal-left, .reveal-right')
    );
    const siblingIndex = siblings.indexOf(element);
    element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 4) * 80}ms`);
    revealObserver.observe(element);
  });
}

const siteNav = document.querySelector('.site-nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const mobileNavQuery = window.matchMedia('(max-width: 900px)');

function setNavOpen(isOpen, restoreFocus = false) {
  if (!navToggle || !navLinks) return;
  const shouldOpen = isOpen && mobileNavQuery.matches;
  navLinks.classList.toggle('open', shouldOpen);
  navLinks.inert = mobileNavQuery.matches && !shouldOpen;
  navLinks.setAttribute('aria-hidden', String(mobileNavQuery.matches && !shouldOpen));
  navToggle.setAttribute('aria-expanded', String(shouldOpen));
  navToggle.setAttribute('aria-label', shouldOpen ? 'Close navigation menu' : 'Open navigation menu');
  const icon = navToggle.querySelector('i');
  if (icon) icon.className = shouldOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  if (restoreFocus && !shouldOpen) navToggle.focus();
}

if (siteNav && navToggle && navLinks) {
  setNavOpen(false);
  navToggle.addEventListener('click', () => setNavOpen(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNavOpen(false));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      setNavOpen(false, true);
    }
  });
  const handleNavBreakpointChange = () => setNavOpen(false);
  if (typeof mobileNavQuery.addEventListener === 'function') {
    mobileNavQuery.addEventListener('change', handleNavBreakpointChange);
  } else {
    mobileNavQuery.addListener(handleNavBreakpointChange);
  }

  const sectionLinks = navLinks.querySelectorAll('a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(link => {
          link.toggleAttribute('aria-current', link.hash === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));
  }
}

const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const requiredFields = [
    [contactForm.querySelector('[name="name"]'), 'Please enter your name.'],
    [contactForm.querySelector('[name="message"]'), 'Please enter a message.']
  ].filter(([field]) => field);

  requiredFields.forEach(([field]) => {
    field.addEventListener('input', () => field.setCustomValidity(''));
  });

  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const subjectInput = String(formData.get('subject') || '').trim();
    const subject = (subjectInput || `Portfolio contact from ${name}`).replace(/[\r\n]+/g, ' ');
    const message = String(formData.get('message') || '').trim();

    requiredFields.forEach(([field, validationMessage]) => {
      field.setCustomValidity(field.value.trim() ? '' : validationMessage);
    });
    if (!contactForm.reportValidity()) return;

    const body = [`Name: ${name}`, `Email: ${email}`, '', message].join('\n');
    const mailto = `mailto:devendrakumbhare005@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const successMessage = document.getElementById('form-success');
    if (successMessage) {
      successMessage.textContent = 'Opening your email app with this message addressed to Devendra.';
      successMessage.style.display = 'block';
    }
    window.location.href = mailto;
  });
}
