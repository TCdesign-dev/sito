/**
 * main.js — Portfolio Tommaso Costanza
 *
 * - fetchProjects: loads projects/projects.json
 * - buildPostitCard: renders realistic post-it HTML
 * - loadProjectsGrid: projects.html board
 * - loadLatestProjects: index.html strip
 * - loadProjectDetail: project.html page
 * - applyWeatherTheme: wttr.in weather → CSS class
 * - initScrollReveal: IntersectionObserver reveals
 * - initCopyrightYear: auto-updates year in footer
 */

'use strict';

/* ===========================
   CONFIG
   =========================== */
const PROJECTS_JSON = '/projects/projects.json';

const COLOR_MAP = {
  yellow: 'postit--yellow',
  green:  'postit--green',
  pink:   'postit--pink',
  blue:   'postit--blue',
};

const MAX_ROTATION = 3.0;

/* ===========================
   UTILITIES
   =========================== */

/** Deterministic rotation from project id — same project = same angle */
function seedRotation(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return ((h % 1000) / 1000) * MAX_ROTATION;
}

/** Deterministic curl decision — ~50/50 */
function shouldCurl(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 3) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2 === 0;
}

/** HTML-escape a string */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===========================
   DATA LOADING
   =========================== */
async function fetchProjects() {
  try {
    const res = await fetch(PROJECTS_JSON);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Could not load projects.json:', err);
    return [];
  }
}

/* ===========================
   POST-IT CARD BUILDER
   =========================== */
function buildPostitCard(project) {
  const colorClass = COLOR_MAP[project.color] || 'postit--yellow';
  const rotation   = seedRotation(project.id);
  const curl       = shouldCurl(project.id);
  const isExternal = project.link && !project.page;

  const catUrl = project.category ? encodeURIComponent(project.category.toLowerCase()) : 'misc';
  const href = project.page
    ? `/${catUrl}/${encodeURIComponent(project.id)}`
    : (project.link || '#');

  const tagsHtml = (project.tags || [])
    .slice(0, 2)
    .map(t => `<span class="postit-tag">${esc(t)}</span>`)
    .join('');

  const a = document.createElement('a');
  a.className = `postit ${colorClass}${curl ? ' postit--curled' : ''}`;
  a.href = href;
  a.style.setProperty('--r', `${rotation}deg`);
  a.setAttribute('aria-label', `${project.name} — ${project.year}`);

  if (isExternal) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }

  a.innerHTML = `
    <div class="postit-shadow"></div>
    <div class="postit-paper">
      <div class="postit-body">
        ${isExternal ? `<span class="postit-external-icon" aria-hidden="true">↗</span>` : ''}
        <img
          class="postit-image"
          src="${esc(project.preview)}"
          alt="${esc(project.name)}"
          loading="lazy"
          onerror="this.style.opacity='0'"
        />
        <p class="postit-name">${esc(project.name)}</p>
        <div class="postit-meta">
          <span class="postit-year">${esc(String(project.year))}</span>
          <div class="postit-tags">${tagsHtml}</div>
        </div>
      </div>
    </div>
    <div class="postit-curl" aria-hidden="true"></div>
  `;

  return a;
}

/* ===========================
   PROJECTS GRID  (projects.html)
   =========================== */
async function loadProjectsGrid(gridId, countId) {
  const grid    = document.getElementById(gridId);
  const countEl = document.getElementById(countId);
  if (!grid) return;

  const projects = await fetchProjects();

  if (countEl) {
    countEl.textContent = `${projects.length} project${projects.length !== 1 ? 's' : ''}`;
  }

  if (!projects.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No projects yet.</p>';
    return;
  }

  projects.forEach((p, i) => {
    const card = buildPostitCard(p);
    // Stagger delay for scroll reveal
    card.style.transitionDelay = `${i * 55}ms`;
    grid.appendChild(card);
  });

  // Trigger IntersectionObserver after DOM is updated
  initScrollReveal();
}

/* ===========================
   LATEST PROJECTS  (index.html)
   =========================== */
async function loadLatestProjects(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const projects = await fetchProjects();
  const latest   = projects.slice(0, count);

  latest.forEach((p, i) => {
    const catUrl = p.category ? encodeURIComponent(p.category.toLowerCase()) : 'misc';
    const href = p.page
      ? `/${catUrl}/${encodeURIComponent(p.id)}`
      : (p.link || '#');

    const a = document.createElement('a');
    a.className = `home-project-card reveal-right reveal-delay-${i + 1}`;
    a.href = href;
    if (p.link && !p.page) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }

    a.innerHTML = `
      <img
        src="${esc(p.preview)}"
        alt="${esc(p.name)}"
        loading="lazy"
        onerror="this.style.opacity='0.15'"
      />
      <span class="card-name">${esc(p.name)}</span>
      <span class="card-year">${esc(String(p.year))}</span>
    `;

    container.appendChild(a);
  });

  // Reveal after insertion
  initScrollReveal();
}

/* ===========================
   EXPLORATIONS (explorations.html)
   =========================== */
async function loadExplorations(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const projects = await fetchProjects();
  // Filter for explorations (you can use category or a specific flag. Assuming category 'explorations')
  const explorations = projects.filter(p => p.category && p.category.toLowerCase() === 'explorations');

  if (explorations.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">No explorations found at the moment.</p>`;
    return;
  }

  explorations.forEach(p => {
    const a = document.createElement('a');
    a.className = 'exploration-card visible';
    // Select dynamic route if 'page' is true, OR if there's no external link
    const hasPage = p.page || (!p.page && !p.link);
    const catUrl = p.category ? encodeURIComponent(p.category.toLowerCase()) : 'misc';
    a.href = hasPage ? `/${catUrl}/${encodeURIComponent(p.id)}` : p.link;
    if (!hasPage && p.link) a.target = '_blank';

    a.innerHTML = `
      <img src="${esc(p.preview || '')}" alt="${esc(p.name)}" class="exploration-img" loading="lazy" />
      <div class="exploration-content">
        <h3 class="exploration-title">${esc(p.name)}</h3>
        <p class="exploration-desc">${esc(p.description || '')}</p>
        <span class="exploration-date">${esc(String(p.year))}</span>
      </div>
    `;
    container.appendChild(a);
  });

  initScrollReveal();
}


/* ===========================
   PROJECT DETAIL  (project.html)
   =========================== */
async function loadProjectDetail(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) { window.location.href = '/404'; return; }

  const projects = await fetchProjects();
  const project  = projects.find(p => p.id === id);
  if (!project)  { window.location.href = '/404'; return; }

  document.title = `${project.name} — Tommaso Costanza`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', project.description || '');

  const canonicalUrl = `https://tommasocostanza.space/project.html?id=${id}`;
  
  const canonicalTag = document.querySelector('link[rel="canonical"]');
  if (canonicalTag) canonicalTag.setAttribute('href', canonicalUrl);
  
  const ogUrlTag = document.querySelector('meta[property="og:url"]');
  if (ogUrlTag) ogUrlTag.setAttribute('content', canonicalUrl);

  const tagsHtml = (project.tags || []).map(t => `<li>${esc(t)}</li>`).join('');

  const contentHtml = (project.content || []).map(block => {
    if (block.type === 'text') {
      return `<p class="content-text reveal">${esc(block.value)}</p>`;
    }
    if (block.type === 'image') {
      return `
        <figure class="content-image reveal">
          <img src="${esc(block.src)}" alt="${esc(block.caption || '')}" loading="lazy" />
          ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}
        </figure>
      `;
    }
    return '';
  }).join('');

  const linkHtml = project.link
    ? `<a href="${esc(project.link)}" class="project-link-btn" target="_blank" rel="noopener noreferrer">View project ↗</a>`
    : '';

  const isExploration = project.category && (project.category.toLowerCase() === 'explorations' || project.category.toLowerCase() === 'esplorazioni');
  const backHref = isExploration ? '/explorations' : '/?skipIntro=true';
  const backText = isExploration ? 'Back to list' : 'Back to Galaxy';

  container.innerHTML = `
    <a href="${backHref}" class="project-back">${backText}</a>
    ${project.preview ? `<img src="${esc(project.preview)}" class="project-detail-hero" alt="Anteprima progetto" />` : ''}
    <h1 class="project-title">${esc(project.name)}</h1>
    <div class="project-header-meta">
      <span class="project-year-badge">${esc(String(project.year))}</span>
      <ul class="project-tag-list">${tagsHtml}</ul>
      ${linkHtml}
    </div>
    <div class="project-content">
      ${contentHtml}
    </div>
  `;

  initScrollReveal();
}


/* ===========================
   SCROLL REVEAL
   =========================== */
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.reveal:not(.visible), .reveal-right:not(.visible), .postit:not(.visible)'
  );

  if (!targets.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => obs.observe(el));
}

/* ===========================
   AUTO COPYRIGHT YEAR
   =========================== */
function initCopyrightYear() {
  document.querySelectorAll('.copyright-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* ===========================
   NOT FOUND
   =========================== */
function notFoundHtml() {
  return `
    <a href="projects.html" class="project-back">Projects</a>
    <h1 class="project-title">Project not found</h1>
    <p class="content-text" style="margin-top:1rem;">
      The project you're looking for doesn't exist or may have been moved.
    </p>
  `;
}

/* ===========================
   SOLAR SYSTEM (projects.html)
   =========================== */
const PLANET_COLORS = {
  yellow: '#fde047',
  green: '#86efac',
  pink: '#f9a8d4',
  blue: '#93c5fd'
};

let orbitsMap = {};
let scene, camera, renderer, controls;
let raycaster, mouse;
let planetsData = [];
let isMobile = window.innerWidth <= 768;
let textureLoader = null;
let gltfLoader;
let voyagerModel = null;
let currentView = 'galaxy';
let globalPlanetState = {};

// Tap vs Drag differentiation variables
let pointerStartX = 0;
let pointerStartY = 0;
let pointerStartTime = 0;
const TAP_DISTANCE_THRESHOLD = 8;
const TAP_TIME_THRESHOLD = 300;

function isRecentTap(e) {
  if (e.detail === 0 || (e.clientX === 0 && e.clientY === 0) || pointerStartTime === 0) {
    pointerStartTime = 0;
    return true;
  }
  const dx = e.clientX - pointerStartX;
  const dy = e.clientY - pointerStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = Date.now() - pointerStartTime;
  pointerStartTime = 0;
  return distance < TAP_DISTANCE_THRESHOLD && duration < TAP_TIME_THRESHOLD;
}

const TEXTURES = [
  '/assets/mars_texture_1782517556906.webp', 
  '/assets/earth_texture_1782517565911.webp', 
  '/assets/ice_texture_1782517572925.webp', 
  '/assets/gas_giant_texture_1782517547949.webp'
];

async function loadSolarSystem(systemId, bgId, mobileListId) {
  const container = document.getElementById(systemId);
  const mobileList = document.getElementById(mobileListId);
  const backBtn = document.getElementById('galaxy-back-btn');
  if (!container) return;

  const projects = await fetchProjects();
  if (!projects.length) return;

  orbitsMap = {};
  projects.forEach(p => {
    let category = p.category || (p.tags && p.tags.length ? p.tags[0] : 'Other');
    if (category.toLowerCase() === 'explorations' || category.toLowerCase() === 'esplorazioni') {
      return; // Skip adding a dedicated planet for this category (Voyager handles it)
    }
    if (!orbitsMap[category]) orbitsMap[category] = [];
    orbitsMap[category].push(p);
  });

  // Mobile fallback (always shows all items as a list)
  if (mobileList) {
    const categories = Object.keys(orbitsMap);
    categories.forEach(cat => {
      orbitsMap[cat].forEach(p => {
        const pColor = PLANET_COLORS[p.color] || '#aaa';
        const catUrl = encodeURIComponent(cat.toLowerCase());
        const href = p.page ? `/${catUrl}/${encodeURIComponent(p.id)}` : (p.link || '#');
        const isExternal = p.link && !p.page;

        const ml = document.createElement('a');
        ml.className = 'mobile-planet-card reveal';
        ml.href = href;
        if (isExternal) { ml.target = '_blank'; ml.rel = 'noopener noreferrer'; }
        ml.innerHTML = `
          <div class="mobile-planet-icon" style="--planet-color: ${pColor}"></div>
          <div class="mobile-planet-info">
            <span class="mobile-planet-name">${esc(p.name)}</span>
            <span class="mobile-planet-cat">${esc(cat)}</span>
          </div>
        `;
        mobileList.appendChild(ml);
      });
    });
    initScrollReveal();
  }

  initThreeJS(container, backBtn);
  renderGalaxy3D();

  // Deep-link routing removed
}

function initThreeJS(container, backBtn) {
  container.innerHTML = `
    <canvas id="webgl-canvas"></canvas>
    <div id="labels-container"></div>
    <div id="moon-popup" class="moon-popup">
      <img id="moon-popup-img" src="" alt="preview" />
      <div class="moon-popup-content">
        <div class="moon-popup-header">
          <h3 id="moon-popup-title"></h3>
          <span id="moon-popup-year" class="moon-popup-year"></span>
        </div>
        <p id="moon-popup-desc"></p>
      </div>
    </div>
  `;
  const canvas = document.getElementById('webgl-canvas');
  
  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.6)); 

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 3000);
  camera.position.set(0, 200, isMobile ? 780 : 400);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 1500;
  controls.minDistance = 100;

  textureLoader = new THREE.TextureLoader();
  gltfLoader = new THREE.GLTFLoader();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  backBtn.addEventListener('click', () => {
    if (currentView !== 'galaxy' && !window.isTransitioning) {
      window.isTransitioning = true;
      const oldCat = currentView;
      currentView = 'galaxy';
      backBtn.classList.remove('visible');
      
      // Removed pushState
      
      const bioWrap = document.querySelector('.hero-bio-wrap');
      if (bioWrap) bioWrap.style.display = 'block';

      // Stop all orbits (moons)
      planetsData.forEach(p => p.speed = 0);
      
      // Hide moons immediately to clean up scene
      planetsData.forEach(p => {
        if (p.mesh.userData.isMoon) {
          scene.remove(p.mesh);
          if (p.orbitLine) scene.remove(p.orbitLine);
          if (p.labelEl) p.labelEl.remove();
        }
      });

      // Rebuild Galaxy
      renderGalaxy3D();
      
      // Animate it in!
      const pData = planetsData.find(p => p.mesh.userData.category === oldCat);
      
      if (pData) {
        const targetRadius = pData.radius;
        // Start it at center, scaled up
        pData.radius = 0;
        pData.mesh.scale.set(3, 3, 3);
        
        new TWEEN.Tween(pData)
          .to({ radius: targetRadius }, 1500)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();

        const targetScale = pData.baseScale || 1;
        new TWEEN.Tween(pData.mesh.scale)
          .to({ x: targetScale, y: targetScale, z: targetScale }, 1500)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();
      }

      // Animate other things popping in
      scene.children.forEach(child => {
        if (child.userData.isSun) {
           child.scale.set(0,0,0);
           new TWEEN.Tween(child.scale).to({x:1, y:1, z:1}, 1500).easing(TWEEN.Easing.Cubic.InOut).start();
        }
      });
      planetsData.forEach(p => {
         if (p !== pData) {
            p.mesh.scale.set(0,0,0);
            const targetScale = p.baseScale || 1;
            new TWEEN.Tween(p.mesh.scale).to({x: targetScale, y: targetScale, z: targetScale}, 1500).easing(TWEEN.Easing.Cubic.InOut).start();
         }
      });

      const galaxyPos = isMobile ? { x: 0, y: 650, z: 900 } : { x: 0, y: 400, z: 700 };
      new TWEEN.Tween(camera.position)
        .to(galaxyPos, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
        
      new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onComplete(() => { window.isTransitioning = false; })
        .start();
    }
  });

  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    if (camera && renderer && container.clientHeight > 0) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });

  const closeBtn = document.getElementById('mobile-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.isTransitioning) return;
      window.isTransitioning = true;
      
      const popup = document.getElementById('mobile-moon-popup');
      const catTitle = document.getElementById('mobile-category-title');
      if (popup) {
        popup.classList.remove('visible');
        popup.setAttribute('aria-hidden', 'true');
      }
      if (catTitle) catTitle.classList.remove('visible');
      
      window.hoveredMoon = null; // Unfreeze orbit
      
      // Restore all hidden moons, orbits, and labels
      planetsData.forEach(p => {
        if (p.mesh.userData.isMoon && p._hiddenByMobilePopup) {
          new TWEEN.Tween(p.mesh.scale).to({x:1, y:1, z:1}, 500).easing(TWEEN.Easing.Cubic.Out).start();
          if (p.orbitLine) p.orbitLine.visible = true;
          p.isHidden = false;
          p._hiddenByMobilePopup = false;
        }
        // Restore center label
        if (p.radius === 0 && p._hiddenByMobilePopup) {
          p.isHidden = false;
          p._hiddenByMobilePopup = false;
        }
      });
      
      const sun = scene.children.find(c => c.userData.isSun);
      if (sun) new TWEEN.Tween(sun.scale).to({x:1, y:1, z:1}, 500).start();
      
      const returnPos = isMobile ? { x: 0, y: 250, z: 500 } : { x: 0, y: 150, z: 350 };
      new TWEEN.Tween(camera.position)
        .to(returnPos, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => window.isTransitioning = false)
        .start();
        
      new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
      updateScreenReaderA11y();
    });
  }

  // Events
  container.addEventListener('pointerdown', (e) => {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerStartTime = Date.now();
  });

  document.getElementById('labels-container').addEventListener('click', (e) => {
    if (!isRecentTap(e)) return;
    if (e.target.classList.contains('webgl-label')) {
      const objData = planetsData.find(p => p.labelEl === e.target);
      if (objData) handleObjectClick(objData.mesh);
    }
  });

  canvas.addEventListener('click', (e) => {
    if (!isRecentTap(e)) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.isCategory && !obj.userData.isMoon && !obj.userData.isVoyager) {
        obj = obj.parent;
      }
      if (obj) handleObjectClick(obj);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isMobile) {
      const popup = document.getElementById('moon-popup');
      if (popup) {
        popup.classList.remove('visible');
        popup.setAttribute('aria-hidden', 'true');
      }
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    let hovered = false;
    let hoveredMoon = null;
    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object;
      while (obj && !obj.userData.isCategory && !obj.userData.isMoon && !obj.userData.isVoyager) {
        obj = obj.parent;
      }
      if (!obj) continue;
      
      if (obj.userData.isMoon) {
        hoveredMoon = obj;
        hovered = true; break;
      } else if (obj.userData.isCategory || obj.userData.isVoyager) {
        hovered = true; break;
      }
    }
    renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';

    if (window.hoveredMoon !== hoveredMoon) {
      window.hoveredMoon = hoveredMoon;
      const popup = document.getElementById('moon-popup');
      if (hoveredMoon && !window.isTransitioning) {
        const p = hoveredMoon.userData.project;
        document.getElementById('moon-popup-title').textContent = p.name || '';
        document.getElementById('moon-popup-desc').textContent = p.description || '';
        const yearEl = document.getElementById('moon-popup-year');
        if (yearEl) yearEl.textContent = p.year ? String(p.year) : '';
        const img = document.getElementById('moon-popup-img');
        if (p.preview) {
          img.src = p.preview;
          img.style.display = 'block';
        } else {
          img.style.display = 'none';
        }
      }
    }
  });

  animate();
}

function handleObjectClick(obj, skipAnim = false) {
  if (window.isTransitioning) return;

  if (obj.userData.isVoyager) {
    window.location.href = obj.userData.link;
    return;
  }

  if (obj.userData.isCategory) {
    window.isTransitioning = true;
    
    const bioWrap = document.querySelector('.hero-bio-wrap');
    if (bioWrap) bioWrap.style.display = 'none';

    updateScreenReaderA11y();

    const cat = obj.userData.category;
    currentView = cat;
    document.getElementById('galaxy-back-btn').classList.add('visible');

    // Removed pushState

    // 1. Stop all orbits
    planetsData.forEach(p => p.speed = 0);

    const pData = planetsData.find(p => p.mesh === obj);

    // 2. Fade out / scale down other planets and sun
    planetsData.forEach(p => {
      if (p !== pData) {
        p.isHidden = true;
        if (!skipAnim) new TWEEN.Tween(p.mesh.scale).to({x:0, y:0, z:0}, 1000).start();
        else p.mesh.scale.set(0,0,0);
        if (p.labelEl) p.labelEl.classList.remove('visible');
      }
    });
    scene.children.forEach(child => {
      if (child.userData.isSun) {
        if (!skipAnim) new TWEEN.Tween(child.scale).to({x:0, y:0, z:0}, 1000).start();
        else child.scale.set(0,0,0);
      }
    });

    if (pData.labelEl) {
      pData.isHidden = true;
      pData.labelEl.classList.remove('visible');
    }

    const sysPos = isMobile ? { x: 0, y: 250, z: 500 } : { x: 0, y: 150, z: 350 };

    if (skipAnim) {
      pData.radius = 0;
      obj.scale.set(3, 3, 3);
      camera.position.set(sysPos.x, sysPos.y, sysPos.z);
      controls.target.set(0, 0, 0);
      renderSystem3D(cat);
      planetsData.forEach(p => {
        if (p.mesh.userData.isMoon) p.mesh.scale.set(1,1,1);
      });
      window.isTransitioning = false;
      updateScreenReaderA11y();
      
      const intro = document.getElementById('intro-screen');
      if (intro) intro.remove();
      document.body.classList.add('loaded');
      return;
    }

    // 3. Move clicked planet to center and scale up
    new TWEEN.Tween(pData)
      .to({ radius: 0 }, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    new TWEEN.Tween(obj.scale)
      .to({ x: 3, y: 3, z: 3 }, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    // 4. Move camera to system view position
    new TWEEN.Tween(camera.position)
      .to(sysPos, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    new TWEEN.Tween(controls.target)
      .to({ x: 0, y: 0, z: 0 }, 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        // Once transition completes, truly switch scenes
        renderSystem3D(cat);
        // Pop in the moons
        planetsData.forEach(p => {
          if (p.mesh.userData.isMoon) {
             p.mesh.scale.set(0,0,0);
             new TWEEN.Tween(p.mesh.scale).to({x:1, y:1, z:1}, 1000).easing(TWEEN.Easing.Elastic.Out).start();
          }
        });
        window.isTransitioning = false;
        updateScreenReaderA11y();
      })
      .start();
  } else if (obj.userData.isMoon) {
    const p = obj.userData.project;
    const href = p.page ? `project.html?id=${encodeURIComponent(p.id)}` : (p.link || '#');
    
    if (isMobile) {
      if (window.isTransitioning) return;
      window.isTransitioning = true;
      window.hoveredMoon = obj; // Freeze orbit
      
      const popup = document.getElementById('mobile-moon-popup');
      const titleEl = document.getElementById('mobile-moon-title');
      const descEl = document.getElementById('mobile-moon-desc');
      const imgEl = document.getElementById('mobile-moon-img');
      const exploreBtn = document.getElementById('mobile-explore-btn');
      const catTitle = document.getElementById('mobile-category-title');
      
      if (titleEl) titleEl.textContent = p.name || '';
      if (descEl) descEl.textContent = p.description || p.category || '';
      const yearMobileEl = document.getElementById('mobile-moon-year');
      if (yearMobileEl) yearMobileEl.textContent = p.year ? String(p.year) : '';
      if (imgEl) {
        imgEl.src = p.preview || '';
        imgEl.style.display = p.preview ? 'block' : 'none';
      }
      if (exploreBtn) {
        exploreBtn.href = href;
        exploreBtn.target = p.page ? '_self' : '_blank';
      }
      
      if (catTitle) {
        // Capitalize current view
        catTitle.textContent = currentView.charAt(0).toUpperCase() + currentView.slice(1);
        catTitle.classList.add('visible');
      }
      
      // Hide all other moons, orbit lines, labels + center label
      planetsData.forEach(pd => {
        if (pd.mesh.userData.isMoon && pd.mesh !== obj) {
          new TWEEN.Tween(pd.mesh.scale).to({x:0, y:0, z:0}, 500).start();
          if (pd.orbitLine) pd.orbitLine.visible = false;
          pd.isHidden = true;
          pd._hiddenByMobilePopup = true;
        }
        // Hide the selected moon's orbit line too
        if (pd.mesh === obj && pd.orbitLine) {
          pd.orbitLine.visible = false;
          pd._hiddenByMobilePopup = true;
        }
        // Hide center category label (orbit count)
        if (pd.radius === 0 && pd.labelEl) {
          pd.isHidden = true;
          pd._hiddenByMobilePopup = true;
        }
      });
      
      const sun = scene.children.find(c => c.userData.isSun);
      if (sun) new TWEEN.Tween(sun.scale).to({x:0, y:0, z:0}, 500).start();

      const targetPos = { 
        x: obj.position.x, 
        y: obj.position.y + 150, 
        z: obj.position.z + 300 
      };
      
      new TWEEN.Tween(camera.position)
        .to(targetPos, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
      new TWEEN.Tween(controls.target)
        .to({ x: obj.position.x, y: obj.position.y - 60, z: obj.position.z }, 800)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => {
          if (popup) {
            popup.classList.add('visible');
            popup.setAttribute('aria-hidden', 'false');
          }
          window.isTransitioning = false;
          updateScreenReaderA11y();
        })
        .start();

    } else {
      if (p.link && !p.page) window.open(href, '_blank');
      else window.location.href = href;
    }
  }
}

function clearScene() {
  planetsData.forEach(p => {
    scene.remove(p.mesh);
    if (p.orbitLine) scene.remove(p.orbitLine);
    if (p.labelEl) p.labelEl.remove();
  });
  planetsData = [];
  
  const toRemove = [];
  scene.traverse(child => {
    if (child.isMesh && child.userData.isSun) toRemove.push(child);
    if (child.isPointLight) toRemove.push(child);
  });
  toRemove.forEach(c => scene.remove(c));
}

function createLabel(text, isMoon) {
  const div = document.createElement('div');
  div.className = `webgl-label ${isMoon ? 'webgl-label--moon' : ''}`;
  div.textContent = text;
  div.setAttribute('aria-hidden', 'true');
  document.getElementById('labels-container').appendChild(div);
  return div;
}

function updateScreenReaderA11y() {
  const srList = document.getElementById('sr-planet-list');
  if (!srList) return;
  srList.innerHTML = '';

  if (currentView !== 'galaxy') {
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back to Galaxy';
    backBtn.addEventListener('click', () => {
      const btn = document.getElementById('galaxy-back-btn');
      if (btn) btn.click();
    });
    srList.appendChild(backBtn);
  }

  planetsData.forEach(p => {
    if (p.isHidden || p._hiddenByMobilePopup) return;
    
    let label = '';
    if (p.mesh.userData.isCategory) label = `Category: ${p.mesh.userData.category}`;
    else if (p.mesh.userData.isMoon) label = `Project: ${p.mesh.userData.project.name}`;
    else if (p.mesh.userData.isVoyager) label = `Category: Explorations`;
    else return;

    const btn = document.createElement('button');
    btn.textContent = label;
    btn.addEventListener('click', () => handleObjectClick(p.mesh));
    srList.appendChild(btn);
  });
}

function createOrbitLine(radius) {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({ color: 0xffffff, opacity: 0.15, transparent: true, dashSize: 4, gapSize: 4 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

function renderGalaxy3D() {
  clearScene();

  // Central Sun
  const sunGeo = new THREE.SphereGeometry(30, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffbe6 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.userData.isSun = true;
  scene.add(sun);

  // Sunlight
  const sunLight = new THREE.PointLight(0xfffbe6, 1.5, 1200);
  scene.add(sunLight);

  const categories = Object.keys(orbitsMap);
  const baseRadius = 100;
  const gap = 55;

  categories.forEach((cat, idx) => {
    const numProjects = orbitsMap[cat] ? orbitsMap[cat].length : 0;
    const planetSize = 10 + (numProjects * 2.5);

    const radius = baseRadius + (idx * gap);
    const speed = 0.001 + (0.0005 * (categories.length - idx));
    const texUrl = TEXTURES[idx % TEXTURES.length];

    if (!globalPlanetState[cat]) {
      const startAngle = Math.random() * Math.PI * 2;
      globalPlanetState[cat] = {
        angle: startAngle,
        startAngle: startAngle,
        totalOrbits: 0
      };
    }

    const orbitLine = createOrbitLine(radius);
    scene.add(orbitLine);

    const geo = new THREE.SphereGeometry(planetSize, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ 
      map: textureLoader.load(texUrl),
      roughness: 0.8,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { isCategory: true, category: cat };
    scene.add(mesh);

    const labelEl = createLabel(cat, false);

    planetsData.push({
      mesh, orbitLine, labelEl, radius, speed, 
      angle: globalPlanetState[cat].angle,
      catRef: globalPlanetState[cat],
      baseScale: 1
    });
  });

  // Setup Voyager for "Explorations"
  const setupVoyager = (model) => {
    if (currentView !== 'galaxy') return; // Don't add if we already navigated away
    const radius = 320; // Furthest orbit
    const speed = -0.0008; // Retrograde orbit to stand out

    if (!globalPlanetState['explorations']) {
      globalPlanetState['explorations'] = { angle: Math.random() * Math.PI * 2, startAngle: 0, totalOrbits: 0 };
    }

    const orbitLine = createOrbitLine(radius);
    scene.add(orbitLine);

    const mesh = model.clone();
    mesh.userData = { isVoyager: true, link: '/explorations' };
    
    // Slight tilt to the model itself
    mesh.rotation.x = Math.PI / 4;
    scene.add(mesh);

    const labelEl = createLabel('Explorations', false);

    planetsData.push({
      mesh, orbitLine, labelEl, radius, speed,
      angle: globalPlanetState['explorations'].angle,
      catRef: globalPlanetState['explorations'],
      baseScale: 5
    });
    
    updateScreenReaderA11y();
  };

  if (!voyagerModel) {
    gltfLoader.load('/assets/Voyager.glb', (gltf) => {
      voyagerModel = gltf.scene;
      // Adjust scale depending on the model's original size
      // We start with a reasonable guess, and scale it up. 
      // Typical models might need significant scaling.
      voyagerModel.scale.set(5, 5, 5);
      
      // Ensure materials are visible
      voyagerModel.traverse((child) => {
        if (child.isMesh) {
          child.material.side = THREE.DoubleSide;
          if (child.material) {
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = 0.15;
            child.material.needsUpdate = true;
          }
        }
      });
      
      setupVoyager(voyagerModel);
    }, undefined, (error) => {
      console.error('Error loading voyager:', error);
    });
  } else {
    setupVoyager(voyagerModel);
  }
  
  updateScreenReaderA11y();
}

function renderSystem3D(category) {
  clearScene();
  
  const catIdx = Object.keys(orbitsMap).indexOf(category);
  const texUrl = TEXTURES[catIdx % TEXTURES.length];

  const numProjects = orbitsMap[category] ? orbitsMap[category].length : 0;
  const planetSize = 10 + (numProjects * 2.5);

  // Central Planet
  const centerGeo = new THREE.SphereGeometry(planetSize * 3, 32, 32);
  const centerMat = new THREE.MeshStandardMaterial({ 
    map: textureLoader.load(texUrl),
    emissive: new THREE.Color(0x222222) // so it's slightly visible
  });
  const centerMesh = new THREE.Mesh(centerGeo, centerMat);
  centerMesh.userData.isSun = true; 
  scene.add(centerMesh);

  // Light radiating from the center planet to illuminate moons
  const light = new THREE.PointLight(0xffffff, 1, 800);
  scene.add(light);

  const orbits = globalPlanetState[category] ? globalPlanetState[category].totalOrbits : 0;
  const centerLabel = createLabel(`${category} (Orbits: ${orbits})`, false);
  planetsData.push({ mesh: centerMesh, labelEl: centerLabel, radius: 0, speed: 0, angle: 0 });

  const projects = orbitsMap[category];
  const baseRadius = 80;
  const gap = 35;

  projects.forEach((p, idx) => {
    const radius = baseRadius + (idx * gap);
    const speed = 0.002 + (Math.random() * 0.002);
    
    const orbitLine = createOrbitLine(radius);
    scene.add(orbitLine);

    const geo = new THREE.SphereGeometry(8 + Math.random() * 4, 32, 32);
    const mTex = TEXTURES[idx % TEXTURES.length];
    
    // Mix base color with texture
    const color = new THREE.Color(PLANET_COLORS[p.color] || '#aaaaaa');
    const mat = new THREE.MeshStandardMaterial({ 
      map: textureLoader.load(mTex),
      color: color,
      roughness: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { isMoon: true, project: p };
    scene.add(mesh);

    const labelEl = createLabel(p.name, true);

    planetsData.push({
      mesh, orbitLine, labelEl, radius, speed, angle: Math.random() * Math.PI * 2
    });
  });
  
  updateScreenReaderA11y();
}

function transitionCamera(tx, ty, tz, onComplete) {
  new TWEEN.Tween(camera.position)
    .to({ x: tx, y: ty, z: tz }, 1000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onComplete(() => {
      controls.target.set(0,0,0);
      onComplete();
    })
    .start();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();

  const isHoveringMoon = !!window.hoveredMoon;
  const popup = document.getElementById('moon-popup');
  if (!isHoveringMoon || window.isTransitioning) {
    if (popup) {
      popup.classList.remove('visible');
      popup.setAttribute('aria-hidden', 'true');
    }
  }

  planetsData.forEach(p => {
    if (p.radius > 0) {
      const shouldMove = !isHoveringMoon || !p.mesh.userData.isMoon;
      
      if (shouldMove) {
        p.angle += p.speed;

        if (p.catRef) {
          p.catRef.angle = p.angle;
          p.catRef.totalOrbits = Math.floor((p.angle - p.catRef.startAngle) / (Math.PI * 2));
        }
      }

      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;
      
      if (!p.mesh.userData.isVoyager) {
        p.mesh.rotation.y += 0.01;
      } else {
        // Optionally make it face the direction of orbit:
        // p.mesh.rotation.y = -p.angle;
      }
    } else if (p.mesh.userData.isSun) {
      p.mesh.rotation.y += 0.005;
    }

    // Map 3D pos to 2D Screen Label
    if (p.labelEl) {
      if (p.isHidden) {
        p.labelEl.classList.remove('visible');
      } else {
        const pos = p.mesh.position.clone();
        // Y offset based on whether it's center or orbit
        pos.y += (p.radius === 0) ? 55 : 20; 
        pos.project(camera);

        // Check if behind camera
        if (pos.z < 1 && pos.x > -1 && pos.x < 1 && pos.y > -1 && pos.y < 1) {
          const canvas = renderer.domElement;
          const x = (pos.x * 0.5 + 0.5) * canvas.clientWidth;
          const y = (pos.y * -0.5 + 0.5) * canvas.clientHeight;
          p.labelEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
          
          if (window.hoveredMoon === p.mesh) {
            p.labelEl.classList.remove('visible');
          } else {
            p.labelEl.classList.add('visible');
          }

          if (window.hoveredMoon === p.mesh && !window.isTransitioning && !isMobile) {
             popup.style.left = x + 'px';
             popup.style.top = y + 'px';
             popup.classList.add('visible');
          }
        } else {
          p.labelEl.classList.remove('visible');
          if (window.hoveredMoon === p.mesh) {
             popup.classList.remove('visible');
          }
        }
      }
    }
  });

  renderer.render(scene, camera);
}

/* ===========================
   404 SCENE
   =========================== */
function load404Scene(canvasId) {
  const container = document.getElementById(canvasId);
  if (!container) return;
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.position.set(0, 0, 800);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(200, 300, 400);
  scene.add(dirLight);

  let voyager;
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load('/assets/Voyager.glb', (gltf) => {
    voyager = gltf.scene;
    voyager.scale.set(30, 30, 30);
    
    voyager.traverse((child) => {
      if (child.isMesh) {
        child.material.side = THREE.DoubleSide;
        if (child.material) {
          child.material.emissive = new THREE.Color(0xffffff);
          child.material.emissiveIntensity = 0.15;
          child.material.needsUpdate = true;
        }
      }
    });
    
    // Tilt to look cool
    voyager.rotation.x = Math.PI / 4;
    voyager.rotation.z = Math.PI / 6;
    
    scene.add(voyager);
  }, undefined, (err) => console.error(err));

  function animate404() {
    requestAnimationFrame(animate404);
    if (voyager) {
      voyager.rotation.y += 0.002;
      voyager.position.y = Math.sin(Date.now() * 0.001) * 10;
    }
    renderer.render(scene, camera);
  }
  animate404();

  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

if (typeof THREE !== 'undefined') {
  THREE.DefaultLoadingManager.onLoad = function ( ) {
    document.body.classList.add('assets-loaded');
  };
}

/* ===========================
   INIT (runs on every page)
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  initCopyrightYear();
  initScrollReveal();
  
  const pageType = document.body.getAttribute('data-page');
  const skipIntro = new URLSearchParams(window.location.search).get('skipIntro') === 'true';

  // Disable interactions during sequence
  window.isTransitioning = !skipIntro;

  const intro = document.getElementById('intro-screen');
  const instructions = document.getElementById('solar-instructions');
  const header = document.getElementById('space-header');

  if (intro && !skipIntro) {
    setTimeout(() => {
      document.body.classList.add('loaded');
      setTimeout(() => {
        intro.remove();
        
        // Phase 2: Show instructions
        if (instructions) instructions.classList.add('visible');
        
        setTimeout(() => {
          // Phase 3: Fade out instructions, zoom out, reveal UI
          if (instructions) instructions.classList.remove('visible');
          
          if (camera) {
            const introTarget = isMobile ? { x: 0, y: 650, z: 900 } : { x: 0, y: 400, z: 700 };
            new TWEEN.Tween(camera.position)
              .to(introTarget, 2500)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onComplete(() => {
                window.isTransitioning = false; // Re-enable interaction
                if (header) header.classList.add('reveal-header');
              })
              .start();
          } else {
            window.isTransitioning = false;
            if (header) header.classList.add('reveal-header');
          }
        }, 3500); // Time to read instructions

      }, 800);
    }, 2400);
  } else {
    document.body.classList.add('loaded');
    window.isTransitioning = false;
    if (header) header.classList.add('reveal-header');
    if (intro) intro.remove();
    if (instructions) instructions.remove();
    
    if (skipIntro && pageType === 'home') {
      const checkCam = setInterval(() => {
        if (typeof camera !== 'undefined' && camera) {
          if (isMobile) camera.position.set(0, 650, 900);
          else camera.position.set(0, 400, 700);
          clearInterval(checkCam);
        }
      }, 50);
    }
  }

  // Router based on data-page
  if (pageType === 'home') {
    loadSolarSystem('solar-system', 'space-bg', 'mobile-planet-list');
  } else if (pageType === 'project') {
    loadProjectDetail('project-detail');
  } else if (pageType === 'explorations') {
    loadExplorations('explorations-list');
  } else if (pageType === '404') {
    load404Scene('solar-system');
  }
});
