/* ══════════════════════════════════════════
   NEURAL NETWORK CANVAS ANIMATION
══════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let nodes = [], W, H, animId;
  const NODE_COUNT = 100;
  const CONNECT_DIST = 300;
  const PULSE_SPEED = 0.0001;
  const PERSPECTIVE = 400; // Focal length

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * W * 1.5,
        y: (Math.random() - 0.5) * H * 1.5,
        z: Math.random() * 800 - 400,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3)
      });
      // Store constant speed
      const n = nodes[nodes.length - 1];
      n.baseSpeed = Math.sqrt(n.vx ** 2 + n.vy ** 2 + n.vz ** 2);
    }
  }

  const COLORS = ['rgba(0,245,255,', 'rgba(180,77,255,', 'rgba(77,143,255,'];
  const GLOW_COLORS = ['#00f5ff', '#b44dff', '#4d8fff'];

  let worldRotX = 0, worldRotY = 0;

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Global rotation speed
    worldRotX += 0.0009;
    worldRotY += 0.0005;

    // Projection and Rotation
    function project(p) {
      // Rotation in 3D Space
      // Y-axis rotation
      let x1 = p.x * Math.cos(worldRotY) - p.z * Math.sin(worldRotY);
      let z1 = p.x * Math.sin(worldRotY) + p.z * Math.cos(worldRotY);
      // X-axis rotation
      let y2 = p.y * Math.cos(worldRotX) - z1 * Math.sin(worldRotX);
      let z2 = p.y * Math.sin(worldRotX) + z1 * Math.cos(worldRotX);

      const scale = PERSPECTIVE / (PERSPECTIVE + z2);
      return {
        x: x1 * scale + W / 2,
        y: y2 * scale + H / 2,
        scale: scale,
        depth: z2
      };
    }

    // Update positions with linear motion
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.z += n.vz;

      const limit = 600;
      // Bounce with constant speed (flip direction)
      if (Math.abs(n.x) > limit) n.vx *= -1;
      if (Math.abs(n.y) > limit) n.vy *= -1;
      if (Math.abs(n.z) > limit) n.vz *= -1;

      // Ensure constant speed (Normalization)
      const currSpeed = Math.sqrt(n.vx ** 2 + n.vy ** 2 + n.vz ** 2);
      if (currSpeed > 0) {
        n.vx = (n.vx / currSpeed) * n.baseSpeed;
        n.vy = (n.vy / currSpeed) * n.baseSpeed;
        n.vz = (n.vz / currSpeed) * n.baseSpeed;
      }
    });

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      const p1 = project(nodes[i]);
      if (p1.x < 0 || p1.x > W || p1.y < 0 || p1.y > H) continue;

      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECT_DIST) {
          const p2 = project(nodes[j]);
          const alpha = (1 - dist / CONNECT_DIST) * 0.2 * p1.scale * p2.scale;
          const colA = COLORS[nodes[i].layer];
          const colB = COLORS[nodes[j].layer];

          // Connection line
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, colA + alpha + ')');
          grad.addColorStop(1, colB + alpha + ')');

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.5 * p1.scale;
          ctx.stroke();

          // Digital flow with 3D scaling
          const pulse = (t * PULSE_SPEED + nodes[i].pulse) % 1;
          const px = p1.x + (p2.x - p1.x) * pulse;
          const py = p1.y + (p2.y - p1.y) * pulse;
          const pScale = p1.scale + (p2.scale - p1.scale) * pulse;

          const chars = "0101<>{}[]X/\\";
          const char = chars[Math.floor((t * 0.005 + nodes[i].pulse * 10) % chars.length)];
          
          ctx.font = `bold ${8 * pScale}px 'Share Tech Mono', monospace`;
          ctx.fillStyle = GLOW_COLORS[nodes[i].layer];
          ctx.globalAlpha = alpha * 4;
          ctx.fillText(char, px, py);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const p = project(n);
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) return;

      n.pulse += 0.003;
      const glow = (Math.sin(n.pulse * 2) + 1) / 2;
      const alpha = (0.3 + glow * 0.7) * p.scale;
      const size = n.r * (1 + glow * 0.3) * p.scale;

      // Layer 1: Outer soft glow
      const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 5);
      radGrad.addColorStop(0, COLORS[n.layer] + (alpha * 0.2) + ')');
      radGrad.addColorStop(1, COLORS[n.layer] + '0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Geometric frame
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(n.pulse);
      ctx.strokeStyle = GLOW_COLORS[n.layer];
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 0.8 * p.scale;
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      
      // Layer 3: Core
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = GLOW_COLORS[n.layer];
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  initNodes();
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); initNodes(); });

  // 3D Perspective Mouse Interaction
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX - W / 2) * 1.5;
    mouseY = (e.clientY - H / 2) * 1.5;
    
    nodes.forEach(n => {
      const dx = mouseX - n.x, dy = mouseY - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        n.vx += dx / dist * 0.04;
        n.vy += dy / dist * 0.04;
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
   THEME TOGGLE
══════════════════════════════════════════ */
const themeBtn = document.getElementById('theme-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const isLight = html.dataset.theme === 'light';
    html.dataset.theme = isLight ? 'dark' : 'light';
  });
}

/* ══════════════════════════════════════════
   MOBILE NAV
══════════════════════════════════════════ */
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const menuIcon = document.getElementById('menu-icon');
if (navToggle && navLinks && menuIcon) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuIcon.className = navLinks.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuIcon.className = 'fa-solid fa-bars';
    });
  });
}

/* ══════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════ */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type=submit]');
    const successMsg = document.getElementById('form-success');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';
    btn.disabled = true;
    setTimeout(() => {
      this.querySelectorAll('input, textarea').forEach(el => el.value = '');
      btn.style.display = 'none';
      if (successMsg) successMsg.style.display = 'block';
      setTimeout(() => {
        btn.style.display = 'flex'; btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>Send Message';
        if (successMsg) successMsg.style.display = 'none';
      }, 4000);
    }, 1500);
  });
}
