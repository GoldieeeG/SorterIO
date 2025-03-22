// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);
renderer.setClearColor(0x808080, 1); // Gray background, fully opaque

camera.position.set(0, 20, 20);
camera.lookAt(0, 0, 0);

// Define conveyor height to match trough top (trough at y=0.03, height=2, top at y=2.03)
const conveyorHeight = 2.03; // NEW: Added constant for conveyor height

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Power-Up Glow (Point Light) - Original light, not currently used dynamically
const powerUpLight = new THREE.PointLight(0x800080, 1, 10);
scene.add(powerUpLight);

// Room Setup (Square Box)
const roomSize = 40;
const wallThickness = 1;
const roomMaterial = new THREE.MeshPhongMaterial({ color: 0xd3d3d3, depthTest: true, depthWrite: true });

// Floor
const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
const floor = new THREE.Mesh(floorGeometry, roomMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0; // CHANGED: Moved from -wallThickness / 2 (-0.5) to 0
floor.receiveShadow = true;
scene.add(floor);

// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
const ceiling = new THREE.Mesh(ceilingGeometry, roomMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomSize / 2;
scene.add(ceiling);

// Walls
const wallGeometry = new THREE.PlaneGeometry(roomSize, roomSize / 2);
const wall1 = new THREE.Mesh(wallGeometry, roomMaterial); // Back wall
wall1.position.z = -roomSize / 2;
wall1.position.y = roomSize / 4;
wall1.receiveShadow = true;
scene.add(wall1);

const wall2 = new THREE.Mesh(wallGeometry, roomMaterial); // Front wall
wall2.position.z = roomSize / 2;
wall2.position.y = roomSize / 4;
wall2.rotation.y = Math.PI;
wall2.receiveShadow = true;
scene.add(wall2);

const wall3 = new THREE.Mesh(wallGeometry, roomMaterial); // Left wall
wall3.position.x = -roomSize / 2;
wall3.position.y = roomSize / 4;
wall3.rotation.y = Math.PI / 2;
wall3.receiveShadow = true;
scene.add(wall3);

const wall4 = new THREE.Mesh(wallGeometry, roomMaterial); // Right wall
wall4.position.x = roomSize / 2;
wall4.position.y = roomSize / 4;
wall4.rotation.y = -Math.PI / 2;
wall4.receiveShadow = true;
scene.add(wall4);

// Black Corner Lines
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-roomSize / 2, 0, -roomSize / 2),
    new THREE.Vector3(-roomSize / 2, roomSize / 2, -roomSize / 2),
    new THREE.Vector3(roomSize / 2, roomSize / 2, -roomSize / 2),
    new THREE.Vector3(roomSize / 2, 0, -roomSize / 2),
    new THREE.Vector3(-roomSize / 2, 0, -roomSize / 2),
    new THREE.Vector3(-roomSize / 2, 0, roomSize / 2),
    new THREE.Vector3(-roomSize / 2, roomSize / 2, roomSize / 2),
    new THREE.Vector3(roomSize / 2, roomSize / 2, roomSize / 2),
    new THREE.Vector3(roomSize / 2, 0, roomSize / 2),
    new THREE.Vector3(-roomSize / 2, 0, roomSize / 2)
]);
const cornerLines = new THREE.Line(lineGeometry, lineMaterial);
scene.add(cornerLines);

const verticalLines = [
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(roomSize / 2, 0, -roomSize / 2),
        new THREE.Vector3(roomSize / 2, roomSize / 2, -roomSize / 2)
    ]),
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(roomSize / 2, 0, roomSize / 2),
        new THREE.Vector3(roomSize / 2, roomSize / 2, roomSize / 2)
    ]),
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-roomSize / 2, 0, roomSize / 2),
        new THREE.Vector3(-roomSize / 2, roomSize / 2, roomSize / 2)
    ])
];
verticalLines.forEach(geometry => {
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
});

// Conveyor Belt with Moving Texture
const beltGeometry = new THREE.PlaneGeometry(20, 38); // CHANGED: Length from 40 to 38 (z=20 to z=-18)
let conveyorBelt, beltMaterial;
const beltTextureLoader = new THREE.TextureLoader();
beltTextureLoader.load(
    'https://threejs.org/examples/textures/uv_grid_opengl.jpg',
    (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 8);
        beltMaterial = new THREE.MeshPhongMaterial({ map: texture, shininess: 10, depthTest: true, depthWrite: true });
        conveyorBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        conveyorBelt.rotation.x = -Math.PI / 2;
        conveyorBelt.position.set(0, conveyorHeight, 1); // CHANGED: y=conveyorHeight (2.03), z=1 to center (20 + -18) / 2
        conveyorBelt.castShadow = true;
        conveyorBelt.receiveShadow = true;
        scene.add(conveyorBelt);
    },
    undefined,
    (error) => {
        console.error('Failed to load conveyor texture:', error);
        beltMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 10, depthTest: true, depthWrite: true });
        conveyorBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        conveyorBelt.rotation.x = -Math.PI / 2;
        conveyorBelt.position.set(0, conveyorHeight, 1); // CHANGED: y=conveyorHeight (2.03), z=1
        conveyorBelt.castShadow = true;
        conveyorBelt.receiveShadow = true;
        scene.add(conveyorBelt);
    }
);

// Missed Trough at End (Open Box)
const troughGeometry = new THREE.BufferGeometry();
const troughVertices = new Float32Array([
    -10, 0, -2,  10, 0, -2,  10, 0, 2,  -10, 0, 2,
    -10, 0, 2,  10, 0, 2,  10, 2, 2,  -10, 2, 2,
    -10, 0, -2,  10, 0, -2,  10, 2, -2,  -10, 2, -2,
    -10, 0, -2,  -10, 0, 2,  -10, 2, 2,  -10, 2, -2,
    10, 0, -2,  10, 0, 2,  10, 2, 2,  10, 2, -2
]);
const troughIndices = [
    0, 1, 2,  0, 2, 3,
    4, 5, 6,  4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19
];
troughGeometry.setAttribute('position', new THREE.BufferAttribute(troughVertices, 3));
troughGeometry.setIndex(troughIndices);
troughGeometry.computeVertexNormals();

const troughTextureLoader = new THREE.TextureLoader();
troughTextureLoader.load(
    'https://threejs.org/examples/textures/brick_diffuse.jpg',
    (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        const troughMaterial = new THREE.MeshPhongMaterial({ map: texture, shininess: 5, depthTest: true, depthWrite: true });
        const trough = new THREE.Mesh(troughGeometry, troughMaterial);
        trough.position.set(0, 0.03, -18); // Above conveyor, unchanged as top matches conveyorHeight
        trough.castShadow = true;
        trough.receiveShadow = true;
        scene.add(trough);
    },
    undefined,
    (error) => {
        console.error('Failed to load trough texture:', error);
        const troughMaterial = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 5, depthTest: true, depthWrite: true });
        const trough = new THREE.Mesh(troughGeometry, troughMaterial);
        trough.position.set(0, 0.03, -18); // Above conveyor, unchanged
        trough.castShadow = true;
        trough.receiveShadow = true;
        scene.add(trough);
    }
);

// Particles for Sorting Effect
const particles = [];
const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);

// Items and Spawning
const items = [];
let spawnInterval;
let lastSpawnZ = 20; // Start at top end (z = 20)

const shapes = [
    { type: 'cube', geometry: new THREE.BoxGeometry(2.25, 2.25, 2.25), color: 0xff0000, needsSorting: true, weight: 0.49, radius: 1.125 },
    { type: 'triangle', geometry: new THREE.TetrahedronGeometry(1.5), color: 0x0000ff, needsSorting: true, weight: 0.49, radius: 0.75 },
    { type: 'sphere', geometry: new THREE.SphereGeometry(1.5, 32, 32), color: 0xffff00, needsSorting: true, weight: 0.49, radius: 1.5 },
    { type: 'cone', geometry: new THREE.ConeGeometry(1.5, 2, 32), color: 0x00ff00, needsSorting: true, weight: 0.49, radius: 1.5 },
    { type: 'powerUpSlow', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x800080, weight: 0.005, radius: 1, effect: 'slow', label: 'Slow Conveyor' },
    { type: 'powerUpSpeed', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ff00, weight: 0.005, radius: 1, effect: 'speed', label: 'Speed Boost' },
    { type: 'powerUpExtraLife', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xffa500, weight: 0.005, radius: 1, effect: 'extraLife', label: 'Extra Life' },
    { type: 'powerUpFreeze', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ffff, weight: 0.005, radius: 1, effect: 'freeze', label: 'Freeze' }
];

// NEW: Function to get y-offset for items based on shape type
function getOffset(shape) {
    if (shape.type === 'cube') return 1.125; // Half height for box
    if (shape.type === 'triangle') return 0.75; // Approximate for tetrahedron
    if (shape.type === 'sphere') return 1.5; // Radius for sphere
    if (shape.type === 'cone') return 0; // Base at y=position.y for cone
    if (shape.type.startsWith('powerUp')) return 1; // Radius for icosahedron
}

// Define Achievements
const achievements = [
    { id: "novice_sorter", name: "Novice Sorter", description: "Sort 50 items in total" },
    { id: "red_master", name: "Red Master", description: "Sort 25 red cubes" },
    { id: "blue_expert", name: "Blue Expert", description: "Sort 25 blue triangles" },
    { id: "yellow_pro", name: "Yellow Pro", description: "Sort 25 yellow spheres" },
    { id: "survivor", name: "Survivor", description: "Complete a level without losing any lives" },
    { id: "power_up_user", name: "Power-Up User", description: "Use any power-up" },
    { id: "speed_demon", name: "Speed Demon", description: "Complete a level in under 2 minutes" },
    { id: "perfectionist", name: "Perfectionist", description: "Sort all items correctly without any mistakes in a level" },
    { id: "combo_king", name: "Combo King", description: "Sort 10 items in a row without mistakes" }
];

function createItem() {
    const availableShapes = (currentLevel < 10) ? shapes.slice(0, 2) : 
                           (currentLevel < 16) ? shapes.slice(0, 3).concat(shapes.slice(4)) : 
                           shapes.slice(0, 4).concat(shapes.slice(4));
    const totalWeight = availableShapes.reduce((sum, shape) => sum + shape.weight, 0);
    let rand = Math.random() * totalWeight;
    let shape;
    for (let i = 0; i < availableShapes.length; i++) {
        rand -= availableShapes[i].weight;
        if (rand <= 0) {
            shape = availableShapes[i];
            break;
        }
    }
    const material = new THREE.MeshPhongMaterial({ color: shape.color, shininess: 50 });
    if (shape.effect) {
        material.emissive.set(shape.color); // Glowing Power-Ups: Set emissive for glow
    }
    const item = new THREE.Mesh(shape.geometry, material);
    
    let xPos;
    let isOverlapping;
    const maxAttempts = 10;
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        xPos = Math.random() * 12 - 6;
        isOverlapping = items.some(existing => {
            if (existing.userData.isDragging) return false;
            const dx = xPos - existing.position.x;
            const dz = lastSpawnZ - existing.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            return distance < (shape.radius + (existing.geometry.type === 'BoxGeometry' ? 1.125 : existing.geometry.type === 'TetrahedronGeometry' ? 0.75 : existing.geometry.type === 'ConeGeometry' ? 1.5 : existing.geometry.type === 'IcosahedronGeometry' ? 1 : 1.5));
        });
        if (!isOverlapping) break;
        if (attempts === maxAttempts - 1) return;
    }
    
    const offset = getOffset(shape); // NEW: Use offset function
    item.position.set(xPos, conveyorHeight + offset, lastSpawnZ); // CHANGED: Adjusted y to conveyorHeight + offset
    item.castShadow = true;
    item.receiveShadow = true;
    item.userData.needsSorting = shape.needsSorting || false;
    item.userData.effect = shape.effect || null;
    item.userData.isPowerUp = shape.effect ? true : false;
    item.userData.type = shape.type;
    if (shape.effect) {
        const light = new THREE.PointLight(shape.color, 1, 5); // Glowing Power-Ups: Add light
        item.add(light);
    }
    lastSpawnZ -= 6;
    if (lastSpawnZ < 14) lastSpawnZ = 20;

    if (shape.effect) {
        const textDiv = document.createElement('div');
        textDiv.className = 'power-up-text';
        textDiv.textContent = shape.label;
        document.body.appendChild(textDiv);
        item.userData.textDiv = textDiv;
        updatePowerUpTextPosition(item);
    }
    
    scene.add(item);
    items.push(item);
}

function spawnPowerUp(type) {
    let shape;
    switch (type) {
        case 'slow':
            shape = { type: 'powerUpSlow', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x800080, radius: 1, effect: 'slow', label: 'Slow Conveyor' };
            break;
        case 'speed':
            shape = { type: 'powerUpSpeed', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ff00, radius: 1, effect: 'speed', label: 'Speed Boost' };
            break;
        case 'extraLife':
            shape = { type: 'powerUpExtraLife', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xffa500, radius: 1, effect: 'extraLife', label: 'Extra Life' };
            break;
        case 'freeze':
            shape = { type: 'powerUpFreeze', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ffff, radius: 1, effect: 'freeze', label: 'Freeze' };
            break;
        default:
            return;
    }
    const material = new THREE.MeshPhongMaterial({ color: shape.color, shininess: 50 });
    material.emissive.set(shape.color); // Glowing Power-Ups: Set emissive for glow
    const item = new THREE.Mesh(shape.geometry, material);
    
    let xPos = Math.random() * 12 - 6;
    const offset = getOffset(shape); // NEW: Use offset for power-ups
    item.position.set(xPos, conveyorHeight + offset, 20); // CHANGED: y to conveyorHeight + offset
    item.castShadow = true;
    item.receiveShadow = true;
    item.userData.effect = shape.effect;
    item.userData.isPowerUp = true;
    item.userData.type = shape.type;
    const light = new THREE.PointLight(shape.color, 1, 5); // Glowing Power-Ups: Add light
    item.add(light);

    const textDiv = document.createElement('div');
    textDiv.className = 'power-up-text';
    textDiv.textContent = shape.label;
    document.body.appendChild(textDiv);
    item.userData.textDiv = textDiv;
    updatePowerUpTextPosition(item);
    
    scene.add(item);
    items.push(item);

    showNotification(`Spawned ${shape.label}`);
}

function showNotification(message) {
    const notification = document.getElementById('spawn-notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
            notification.style.opacity = '1';
        }, 500);
    }, 3000);
}

function updatePowerUpTextPosition(item) {
    if (item.userData.textDiv) {
        const vector = item.position.clone().project(camera);
        const x = (vector.x + 1) / 2 * window.innerWidth;
        const y = (-vector.y + 1) / 2 * window.innerHeight + 20;
        item.userData.textDiv.style.left = `${x}px`;
        item.userData.textDiv.style.top = `${y}px`;
    }
}

function updatePowerUpStatus() {
    powerUpStatus.innerHTML = '';
    if (activePowerUps.length > 0) {
        powerUpStatus.style.display = 'block';
        activePowerUps.forEach((powerUp, index) => {
            const label = powerUp.effect === 'slow' ? 'Slow' : powerUp.effect === 'speed' ? 'Speed Boost' : powerUp.effect === 'freeze' ? 'Freeze' : '';
            const powerUpLine = document.createElement('div');
            powerUpLine.textContent = `${label}: ${Math.ceil(powerUp.timer)}s`;
            powerUpLine.style.marginTop = `${index * 20}px`;
            powerUpStatus.appendChild(powerUpLine);
        });
    } else {
        powerUpStatus.style.display = 'none';
    }
}

function startSpawning() {
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    spawnInterval = setInterval(() => {
        if (!isPaused) createItem();
    }, 1500);
}

// Sorting Bins with Rough Texture (Open Boxes)
const binGeometry = new THREE.BufferGeometry();
const binVertices = new Float32Array([
    -1.5, 0, -1.5,  1.5, 0, -1.5,  1.5, 0, 1.5,  -1.5, 0, 1.5,
    -1.5, 0, 1.5,  1.5, 0, 1.5,  1.5, 1.5, 1.5,  -1.5, 1.5, 1.5,
    -1.5, 0, -1.5,  1.5, 0, -1.5,  1.5, 1.5, -1.5,  -1.5, 1.5, -1.5,
    -1.5, 0, -1.5,  -1.5, 0, 1.5,  -1.5, 1.5, 1.5,  -1.5, 1.5, -1.5,
    1.5, 0, -1.5,  1.5, 0, 1.5,  1.5, 1.5, 1.5,  1.5, 1.5, -1.5
]);
const binIndices = [
    0, 1, 2,  0, 2, 3,
    4, 5, 6,  4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19
];
binGeometry.setAttribute('position', new THREE.BufferAttribute(binVertices, 3));
binGeometry.setIndex(binIndices);
binGeometry.computeVertexNormals();

function setupBins() {
    const binTextureLoader = new THREE.TextureLoader();
    binTextureLoader.load(
        'https://threejs.org/examples/textures/roughness_map.jpg',
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            const bins = [
                { color: 0xff0000, mesh: new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0xff0000, map: texture, shininess: 30, depthTest: true, depthWrite: true })) },
                { color: 0x0000ff, mesh: new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0x0000ff, map: texture, shininess: 30, depthTest: true, depthWrite: true })) }
            ];
            // Scale bins by 10%
            bins[0].mesh.scale.set(1.1, 1.1, 1.1);
            bins[1].mesh.scale.set(1.1, 1.1, 1.1);

            if (currentLevel >= 10) {
                const bin3 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0xffff00, map: texture, shininess: 30, depthTest: true, depthWrite: true }));
                bin3.scale.set(1.1, 1.1, 1.1); // Scale by 10%
                bins.push({ color: 0xffff00, mesh: bin3 });
            }

            if (currentLevel >= 16 && currentLevel <= 25) {
                const bin4 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0x00ff00, map: texture, shininess: 30, depthTest: true, depthWrite: true }));
                bin4.scale.set(1.1, 1.1, 1.1); // Scale by 10%
                bins.push({ color: 0x00ff00, mesh: bin4 });
            }

            // Set positions with adjusted y to 0.1 (just above floor at y=0)
            bins[0].mesh.position.set(-12, 0.1, 0); // CHANGED: y from 0.04 to 0.1
            bins[1].mesh.position.set(12, 0.1, 0); // CHANGED: y from 0.04 to 0.1
            if (currentLevel >= 10) {
                bins[2].mesh.position.set(12, 0.1, 4); // CHANGED: y from 0.04 to 0.1
            }
            if (currentLevel >= 16 && currentLevel <= 25) {
                bins[3].mesh.position.set(-12, 0.1, 4); // CHANGED: y from 0.04 to 0.1
            }

            bins.forEach(bin => {
                bin.mesh.castShadow = true;
                bin.mesh.receiveShadow = true;
                scene.add(bin.mesh);
                const outline = new THREE.Mesh(binGeometry, new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }));
                outline.scale.set(1.1, 1.1, 1.1);
                bin.mesh.add(outline);
                outline.visible = false;
            });
            window.bins = bins;
        },
        undefined,
        (error) => {
            console.error('Failed to load bin texture:', error);
            const bins = [
                { color: 0xff0000, mesh: new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 30, depthTest: true, depthWrite: true })) },
                { color: 0x0000ff, mesh: new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 30, depthTest: true, depthWrite: true })) }
            ];
            // Scale bins by 10%
            bins[0].mesh.scale.set(1.1, 1.1, 1.1);
            bins[1].mesh.scale.set(1.1, 1.1, 1.1);

            if (currentLevel >= 10) {
                const bin3 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0xffff00, shininess: 30, depthTest: true, depthWrite: true }));
                bin3.scale.set(1.1, 1.1, 1.1); // Scale by 10%
                bins.push({ color: 0xffff00, mesh: bin3 });
            }

            if (currentLevel >= 16 && currentLevel <= 25) {
                const bin4 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 30, depthTest: true, depthWrite: true }));
                bin4.scale.set(1.1, 1.1, 1.1); // Scale by 10%
                bins.push({ color: 0x00ff00, mesh: bin4 });
            }

            // Set positions with adjusted y to 0.1
            bins[0].mesh.position.set(-12, 0.1, 0); // CHANGED: y from 0.04 to 0.1
            bins[1].mesh.position.set(12, 0.1, 0); // CHANGED: y from 0.04 to 0.1
            if (currentLevel >= 10) {
                bins[2].mesh.position.set(12, 0.1, 4); // CHANGED: y from 0.04 to 0.1
            }
            if (currentLevel >= 16 && currentLevel <= 25) {
                bins[3].mesh.position.set(-12, 0.1, 4); // CHANGED: y from 0.04 to 0.1
            }

            bins.forEach(bin => {
                bin.mesh.castShadow = true;
                bin.mesh.receiveShadow = true;
                scene.add(bin.mesh);
                const outline = new THREE.Mesh(binGeometry, new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }));
                outline.scale.set(1.1, 1.1, 1.1);
                bin.mesh.add(outline);
                outline.visible = false;
            });
            window.bins = bins;
        }
    );
}

// Dragging Setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedItem = null;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -conveyorHeight); // CHANGED: Adjusted to -conveyorHeight (-2.03)

// Audio Setup
const successSound = document.getElementById('sort-success');
const failSound = document.getElementById('sort-fail');
const levelSuccessSound = document.getElementById('level-success');
const gameMusic = document.getElementById('game-music');

successSound.load();
failSound.load();
levelSuccessSound.load();
gameMusic.load();

// Game State
let lives = 3;
let sortCount = 0;
let totalItemsSorted = parseInt(localStorage.getItem('totalItemsSorted')) || 0;
let redCubesSorted = parseInt(localStorage.getItem('redCubesSorted')) || 0;
let blueTrianglesSorted = parseInt(localStorage.getItem('blueTrianglesSorted')) || 0;
let yellowSpheresSorted = parseInt(localStorage.getItem('yellowSpheresSorted')) || 0;
let greenConesSorted = parseInt(localStorage.getItem('greenConesSorted')) || 0;
let levelsFailed = parseInt(localStorage.getItem('levelsFailed')) || 0;
let topSortedPerLevel = { 
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 
    6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 
    11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
    16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
    21: 0, 22: 0, 23: 0, 24: 0, 25: 0,
    26: 0, 27: 0, 28: 0, 29: 0, 30: 0
};
let isPaused = false;
let isMutedSounds = localStorage.getItem('isMutedSounds') === 'true';
let isMutedMusic = localStorage.getItem('isMutedMusic') === 'true';
let soundVolume = parseFloat(localStorage.getItem('soundVolume')) || 1;
let musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 1;
let levelStartTime = null;
let mistakesMade = false;
let currentStreak = 0;

let levelUnlocks = JSON.parse(localStorage.getItem('levelUnlocks')) || { 
    2: false, 3: false, 4: false, 5: false, 
    6: false, 7: false, 8: false, 9: false, 
    10: false, 11: false, 12: false, 13: false, 
    14: false, 15: false, 16: false, 17: false, 
    18: false, 19: false, 20: false, 21: false, 
    22: false, 23: false, 24: false, 25: false, 
    26: false, 27: false, 28: false, 29: false, 
    30: false 
};

// Load Unlocked Achievements
let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || {};

const levelButtons = {
    2: document.getElementById('level-2-button'),
    3: document.getElementById('level-3-button'),
    4: document.getElementById('level-4-button'),
    5: document.getElementById('level-5-button'),
    6: document.getElementById('level-6-button'),
    7: document.getElementById('level-7-button'),
    8: document.getElementById('level-8-button'),
    9: document.getElementById('level-9-button'),
    10: document.getElementById('level-10-button'),
    11: document.getElementById('level-11-button'),
    12: document.getElementById('level-12-button'),
    13: document.getElementById('level-13-button'),
    14: document.getElementById('level-14-button'),
    15: document.getElementById('level-15-button'),
    16: document.getElementById('level-16-button'),
    17: document.getElementById('level-17-button'),
    18: document.getElementById('level-18-button'),
    19: document.getElementById('level-19-button'),
    20: document.getElementById('level-20-button'),
    21: document.getElementById('level-21-button'),
    22: document.getElementById('level-22-button'),
    23: document.getElementById('level-23-button'),
    24: document.getElementById('level-24-button'),
    25: document.getElementById('level-25-button'),
    26: document.getElementById('level-26-button'),
    27: document.getElementById('level-27-button'),
    28: document.getElementById('level-28-button'),
    29: document.getElementById('level-29-button'),
    30: document.getElementById('level-30-button')
};
for (let i = 2; i <= 30; i++) {
    if (levelUnlocks[i]) {
        levelButtons[i].textContent = `Level ${i}`;
        levelButtons[i].disabled = false;
    } else {
        levelButtons[i].textContent = `Level ${i} (Locked)`;
        levelButtons[i].disabled = true;
    }
}

let currentLevel = 1;
let itemsNeeded = 15;
let conveyorSpeed = 0.02;
let baseConveyorSpeed = 0.02;
let activePowerUps = [];

const hearts = [
    document.getElementById('heart1'),
    document.getElementById('heart2'),
    document.getElementById('heart3')
];
const neededCountDisplay = document.getElementById('needed-count');
const neededTotalDisplay = document.getElementById('needed-total');
const topSortedCountDisplay = document.getElementById('top-sorted-count');
const livesText = document.getElementById('lives-text');
const levelDisplay = document.getElementById('level-display');
const gamePausedText = document.getElementById('game-paused-text');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverSortCount = document.getElementById('game-over-sort-count');
const gameOverNeededCount = document.getElementById('game-over-needed-count');
const levelCompleteScreen = document.getElementById('level-complete-screen');
const levelCompleteSortCount = document.getElementById('level-complete-sort-count');
const completedLevelDisplay = document.getElementById('completed-level');
const nextLevelDisplay = document.getElementById('next-level');
const endLevelButton = document.getElementById('end-level-button');
const progressBar = document.getElementById('progress-bar');
const powerUpStatus = document.getElementById('power-up-status');

const startScreen = document.getElementById('start-screen');
const levelSelectScreen = document.getElementById('level-select-screen');
const levelSelectPage2 = document.getElementById('level-select-page-2');
const gameUI = document.getElementById('game-ui');
const pauseScreen = document.getElementById('pause-screen');
const settingsScreen = document.getElementById('settings-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const statsScreen = document.getElementById('stats-screen');
const devToolsButton = document.getElementById('dev-tools-button');
const devToolsBubble = document.getElementById('dev-tools-bubble');
const powerUpMenu = document.getElementById('power-up-menu');
const pauseResumeButton = document.getElementById('pause-resume-button');
const totalSortedDisplay = document.getElementById('total-sorted');
const redSortedDisplay = document.getElementById('red-sorted');
const blueSortedDisplay = document.getElementById('blue-sorted');
const yellowSortedDisplay = document.getElementById('yellow-sorted');
const levelsFailedDisplay = document.getElementById('levels-failed');
const achievementsList = document.getElementById('achievements-list');

const powerUpsScreen = document.getElementById('power-ups-screen');

let selectedLevel;
const levelStartScreen = document.getElementById('level-start-screen');
const selectedLevelNumberDisplay = document.getElementById('selected-level-number');
const levelStartButton = document.getElementById('level-start-button');
const backToLevelSelectFromStart = document.getElementById('back-to-level-select-from-start');
const backToMainMenuFromStart = document.getElementById('back-to-main-menu-from-start');

// Apply saved settings and stats on startup
successSound.muted = isMutedSounds;
failSound.muted = isMutedSounds;
levelSuccessSound.muted = isMutedSounds;
gameMusic.muted = isMutedMusic;
successSound.volume = soundVolume;
failSound.volume = soundVolume;
levelSuccessSound.volume = soundVolume;
gameMusic.volume = musicVolume;
totalSortedDisplay.textContent = totalItemsSorted;
redSortedDisplay.textContent = redCubesSorted;
blueSortedDisplay.textContent = blueTrianglesSorted;
yellowSortedDisplay.textContent = yellowSpheresSorted;
levelsFailedDisplay.textContent = levelsFailed;

// Event Listeners
document.getElementById('start-button').addEventListener('click', () => {
    console.log('Start button clicked');
    selectedLevel = 1;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    startScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

document.getElementById('level-select-button').addEventListener('click', () => {
    console.log('Level select button clicked');
    startScreen.style.display = 'none';
    levelSelectScreen.style.display = 'block';
});

document.getElementById('level-1-button').addEventListener('click', () => {
    console.log('Level 1 button clicked');
    selectedLevel = 1;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    levelSelectScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

for (let i = 2; i <= 30; i++) {
    document.getElementById(`level-${i}-button`).addEventListener('click', () => {
        if (levelUnlocks[i]) {
            console.log(`Level ${i} button clicked`);
            selectedLevel = i;
            selectedLevelNumberDisplay.textContent = selectedLevel;
            if (i <= 15) {
                levelSelectScreen.style.display = 'none';
            } else {
                levelSelectPage2.style.display = 'none';
            }
            levelStartScreen.style.display = 'block';
        }
    });
}

document.getElementById('back-to-start').addEventListener('click', () => {
    console.log('Back to start from level select clicked');
    levelSelectScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

document.getElementById('next-page-button').addEventListener('click', () => {
    console.log('Next page button clicked');
    levelSelectScreen.style.display = 'none';
    levelSelectPage2.style.display = 'block';
});

document.getElementById('prev-page-button').addEventListener('click', () => {
    console.log('Previous page button clicked');
    levelSelectPage2.style.display = 'none';
    levelSelectScreen.style.display = 'block';
});

document.getElementById('back-to-start-page-2').addEventListener('click', () => {
    console.log('Back to start from page 2 clicked');
    levelSelectPage2.style.display = 'none';
    startScreen.style.display = 'block';
});

document.getElementById('instructions-button').addEventListener('click', () => {
    console.log('Instructions button clicked');
    startScreen.style.display = 'none';
    instructionsScreen.style.display = 'block';
});

document.getElementById('back-instructions').addEventListener('click', () => {
    console.log('Back from instructions clicked');
    instructionsScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

document.getElementById('power-ups-button').addEventListener('click', () => {
    console.log('Power-Ups button clicked');
    startScreen.style.display = 'none';
    powerUpsScreen.style.display = 'block';
});

document.getElementById('back-power-ups').addEventListener('click', () => {
    console.log('Back from power-ups clicked');
    powerUpsScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

document.getElementById('stats-button').addEventListener('click', () => {
    console.log('Stats button clicked');
    startScreen.style.display = 'none';
    statsScreen.style.display = 'block';
    totalSortedDisplay.textContent = totalItemsSorted;
    redSortedDisplay.textContent = redCubesSorted;
    blueSortedDisplay.textContent = blueTrianglesSorted;
    yellowSortedDisplay.textContent = yellowSpheresSorted;
    levelsFailedDisplay.textContent = levelsFailed;
    updateAchievementsList();
});

document.getElementById('back-to-start-from-stats').addEventListener('click', () => {
    console.log('Back to start from stats clicked');
    statsScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

pauseResumeButton.addEventListener('click', () => {
    console.log('Pause/resume button clicked');
    togglePause();
});

document.getElementById('resume-button').addEventListener('click', () => {
    console.log('Resume button clicked');
    togglePause();
});

document.getElementById('back-to-start-pause').addEventListener('click', () => {
    console.log('Back to start from pause clicked');
    pauseScreen.style.display = 'none';
    gameUI.style.display = 'none';
    startScreen.style.display = 'block';
    cleanupGame();
});

document.getElementById('restart-from-game-over').addEventListener('click', () => {
    console.log('Restart from game over clicked');
    selectedLevel = currentLevel;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    gameOverScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

document.getElementById('back-to-start-from-game-over').addEventListener('click', () => {
    console.log('Back to start from game over clicked');
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

document.getElementById('start-next-level').addEventListener('click', () => {
    console.log('Start next level clicked');
    selectedLevel = currentLevel + 1;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    levelCompleteScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

document.getElementById('back-to-level-select').addEventListener('click', () => {
    console.log('Back to level select clicked');
    levelCompleteScreen.style.display = 'none';
    levelSelectScreen.style.display = 'block';
});

document.getElementById('settings-from-level-complete').addEventListener('click', () => {
    console.log('Settings from level complete clicked');
    levelCompleteScreen.style.display = 'none';
    showSettings();
});

document.getElementById('end-level-button').addEventListener('click', () => {
    console.log('End level button clicked');
    gameUI.style.display = 'none';
    levelCompleteScreen.style.display = 'block';
    levelCompleteSortCount.textContent = sortCount;
    cleanupGame();
});

document.getElementById('settings-button-start').addEventListener('click', () => {
    console.log('Settings from start clicked');
    startScreen.style.display = 'none';
    showSettings();
});

document.getElementById('settings-button-pause').addEventListener('click', () => {
    console.log('Settings from pause clicked');
    pauseScreen.style.display = 'none';
    showSettings();
});

document.getElementById('close-settings').addEventListener('click', () => {
    console.log('Close settings clicked');
    settingsScreen.style.display = 'none';
    if (gameUI.style.display === 'block') {
        pauseScreen.style.display = 'block';
    } else if (levelCompleteScreen.style.display === 'block') {
        levelCompleteScreen.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
});

document.getElementById('mute-sounds').addEventListener('change', (e) => {
    isMutedSounds = e.target.checked;
    successSound.muted = isMutedSounds;
    failSound.muted = isMutedSounds;
    levelSuccessSound.muted = isMutedSounds;
    localStorage.setItem('isMutedSounds', isMutedSounds);
});

document.getElementById('mute-music').addEventListener('change', (e) => {
    isMutedMusic = e.target.checked;
    gameMusic.muted = isMutedMusic;
    localStorage.setItem('isMutedMusic', isMutedMusic);
});

document.getElementById('sounds-volume').addEventListener('input', (e) => {
    soundVolume = parseFloat(e.target.value);
    successSound.volume = soundVolume;
    failSound.volume = soundVolume;
    levelSuccessSound.volume = soundVolume;
    localStorage.setItem('soundVolume', soundVolume);
});

document.getElementById('music-volume').addEventListener('input', (e) => {
    musicVolume = parseFloat(e.target.value);
    gameMusic.volume = musicVolume;
    localStorage.setItem('musicVolume', musicVolume);
});

// Add reset game data event listener
document.getElementById('reset-game-data').addEventListener('click', () => {
    console.log('Reset game data button clicked');
    if (confirm('Are you sure you want to reset all game data? This will reset level progress, stats, and achievements.')) {
        // Reset level unlocks
        levelUnlocks = {
            2: false, 3: false, 4: false, 5: false,
            6: false, 7: false, 8: false, 9: false,
            10: false, 11: false, 12: false, 13: false,
            14: false, 15: false, 16: false, 17: false,
            18: false, 19: false, 20: false, 21: false,
            22: false, 23: false, 24: false, 25: false,
            26: false, 27: false, 28: false, 29: false,
            30: false
        };
        localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));

        // Reset stats
        totalItemsSorted = 0;
        redCubesSorted = 0;
        blueTrianglesSorted = 0;
        yellowSpheresSorted = 0;
        greenConesSorted = 0;
        levelsFailed = 0;
        localStorage.setItem('totalItemsSorted', totalItemsSorted);
        localStorage.setItem('redCubesSorted', redCubesSorted);
        localStorage.setItem('blueTrianglesSorted', blueTrianglesSorted);
        localStorage.setItem('yellowSpheresSorted', yellowSpheresSorted);
        localStorage.setItem('greenConesSorted', greenConesSorted);
        localStorage.setItem('levelsFailed', levelsFailed);

        // Reset achievements
        unlockedAchievements = {};
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));

        // Update UI
        for (let i = 2; i <= 30; i++) {
            levelButtons[i].textContent = `Level ${i} (Locked)`;
            levelButtons[i].disabled = true;
        }
        totalSortedDisplay.textContent = totalItemsSorted;
        redSortedDisplay.textContent = redCubesSorted;
        blueSortedDisplay.textContent = blueTrianglesSorted;
        yellowSortedDisplay.textContent = yellowSpheresSorted;
        levelsFailedDisplay.textContent = levelsFailed;
        updateAchievementsList();

        // Reset topSortedPerLevel in memory
        topSortedPerLevel = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
            6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
            11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
            16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
            21: 0, 22: 0, 23: 0, 24: 0, 25: 0,
            26: 0, 27: 0, 28: 0, 29: 0, 30: 0
        };

        alert('Game data has been reset.');
    }
});

document.getElementById('dev-tools-button').addEventListener('click', () => {
    console.log('Dev tools button clicked');
    const password = prompt('Enter password to access Dev Tools:');
    if (password === 'Skywalker') {
        if (startScreen.style.display === 'block') {
            startScreen.style.display = 'none';
        }
        if (gameUI.style.display === 'block' && !isPaused) {
            isPaused = true;
            if (spawnInterval) {
                clearInterval(spawnInterval);
                spawnInterval = null;
            }
            gameMusic.pause();
        }
        if (pauseScreen.style.display === 'block') {
            pauseScreen.style.display = "none";
        }
        devToolsBubble.style.display = 'block';
        document.getElementById('dev-game-paused').style.display = (gameUI.style.display === 'block') ? 'block' : 'none';
    } else {
        alert('Incorrect password');
    }
});

document.getElementById('unlock-all-button').addEventListener('click', () => {
    console.log('Unlock all button clicked');
    for (let i = 2; i <= 30; i++) {
        levelUnlocks[i] = true;
        levelButtons[i].textContent = `Level ${i}`;
        levelButtons[i].disabled = false;
    }
    localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
    console.log('All levels unlocked');
    showNotification('All levels have been unlocked!');
});

document.getElementById('spawn-power-up-button').addEventListener('click', () => {
    console.log('Spawn power-up button clicked');
    devToolsBubble.style.display = 'none';
    powerUpMenu.style.display = 'block';
});

document.getElementById('spawn-slow-conveyor').addEventListener('click', () => {
    console.log('Spawn slow conveyor clicked');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('slow');
        console.log('Spawned Slow Conveyor power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

document.getElementById('spawn-speed-boost').addEventListener('click', () => {
    console.log('Spawn speed boost clicked');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('speed');
        console.log('Spawned Speed Boost power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

document.getElementById('spawn-extra-life').addEventListener('click', () => {
    console.log('Spawn extra life clicked');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('extraLife');
        console.log('Spawned Extra Life power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

document.getElementById('spawn-freeze').addEventListener('click', () => {
    console.log('Spawn freeze clicked');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('freeze');
        console.log('Spawned Freeze power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

document.getElementById('back-to-dev-tools').addEventListener('click', () => {
    console.log('Back to dev tools clicked');
    powerUpMenu.style.display = 'none';
    devToolsBubble.style.display = 'block';
});

document.getElementById('close-power-up-menu').addEventListener('click', () => {
    console.log('Close power-up menu clicked');
    powerUpMenu.style.display = 'none';
    if (gameUI.style.display === 'block' && isPaused) {
        pauseScreen.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
});

document.getElementById('close-dev-tools').addEventListener('click', () => {
    console.log('Close dev tools clicked');
    devToolsBubble.style.display = 'none';
    if (gameUI.style.display === 'block') {
        pauseScreen.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
});

levelStartButton.addEventListener('click', () => {
    console.log('Level start button clicked');
    levelStartScreen.style.display = 'none';
    gameUI.style.display = 'block';
    startGame(selectedLevel);
});

backToLevelSelectFromStart.addEventListener('click', () => {
    console.log('Back to level select from start clicked');
    levelStartScreen.style.display = 'none';
    if (selectedLevel <= 15) {
        levelSelectScreen.style.display = 'block';
    } else {
        levelSelectPage2.style.display = 'block';
    }
});

backToMainMenuFromStart.addEventListener('click', () => {
    console.log('Back to main menu from level start clicked');
    levelStartScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

document.getElementById('back-to-main-menu').addEventListener('click', () => {
    console.log('Back to main menu clicked');
    levelCompleteScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

// Added event listener for Restart Game button
document.getElementById('restart-button').addEventListener('click', () => {
    console.log('Restart button clicked');
    restartGame();
});

// Achievement Functions
function unlockAchievement(id) {
    if (!unlockedAchievements[id]) {
        unlockedAchievements[id] = true;
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
        const achievement = achievements.find(a => a.id === id);
        if (achievement) {
            showNotification(`Achievement Unlocked: ${achievement.name}`);
        }
    }
}

function checkSortingAchievements() {
    if (totalItemsSorted >= 50) {
        unlockAchievement("novice_sorter");
    }
    if (redCubesSorted >= 25) {
        unlockAchievement("red_master");
    }
    if (blueTrianglesSorted >= 25) {
        unlockAchievement("blue_expert");
    }
    if (yellowSpheresSorted >= 25) {
        unlockAchievement("yellow_pro");
    }
}

function updateAchievementsList() {
    achievementsList.innerHTML = '';
    const unlocked = achievements.filter(a => unlockedAchievements[a.id]);
    if (unlocked.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No achievements unlocked yet.';
        achievementsList.appendChild(li);
    } else {
        unlocked.forEach(achievement => {
            const li = document.createElement('li');
            li.textContent = `${achievement.name}: ${achievement.description}`;
            achievementsList.appendChild(li);
        });
    }
}

// Particle Effects Function
function createParticles(position, color) {
    const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
    for (let i = 0; i < 5; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        const direction = new THREE.Vector3(Math.random() - 0.5, Math.random(), Math.random() - 0.5).normalize();
        particle.userData.velocity = direction.multiplyScalar(0.1);
        particle.userData.life = 1;
        scene.add(particle);
        particles.push(particle);
    }
}

// Game Logic Functions
function resetGameState() {
    lives = 3;
    livesText.textContent = `Lives: ${lives}`;
    hearts.forEach(heart => heart.classList.remove('lost'));
    sortCount = 0;
    neededCountDisplay.textContent = sortCount;
    topSortedCountDisplay.textContent = topSortedPerLevel[currentLevel];
    progressBar.style.width = '0%';
    activePowerUps = [];
    powerUpStatus.style.display = 'none';
    isPaused = false;
    pauseResumeButton.textContent = 'Pause';
    levelStartTime = Date.now();
    mistakesMade = false;
    currentStreak = 0;
}

function startGame(level) {
    console.log(`Starting level ${level}`);
    currentLevel = level;
    levelDisplay.textContent = `Level ${currentLevel}`;
    itemsNeeded = level === 1 ? 15 : level === 2 ? 20 : level === 3 ? 25 : level === 4 ? 30 : level === 5 ? 35 :
                  level === 6 ? 40 : level === 7 ? 45 : level === 8 ? 50 : level === 9 ? 55 : level === 10 ? 60 :
                  level === 11 ? 65 : level === 12 ? 70 : level === 13 ? 75 : level === 14 ? 80 : level === 15 ? 85 :
                  level === 16 ? 90 : level === 17 ? 95 : level === 18 ? 100 : level === 19 ? 105 : level === 20 ? 110 :
                  level === 21 ? 115 : level === 22 ? 120 : level === 23 ? 125 : level === 24 ? 130 : level === 25 ? 135 :
                  level === 26 ? 140 : level === 27 ? 145 : level === 28 ? 150 : level === 29 ? 155 : level === 30 ? 165 : 15;
    baseConveyorSpeed = level === 1 ? 0.02 : level === 2 ? 0.025 : level === 3 ? 0.028 : level === 4 ? 0.031 : level === 5 ? 0.034 :
                        level === 6 ? 0.037 : level === 7 ? 0.040 : level === 8 ? 0.043 : level === 9 ? 0.046 : level === 10 ? 0.049 :
                        level === 11 ? 0.052 : level === 12 ? 0.055 : level === 13 ? 0.058 : level === 14 ? 0.061 : level === 15 ? 0.064 :
                        level === 16 ? 0.067 : level === 17 ? 0.070 : level === 18 ? 0.073 : level === 19 ? 0.076 : level === 20 ? 0.079 :
                        level === 21 ? 0.082 : level === 22 ? 0.085 : level === 23 ? 0.088 : level === 24 ? 0.091 : level === 25 ? 0.094 :
                        level === 26 ? 0.097 : level === 27 ? 0.100 : level === 28 ? 0.103 : level === 29 ? 0.106 : level === 30 ? 0.109 : 0.02;
    conveyorSpeed = baseConveyorSpeed;
    neededTotalDisplay.textContent = itemsNeeded;
    completedLevelDisplay.textContent = currentLevel;
    nextLevelDisplay.textContent = currentLevel + 1;
    endLevelButton.style.display = 'none';
    cleanupBins();
    setupBins();
    restartGame();
}

function cleanupBins() {
    if (window.bins) {
        window.bins.forEach(bin => {
            scene.remove(bin.mesh);
        });
        window.bins = null;
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
        }
        pauseScreen.style.display = 'block';
        pauseResumeButton.textContent = 'Resume';
        gameMusic.pause();
    } else {
        startSpawning();
        pauseScreen.style.display = 'none';
        pauseResumeButton.textContent = 'Pause';
        if (!isMutedMusic) {
            gameMusic.play().catch(e => console.log('Music play failed:', e));
        }
    }
}

function showSettings() {
    if (gameUI.style.display === 'block' && !isPaused) {
        togglePause();
    }
    settingsScreen.style.display = 'block';
    document.getElementById('mute-sounds').checked = isMutedSounds;
    document.getElementById('mute-music').checked = isMutedMusic;
    document.getElementById('sounds-volume').value = soundVolume;
    document.getElementById('music-volume').value = musicVolume;
    gamePausedText.style.display = (gameUI.style.display === 'block') ? 'block' : 'none';
}

function cleanupGame() {
    isPaused = true;
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }
    gameMusic.pause();
    items.forEach(item => {
        if (item.userData.textDiv) {
            document.body.removeChild(item.userData.textDiv);
        }
        scene.remove(item);
    });
    items.length = 0;
    particles.forEach(particle => scene.remove(particle)); // Particle Effects: Cleanup
    particles.length = 0;
}

function restartGame() {
    cleanupGame();
    resetGameState();
    startSpawning();
    if (!isMutedMusic) {
        gameMusic.play().catch(e => console.log('Music play failed:', e));
    }
}

// Mouse Event Handlers
window.addEventListener('mousedown', (event) => {
    if (!isPaused) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(items);
        
        if (intersects.length > 0) {
            selectedItem = intersects[0].object;
            selectedItem.userData.isDragging = true;
        }
    }
});

window.addEventListener('mousemove', (event) => {
    if (selectedItem && !isPaused) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
            const shapeType = selectedItem.userData.type;
            const offset = getOffset({type: shapeType}); // NEW: Get offset for dragging
            selectedItem.position.set(intersectPoint.x, conveyorHeight + offset, intersectPoint.z); // CHANGED: Adjusted y to conveyorHeight + offset
            selectedItem.position.z = Math.max(-18, Math.min(20, selectedItem.position.z)); // CHANGED: Updated bounds to match new conveyor z (-18 to 20)
            updatePowerUpTextPosition(selectedItem);
        }

        if (window.bins) {
            window.bins.forEach(bin => {
                const binPos = bin.mesh.position;
                const itemPos = selectedItem.position;
                const distance = Math.sqrt(Math.pow(itemPos.x - binPos.x, 2) + Math.pow(itemPos.z - binPos.z, 2));
                const isCorrectBin = bin.color === selectedItem.material.color.getHex();
                // Adjusted distance for scaled bins (1.5 * 1.1 = 1.65)
                bin.mesh.children[0].visible = distance < 1.65 && isCorrectBin && !selectedItem.userData.effect;
            });
        }
    } else if (window.bins) {
        window.bins.forEach(bin => bin.mesh.children[0].visible = false);
    }
});

window.addEventListener('mouseup', (event) => {
    if (selectedItem && !isPaused) {
        const itemColor = selectedItem.material.color.getHex();
        let sorted = false;
        let sortedItem = selectedItem;
        const itemPos = sortedItem.position;

        if (window.bins) {
            for (const bin of window.bins) {
                const binPos = bin.mesh.position;
                const distance = Math.sqrt(Math.pow(itemPos.x - binPos.x, 2) + Math.pow(itemPos.z - binPos.z, 2));
                // Adjusted for scaled bins (1.5 * 1.1 = 1.65)
                const withinBounds = Math.abs(itemPos.x - binPos.x) <= 1.65 && Math.abs(itemPos.z - binPos.z) <= 1.65;
                if (distance < 1.65 && withinBounds) {
                    sorted = true;
                    sortedItem.position.copy(binPos);
                    sortedItem.position.y += 1.5;

                    if (sortedItem.userData.effect) {
                        if (sortedItem.userData.effect === 'slow') {
                            const existingSlow = activePowerUps.find(p => p.effect === 'slow');
                            if (existingSlow) {
                                existingSlow.timer += 5;
                            } else {
                                activePowerUps.push({ effect: 'slow', timer: 5 });
                            }
                        } else if (sortedItem.userData.effect === 'speed') {
                            const existingSpeed = activePowerUps.find(p => p.effect === 'speed');
                            if (existingSpeed) {
                                existingSpeed.timer += 5;
                            } else {
                                activePowerUps.push({ effect: 'speed', timer: 5 });
                            }
                        } else if (sortedItem.userData.effect === 'extraLife') {
                            if (lives < 3) {
                                lives++;
                                livesText.textContent = `Lives: ${lives}`;
                                hearts[lives - 1].classList.remove('lost');
                                showNotification('Extra Life Gained!');
                            }
                        } else if (sortedItem.userData.effect === 'freeze') {
                            const existingFreeze = activePowerUps.find(p => p.effect === 'freeze');
                            if (existingFreeze) {
                                existingFreeze.timer += 3;
                            } else {
                                activePowerUps.push({ effect: 'freeze', timer: 3 });
                            }
                        }
                        updatePowerUpStatus();
                        animatePowerUp(sortedItem, 'shrink', () => {
                            if (sortedItem.userData.textDiv) {
                                document.body.removeChild(sortedItem.userData.textDiv);
                            }
                            scene.remove(sortedItem);
                            const index = items.indexOf(sortedItem);
                            if (index !== -1) items.splice(index, 1);
                            if (!isMutedSounds) successSound.play();
                            currentStreak++;
                            if (currentStreak >= 10) {
                                unlockAchievement("combo_king");
                            }
                        });
                        unlockAchievement("power_up_user");
                    } else if (sortedItem.userData.needsSorting) {
                        if (bin.color === itemColor) {
                            animatePowerUp(sortedItem, 'shrink', () => {
                                createParticles(sortedItem.position, sortedItem.material.color); // Particle Effects: Trigger particles
                                scene.remove(sortedItem);
                                const index = items.indexOf(sortedItem);
                                if (index !== -1) items.splice(index, 1);
                                sortCount++;
                                totalItemsSorted++;
                                if (sortedItem.userData.type === 'cube') {
                                    redCubesSorted++;
                                    localStorage.setItem('redCubesSorted', redCubesSorted);
                                } else if (sortedItem.userData.type === 'triangle') {
                                    blueTrianglesSorted++;
                                    localStorage.setItem('blueTrianglesSorted', blueTrianglesSorted);
                                } else if (sortedItem.userData.type === 'sphere') {
                                    yellowSpheresSorted++;
                                    localStorage.setItem('yellowSpheresSorted', yellowSpheresSorted);
                                } else if (sortedItem.userData.type === 'cone') {
                                    greenConesSorted++;
                                    localStorage.setItem('greenConesSorted', greenConesSorted);
                                }
                                localStorage.setItem('totalItemsSorted', totalItemsSorted);
                                checkSortingAchievements();
                                neededCountDisplay.textContent = Math.min(sortCount, itemsNeeded);
                                topSortedCountDisplay.textContent = Math.max(sortCount, topSortedPerLevel[currentLevel]);
                                topSortedPerLevel[currentLevel] = Math.max(sortCount, topSortedPerLevel[currentLevel]);
                                progressBar.style.width = `${Math.min((sortCount / itemsNeeded) * 100, 100)}%`;
                                if (!isMutedSounds) successSound.play();
                                currentStreak++;
                                if (currentStreak >= 10) {
                                    unlockAchievement("combo_king");
                                }

                                if (sortCount >= itemsNeeded) {
                                    const timeElapsed = (Date.now() - levelStartTime) / 1000; // in seconds
                                    if (timeElapsed < 120) {
                                        unlockAchievement("speed_demon");
                                    }
                                    if (!mistakesMade) {
                                        unlockAchievement("perfectionist");
                                    }
                                    if (lives === 3) {
                                        unlockAchievement("survivor");
                                    }
                                    if (currentLevel < 30) {
                                        levelUnlocks[currentLevel + 1] = true;
                                        localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
                                        if (levelButtons[currentLevel + 1]) {
                                            levelButtons[currentLevel + 1].textContent = `Level ${currentLevel + 1}`;
                                            levelButtons[currentLevel + 1].disabled = false;
                                        }
                                    }
                                    endLevelButton.style.display = 'block';
                                    if (!isMutedSounds) levelSuccessSound.play();
                                }
                            });
                        } else {
                            animatePowerUp(sortedItem, 'shake', () => {
                                if (sortedItem.userData.textDiv) {
                                    document.body.removeChild(sortedItem.userData.textDiv);
                                }
                                scene.remove(sortedItem);
                                const index = items.indexOf(sortedItem);
                                if (index !== -1) items.splice(index, 1);
                                if (!isMutedSounds) failSound.play();
                                loseLife();
                            });
                            sorted = true;
                        }
                    }
                    break;
                }
            }
        }

        if (!sorted) {
            if (Math.abs(selectedItem.position.x) > 10) {
                // Remove item and lose a life if dropped off the conveyor sides
                if (selectedItem.userData.textDiv) {
                    document.body.removeChild(selectedItem.userData.textDiv);
                }
                scene.remove(selectedItem);
                const index = items.indexOf(selectedItem);
                if (index !== -1) items.splice(index, 1);
                if (selectedItem.userData.needsSorting) {
                    loseLife();
                    if (!isMutedSounds) failSound.play();
                }
            } else {
                selectedItem.userData.isDragging = false;
            }
        }
        selectedItem = null;
        if (window.bins) {
            window.bins.forEach(bin => bin.mesh.children[0].visible = false);
        }
    }
});

function loseLife() {
    mistakesMade = true;
    currentStreak = 0;
    lives--;
    livesText.textContent = `Lives: ${lives}`;
    if (lives >= 0) hearts[lives].classList.add('lost');
    if (lives <= 0) {
        levelsFailed++;
        localStorage.setItem('levelsFailed', levelsFailed);
        gameUI.style.display = 'none';
        gameOverScreen.style.display = 'block';
        gameOverSortCount.textContent = sortCount;
        gameOverNeededCount.textContent = itemsNeeded;
        cleanupGame();
    }
}

function animatePowerUp(item, type, callback) {
    let elapsed = 0;
    const duration = type === 'shrink' ? 500 : 300;
    const startScale = item.scale.clone();
    const startPosition = item.position.clone();

    function animate(timestamp) {
        elapsed += 16;
        const progress = Math.min(elapsed / duration, 1);

        if (type === 'shrink') {
            item.scale.lerp(new THREE.Vector3(0, 0, 0), progress);
        } else if (type === 'shake') {
            const shakeAmount = Math.sin(progress * Math.PI * 4) * 0.2;
            item.position.set(
                startPosition.x + shakeAmount,
                startPosition.y,
                startPosition.z
            );
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            item.scale.copy(startScale);
            item.position.copy(startPosition);
            callback();
        }
    }
    requestAnimationFrame(animate);
}

// Animation Loop
let lastTime = 0;
let textureOffset = 0;
function animate(timestamp) {
    requestAnimationFrame(animate);
    
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!isPaused && beltMaterial && beltMaterial.map) {
        // Set conveyor speed based on active power-ups
        conveyorSpeed = baseConveyorSpeed;
        if (activePowerUps.length > 0) {
            const hasFreeze = activePowerUps.some(p => p.effect === 'freeze');
            const hasSpeed = activePowerUps.some(p => p.effect === 'speed');
            const hasSlow = activePowerUps.some(p => p.effect === 'slow');
            
            if (hasFreeze) {
                conveyorSpeed = 0;
            } else if (hasSpeed) {
                conveyorSpeed = baseConveyorSpeed * 2;
            } else if (hasSlow) {
                conveyorSpeed = baseConveyorSpeed * 0.5;
            }
            
            activePowerUps.forEach((powerUp, idx) => {
                powerUp.timer -= delta;
                if (powerUp.timer <= 0) {
                    activePowerUps.splice(idx, 1);
                }
            });
            updatePowerUpStatus();
        }
        
        textureOffset -= conveyorSpeed;
        beltMaterial.map.offset.y = textureOffset % 1;

        const toRemove = [];
        items.forEach((item, index) => {
            if (!item.userData.isDragging) {
                item.position.z -= conveyorSpeed;
                item.rotation.y += 0.02;
                if (item.position.z < -18) {
                    toRemove.push(index);
                } else {
                    updatePowerUpTextPosition(item);
                }
            }
        });
        toRemove.reverse().forEach(index => {
            const item = items[index];
            if (item.userData.textDiv) {
                document.body.removeChild(item.userData.textDiv);
            }
            scene.remove(item);
            items.splice(index, 1);
            if (item.userData.needsSorting) {
                loseLife();
                if (!isMutedSounds) failSound.play();
            }
        });

        // Particle Effects: Update particles
        const particleRemove = [];
        particles.forEach((particle, index) => {
            particle.position.add(particle.userData.velocity);
            particle.userData.life -= delta;
            particle.scale.setScalar(particle.userData.life);
            if (particle.userData.life <= 0) {
                particleRemove.push(index);
            }
        });
        particleRemove.reverse().forEach(index => {
            scene.remove(particles[index]);
            particles.splice(index, 1);
        });
    }

    renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Shadow and Renderer Settings
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);

// Initial bin setup
setupBins();