/* ══════════════════════════════════════════
   NEURAL NETWORK CANVAS ANIMATION
══════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let nodes = [], W, H, animId;
  const NODE_COUNT = 135; // Denser network
  const CONNECT_DIST = 320; // Longer axons
  const PERSPECTIVE = 650;
  const CAMERA_DEPTH = 600;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * W * 1.9,
        y: (Math.random() - 0.5) * H * 1.9,
        z: Math.random() * 1200 - 600,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        vz: (Math.random() - 0.5) * 0.45,
        r: Math.random() < 0.12 ? (Math.random() * 2 + 3.5) : (Math.random() * 1.8 + 0.8),
        pulse: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3)
      });
      const n = nodes[nodes.length - 1];
      n.baseSpeed = Math.sqrt(n.vx ** 2 + n.vy ** 2 + n.vz ** 2);
    }
  }

  const COLORS = ['0,245,255', '180,77,255', '77,143,255'];
  const GLOW_COLORS = ['#00f5ff', '#b44dff', '#4d8fff'];

  let worldRotX = 0, worldRotY = 0;
  let mouseTiltX = 0, mouseTiltY = 0;

  function project(p) {
    const x1 = p.x * Math.cos(worldRotY) - p.z * Math.sin(worldRotY);
    const z1 = p.x * Math.sin(worldRotY) + p.z * Math.cos(worldRotY);
    const y2 = p.y * Math.cos(worldRotX) - z1 * Math.sin(worldRotX);
    const z2 = p.y * Math.sin(worldRotX) + z1 * Math.cos(worldRotX);

    const depth = z2 + CAMERA_DEPTH;
    if (depth < 40) return null;

    const scale = PERSPECTIVE / depth;
    return {
      x: x1 * scale + W / 2,
      y: y2 * scale + H / 2,
      scale: Math.min(8, scale),
      depth: depth
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    worldRotX += 0.0004 + mouseTiltY * 0.00008;
    worldRotY += 0.0003 + mouseTiltX * 0.00008;

    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.z += n.vz;
      const limit = 900;
      if (Math.abs(n.x) > limit) n.vx *= -1;
      if (Math.abs(n.y) > limit) n.vy *= -1;
      if (Math.abs(n.z) > limit) n.vz *= -1;

      const currSpeed = Math.sqrt(n.vx ** 2 + n.vy ** 2 + n.vz ** 2);
      if (currSpeed > 0) {
        n.vx = (n.vx / currSpeed) * (n.baseSpeed * (1 + Math.abs(mouseTiltX) / 1500));
        n.vy = (n.vy / currSpeed) * (n.baseSpeed * (1 + Math.abs(mouseTiltY) / 1500));
        n.vz = (n.vz / currSpeed) * n.baseSpeed;
      }
    });

    // Draw axons - STRONGER VISIBILITY
    for (let i = 0; i < nodes.length; i++) {
      const p1 = project(nodes[i]);
      if (!p1 || p1.x < -300 || p1.x > W + 300 || p1.y < -300 || p1.y > H + 300) continue;

      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECT_DIST) {
          const p2 = project(nodes[j]);
          if (!p2) continue;

          // Significantly boosted alpha for axons
          let alpha = (1 - dist / CONNECT_DIST) * 0.45 * Math.min(p1.scale, p2.scale, 1.5);
          if (alpha < 0.01) continue;

          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, `rgba(${COLORS[nodes[i].layer]}, ${alpha})`);
          grad.addColorStop(1, `rgba(${COLORS[nodes[j].layer]}, ${alpha})`);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = grad;
          // Thicker lines for visibility
          ctx.lineWidth = 0.8 * p1.scale;
          ctx.stroke();

          // Data flow pulses
          if (dist < CONNECT_DIST * 0.35 && p1.scale > 1) {
            const timeIdx = (t * 0.00025 + nodes[i].pulse) % 1;
            const px = p1.x + (p2.x - p1.x) * timeIdx;
            const py = p1.y + (p2.y - p1.y) * timeIdx;
            
            ctx.fillStyle = GLOW_COLORS[nodes[i].layer];
            ctx.globalAlpha = alpha * 2.5;
            ctx.beginPath();
            ctx.arc(px, py, 2.5 * p1.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Draw neurons
    nodes.forEach(n => {
      const p = project(n);
      if (!p || p.x < -150 || p.x > W + 150 || p.y < -150 || p.y > H + 150) return;

      n.pulse += 0.005;
      const glow = (Math.sin(n.pulse * 2.5) + 1) / 2;
      const alpha = (0.55 + glow * 0.45) * Math.min(1.2, p.scale);
      const size = n.r * (1 + glow * 0.3) * p.scale;

      ctx.shadowBlur = 12 * p.scale;
      ctx.shadowColor = GLOW_COLORS[n.layer];

      ctx.beginPath();
      ctx.arc(p.x, p.y, size * (n.r > 2.5 ? 0.4 : 0.7), 0, Math.PI * 2);
      ctx.fillStyle = GLOW_COLORS[n.layer];
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fill();

      ctx.shadowBlur = 0;

      if (n.r > 2.5) {
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 5);
        radGrad.addColorStop(0, `rgba(${COLORS[n.layer]}, ${alpha * 0.6})`);
        radGrad.addColorStop(1, `rgba(${COLORS[n.layer]}, 0)`);
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  initNodes();
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => resize());

  window.addEventListener('mousemove', e => {
    mouseTiltX = (e.clientX - W / 2);
    mouseTiltY = (e.clientY - H / 2);
    
    nodes.forEach(n => {
      const p = project(n);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0 && dist < 200) {
        const force = (1 - dist / 200) * 0.3;
        n.vx += (dx / dist) * force;
        n.vy += (dy / dist) * force;
      }
    });
  });
})();





/* ══════════════════════════════════════════
   TYPING ANIMATION
══════════════════════════════════════════ */
(function () {
  const phrases = [
    "AI Enthusiast",
    "Data Science Learner",
    "Future Innovator",
    "Python Developer"
  ];
  const el = document.getElementById('typing-text');
  if (!el) return;
  let phraseIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    }
    setTimeout(type, deleting ? 55 : 90);
  }
  type();
})();

/* ══════════════════════════════════════════
   CURSOR
══════════════════════════════════════════ */
(function () {
  const cursor = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  if (!cursor) return;
  let tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    tx = e.clientX; ty = e.clientY;
  });
  setInterval(() => {
    if (trail) {
      trail.style.left = tx + 'px';
      trail.style.top = ty + 'px';
    }
  }, 80);
  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width = '20px'; cursor.style.height = '20px'; });
    el.addEventListener('mouseleave', () => { cursor.style.width = '12px'; cursor.style.height = '12px'; });
  });
})();

/* ══════════════════════════════════════════
   SCROLL EFFECTS
══════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const scrollBar = document.getElementById('scroll-bar');
  if (scrollBar) {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    scrollBar.style.width = pct + '%';
  }
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* ══════════════════════════════════════════
   REVEAL ON SCROLL (IntersectionObserver)
══════════════════════════════════════════ */
(function () {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        // Animate skill bars
        const bar = e.target.querySelector('.skill-bar');
        if (bar) bar.style.width = bar.dataset.width + '%';
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
    obs.observe(el);
  });
})();


/* ══════════════════════════════════════════
   MOBILE NAV
══════════════════════════════════════════ */
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');
const navClose  = document.getElementById('nav-close');

function openMenu() {
  navLinks.classList.add('open');
}
function closeMenu() {
  navLinks.classList.remove('open');
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', openMenu);
}
if (navClose) {
  navClose.addEventListener('click', closeMenu);
}
if (navLinks) {
  // Close when any nav link is clicked
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
  // Close when clicking the dark overlay backdrop
  navLinks.addEventListener('click', function (e) {
    if (e.target === navLinks) closeMenu();
  });
}
// Close with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});

/* ══════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════ */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const successMsg = document.getElementById('form-success');
    const formData = new FormData(this);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const subject = formData.get('subject').trim() || `Portfolio contact from ${name}`;
    const message = formData.get('message').trim();
    const body = [`Name: ${name}`, `Email: ${email}`, '', message].join('\n');
    const mailto = `mailto:devendrakumbhare005@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (successMsg) {
        successMsg.textContent = 'Opening your email app with this message addressed to Devendra. Review and send it there.';
        successMsg.style.display = 'block';
    }
    window.location.href = mailto;
  });
}

/* ══════════════════════════════════════════
   PROJECT CARD CLICKABILITY
══════════════════════════════════════════ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const link = card.querySelector('.project-link');
    if (link) window.open(link.href, '_blank');
  });
});
