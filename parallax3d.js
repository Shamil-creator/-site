// ============================================
// ARIT — 3D Parallax Background
// Central 3D Object + Particles (Cosimo-style)
// ============================================

(function () {
    'use strict';

    if (typeof THREE === 'undefined') return;

    // --- Config ---
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const CFG = {
        particleCount: isMobile ? 40 : 100,
        cameraZ: 18,
        cameraFov: 50,
        mouseInfluence: 0.6,
        scrollMultiplier: 0.0012,
        colors: {
            accent: 0xf97316,
            copper: 0xd4845a,
            dim: 0x1a1a2e,
            bg: 0x0c0e19,
        },
    };

    // --- Renderer ---
    const canvas = document.getElementById('parallax-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(CFG.colors.bg, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(CFG.colors.bg, 0.025);

    const camera = new THREE.PerspectiveCamera(
        CFG.cameraFov,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );
    camera.position.set(0, 0, CFG.cameraZ);

    // ============================================
    // CENTRAL 3D OBJECT — Geodesic Wireframe Sphere
    // ============================================
    const mainGroup = new THREE.Group();
    mainGroup.position.set(0, 1, 0);
    scene.add(mainGroup);

    // --- Main wireframe icosahedron (detail 2 = geodesic sphere) ---
    const icoGeo = new THREE.IcosahedronGeometry(4.5, 2);
    const wireframeMat = new THREE.MeshBasicMaterial({
        color: CFG.colors.accent,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
    });
    const wireframeSphere = new THREE.Mesh(icoGeo, wireframeMat);
    mainGroup.add(wireframeSphere);

    // --- Inner wireframe (smaller, different detail, rotating opposite) ---
    const innerGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const innerMat = new THREE.MeshBasicMaterial({
        color: CFG.colors.copper,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerSphere);

    // --- Core glow sphere ---
    const coreGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
        color: CFG.colors.accent,
        transparent: true,
        opacity: 0.06,
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreSphere);

    // --- Vertex points on the outer wireframe ---
    const vertexPositions = icoGeo.getAttribute('position');
    const uniqueVertices = [];
    const seen = new Set();

    for (let i = 0; i < vertexPositions.count; i++) {
        const x = vertexPositions.getX(i);
        const y = vertexPositions.getY(i);
        const z = vertexPositions.getZ(i);
        const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueVertices.push(new THREE.Vector3(x, y, z));
        }
    }

    // Glow sprite texture
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const glowCtx = glowCanvas.getContext('2d');
    const gradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.9)');
    gradient.addColorStop(0.2, 'rgba(249, 115, 22, 0.4)');
    gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.1)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, 64, 64);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);

    // Place glow dots at vertices
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(uniqueVertices.length * 3);
    uniqueVertices.forEach((v, i) => {
        dotPositions[i * 3] = v.x;
        dotPositions[i * 3 + 1] = v.y;
        dotPositions[i * 3 + 2] = v.z;
    });
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));

    const dotMat = new THREE.PointsMaterial({
        map: glowTexture,
        size: 0.35,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        color: CFG.colors.accent,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    mainGroup.add(dots);

    // --- Orbital rings around the sphere ---
    const ringGeo = new THREE.TorusGeometry(6.5, 0.015, 8, 120);
    const ringMat = new THREE.MeshBasicMaterial({
        color: CFG.colors.accent,
        transparent: true,
        opacity: 0.08,
    });

    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.2;
    ring1.rotation.z = 0.3;
    mainGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring2.material.opacity = 0.05;
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.z = -0.8;
    ring2.scale.set(1.15, 1.15, 1.15);
    mainGroup.add(ring2);

    const ring3 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring3.material.opacity = 0.04;
    ring3.rotation.x = Math.PI / 1.5;
    ring3.rotation.y = 0.5;
    ring3.scale.set(0.85, 0.85, 0.85);
    mainGroup.add(ring3);

    // ============================================
    // FLOATING PARTICLES
    // ============================================
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(CFG.particleCount * 3);
    const pSpeeds = new Float32Array(CFG.particleCount);

    for (let i = 0; i < CFG.particleCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 30;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
        pSpeeds[i] = 0.003 + Math.random() * 0.01;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const ptCanvas = document.createElement('canvas');
    ptCanvas.width = 32;
    ptCanvas.height = 32;
    const ptCtx = ptCanvas.getContext('2d');
    const ptGrad = ptCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    ptGrad.addColorStop(0, 'rgba(251, 146, 60, 0.9)');
    ptGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.3)');
    ptGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ptCtx.fillStyle = ptGrad;
    ptCtx.fillRect(0, 0, 32, 32);
    const ptTexture = new THREE.CanvasTexture(ptCanvas);

    const particleMat = new THREE.PointsMaterial({
        map: ptTexture,
        size: 0.18,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ============================================
    // STATE & EVENTS
    // ============================================
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let scrollY = 0, targetScrollY = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
        targetScrollY = window.pageYOffset;
    }, { passive: true });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ============================================
    // ANIMATION LOOP
    // ============================================
    const clock = new THREE.Clock();
    // Store base position for vertex animation
    const baseVertexPositions = icoGeo.getAttribute('position').array.slice();

    function animate() {
        requestAnimationFrame(animate);

        const t = clock.getElapsedTime();

        // --- Smooth lerp ---
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;
        scrollY += (targetScrollY - scrollY) * 0.06;

        const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0; // 0..1

        // ============================================
        // CAMERA — mouse follow
        // ============================================
        if (!prefersReducedMotion) {
            camera.position.x = mouseX * CFG.mouseInfluence;
            camera.position.y = -mouseY * CFG.mouseInfluence * 0.4 - scrollY * CFG.scrollMultiplier;
            camera.lookAt(0, -scrollY * CFG.scrollMultiplier * 0.4, 0);
        }

        // ============================================
        // CENTRAL 3D OBJECT — scroll-driven transforms
        // ============================================

        // Slow base rotation
        wireframeSphere.rotation.y = t * 0.15;
        wireframeSphere.rotation.x = Math.sin(t * 0.08) * 0.2;

        // Inner sphere rotates opposite
        innerSphere.rotation.y = -t * 0.1;
        innerSphere.rotation.z = t * 0.12;

        // Dots follow outer wireframe rotation
        dots.rotation.copy(wireframeSphere.rotation);

        // --- Mouse tilt on the main group ---
        const tiltX = mouseY * 0.15;
        const tiltY = mouseX * 0.2;
        mainGroup.rotation.x += (tiltX - mainGroup.rotation.x) * 0.03;
        mainGroup.rotation.y += (tiltY - mainGroup.rotation.y) * 0.03;

        // --- Scroll-driven transforms ---
        // As user scrolls: scale up slightly, drift down, rotate more
        const scrollScale = 1 + scrollProgress * 0.3;
        mainGroup.scale.set(scrollScale, scrollScale, scrollScale);

        // Vertical drift with scroll (parallax — moves slower than content)  
        mainGroup.position.y = 1 - scrollY * CFG.scrollMultiplier * 0.6;

        // Extra rotation based on scroll
        wireframeSphere.rotation.z = scrollProgress * Math.PI * 0.5;

        // --- Wireframe opacity shifts with scroll ---
        wireframeMat.opacity = 0.12 + scrollProgress * 0.08;
        innerMat.opacity = 0.08 + scrollProgress * 0.06;

        // --- "Breathing" vertex displacement ---
        const posAttr = icoGeo.getAttribute('position');
        for (let i = 0; i < posAttr.count; i++) {
            const bx = baseVertexPositions[i * 3];
            const by = baseVertexPositions[i * 3 + 1];
            const bz = baseVertexPositions[i * 3 + 2];

            const len = Math.sqrt(bx * bx + by * by + bz * bz);
            const nx = bx / len, ny = by / len, nz = bz / len;

            // Displacement based on noise-like pattern
            const wave = Math.sin(t * 0.5 + bx * 2) * Math.cos(t * 0.3 + by * 2) * 0.12;

            posAttr.array[i * 3] = bx + nx * wave;
            posAttr.array[i * 3 + 1] = by + ny * wave;
            posAttr.array[i * 3 + 2] = bz + nz * wave;
        }
        posAttr.needsUpdate = true;

        // --- Core glow pulse ---
        const pulse = 0.04 + Math.sin(t * 0.8) * 0.03;
        coreMat.opacity = pulse;
        const coreScale = 1 + Math.sin(t * 0.5) * 0.15;
        coreSphere.scale.set(coreScale, coreScale, coreScale);

        // --- Dot pulse ---
        dotMat.opacity = 0.5 + Math.sin(t * 1.2) * 0.3;
        dotMat.size = 0.3 + Math.sin(t * 0.6) * 0.1;

        // --- Ring rotation ---
        ring1.rotation.z = 0.3 + t * 0.08;
        ring2.rotation.z = -0.8 - t * 0.05;
        ring3.rotation.y = 0.5 + t * 0.06;

        // ============================================
        // PARTICLES — drift upward
        // ============================================
        const pPos = particleGeo.getAttribute('position');
        for (let i = 0; i < CFG.particleCount; i++) {
            pPos.array[i * 3 + 1] += pSpeeds[i];
            if (pPos.array[i * 3 + 1] > 15) {
                pPos.array[i * 3 + 1] = -15;
                pPos.array[i * 3] = (Math.random() - 0.5) * 30;
                pPos.array[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
            }
        }
        pPos.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();
})();
