let scene, camera, renderer, controls;
let particles, flowerGroup, frasesGroup, shootingStarsGroup, heartGroup, spiralGroup;
let galaxyBasePositions = null;
let galaxyMeta = [];

function init() {
  // 1. Crear Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0908);

  // 2. Crear Cámara
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(18, 14, 28);

  // 3. Renderizador
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x0a0908, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // 4. Controles de Cámara (Órbita)
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.8;
  controls.minDistance = 8;
  controls.maxDistance = 60;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI - 0.15;
  controls.target.set(0, 1.5, 0);
  controls.screenSpacePanning = true;
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.8;

  // 5. Crear la espiral de estrellas y el resto de la escena
  crearEspiralDeLuz();
  crearEstrellasFugaces();
  crearFlores();
  crearFrases();
  crearCorazonCentral();

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Evento Resize
  window.addEventListener('resize', onWindowResize);

  // Bucle de animación
  animate();
}

function crearGalaxia() {
  const particleCount = 12000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const core = new THREE.Color(0xfff7bf);
  const bright = new THREE.Color(0xffe07a);
  const mid = new THREE.Color(0xffc547);
  const deep = new THREE.Color(0x7a4100);

  galaxyMeta = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 8.5;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.2;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.2;
    const y = (Math.random() - 0.5) * 2.4;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    let color = deep.clone();
    if (radius < 2.2) color = core.clone();
    else if (radius < 4.5) color = bright.clone();
    else color = mid.clone().lerp(deep, 0.35);

    const boost = 1.1 + Math.random() * 0.7;
    color.r *= boost;
    color.g *= boost;
    color.b *= boost;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    galaxyMeta.push({ radius, angle, y });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  particles.rotation.x = 0.2;
  particles.rotation.y = 0.9;
  particles.rotation.z = 0.08;
  scene.add(particles);
}

// Distribuye girasoles en el espacio
function crearTexturaFlorFallback() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Fondo transparente
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Centro del girasol
  ctx.beginPath();
  ctx.arc(128, 128, 32, 0, Math.PI * 2);
  ctx.fillStyle = '#f4c542';
  ctx.fill();

  // Pétalos
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18;
    const x = 128 + Math.cos(angle) * 68;
    const y = 128 + Math.sin(angle) * 68;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd93d';
    ctx.fill();
    ctx.restore();
  }

  // Núcleo oscuro
  ctx.beginPath();
  ctx.arc(128, 128, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#7a4b00';
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function crearEstrellasFugaces() {
  shootingStarsGroup = new THREE.Group();

  const texture = crearTexturaEstrellaFugaz();
  const materialTemplate = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < 18; i++) {
    const sprite = new THREE.Sprite(materialTemplate.clone());
    sprite.visible = false;
    sprite.scale.set(28, 0.6, 1);
    sprite.userData = {
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
      drift: new THREE.Vector3()
    };
    shootingStarsGroup.add(sprite);
  }

  scene.add(shootingStarsGroup);
}

function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,248,180,1)');
  gradient.addColorStop(0.45, 'rgba(255,214,102,0.9)');
  gradient.addColorStop(0.7, 'rgba(255,184,60,0.35)');
  gradient.addColorStop(1, 'rgba(255,184,60,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 44);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.3, 'rgba(255,240,180,1)');
  glow.addColorStop(1, 'rgba(255,220,90,0)');

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function crearTexturaEstrellaFugaz() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(8, 64);
  ctx.rotate(-0.12);

  const trail = ctx.createLinearGradient(0, 0, 440, 0);
  trail.addColorStop(0, 'rgba(255,255,255,0)');
  trail.addColorStop(0.08, 'rgba(180,235,255,0.18)');
  trail.addColorStop(0.3, 'rgba(255,255,255,1)');
  trail.addColorStop(0.66, 'rgba(120,220,255,1)');
  trail.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.strokeStyle = trail;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(440, 0);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(230,245,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(340, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(440, 0);
  ctx.lineTo(400, -13);
  ctx.lineTo(388, 0);
  ctx.lineTo(400, 13);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(440, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(95, 195, 255, 1)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function activarEstrellaFugaz(star) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 18 + Math.random() * 26;
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
  const y = -18 + Math.random() * 20;
  const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 4;

  const start = new THREE.Vector3(x, y, z);
  const target = new THREE.Vector3(0, 1.5, 0);
  const direction = target.clone().sub(start).normalize();
  const speed = 0.52 + Math.random() * 0.38;

  star.position.copy(start);
  star.userData.velocity.copy(direction.multiplyScalar(speed));
  star.userData.drift.set(
    (Math.random() - 0.5) * 0.01,
    (Math.random() - 0.5) * 0.01,
    (Math.random() - 0.5) * 0.01
  );
  star.userData.life = 0.45 + Math.random() * 0.35;
  star.userData.maxLife = star.userData.life;
  star.visible = true;
  star.material.opacity = 1;
  star.rotation.set(0, 0, 0);

  const lookAt = target.clone().sub(start);
  if (lookAt.lengthSq() > 0) {
    star.lookAt(start.clone().add(lookAt));
  }
}

function crearEspiralDeLuz() {
  const arms = 5;
  const particlesPerArm = 4200;
  const total = arms * particlesPerArm;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);

  const core = new THREE.Color(0xfff7bf);
  const bright = new THREE.Color(0xffd857);
  const dust = new THREE.Color(0xfff7d6);

  let index = 0;

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2 + (Math.PI / 10);

    for (let i = 0; i < particlesPerArm; i++) {
      const t = i / particlesPerArm;
      const angle = t * Math.PI * 2.4 + armOffset + Math.sin(i * 0.035 + arm) * 0.32;
      const radius = 0.6 + t * 23 + Math.sin(i * 0.07 + arm) * 0.34;

      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.9;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.9;
      const y = (Math.random() - 0.5) * 1.5;

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;

      let color = dust.clone();
      if (radius < 3.7) color = core.clone();
      else if (radius < 8.5) color = bright.clone();

      const glowBoost = radius < 4.5 ? 1.9 + Math.random() * 0.9 : 1.25 + Math.random() * 0.6;
      color.r *= glowBoost;
      color.g *= glowBoost;
      color.b *= glowBoost;

      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      index++;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.11,
    vertexColors: true,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: createStarTexture(),
    alphaTest: 0.01
  });

  spiralGroup = new THREE.Group();
  const spiralPoints = new THREE.Points(geometry, material);
  spiralPoints.rotation.y = Math.random() * Math.PI;

  const glowGeometry = new THREE.BufferGeometry();
  const glowCount = 3200;
  const glowPositions = new Float32Array(glowCount * 3);
  const glowColors = new Float32Array(glowCount * 3);

  for (let i = 0; i < glowCount; i++) {
    const spiralAngle = Math.random() * Math.PI * 2;
    const spiralRadius = 1.2 + Math.random() * 18.5;
    const x = Math.cos(spiralAngle) * spiralRadius;
    const z = Math.sin(spiralAngle) * spiralRadius;
    const y = (Math.random() - 0.5) * 3.5;

    glowPositions[i * 3] = x;
    glowPositions[i * 3 + 1] = y;
    glowPositions[i * 3 + 2] = z;

    const color = new THREE.Color(0xffe57a).lerp(new THREE.Color(0xffd24d), Math.random());
    glowColors[i * 3] = color.r;
    glowColors[i * 3 + 1] = color.g;
    glowColors[i * 3 + 2] = color.b;
  }

  glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
  glowGeometry.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));

  const glowMaterial = new THREE.PointsMaterial({
    size: 0.11,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: createStarTexture(),
    alphaTest: 0.01
  });

  const glowHalo = new THREE.Points(glowGeometry, glowMaterial);
  spiralGroup.add(spiralPoints);
  spiralGroup.add(glowHalo);
  spiralGroup.position.set(0, -4.5, -3.8);
  spiralGroup.rotation.x = 0.18;
  spiralGroup.rotation.y = 0.6;
  spiralGroup.rotation.z = 0.12;
  scene.add(spiralGroup);
}

function crearFlores() {
  flowerGroup = new THREE.Group();
  const textureLoader = new THREE.TextureLoader();
  const flowerTexture = textureLoader.load('girasoles.png');
  const material = new THREE.SpriteMaterial({ map: flowerTexture, transparent: true, depthWrite: false });

  const numFlores = 25;
  for (let i = 0; i < numFlores; i++) {
    const sprite = new THREE.Sprite(material);
    
    // Posición aleatoria alrededor de la galaxia
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 15;
    
    sprite.position.x = Math.cos(angle) * radius;
    sprite.position.y = (Math.random() - 0.5) * 8;
    sprite.position.z = Math.sin(angle) * radius;
    
    sprite.scale.set(2, 2, 1);
    flowerGroup.add(sprite);
  }

  scene.add(flowerGroup);
}

function crearFrases() {
  const frases = [
    'Eres hermosa',
    'Te adoro',
    'Eres mi luz',
    'Te quiero muchisimo',
    'Eres muy especial',
    'Brillas más que la luz',
    'Eres única',
    'Te valoro',
    'Me haces sonreír',
    'Linda sonrisa',
    'Eres bella',
    'Siempre te pienso',
    'Te deseo lo mejor',
    'Eres mi cielo',
    'Te quiero mucho',
    'Eres mi alegría',
    'Tu amor ilumina',
    'Anelo verte feliz',
    'Eres increíble',
    'Me haces feliz',
    'Eres preciosa',
    'Te admiro',
    'Siempre esfuerzate',
    'Te quiero siempre',
    'Eres mi calma',
    'Eres mi tesoro',
    'Te pienso siempre',
    'Eres mi mundo',
    'Te quiero mucho más',
    'Eres especial',
    'Me inspiras',
    'Eres mi fuerza',
    'Te extraño hoy y mañana',
    'Eres fascinante',
    'Te llevo en mi alma',
    'Eres mi prioridad',
    'Eres mi sueño',
    'Te deseo la felicidad',
    'Eres mi alegría',
    'Te adoro siempre',
    'Eres mi todo',
    'Te quiero con locura',
    'Eres mi inspiración',
    'Quiero escapar contigo',
    'Eres mi razón'
  ];

  frasesGroup = new THREE.Group();

  frases.forEach((texto, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 30px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 197, 0, 0.35)';
    ctx.shadowColor = 'rgba(255, 220, 90, 0.85)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff7c2';
    ctx.strokeText(texto, canvas.width / 2, canvas.height / 2);
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);
    const angle = (index / frases.length) * Math.PI * 2;
    const radius = 7 + (index % 5) * 1.8;
    const y = -1 + (index % 3) * 1.5;

    sprite.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
    sprite.scale.set(5.2, 1.5, 1);
    sprite.userData = {
      angle,
      radius,
      baseY: y,
      speed: 0.6 + index * 0.08
    };

    frasesGroup.add(sprite);
  });

  scene.add(frasesGroup);
}

// Corazón resplandeciente en el centro
function crearCorazonCentral() {
  heartGroup = new THREE.Group();
  heartGroup.position.set(0.1, 1.2, 0.5);

  const particleCount = 2600;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const base = new THREE.Color(0xfff8bf);
  const glow = new THREE.Color(0xffd93d);

  for (let i = 0; i < particleCount; i++) {
    const t = (i / particleCount) * Math.PI * 2;
    const heartX = 16 * Math.pow(Math.sin(t), 3);
    const heartY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const radius = 0.28 + Math.random() * 0.7;
    const noise = (Math.random() - 0.5) * 0.15;

    const x = heartX * 0.12 * radius + noise;
    const y = heartY * 0.12 * radius + noise;
    const z = (Math.random() - 0.5) * 0.7;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const mix = 0.3 + Math.random() * 0.7;
    const color = base.clone().lerp(glow, mix);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const heartMaterial = new THREE.PointsMaterial({
    size: 0.11,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const heartPoints = new THREE.Points(geometry, heartMaterial);
  heartPoints.rotation.z = 0;
  heartPoints.scale.set(1.18, 1.18, 1.18);

  const outerGeometry = new THREE.BufferGeometry();
  const outerPositions = new Float32Array(particleCount * 3);
  const outerColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const t = (i / particleCount) * Math.PI * 2;
    const heartX = 16 * Math.pow(Math.sin(t), 3);
    const heartY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const x = heartX * 0.14 + (Math.random() - 0.5) * 0.15;
    const y = heartY * 0.14 + (Math.random() - 0.5) * 0.15;
    const z = (Math.random() - 0.5) * 0.8;

    outerPositions[i * 3] = x;
    outerPositions[i * 3 + 1] = y;
    outerPositions[i * 3 + 2] = z;

    outerColors[i * 3] = 1;
    outerColors[i * 3 + 1] = 0.9;
    outerColors[i * 3 + 2] = 0.5;
  }

  outerGeometry.setAttribute('position', new THREE.BufferAttribute(outerPositions, 3));
  outerGeometry.setAttribute('color', new THREE.BufferAttribute(outerColors, 3));

  const glowMaterial = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const heartGlow = new THREE.Points(outerGeometry, glowMaterial);
  heartGlow.scale.set(1.54, 1.54, 1.54);
  heartGlow.rotation.z = 0;

  const aPositions = [];
  const aColors = [];
  const aColor = new THREE.Color(0xfff7d2);

  const addLetterAPoint = (x, y, z = 0.45) => {
    aPositions.push(x, y, z);
    aColors.push(aColor.r, aColor.g, aColor.b);
  };

  for (let i = 0; i <= 1; i += 0.05) {
    const leftX = -0.78 + i * 0.63;
    const leftY = -1.15 + i * 2.35;
    addLetterAPoint(leftX, leftY, 0.42);

    const rightX = 0.78 - i * 0.63;
    const rightY = -1.15 + i * 2.35;
    addLetterAPoint(rightX, rightY, 0.42);
  }

  for (let x = -0.36; x <= 0.36; x += 0.08) {
    addLetterAPoint(x, 0.18, 0.48);
  }

  for (let x = -0.3; x <= 0.3; x += 0.09) {
    addLetterAPoint(x, 0.04, 0.5);
  }

  const aGeometry = new THREE.BufferGeometry();
  aGeometry.setAttribute('position', new THREE.Float32BufferAttribute(aPositions, 3));
  aGeometry.setAttribute('color', new THREE.Float32BufferAttribute(aColors, 3));

  const aMaterial = new THREE.PointsMaterial({
    size: 0.11,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const heartLetterA = new THREE.Points(aGeometry, aMaterial);
  heartLetterA.position.set(0, 0.08, 0.35);

  heartGroup.add(heartGlow);
  heartGroup.add(heartPoints);
  heartGroup.add(heartLetterA);
  scene.add(heartGroup);

  const heartLight = new THREE.PointLight(0xfff2a6, 13, 36, 2.8);
  heartLight.position.set(0.1, 1.2, 4.5);
  scene.add(heartLight);
}

// Animación continua
function animate() {
  requestAnimationFrame(animate);

  const t = performance.now() * 0.001;

  if (spiralGroup) {
    spiralGroup.rotation.y += 0.008;
    spiralGroup.rotation.z = Math.sin(t * 0.7) * 0.18;
    spiralGroup.rotation.x = 0.18 + Math.sin(t * 0.9) * 0.12;
    spiralGroup.position.y = -4.5 + Math.sin(t * 0.8) * 0.18;
  }

  if (particles && galaxyMeta.length) {
    const current = particles.geometry.attributes.position.array;
    for (let i = 0; i < galaxyMeta.length; i++) {
      const meta = galaxyMeta[i];
      const drift = t * 0.03;
      const inward = Math.max(0.2, 1 - (meta.radius / 8.5) * 0.8);
      const rotation = meta.angle + drift;

      const x = Math.cos(rotation) * meta.radius * inward;
      const z = Math.sin(rotation) * meta.radius * inward;
      const y = meta.y + Math.sin(t * 0.7 + i * 0.02) * 0.08;

      current[i * 3] = x * 1.04;
      current[i * 3 + 1] = y;
      current[i * 3 + 2] = z * 1.04;
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.0008;
    particles.rotation.x = 0.2 + Math.sin(t * 0.15) * 0.012;
  }

  if (flowerGroup) {
    flowerGroup.rotation.y += 0.0032;
    flowerGroup.rotation.z = 0.32 + Math.sin(t * 0.75) * 0.12;
    flowerGroup.rotation.x = 0.22 + Math.cos(t * 0.65) * 0.08;

    flowerGroup.children.forEach((flower, index) => {
      const orbit = t * (0.35 + index * 0.015) + index * 0.7;
      const radius = 6 + (index % 8) * 1.7 + Math.sin(t * 0.9 + index) * 0.25;
      flower.position.x = Math.cos(orbit) * radius;
      flower.position.z = Math.sin(orbit) * radius;
      flower.position.y = (index % 5) * 1.2 - 2 + Math.sin(t * 0.8 + index) * 0.5;
    });
  }

  if (shootingStarsGroup) {
    shootingStarsGroup.children.forEach((star) => {
      if (!star.visible) {
        if (Math.random() < 0.07) {
          activarEstrellaFugaz(star);
        }
        return;
      }

      star.position.addScaledVector(star.userData.velocity, 0.3);
      star.position.add(star.userData.drift);
      star.userData.life -= 0.055;
      star.material.opacity = Math.max(0, star.userData.life / star.userData.maxLife);

      const targetDirection = new THREE.Vector3(0, 1.5, 0).sub(star.position);
      if (targetDirection.lengthSq() > 0) {
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(1, 0, 0),
          targetDirection.clone().normalize()
        );
        star.quaternion.copy(quaternion);
      }

      if (star.userData.life <= 0 || star.position.length() > 35) {
        star.visible = false;
      }
    });
  }

  if (heartGroup) {
    heartGroup.rotation.y += 0.005;
    heartGroup.rotation.z = Math.sin(t * 1.1) * 0.12;
    const pulse = 1 + Math.sin(t * 2.4) * 0.08;
    heartGroup.scale.set(pulse, pulse, pulse);
    heartGroup.position.y = 1.2 + Math.sin(t * 1.2) * 0.12;
    heartGroup.position.x = 0.1 + Math.sin(t * 0.9) * 0.08;

    heartGroup.children.forEach((child) => {
      if (child.type === 'Points' && child.geometry && child.geometry.attributes.position && child.geometry.attributes.position.count > 1800) {
        child.rotation.y += 0.0008;
      }
    });
  }

  if (frasesGroup) {
    frasesGroup.rotation.y += 0.0011;
    frasesGroup.rotation.z = 0.18 + Math.sin(t * 0.8) * 0.14;
    frasesGroup.rotation.x = 0.2 + Math.cos(t * 0.7) * 0.12;

    frasesGroup.children.forEach((sprite, index) => {
      const data = sprite.userData;
      const orbit = t * (data.speed * 0.17) + data.angle;
      const orbitalRadius = data.radius;

      sprite.position.x = Math.cos(orbit) * orbitalRadius;
      sprite.position.z = Math.sin(orbit) * orbitalRadius;
      sprite.position.y = data.baseY + Math.sin(t * 0.8 + index) * 0.18;
      sprite.rotation.z = Math.sin(t * 0.7 + index) * 0.08;
    });
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Controladores de interfaz
function iniciarExperiencia() {
  document.getElementById('overlay').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('overlay').style.display = 'none';
  }, 800);

  // Reproducir música solo si existe el archivo
  const audio = document.getElementById('musica');
  if (audio && audio.getAttribute('src')) {
    audio.play().catch(e => console.log("Audio block:", e));
  }

  // Abrir la tarjeta después de 2 segundos
  setTimeout(() => {
    document.getElementById('card').classList.remove('hidden');
  }, 2000);
}

function cerrarTarjeta() {
  document.getElementById('card').classList.add('hidden');
}

// Iniciar al cargar ventana
window.onload = init;