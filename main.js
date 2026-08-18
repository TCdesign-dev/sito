/**
 * main.js — Portfolio Tommaso Costanza
 *
 * Pages are routed via <body data-page="...">:
 * - home         → loadSolarSystem: 3D galaxy of category planets (Three.js),
 *                  rendered pixelated; a planet links to its category page
 * - category     → loadCategoryPage: project list for ?cat=<category>
 * - explorations → loadExplorations: project list for the Explorations category
 * - project      → loadProjectDetail: renders a project from ?id=<project-id>
 * - 404          → load404Scene: floating Voyager model
 *
 * Data source: projects/projects.json (edited via /admin).
 * Shared helpers: initScrollReveal, initCopyrightYear.
 */

'use strict';

/* ===========================
   CONFIG
   =========================== */
const PROJECTS_JSON = '/projects/projects.json';

/* ===========================
   UTILITIES
   =========================== */

/** HTML-escape a string */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ensure image paths are always root-relative (prefix / if missing) */
function imgUrl(src) {
  if (!src) return '';
  return src.startsWith('/') || src.startsWith('http') ? src : '/' + src;
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
   CATEGORY LISTS  (explorations.html, category.html)
   =========================== */

/** One project card — shared by every list page */
function buildListCard(p) {
  const a = document.createElement('a');
  a.className = 'exploration-card visible';
  // Dedicated page if 'page' is true, OR if there's no external link
  const hasPage = p.page || (!p.page && !p.link);
  a.href = hasPage ? `/project.html?id=${encodeURIComponent(p.id)}` : p.link;
  if (!hasPage && p.link) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }

  a.innerHTML = `
    <img src="${esc(imgUrl(p.preview || ''))}" alt="${esc(p.name)}" class="exploration-img" loading="lazy" />
    <div class="exploration-content">
      <h3 class="exploration-title">${esc(p.name)}</h3>
      <p class="exploration-desc">${esc(p.description || '')}</p>
      <span class="exploration-date">${esc(String(p.year))}</span>
    </div>
  `;
  return a;
}

/** Render every project of one category into a container */
function renderCategoryList(container, projects, category, emptyText) {
  const matches = projects.filter(
    p => (p.category || '').toLowerCase() === category.toLowerCase()
  );

  if (!matches.length) {
    container.innerHTML = `<p style="color:var(--text-muted);">${esc(emptyText)}</p>`;
    return;
  }

  matches.forEach(p => container.appendChild(buildListCard(p)));
  initScrollReveal();
}

async function loadExplorations(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const projects = await fetchProjects();
  renderCategoryList(container, projects, 'Explorations', 'No explorations found at the moment.');
}

/** category.html — the page a category planet links to, driven by ?cat=<name> */
async function loadCategoryPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const requested = new URLSearchParams(window.location.search).get('cat');
  if (!requested) { window.location.href = '/404'; return; }

  const projects = await fetchProjects();
  // Resolve the category's real casing from the data, so the heading and the
  // canonical URL match what the admin panel actually stores
  const match = projects.find(
    p => (p.category || '').toLowerCase() === requested.toLowerCase()
  );
  if (!match) { window.location.href = '/404'; return; }
  const category = match.category;

  document.title = `${category} — Tommaso Costanza`;
  const heading = document.getElementById('category-title');
  if (heading) heading.textContent = category;

  const canonicalUrl =
    `https://tommasocostanza.space/category.html?cat=${encodeURIComponent(category)}`;
  const setAttr = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  setAttr('meta[name="description"]', 'content', `${category} projects by Tommaso Costanza, Product Design student in Turin.`);
  setAttr('link[rel="canonical"]', 'href', canonicalUrl);
  setAttr('meta[property="og:url"]', 'content', canonicalUrl);
  setAttr('meta[property="og:title"]', 'content', `${category} — Tommaso Costanza`);

  renderCategoryList(container, projects, category, 'No projects in this category yet.');
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

  const canonicalUrl = `https://tommasocostanza.space/project.html?id=${encodeURIComponent(id)}`;
  
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
          <img src="${esc(imgUrl(block.src))}" alt="${esc(block.caption || '')}" loading="lazy" />
          ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}
        </figure>
      `;
    }
    return '';
  }).join('');

  const linkHtml = project.link
    ? `<a href="${esc(project.link)}" class="project-link-btn" target="_blank" rel="noopener noreferrer">View project ↗</a>`
    : '';

  // Back link mirrors how the visitor got here: galaxy → category → project
  const category = project.category || '';
  const isExploration = ['explorations', 'esplorazioni'].includes(category.toLowerCase());
  let backHref = '/?skipIntro=true';
  let backText = 'Back to Galaxy';
  if (isExploration) {
    backHref = '/explorations';
    backText = 'Back to list';
  } else if (category) {
    backHref = `/category.html?cat=${encodeURIComponent(category)}`;
    backText = `Back to ${category}`;
  }

  container.innerHTML = `
    <a href="${backHref}" class="project-back">${backText}</a>
    ${project.preview ? `<img src="${esc(imgUrl(project.preview))}" class="project-detail-hero" alt="Project preview" />` : ''}
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
    '.reveal:not(.visible)'
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
   SOLAR SYSTEM (projects.html)
   =========================== */
const PLANET_COLORS = {
  yellow: '#fde047',
  green: '#86efac',
  pink: '#f9a8d4',
  blue: '#93c5fd',
  purple: '#d8b4fe',
  orange: '#fdba74'
};

let orbitsMap = {};
let scene, camera, renderer, controls;
let raycaster, mouse;
let planetsData = [];
let isMobile = window.innerWidth <= 768;
let textureLoader = null;
let gltfLoader;
let voyagerModel = null;
let globalPlanetState = {};

// Tap vs Drag differentiation variables
let pointerStartX = 0;
let pointerStartY = 0;
let pointerStartTime = 0;
const TAP_DISTANCE_THRESHOLD = 8;
// Distance is the real tap-vs-drag discriminator; the time limit only guards
// long presses. Keep it generous — on slow devices the pointerdown→click gap
// alone can exceed 300ms, which used to swallow legitimate clicks.
const TAP_TIME_THRESHOLD = 800;

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

// On phones the camera sits farther back, so planets read small — scale them
// up a touch there. 1 on desktop leaves that view unchanged.
const planetScale = () => (isMobile ? 1.35 : 1);

async function loadSolarSystem(systemId, bgId, mobileListId) {
  const container = document.getElementById(systemId);
  const mobileList = document.getElementById(mobileListId);
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
        const href = p.page ? `/project.html?id=${encodeURIComponent(p.id)}` : (p.link || '#');
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

  initThreeJS(container);
  renderGalaxy3D();
}

/**
 * Pixelation: the WebGL buffer is rendered at 1/PIXEL_SIZE of the CSS size and
 * blown back up by the browser (CSS keeps the canvas full size and
 * `image-rendering: pixelated` disables smoothing). The result is a chunky,
 * pixel-art solar system, while the DOM labels layered above it stay crisp.
 * It also renders far fewer pixels, so it is cheaper than the sharp version.
 */
const PIXEL_SIZE = 3;

/** Resize the camera and the low-resolution pixel buffer to the container */
function sizeRenderer(container) {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h || !camera || !renderer) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // updateStyle = false: leave the canvas stretched to 100% by CSS
  renderer.setSize(
    Math.max(1, Math.round(w / PIXEL_SIZE)),
    Math.max(1, Math.round(h / PIXEL_SIZE)),
    false
  );
}

function initThreeJS(container) {
  container.innerHTML = `
    <canvas id="webgl-canvas"></canvas>
    <div id="labels-container"></div>
  `;
  const canvas = document.getElementById('webgl-canvas');

  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 3000);
  camera.position.set(0, 200, isMobile ? 780 : 400);

  // No antialiasing and pixelRatio 1: smoothing would fight the pixel look
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(1);
  sizeRenderer(container);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 1500;
  controls.minDistance = 100;

  textureLoader = new THREE.TextureLoader();
  gltfLoader = new THREE.GLTFLoader();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    sizeRenderer(container);
  });

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
      while (obj && !obj.userData.isCategory && !obj.userData.isVoyager) {
        obj = obj.parent;
      }
      if (obj) handleObjectClick(obj);
    }
  });

  // Hover feedback only — clickable objects switch the cursor to a pointer
  canvas.addEventListener('mousemove', (e) => {
    if (isMobile) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    let hovered = false;
    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object;
      while (obj && !obj.userData.isCategory && !obj.userData.isVoyager) {
        obj = obj.parent;
      }
      if (obj) { hovered = true; break; }
    }
    renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
  });

  animate();
}

function handleObjectClick(obj) {
  if (window.isTransitioning) return;

  // Leaving the page: latch the flag so repeated taps while the browser is
  // still navigating don't fire overlapping navigations.
  const navigateTo = (href) => {
    window.isTransitioning = true;
    window.location.href = href;
  };

  if (obj.userData.isVoyager) {
    navigateTo(obj.userData.link);
  } else if (obj.userData.isCategory) {
    navigateTo(`/category.html?cat=${encodeURIComponent(obj.userData.category)}`);
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

function createLabel(text) {
  const div = document.createElement('div');
  div.className = 'webgl-label';
  div.textContent = text;
  div.setAttribute('aria-hidden', 'true');
  document.getElementById('labels-container').appendChild(div);
  return div;
}

function updateScreenReaderA11y() {
  const srList = document.getElementById('sr-planet-list');
  if (!srList) return;
  srList.innerHTML = '';

  planetsData.forEach(p => {
    let label = '';
    if (p.mesh.userData.isCategory) label = `Category: ${p.mesh.userData.category}`;
    else if (p.mesh.userData.isVoyager) label = 'Category: Explorations';
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
    const planetSize = (10 + (numProjects * 2.5)) * planetScale();

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

    const labelEl = createLabel(cat);

    planetsData.push({
      mesh, orbitLine, labelEl, radius, speed, 
      angle: globalPlanetState[cat].angle,
      catRef: globalPlanetState[cat],
      baseScale: 1
    });
  });

  // Setup Voyager for "Explorations"
  const setupVoyager = (model) => {
    // Sit just beyond the outermost category orbit instead of a fixed far
    // distance: keeps Explorations close to the system while staying clear as
    // more categories are added.
    const outerCategoryRadius = baseRadius + Math.max(0, categories.length - 1) * gap;
    const radius = outerCategoryRadius + gap * 1.4;
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

    const labelEl = createLabel('Explorations');

    planetsData.push({
      mesh, orbitLine, labelEl, radius, speed,
      angle: globalPlanetState['explorations'].angle,
      catRef: globalPlanetState['explorations'],
      baseScale: 4
    });
    
    updateScreenReaderA11y();
  };

  if (!voyagerModel) {
    gltfLoader.load('/assets/Voyager.glb', (gltf) => {
      voyagerModel = gltf.scene;
      // Adjust scale depending on the model's original size
      // We start with a reasonable guess, and scale it up. 
      // Typical models might need significant scaling.
      voyagerModel.scale.set(4, 4, 4);
      
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

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();

  planetsData.forEach(p => {
    if (p.radius > 0) {
      p.angle += p.speed;

      if (p.catRef) {
        p.catRef.angle = p.angle;
        p.catRef.totalOrbits = Math.floor((p.angle - p.catRef.startAngle) / (Math.PI * 2));
      }

      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;

      if (!p.mesh.userData.isVoyager) p.mesh.rotation.y += 0.01;
    } else if (p.mesh.userData.isSun) {
      p.mesh.rotation.y += 0.005;
    }

    // Project the 3D position onto the 2D label overlay
    if (p.labelEl) {
      const pos = p.mesh.position.clone();
      pos.y += 20;
      pos.project(camera);

      // Only show labels that are in front of the camera and on screen
      if (pos.z < 1 && pos.x > -1 && pos.x < 1 && pos.y > -1 && pos.y < 1) {
        const canvas = renderer.domElement;
        const x = (pos.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (pos.y * -0.5 + 0.5) * canvas.clientHeight;
        p.labelEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        p.labelEl.classList.add('visible');
      } else {
        p.labelEl.classList.remove('visible');
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
// The 404 page injects this script after DOMContentLoaded has already
// fired (it waits for the fallback-router decision), so run immediately
// when the document is ready instead of only listening for the event.
function onDocumentReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

onDocumentReady(() => {
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
  } else if (pageType === 'category') {
    loadCategoryPage('category-list');
  } else if (pageType === '404') {
    load404Scene('solar-system');
  }
});
