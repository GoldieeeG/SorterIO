function loadAdIfNeeded(containerId, adSlot) {
    const container = document.getElementById(containerId);
    if (container && container.children.length === 0) {
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', 'ca-pub-4887565612343348');
        ins.setAttribute('data-ad-slot', adSlot);
        ins.setAttribute('data-ad-format', 'auto');
        container.appendChild(ins);
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadAdIfNeeded('start-ad', '8874697286');
});

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
const conveyorHeight = 2.03;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased from 0.5 to prevent dark overtone
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Power-Up Glow (Point Light)
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
floor.position.y = 0;
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

// Conveyor Belt Material Setup
let beltMaterial;
const beltTextureLoader = new THREE.TextureLoader();
beltTextureLoader.load(
    'https://threejs.org/examples/textures/uv_grid_opengl.jpg',
    (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 8);
        beltMaterial = new THREE.MeshPhongMaterial({ map: texture, shininess: 10, depthTest: true, depthWrite: true });
    },
    undefined,
    (error) => {
        console.error('Failed to load conveyor texture:', error);
        beltMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 10, depthTest: true, depthWrite: true });
    }
);

// Trough Material Setup
let troughMaterial;
const troughTextureLoader = new THREE.TextureLoader();
troughTextureLoader.load(
    'https://threejs.org/examples/textures/brick_diffuse.jpg',
    (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        troughMaterial = new THREE.MeshPhongMaterial({ map: texture, shininess: 5, depthTest: true, depthWrite: true });
    },
    undefined,
    (error) => {
        console.error('Failed to load trough texture:', error);
        troughMaterial = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 5, depthTest: true, depthWrite: true });
    }
);

// Power-Ups 3D Setup
let powerUpsScene, powerUpsCamera, powerUpsRenderer;
let isPowerUpsAnimating = false;

// Manage Conveyors and Troughs
let conveyorBelts = [];
let troughs = [];
let leftConveyorDirection, rightConveyorDirection, conveyorDirection;

function setupConveyors() {
    // Remove existing conveyors
    conveyorBelts.forEach(belt => scene.remove(belt));
    conveyorBelts = [];

    if (currentLevel >= 26) {
        const leftBeltMaterial = beltMaterial.clone();
        const rightBeltMaterial = beltMaterial.clone();
        let leftBeltGeometry;
        if (currentLevel >= 36 && currentLevel <= 45) {
            leftBeltGeometry = new THREE.PlaneGeometry(10, 40); // Extended to 40 units for levels 36-45
        } else {
            leftBeltGeometry = new THREE.PlaneGeometry(10, 38);
        }
        const leftBelt = new THREE.Mesh(leftBeltGeometry, leftBeltMaterial);
        leftBelt.rotation.x = -Math.PI / 2;
        leftBelt.position.set(-7.5, conveyorHeight, currentLevel >= 36 && currentLevel <= 45 ? 0 : 1); // z=0 for 40-unit length (z=-20 to z=20), z=1 otherwise (z=-18 to z=20)
        leftBelt.castShadow = true;
        leftBelt.receiveShadow = true;
        leftBelt.userData.direction = leftConveyorDirection;
        leftBelt.userData.textureOffset = 0;
        if (currentLevel >= 36 && currentLevel <= 45) {
            leftBelt.userData.textureDirectionMultiplier = -1; // Reverse texture direction for left conveyor in levels 36-45
        } else {
            leftBelt.userData.textureDirectionMultiplier = 1; // Normal texture direction
        }
        scene.add(leftBelt);
        conveyorBelts.push(leftBelt);

        const rightBeltGeometry = new THREE.PlaneGeometry(10, 38);
        const rightBelt = new THREE.Mesh(rightBeltGeometry, rightBeltMaterial);
        rightBelt.rotation.x = -Math.PI / 2;
        rightBelt.position.set(7.5, conveyorHeight, 1); // z=1 (z=-18 to z=20)
        rightBelt.castShadow = true;
        rightBelt.receiveShadow = true;
        rightBelt.userData.direction = rightConveyorDirection;
        rightBelt.userData.textureOffset = 0;
        rightBelt.userData.textureDirectionMultiplier = 1; // Normal texture direction
        scene.add(rightBelt);
        conveyorBelts.push(rightBelt);
    } else {
        const beltGeometry = new THREE.PlaneGeometry(20, 38);
        const conveyorBelt = new THREE.Mesh(beltGeometry, beltMaterial);
        conveyorBelt.rotation.x = -Math.PI / 2;
        conveyorBelt.position.set(0, conveyorHeight, 1);
        conveyorBelt.castShadow = true;
        conveyorBelt.receiveShadow = true;
        conveyorBelt.userData.direction = conveyorDirection;
        conveyorBelt.userData.textureOffset = 0;
        conveyorBelt.userData.textureDirectionMultiplier = 1; // Normal texture direction
        scene.add(conveyorBelt);
        conveyorBelts.push(conveyorBelt);
    }
}

function setupTroughs() {
    // Remove existing troughs
    troughs.forEach(trough => scene.remove(trough));
    troughs = [];

    if (currentLevel >= 26) {
        const troughGeometry = new THREE.BufferGeometry();
        const troughVertices = new Float32Array([
            -5, 0, -2,  5, 0, -2,  5, 0, 2,  -5, 0, 2,
            -5, 0, 2,  5, 0, 2,  5, 2, 2,  -5, 2, 2,
            -5, 0, -2,  5, 0, -2,  5, 2, -2,  -5, 2, -2,
            -5, 0, -2,  -5, 0, 2,  -5, 2, 2,  -5, 2, -2,
            5, 0, -2,  5, 0, 2,  5, 2, 2,  5, 2, -2
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

        const leftMinZ = (currentLevel >= 36 && currentLevel <= 45) ? -20 : -18;
        const leftMaxZ = (currentLevel >= 36 && currentLevel <= 45) ? 20 : 20;
        const leftTroughZ = leftConveyorDirection > 0 ? leftMaxZ : leftMinZ; // z=20 for direction=1 (levels 36-45), z=-18 otherwise
        const leftTrough = new THREE.Mesh(troughGeometry, troughMaterial);
        leftTrough.position.set(-7.5, 0.03, leftTroughZ);
        leftTrough.castShadow = true;
        leftTrough.receiveShadow = true;
        scene.add(leftTrough);
        troughs.push(leftTrough);

        const rightTroughZ = rightConveyorDirection > 0 ? 20 : -18; // Always -18 as rightConveyorDirection = -1
        const rightTrough = new THREE.Mesh(troughGeometry, troughMaterial);
        rightTrough.position.set(7.5, 0.03, rightTroughZ);
        rightTrough.castShadow = true;
        rightTrough.receiveShadow = true;
        scene.add(rightTrough);
        troughs.push(rightTrough);
    } else {
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

        const trough = new THREE.Mesh(troughGeometry, troughMaterial);
        trough.position.set(0, 0.03, -18);
        trough.castShadow = true;
        trough.receiveShadow = true;
        scene.add(trough);
        troughs.push(trough);
    }
}

// Particles for Sorting Effect
const particles = [];
const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);

// Items and Spawning
const items = [];
let spawnInterval;

// Updated shapes with XP values
const shapes = [
    { type: 'cube', geometry: new THREE.BoxGeometry(2.25, 2.25, 2.25), color: 0xff0000, needsSorting: true, weight: 0.49, radius: 1.125, xp: 1 },
    { type: 'triangle', geometry: new THREE.TetrahedronGeometry(1.5), color: 0x0000ff, needsSorting: true, weight: 0.49, radius: 0.75, xp: 4 },
    { type: 'sphere', geometry: new THREE.SphereGeometry(1.5, 32, 32), color: 0xffff00, needsSorting: true, weight: 0.49, radius: 1.5, xp: 2 },
    { type: 'cone', geometry: new THREE.ConeGeometry(1.5, 2, 32), color: 0x00ff00, needsSorting: true, weight: 0.49, radius: 1.5, xp: 3 },
    { type: 'powerUpSlow', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x800080, weight: 0.015, radius: 1, effect: 'slow', label: 'Slow Conveyor', xp: 0 },
    { type: 'powerUpSpeed', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ff00, weight: 0.015, radius: 1, effect: 'speed', label: 'Speed Boost', xp: 0 },
    { type: 'powerUpExtraLife', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xffa500, weight: 0.015, radius: 1, effect: 'extraLife', label: 'Extra Life', xp: 0 },
    { type: 'powerUpFreeze', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ffff, weight: 0.015, radius: 1, effect: 'freeze', label: 'Freeze', xp: 0 },
    { type: 'powerUpAutoSort', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x0000ff, weight: 0.015, radius: 1, effect: 'autoSort', label: 'Auto Sort', xp: 0 },
    { type: 'powerUpMagnet', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xff0000, weight: 0.015, radius: 1, effect: 'magnet', label: 'Magnet', xp: 0 },
    { type: 'powerUpSpeedSurge', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xff69b4, weight: 0.015, radius: 1, effect: 'speedSurge', label: 'Speed Surge', xp: 0 }
];

const xpPerShape = {
    'cube': 1,
    'triangle': 4,
    'sphere': 2,
    'cone': 3
};

function getOffset(shape) {
    if (!shape || !shape.type) {
        console.error('Invalid shape in getOffset', shape);
        return 0; // Default offset to prevent crash
    }
    if (shape.type === 'cube') return 1.125;
    if (shape.type === 'triangle') return 0.75;
    if (shape.type === 'sphere') return 1.5;
    if (shape.type === 'cone') return 1;
    if (shape.type.startsWith('powerUp')) return 1;
}

function createItem() {
    if (!shapes || shapes.length === 0) {
        console.error('Shapes array is undefined or empty');
        return;
    }

    const availableShapes = (currentLevel < 10) ? shapes.slice(0, 2) : 
                           (currentLevel < 16) ? shapes.slice(0, 3).concat(shapes.slice(4)) : 
                           shapes.slice(0, 4).concat(shapes.slice(4));
    const totalWeight = availableShapes.reduce((sum, shape) => sum + shape.weight, 0);
    let rand = Math.random() * totalWeight;
    let shape = availableShapes[availableShapes.length - 1]; // Fallback to last shape
    for (let i = 0; i < availableShapes.length; i++) {
        rand -= availableShapes[i].weight;
        if (rand <= 0) {
            shape = availableShapes[i];
            break;
        }
    }

    if (!shape) {
        console.error('No shape selected for spawning');
        return;
    }

    if (shape.effect) {
        console.log(`Spawned power-up: ${shape.type}`);
    }

    const material = new THREE.MeshPhongMaterial({ color: shape.color, shininess: 50 });
    if (shape.effect) {
        material.emissive.set(shape.color);
    }
    const item = new THREE.Mesh(shape.geometry, material);
    
    // Add outline
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const outlineMesh = new THREE.Mesh(shape.geometry, outlineMaterial);
    outlineMesh.scale.multiplyScalar(1.05);
    item.add(outlineMesh);
    
    let xPos;
    let isOverlapping;
    const maxAttempts = 10;

    let conveyorChoice;
    if (currentLevel >= 26) {
        conveyorChoice = Math.random() < 0.5 ? 'left' : 'right';
        let minZ, maxZ;
        if (conveyorChoice === 'left') {
            xPos = Math.random() * 10 - 12.5; // x = -12.5 to -2.5
            minZ = (currentLevel >= 36 && currentLevel <= 45) ? -20 : -18;
            maxZ = (currentLevel >= 36 && currentLevel <= 45) ? 20 : 20;
        } else {
            xPos = Math.random() * 10 + 2.5; // x = 2.5 to 12.5
            minZ = -18;
            maxZ = 20;
        }
        const direction = conveyorChoice === 'left' ? leftConveyorDirection : rightConveyorDirection;
        if (typeof direction === 'undefined') {
            console.error(`Conveyor direction undefined for ${conveyorChoice} conveyor`);
            return;
        }
        const spawnZ = direction > 0 ? minZ : maxZ;
        item.position.set(xPos, conveyorHeight + getOffset(shape), spawnZ);
        item.userData.conveyor = conveyorChoice;
        item.userData.direction = direction;
        item.userData.endZ = direction > 0 ? maxZ : minZ;
    } else {
        xPos = Math.random() * 12 - 6; // x = -6 to 6
        const minZ = -18;
        const maxZ = 20;
        const spawnZ = 20; // direction=-1
        item.position.set(xPos, conveyorHeight + getOffset(shape), spawnZ);
        item.userData.conveyor = 'center';
        item.userData.direction = conveyorDirection;
        item.userData.endZ = -18;
    }

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        isOverlapping = items.some(existing => {
            if (existing.userData.isDragging) return false;
            const dx = xPos - existing.position.x;
            const dz = item.position.z - existing.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            const existingRadius = existing.geometry.type === 'BoxGeometry' ? 1.125 :
                                  existing.geometry.type === 'TetrahedronGeometry' ? 0.75 :
                                  existing.geometry.type === 'ConeGeometry' ? 1.5 :
                                  existing.geometry.type === 'IcosahedronGeometry' ? 1 : 1.5;
            return distance < (shape.radius + existingRadius);
        });
        if (!isOverlapping) break;
        if (attempts === maxAttempts - 1) {
            console.warn('Max spawn attempts reached, item not spawned');
            return;
        }
        // Adjust xPos for next attempt
        xPos = currentLevel >= 26 ? 
               (conveyorChoice === 'left' ? Math.random() * 10 - 12.5 : Math.random() * 10 + 2.5) :
               Math.random() * 12 - 6;
    }
    
    item.castShadow = true;
    item.receiveShadow = true;
    item.userData.needsSorting = shape.needsSorting || false;
    item.userData.effect = shape.effect || null;
    item.userData.isPowerUp = shape.effect ? true : false;
    item.userData.type = shape.type;
    item.userData.xp = shape.xp;
    if (shape.effect) {
        const light = new THREE.PointLight(shape.color, 1, 5);
        item.add(light);
    }

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

    // Auto Sort logic
    if (autoSortCount > 0 && item.userData.needsSorting && window.bins && window.bins.length > 0) {
        const bin = window.bins.find(b => b.color === item.material.color.getHex());
        if (!bin) {
            console.warn(`No matching bin found for item color ${item.material.color.getHexString()}`);
            return;
        }
        item.position.copy(bin.mesh.position);
        item.position.y += 1.5;
        animatePowerUp(item, 'shrink', () => {
            createParticles(item.position, item.material.color);
            scene.remove(item);
            const index = items.indexOf(item);
            if (index !== -1) items.splice(index, 1);
            sortCount++;
            totalItemsSorted++;
            sessionItemsSorted++;
            levelItemsSorted++;
            if (item.userData.type === 'cube') {
                redCubesSorted++;
                shapeCounts.cube++;
                colorCounts[0xff0000]++;
                localStorage.setItem('redCubesSorted', redCubesSorted);
                localStorage.setItem('shape_cube', shapeCounts.cube);
                localStorage.setItem('color_red', colorCounts[0xff0000]);
                redCubesSortedThisLevel++;
                currentRedStreak++;
                if (currentRedStreak >= 5) unlockAchievement("five_red_in_row");
                currentBlueStreak = 0;
                if (redCubesSortedThisLevel >= 20) unlockAchievement("sort_20_red_in_level");
            } else if (item.userData.type === 'triangle') {
                blueTrianglesSorted++;
                shapeCounts.triangle++;
                colorCounts[0x0000ff]++;
                localStorage.setItem('blueTrianglesSorted', blueTrianglesSorted);
                localStorage.setItem('shape_triangle', shapeCounts.triangle);
                localStorage.setItem('color_blue', colorCounts[0x0000ff]);
                blueTrianglesSortedThisLevel++;
                currentBlueStreak++;
                if (currentBlueStreak >= 5) unlockAchievement("five_blue_in_row");
                currentRedStreak = 0;
                if (blueTrianglesSortedThisLevel >= 20) unlockAchievement("sort_20_blue_in_level");
            } else if (item.userData.type === 'sphere') {
                yellowSpheresSorted++;
                shapeCounts.sphere++;
                colorCounts[0xffff00]++;
                localStorage.setItem('yellowSpheresSorted', yellowSpheresSorted);
                localStorage.setItem('shape_sphere', shapeCounts.sphere);
                localStorage.setItem('color_yellow', colorCounts[0xffff00]);
                yellowSpheresSortedThisLevel++;
                if (yellowSpheresSortedThisLevel >= 20) unlockAchievement("sort_20_yellow_in_level");
            } else if (item.userData.type === 'cone') {
                greenConesSorted++;
                shapeCounts.cone++;
                colorCounts[0x00ff00]++;
                localStorage.setItem('greenConesSorted', greenConesSorted);
                localStorage.setItem('shape_cone', shapeCounts.cone);
                localStorage.setItem('color_green', colorCounts[0x00ff00]);
                greenConesSortedThisLevel++;
                if (greenConesSortedThisLevel >= 20) unlockAchievement("sort_20_green_in_level");
            }
            localStorage.setItem('totalItemsSorted', totalItemsSorted);
            checkSortingAchievements();
            neededCountDisplay.textContent = Math.min(sortCount, itemsNeeded);
            topSortedCountDisplay.textContent = Math.max(sortCount, topSortedPerLevel[currentLevel]);
            topSortedPerLevel[currentLevel] = Math.max(sortCount, topSortedPerLevel[currentLevel]);
            progressBar.style.width = `${Math.min((sortCount / itemsNeeded) * 100, 100)}%`;
            if (!isMutedSounds) {
                console.log('Playing success sound');
                successSound.play().catch(e => console.log('Error playing success sound:', e));
            }
            currentStreak++;
            if (currentStreak >= 10) unlockAchievement("combo_king");
            if (currentStreak >= 20) unlockAchievement("sort_20_in_row");
            if (currentStreak >= 50) unlockAchievement("sort_50_in_row");

            sortedShapesThisLevel.add(item.userData.type);
            const currentColor = item.material.color.getHex();
            if (currentColor === lastSortedColor) {
                consecutiveColorStreak++;
                if (consecutiveColorStreak >= 5) unlockAchievement("color_coordinator");
            } else {
                consecutiveColorStreak = 1;
                lastSortedColor = currentColor;
            }
            if (firstSortInLevel) {
                firstSortInLevel = false;
                unlockAchievement("lucky_sorter");
            }
            if (sortedShapesThisLevel.size >= 4) unlockAchievement("shape_shifter");
            const timeElapsed = (Date.now() - levelStartTime) / 1000;
            if (levelItemsSorted >= 20 && timeElapsed < 60) unlockAchievement("quick_sorter");
            if (sessionItemsSorted >= 100) unlockAchievement("marathon_sorter");
            for (const shape in shapeCounts) {
                if (shapeCounts[shape] >= 50) {
                    unlockAchievement("shape_specialist");
                    break;
                }
            }
            for (const color in colorCounts) {
                if (colorCounts[color] >= 50) {
                    unlockAchievement("color_specialist");
                    break;
                }
            }
            if (sortCount >= 10) unlockAchievement("sort_10_in_level");
            if (sortCount >= 100) unlockAchievement("sort_100_in_level");
            if (sortCount >= 1000) unlockAchievement("score_1000_in_level");

            // Award XP
            const xpGained = item.userData.xp || 0;
            xpTowardsNext += xpGained;
            while (xpTowardsNext >= 100 * playerLevel && playerLevel < 100) {
                xpTowardsNext -= 100 * playerLevel;
                playerLevel++;
                showNotification(`Leveled up to level ${playerLevel}!`);
            }
            if (playerLevel >= 100) {
                xpTowardsNext = 0;
            }
            localStorage.setItem('playerLevel', playerLevel);
            localStorage.setItem('xpTowardsNext', xpTowardsNext);
            playerLevelDisplay.textContent = `Level: ${playerLevel}`;
            if (playerLevel < 100) {
                xpDisplay.textContent = `XP: ${xpTowardsNext} / ${100 * playerLevel}`;
            } else {
                xpDisplay.textContent = 'XP: Max Level';
            }

            autoSortCount--;
            updatePowerUpStatus();
            if (sortCount >= itemsNeeded) {
                console.log('Condition met, showing end level button');
                const timeElapsed = (Date.now() - levelStartTime) / 1000;
                if (timeElapsed < 60) unlockAchievement("speed_runner");
                if (timeElapsed < 120) unlockAchievement("speed_demon");
                if (!mistakesMade) unlockAchievement("perfectionist");
                if (lives === 3) unlockAchievement("survivor");
                if (currentLevel === 10) unlockAchievement("level_conqueror");
                if (currentLevel === 45) unlockAchievement("master_sorter");
                if (currentLevel == 1 && lives == 3) unlockAchievement("level_1_no_lives_lost");
                if (lives == 3) {
                    consecutiveLevelsNoLivesLost++;
                    if (consecutiveLevelsNoLivesLost >= 3) unlockAchievement("three_levels_no_lives_lost");
                    if (consecutiveLevelsNoLivesLost >= 5) unlockAchievement("five_levels_no_lives_lost");
                } else {
                    consecutiveLevelsNoLivesLost = 0;
                }
                if (currentLevel == 10 && powerUpsUsedThisLevel.size == 0) unlockAchievement("level_10_no_powerups");
                if (lives == 1) unlockAchievement("complete_with_one_life");
                if (timeElapsed < 60) unlockAchievement("complete_level_under_1_min");
                if (currentLevel === 45 && levelsFailed === 0) unlockAchievement("all_levels_no_lives_lost");

                if (currentLevel < 45) {
                    levelUnlocks[currentLevel + 1] = true;
                    localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
                }
                endLevelButton.style.display = 'block';
                if (!isMutedSounds) {
                    console.log('Playing level success sound');
                    levelSuccessSound.play().catch(e => console.log('Error playing level success sound:', e));
                }
            }
        });
    }
}

function spawnPowerUp(type) {
    let shape;
    switch (type) {
        case 'slow':
            shape = { type: 'powerUpSlow', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x800080, radius: 1, effect: 'slow', label: 'Slow Conveyor', xp: 0 };
            break;
        case 'speed':
            shape = { type: 'powerUpSpeed', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ff00, radius: 1, effect: 'speed', label: 'Speed Boost', xp: 0 };
            break;
        case 'extraLife':
            shape = { type: 'powerUpExtraLife', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xffa500, radius: 1, effect: 'extraLife', label: 'Extra Life', xp: 0 };
            break;
        case 'freeze':
            shape = { type: 'powerUpFreeze', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x00ffff, radius: 1, effect: 'freeze', label: 'Freeze', xp: 0 };
            break;
        case 'autoSort':
            shape = { type: 'powerUpAutoSort', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0x0000ff, radius: 1, effect: 'autoSort', label: 'Auto Sort', xp: 0 };
            break;
        case 'magnet':
            shape = { type: 'powerUpMagnet', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xff0000, radius: 1, effect: 'magnet', label: 'Magnet', xp: 0 };
            break;
        case 'speedSurge':
            shape = { type: 'powerUpSpeedSurge', geometry: new THREE.IcosahedronGeometry(1, 1), color: 0xff69b4, radius: 1, effect: 'speedSurge', label: 'Speed Surge', xp: 0 };
            break;
        default:
            return;
    }
    const material = new THREE.MeshPhongMaterial({ color: shape.color, shininess: 50 });
    material.emissive.set(shape.color);
    const item = new THREE.Mesh(shape.geometry, material);
    
    let xPos;
    if (currentLevel >= 26) {
        const conveyorChoice = Math.random() < 0.5 ? 'left' : 'right';
        if (conveyorChoice === 'left') {
            xPos = Math.random() * 10 - 12.5; // x = -12.5 to -2.5
        } else {
            xPos = Math.random() * 10 + 2.5; // x = 2.5 to 12.5
        }
    } else {
        xPos = Math.random() * 12 - 6; // x = -6 to 6
    }
    const offset = getOffset(shape);
    item.position.set(xPos, conveyorHeight + offset, 20); // Default spawn at z=20
    item.castShadow = true;
    item.receiveShadow = true;
    item.userData.effect = shape.effect;
    item.userData.isPowerUp = true;
    item.userData.type = shape.type;
    item.userData.xp = shape.xp;
    const light = new THREE.PointLight(shape.color, 1, 5);
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
    let displayLines = [];
    if (activePowerUps.length > 0) {
        activePowerUps.forEach(powerUp => {
            if (powerUp.effect === 'slow') {
                displayLines.push(`Slow: ${Math.ceil(powerUp.timer)}s`);
            } else if (powerUp.effect === 'speed') {
                displayLines.push(`Speed Boost: ${Math.ceil(powerUp.timer)}s`);
            } else if (powerUp.effect === 'freeze') {
                displayLines.push(`Freeze: ${Math.ceil(powerUp.timer)}s`);
            } else if (powerUp.effect === 'magnet') {
                displayLines.push(`Magnet: ${Math.ceil(powerUp.timer)}s`);
            } else if (powerUp.effect === 'speedSurge') {
                displayLines.push(`Speed Surge: ${Math.ceil(powerUp.timer)}s`);
            }
        });
    }
    if (autoSortCount > 0) {
        displayLines.push(`Auto Sort: ${autoSortCount} items`);
    }
    if (displayLines.length > 0) {
        powerUpStatus.style.display = 'block';
        displayLines.forEach((line, index) => {
            const powerUpLine = document.createElement('div');
            powerUpLine.textContent = line;
            powerUpLine.style.marginTop = `${index * 20}px`;
            powerUpStatus.appendChild(powerUpLine);
        });
    } else {
        powerUpStatus.style.display = 'none';
    }
}

function updatePowerUpCounts() {
    document.querySelectorAll('.power-up-count').forEach(span => {
        const type = span.getAttribute('data-type');
        span.textContent = savedPowerUps[type];
    });
}

function updatePlayerPowerUpMenu() {
    document.getElementById('use-slow-count').textContent = savedPowerUps.slow;
    document.getElementById('use-slow').disabled = savedPowerUps.slow <= 0;
    document.getElementById('use-speed-count').textContent = savedPowerUps.speed;
    document.getElementById('use-speed').disabled = savedPowerUps.speed <= 0;
    document.getElementById('use-extraLife-count').textContent = savedPowerUps.extraLife;
    document.getElementById('use-extraLife').disabled = savedPowerUps.extraLife <= 0;
    document.getElementById('use-freeze-count').textContent = savedPowerUps.freeze;
    document.getElementById('use-freeze').disabled = savedPowerUps.freeze <= 0;
    document.getElementById('use-autoSort-count').textContent = savedPowerUps.autoSort;
    document.getElementById('use-autoSort').disabled = savedPowerUps.autoSort <= 0;
    document.getElementById('use-magnet-count').textContent = savedPowerUps.magnet;
    document.getElementById('use-magnet').disabled = savedPowerUps.magnet <= 0;
    document.getElementById('use-speedSurge-count').textContent = savedPowerUps.speedSurge;
    document.getElementById('use-speedSurge').disabled = savedPowerUps.speedSurge <= 0;
}

function startSpawning() {
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    let currentSpawnInterval = baseSpawnInterval;
    if (activePowerUps.some(p => p.effect === 'speedSurge')) {
        currentSpawnInterval /= 3; // 3x spawn rate
    }
    spawnInterval = setInterval(() => {
        if (!isPaused) createItem();
    }, currentSpawnInterval);
}

// Sorting Bins
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
    10, 9, 8,  11, 10, 8,
    12, 13, 14, 12, 14, 15,
    18, 17, 16, 19, 18, 16
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
            bins[0].mesh.scale.set(1.1, 1.1, 1.1);
            bins[1].mesh.scale.set(1.1, 1.1, 1.1);

            if (currentLevel >= 10) {
                const bin3 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0xffff00, map: texture, shininess: 30, depthTest: true, depthWrite: true }));
                bin3.scale.set(1.1, 1.1, 1.1);
                bins.push({ color: 0xffff00, mesh: bin3 });
            }

            if (currentLevel >= 16) {
                const bin4 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0x00ff00, map: texture, shininess: 30, depthTest: true, depthWrite: true }));
                bin4.scale.set(1.1, 1.1, 1.1);
                bins.push({ color: 0x00ff00, mesh: bin4 });
            }

            if (currentLevel >= 26) {
                bins[0].mesh.position.set(-15, 0.1, 0); // Red
                bins[1].mesh.position.set(-15, 0.1, 4); // Blue
                if (currentLevel >= 10) {
                    bins[2].mesh.position.set(15, 0.1, 0); // Yellow
                }
                if (currentLevel >= 16) {
                    bins[3].mesh.position.set(15, 0.1, 4); // Green
                }
            } else {
                bins[0].mesh.position.set(-12, 0.1, 0);
                bins[1].mesh.position.set(12, 0.1, 0);
                if (currentLevel >= 10) {
                    bins[2].mesh.position.set(12, 0.1, 4);
                }
                if (currentLevel >= 16) {
                    bins[3].mesh.position.set(-12, 0.1, 4);
                }
            }

            bins.forEach(bin => {
                bin.mesh.castShadow = true;
                bin.mesh.receiveShadow = true;
                scene.add(bin.mesh);
                
                // Permanent outline
                const permanentOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
                const permanentOutlineMesh = new THREE.Mesh(binGeometry, permanentOutlineMaterial);
                permanentOutlineMesh.scale.multiplyScalar(1.05);
                bin.mesh.add(permanentOutlineMesh);
                bin.permanentOutline = permanentOutlineMesh;
                
                // Highlight outline
                const highlightOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
                const highlightOutlineMesh = new THREE.Mesh(binGeometry, highlightOutlineMaterial);
                highlightOutlineMesh.scale.set(1.1, 1.1, 1.1);
                bin.mesh.add(highlightOutlineMesh);
                bin.highlightOutline = highlightOutlineMesh;
                bin.highlightOutline.visible = false;
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
            bins[0].mesh.scale.set(1.1, 1.1, 1.1);
            bins[1].mesh.scale.set(1.1, 1.1, 1.1);

            if (currentLevel >= 10) {
                const bin3 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0xffff00, shininess: 30, depthTest: true, depthWrite: true }));
                bin3.scale.set(1.1, 1.1, 1.1);
                bins.push({ color: 0xffff00, mesh: bin3 });
            }

            if (currentLevel >= 16) {
                const bin4 = new THREE.Mesh(binGeometry, new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 30, depthTest: true, depthWrite: true }));
                bin4.scale.set(1.1, 1.1, 1.1);
                bins.push({ color: 0x00ff00, mesh: bin4 });
            }

            if (currentLevel >= 26) {
                bins[0].mesh.position.set(-15, 0.1, 0);
                bins[1].mesh.position.set(-15, 0.1, 4);
                if (currentLevel >= 10) {
                    bins[2].mesh.position.set(15, 0.1, 0);
                }
                if (currentLevel >= 16) {
                    bins[3].mesh.position.set(15, 0.1, 4);
                }
            } else {
                bins[0].mesh.position.set(-12, 0.1, 0);
                bins[1].mesh.position.set(12, 0.1, 0);
                if (currentLevel >= 10) {
                    bins[2].mesh.position.set(12, 0.1, 4);
                }
                if (currentLevel >= 16) {
                    bins[3].mesh.position.set(-12, 0.1, 4);
                }
            }

            bins.forEach(bin => {
                bin.mesh.castShadow = true;
                bin.mesh.receiveShadow = true;
                scene.add(bin.mesh);
                
                // Permanent outline
                const permanentOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
                const permanentOutlineMesh = new THREE.Mesh(binGeometry, permanentOutlineMaterial);
                permanentOutlineMesh.scale.multiplyScalar(1.05);
                bin.mesh.add(permanentOutlineMesh);
                bin.permanentOutline = permanentOutlineMesh;
                
                // Highlight outline
                const highlightOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
                const highlightOutlineMesh = new THREE.Mesh(binGeometry, highlightOutlineMaterial);
                highlightOutlineMesh.scale.set(1.1, 1.1, 1.1);
                bin.mesh.add(highlightOutlineMesh);
                bin.highlightOutline = highlightOutlineMesh;
                bin.highlightOutline.visible = false;
            });
            window.bins = bins;
        }
    );
}

// Dragging Setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedItem = null;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -conveyorHeight);

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
// Game State
let lives = 3;
let sortCount = 0;
let totalItemsSorted = parseInt(localStorage.getItem('totalItemsSorted')) || 0;
let redCubesSorted = parseInt(localStorage.getItem('redCubesSorted')) || 0;
let blueTrianglesSorted = parseInt(localStorage.getItem('blueTrianglesSorted')) || 0;
let yellowSpheresSorted = parseInt(localStorage.getItem('yellowSpheresSorted')) || 0;
let greenConesSorted = parseInt(localStorage.getItem('greenConesSorted')) || 0;
let levelsFailed = parseInt(localStorage.getItem('levelsFailed')) || 0;
let totalLevelsPassed = parseInt(localStorage.getItem('totalLevelsPassed')) || 0;
let totalPlayTime = parseFloat(localStorage.getItem('totalPlayTime')) || 0; // in seconds
let playerLevel = parseInt(localStorage.getItem('playerLevel')) || 1;
let xpTowardsNext = parseInt(localStorage.getItem('xpTowardsNext')) || 0;
let topSortedPerLevel = { 
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 
    6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 
    11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
    16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
    21: 0, 22: 0, 23: 0, 24: 0, 25: 0,
    26: 0, 27: 0, 28: 0, 29: 0, 30: 0,
    31: 0, 32: 0, 33: 0, 34: 0, 35: 0,
    36: 0, 37: 0, 38: 0, 39: 0, 40: 0,
    41: 0, 42: 0, 43: 0, 44: 0, 45: 0
};
let isPaused = false;
let isMutedSounds = localStorage.getItem('isMutedSounds') === 'true';
let isMutedMusic = localStorage.getItem('isMutedMusic') === 'true';
let soundVolume = parseFloat(localStorage.getItem('soundVolume')) || 1;
let musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 1;
let levelStartTime = null;
let mistakesMade = false;
let currentStreak = 0;

let sortedShapesThisLevel = new Set();
let consecutiveColorStreak = 0;
let lastSortedColor = null;
let sessionStartTime = Date.now();
let sessionItemsSorted = 0;
let shapeCounts = {
    cube: parseInt(localStorage.getItem('shape_cube')) || 0,
    triangle: parseInt(localStorage.getItem('shape_triangle')) || 0,
    sphere: parseInt(localStorage.getItem('shape_sphere')) || 0,
    cone: parseInt(localStorage.getItem('shape_cone')) || 0
};
let colorCounts = {
    0xff0000: parseInt(localStorage.getItem('color_red')) || 0,
    0x0000ff: parseInt(localStorage.getItem('color_blue')) || 0,
    0xffff00: parseInt(localStorage.getItem('color_yellow')) || 0,
    0x00ff00: parseInt(localStorage.getItem('color_green')) || 0
};
let firstSortInLevel = true;
let powerUpsUsedThisLevel = new Set();
let totalPowerUpsCollected = parseInt(localStorage.getItem('totalPowerUpsCollected')) || 0;
let powerUpsUsed = JSON.parse(localStorage.getItem('powerUpsUsed')) || {
    slow: false,
    speed: false,
    extraLife: false,
    freeze: false,
    autoSort: false,
    magnet: false,
    speedSurge: false
};
let levelItemsSorted = 0;

let username = localStorage.getItem('username') || 'Player';

// NEW: Added variables for new achievements
let currentRedStreak = 0;
let currentBlueStreak = 0;
let consecutiveLevelsNoLivesLost = 0;
let powerUpsSortedThisLevel = 0;
let redCubesSortedThisLevel = 0;
let blueTrianglesSortedThisLevel = 0;
let yellowSpheresSortedThisLevel = 0;
let greenConesSortedThisLevel = 0;

// NEW: Variables for new power-ups
let autoSortCount = 0; // Tracks remaining auto-sorts
let magnetPosition = null; // Tracks cursor position for magnet effect

let savedPowerUps = JSON.parse(localStorage.getItem('savedPowerUps')) || {
    slow: 0,
    speed: 0,
    extraLife: 0,
    freeze: 0,
    autoSort: 0,
    magnet: 0,
    speedSurge: 0
};

let levelUnlocks = JSON.parse(localStorage.getItem('levelUnlocks')) || {};
for (let i = 2; i <= 45; i++) {
    if (!(i in levelUnlocks)) {
        levelUnlocks[i] = false;
    }
}

let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || {};

let currentLevel = 1;
let itemsNeeded = 15;
let conveyorSpeed = 0.02;
let baseConveyorSpeed = 0.02;
let baseSpawnInterval = 1500; // Base spawn interval in milliseconds
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
const playerLevelDisplay = document.getElementById('player-level-display');
const xpDisplay = document.getElementById('xp-display');
const topPlayerNameDisplay = document.getElementById('top-player-name');
const topPlayerScoreDisplay = document.getElementById('top-player-score');
const playerPowerUpMenu = document.getElementById('player-power-up-menu');

const startScreen = document.getElementById('start-screen');
const levelStartScreen = document.getElementById('level-start-screen');
const levelSelectScreen = document.getElementById('level-select-screen');
const levelSelectPage2 = document.getElementById('level-select-page-2');
const levelSelectPage3 = document.getElementById('level-select-page-3');
const levelSelectPage4 = document.getElementById('level-select-page-4');
const levelSelectPage5 = document.getElementById('level-select-page-5');
const levelSelectPage6 = document.getElementById('level-select-page-6');
const gameUI = document.getElementById('game-ui');
const pauseScreen = document.getElementById('pause-screen');
const settingsScreen = document.getElementById('settings-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const statsScreen = document.getElementById('stats-screen');
const achievementsScreen = document.getElementById('achievements-screen');
const devToolsButton = document.getElementById('dev-tools-button');
const devToolsBubble = document.getElementById('dev-tools-bubble');
const powerUpMenu = document.getElementById('power-up-menu');
const pauseResumeButton = document.getElementById('pause-resume-button');
const totalSortedDisplay = document.getElementById('total-sorted');
const redSortedDisplay = document.getElementById('red-sorted');
const blueSortedDisplay = document.getElementById('blue-sorted');
const yellowSortedDisplay = document.getElementById('yellow-sorted');
const greenSortedDisplay = document.getElementById('green-sorted');
const levelsFailedDisplay = document.getElementById('levels-failed');
const totalHoursPlayedDisplay = document.getElementById('total-hours-played');
const achievementsList = document.getElementById('achievements-list');

const powerUpsScreen = document.getElementById('power-ups-screen');
const updatesScreen = document.getElementById('updates-screen');

const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const leaderboardList = document.getElementById('leaderboard-list');
const backToStartFromLeaderboard = document.getElementById('back-to-start-from-leaderboard');
const selectedLevelNumberDisplay = document.getElementById('selected-level-number');
console.log('selectedLevelNumberDisplay:', selectedLevelNumberDisplay);

//idk 
let selectedLevel = 1; // Default to Level 1

// NEW: Variable to track the previous screen before opening settings
let previousScreen = null;

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
greenSortedDisplay.textContent = greenConesSorted;
levelsFailedDisplay.textContent = levelsFailed;
totalHoursPlayedDisplay.textContent = (totalPlayTime / 3600).toFixed(2); // Updated to 2 decimal places

// New Function: Update Level Buttons
function updateLevelButtons() {
    for (let i = 2; i <= 90; i++) { // Changed from 75 to 90 to cover all HTML buttons
        const button = document.getElementById(`level-${i}-button`);
        if (button) {
            if (i <= 45) {
                if (levelUnlocks[i]) {
                    button.textContent = `Level ${i}`;
                    button.disabled = false;
                } else {
                    button.textContent = `Level ${i} (Locked)`;
                    button.disabled = true;
                }
            } else {
                button.textContent = `Level ${i} (Coming Soon)`;
                button.disabled = true;
            }
        }
    }
}

// Call updateLevelButtons initially to set the correct states
updateLevelButtons();

// Initialize level buttons (this block is now redundant due to updateLevelButtons, but kept for consistency)
for (let i = 2; i <= 60; i++) {
    const button = document.getElementById(`level-${i}-button`);
    if (button) {
        if (levelUnlocks[i]) {
            button.textContent = `Level ${i}`;
            button.disabled = false;
        } else {
            button.textContent = i <= 15 ? `Level ${i} (Locked)` : `Level ${i} (Coming Soon)`;
            button.disabled = true;
        }
    }
}

// Power-Ups 3D Functions
function initPowerUps3D() {
    const powerUps3DContainer = document.getElementById('power-ups-3d');
    const width = powerUps3DContainer.clientWidth;
    const height = powerUps3DContainer.clientHeight;
    
    powerUpsScene = new THREE.Scene();
    powerUpsCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    powerUpsRenderer = new THREE.WebGLRenderer({ antialias: true });
    powerUpsRenderer.setSize(width, height);
    powerUps3DContainer.appendChild(powerUpsRenderer.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    powerUpsScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    powerUpsScene.add(directionalLight);
    
    // Add power-up models
    const powerUpTypes = [
        { color: 0x800080, label: 'Slow Conveyor' },
        { color: 0x00ff00, label: 'Speed Boost' },
        { color: 0xffa500, label: 'Extra Life' },
        { color: 0x00ffff, label: 'Freeze' },
        { color: 0x0000ff, label: 'Auto Sort' },
        { color: 0xff0000, label: 'Magnet' },
        { color: 0xff69b4, label: 'Speed Surge' }
    ];
    
    powerUpTypes.forEach((type, index) => {
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshPhongMaterial({ color: type.color, shininess: 50 });
        const powerUp = new THREE.Mesh(geometry, material);
        powerUp.position.set((index - 3) * 2.5, 0, 0); // Adjusted to center 7 power-ups
        powerUpsScene.add(powerUp);
    });
    
    powerUpsCamera.position.set(0, 0, 10);
    powerUpsCamera.lookAt(0, 0, 0);
}

function animatePowerUps() {
    if (isPowerUpsAnimating) {
        requestAnimationFrame(animatePowerUps);
        
        // Rotate the power-ups for visual effect
        powerUpsScene.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                child.rotation.y += 0.01;
            }
        });
        
        powerUpsRenderer.render(powerUpsScene, powerUpsCamera);
    }
}

function addButtonListeners(elementId, action) {
    const element = document.getElementById(elementId);
    element.addEventListener('click', (event) => {
        event.preventDefault();
        action(event);
    });
    element.addEventListener('touchend', (event) => {
        event.preventDefault();
        action(event);
    }, { passive: false });
}

addButtonListeners('start-button', () => {
    console.log('Start button clicked/touched');
    console.log('selectedLevelNumberDisplay:', selectedLevelNumberDisplay);
    selectedLevelNumberDisplay.textContent = selectedLevel; // Replace selectedLevel with your level variable
    startScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

addButtonListeners('level-select-button', () => {
    console.log('Level select button clicked/touched');
    startScreen.style.display = 'none';
    levelSelectScreen.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing level select screen
});

addButtonListeners('level-1-button', () => {
    console.log('Level 1 button clicked/touched');
    selectedLevel = 1;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    levelSelectScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

addButtonListeners('updates-button', () => {
    console.log('Updates button clicked/touched');
    startScreen.style.display = 'none';
    updatesScreen.style.display = 'block';
});

addButtonListeners('back-to-start-from-updates', () => {
    console.log('Back to start from updates clicked/touched');
    updatesScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

for (let i = 2; i <= 45; i++) { // Changed from 60 to 45
    addButtonListeners(`level-${i}-button`, () => {
        if (levelUnlocks[i]) {
            console.log(`Level ${i} button clicked/touched`);
            selectedLevel = i;
            selectedLevelNumberDisplay.textContent = selectedLevel;
            if (i <= 15) {
                levelSelectScreen.style.display = 'none';
            } else if (i <= 30) {
                levelSelectPage2.style.display = 'none';
            } else if (i <= 45) {
                levelSelectPage3.style.display = 'none';
            }
            levelStartScreen.style.display = 'block';
        }
    });
}

addButtonListeners('back-to-start', () => {
    console.log('Back to start from level select clicked/touched');
    levelSelectScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('next-page-button', () => {
    console.log('Next page button clicked/touched');
    levelSelectScreen.style.display = 'none';
    levelSelectPage2.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 2
});

addButtonListeners('prev-page-button', () => {
    console.log('Previous page button clicked/touched');
    levelSelectPage2.style.display = 'none';
    levelSelectScreen.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 1
});

addButtonListeners('next-page-button-page-2', () => {
    console.log('Next page from page 2 clicked/touched');
    levelSelectPage2.style.display = 'none';
    levelSelectPage3.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 3
});

addButtonListeners('prev-page-button-page-3', () => {
    console.log('Previous page from page 3 clicked/touched');
    levelSelectPage3.style.display = 'none';
    levelSelectPage2.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 2
});

addButtonListeners('next-page-button-page-3', () => {
    console.log('Next page from page 3 clicked/touched');
    levelSelectPage3.style.display = 'none';
    levelSelectPage4.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 4
});

addButtonListeners('prev-page-button-page-4', () => {
    console.log('Previous page from page 4 clicked/touched');
    levelSelectPage4.style.display = 'none';
    levelSelectPage3.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 3
});

addButtonListeners('back-to-start-page-2', () => {
    console.log('Back to start from page 2 clicked/touched');
    levelSelectPage2.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('back-to-start-page-3', () => {
    console.log('Back to start from page 3 clicked/touched');
    levelSelectPage3.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('back-to-start-page-4', () => {
    console.log('Back to start from page 4 clicked/touched');
    levelSelectPage4.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('instructions-button', () => {
    console.log('Instructions button clicked/touched');
    startScreen.style.display = 'none';
    instructionsScreen.style.display = 'block';
});

addButtonListeners('back-instructions', () => {
    console.log('Back from instructions clicked/touched');
    instructionsScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('power-ups-button', () => {
    console.log('Power-Ups button clicked/touched');
    startScreen.style.display = 'none';
    powerUpsScreen.style.display = 'block';
    updatePowerUpCounts();
    initPowerUps3D();
    isPowerUpsAnimating = true;
    animatePowerUps();
});

addButtonListeners('back-power-ups', () => {
    console.log('Back from power-ups clicked/touched');
    powerUpsScreen.style.display = 'none';
    startScreen.style.display = 'block';
    isPowerUpsAnimating = false;
    // Clean up
    if (powerUpsRenderer) {
        powerUpsRenderer.domElement.remove();
        powerUpsRenderer = null;
    }
    powerUpsScene = null;
    powerUpsCamera = null;
});

addButtonListeners('stats-button', () => {
    console.log('Stats button clicked/touched');
    startScreen.style.display = 'none';
    statsScreen.style.display = 'block';
    totalSortedDisplay.textContent = totalItemsSorted;
    redSortedDisplay.textContent = redCubesSorted;
    blueSortedDisplay.textContent = blueTrianglesSorted;
    yellowSortedDisplay.textContent = yellowSpheresSorted;
    greenSortedDisplay.textContent = greenConesSorted;
    levelsFailedDisplay.textContent = levelsFailed;
    totalHoursPlayedDisplay.textContent = (totalPlayTime / 3600).toFixed(2); // Updated to 2 decimal places
    document.getElementById('player-level').textContent = playerLevel;
    if (playerLevel < 100) {
        document.getElementById('xp-to-next').textContent = `${xpTowardsNext} / ${100 * playerLevel}`;
    } else {
        document.getElementById('xp-to-next').textContent = 'Max Level';
    }
});

addButtonListeners('achievements-button', () => {
    console.log('Achievements button clicked/touched');
    startScreen.style.display = 'none';
    achievementsScreen.style.display = 'block';
    updateAchievementsList();
});

addButtonListeners('back-to-start-from-stats', () => {
    console.log('Back to start from stats clicked/touched');
    statsScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('back-to-start-from-achievements', () => {
    console.log('Back to start from achievements clicked/touched');
    achievementsScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('pause-resume-button', () => {
    console.log('Pause/resume button clicked/touched');
    togglePause();
});

addButtonListeners('resume-button', () => {
    console.log('Resume button clicked/touched');
    togglePause();
});

addButtonListeners('back-to-start-pause', () => {
    console.log('Back to start from pause clicked/touched');
    pauseScreen.style.display = 'none';
    gameUI.style.display = 'none';
    startScreen.style.display = 'block';
    cleanupGame();
});

addButtonListeners('restart-from-game-over', () => {
    console.log('Restart from game over clicked/touched');
    selectedLevel = currentLevel;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    gameOverScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

addButtonListeners('back-to-start-from-game-over', () => {
    console.log('Back to start from game over clicked/touched');
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('start-next-level', () => {
    console.log('Start next level clicked/touched');
    selectedLevel = currentLevel + 1;
    selectedLevelNumberDisplay.textContent = selectedLevel;
    levelCompleteScreen.style.display = 'none';
    levelStartScreen.style.display = 'block';
});

addButtonListeners('back-to-level-select', () => {
    console.log('Back to level select clicked/touched');
    levelCompleteScreen.style.display = 'none';
    if (currentLevel <= 15) {
        levelSelectScreen.style.display = 'block';
    } else if (currentLevel <= 30) {
        levelSelectPage2.style.display = 'block';
    } else if (currentLevel <= 45) {
        levelSelectPage3.style.display = 'block';
    } else {
        levelSelectPage4.style.display = 'block';
    }
    updateLevelButtons(); // Update buttons when returning to level select
});

// NEW: Updated to set previousScreen
addButtonListeners('settings-from-level-complete', () => {
    console.log('Settings from level complete clicked/touched');
    previousScreen = 'level-complete';
    levelCompleteScreen.style.display = 'none';
    showSettings();
});

addButtonListeners('end-level-button', () => {
    console.log('End Level button clicked');
    if (currentLevel % 5 === 0) {
        for (let type in savedPowerUps) {
            savedPowerUps[type]++;
        }
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        showNotification('Earned one of each power-up!');
    }
    gameUI.style.display = 'none';
    levelCompleteScreen.style.display = 'block';
    levelCompleteSortCount.textContent = sortCount;
    completedLevelDisplay.textContent = currentLevel;
    nextLevelDisplay.textContent = currentLevel + 1;
    sendLevelDataToSheetDB(currentLevel, sortCount);
    cleanupGame();
});

// NEW: Updated to set previousScreen
addButtonListeners('settings-button-start', () => {
    console.log('Settings from start clicked/touched');
    previousScreen = 'start';
    startScreen.style.display = 'none';
    showSettings();
});

// Settings Handlers
const muteSoundsCheckbox = document.getElementById('mute-sounds');
const muteMusicCheckbox = document.getElementById('mute-music');

function updateMuteSounds() {
    isMutedSounds = muteSoundsCheckbox.checked;
    localStorage.setItem('isMutedSounds', isMutedSounds.toString());
    successSound.muted = isMutedSounds;
    failSound.muted = isMutedSounds;
    levelSuccessSound.muted = isMutedSounds;
    console.log('mute-sounds updated to', isMutedSounds);
}

function updateMuteMusic() {
    isMutedMusic = muteMusicCheckbox.checked;
    localStorage.setItem('isMutedMusic', isMutedMusic.toString());
    gameMusic.muted = isMutedMusic;
    if (isMutedMusic) {
        gameMusic.pause();
    } else if (gameUI.style.display === 'block' && !isPaused) {
        gameMusic.play().catch(e => console.log('Error playing game music:', e));
    }
    console.log('mute-music updated to', isMutedMusic);
}

muteSoundsCheckbox.addEventListener('change', updateMuteSounds);
muteSoundsCheckbox.addEventListener('click', updateMuteSounds);

muteMusicCheckbox.addEventListener('change', updateMuteMusic);
muteMusicCheckbox.addEventListener('click', updateMuteMusic);

document.getElementById('sounds-volume').addEventListener('input', () => {
    soundVolume = parseFloat(document.getElementById('sounds-volume').value);
    localStorage.setItem('soundVolume', soundVolume);
    successSound.volume = soundVolume;
    failSound.volume = soundVolume;
    levelSuccessSound.volume = soundVolume;
});

document.getElementById('music-volume').addEventListener('input', () => {
    musicVolume = parseFloat(document.getElementById('music-volume').value);
    localStorage.setItem('musicVolume', musicVolume);
    gameMusic.volume = musicVolume;
});

addButtonListeners('close-settings', () => {
    console.log('Close settings clicked/touched');
    settingsScreen.style.display = 'none';
    if (previousScreen === 'start') {
        startScreen.style.display = 'block';
    } else if (previousScreen === 'pause') {
        pauseScreen.style.display = 'block';
    } else if (previousScreen === 'level-complete') {
        levelCompleteScreen.style.display = 'block';
    } else if (gameUI.style.display === 'block') {
        pauseScreen.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
});

addButtonListeners('settings-button-pause', () => {
    console.log('Settings from pause clicked/touched');
    previousScreen = 'pause';
    pauseScreen.style.display = 'none';
    showSettings();
});

addButtonListeners('reset-game-data', () => {
    console.log('Reset game data clicked/touched');
    if (confirm('Are you sure you want to reset all game data? This action cannot be undone.')) {
        localStorage.clear();
        isMutedSounds = false;
        isMutedMusic = false;
        soundVolume = 1;
        musicVolume = 1;
        successSound.muted = false;
        failSound.muted = false;
        levelSuccessSound.muted = false;
        gameMusic.muted = false;
        successSound.volume = 1;
        failSound.volume = 1;
        levelSuccessSound.volume = 1;
        gameMusic.volume = 1;
        totalItemsSorted = 0;
        redCubesSorted = 0;
        blueTrianglesSorted = 0;
        yellowSpheresSorted = 0;
        greenConesSorted = 0;
        levelsFailed = 0;
        totalPlayTime = 0;
        playerLevel = 1;
        xpTowardsNext = 0;
        levelUnlocks = {};
        for (let i = 2; i <= 45; i++) {
            levelUnlocks[i] = false;
        }
        unlockedAchievements = {};
        localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));

        shapeCounts = { cube: 0, triangle: 0, sphere: 0, cone: 0 };
        colorCounts = { 0xff0000: 0, 0x0000ff: 0, 0xffff00: 0, 0x00ff00: 0 };
        totalPowerUpsCollected = 0;
        powerUpsUsed = { slow: false, speed: false, extraLife: false, freeze: false };
        localStorage.setItem('shape_cube', 0);
        localStorage.setItem('shape_triangle', 0);
        localStorage.setItem('shape_sphere', 0);
        localStorage.setItem('shape_cone', 0);
        localStorage.setItem('color_red', 0);
        localStorage.setItem('color_blue', 0);
        localStorage.setItem('color_yellow', 0);
        localStorage.setItem('color_green', 0);
        localStorage.setItem('totalPowerUpsCollected', 0);
        localStorage.setItem('powerUpsUsed', JSON.stringify(powerUpsUsed));

        for (let i = 2; i <= 75; i++) { // Changed from 60 to 75
            const button = document.getElementById(`level-${i}-button`);
            if (button) {
                if (i <= 45) {
                    button.textContent = `Level ${i} (Locked)`;
                    button.disabled = true;
                } else {
                    button.textContent = `Level ${i} (Coming Soon)`;
                    button.disabled = true;
                }
            }
        }
        totalSortedDisplay.textContent = totalItemsSorted;
        redSortedDisplay.textContent = redCubesSorted;
        blueSortedDisplay.textContent = blueTrianglesSorted;
        yellowSortedDisplay.textContent = yellowSpheresSorted;
        greenSortedDisplay.textContent = greenConesSorted;
        levelsFailedDisplay.textContent = levelsFailed;
        totalHoursPlayedDisplay.textContent = (totalPlayTime / 3600).toFixed(2); // Updated to 2 decimal places
        updateAchievementsList();

        topSortedPerLevel = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
            6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
            11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
            16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
            21: 0, 22: 0, 23: 0, 24: 0, 25: 0,
            26: 0, 27: 0, 28: 0, 29: 0, 30: 0,
            31: 0, 32: 0, 33: 0, 34: 0, 35: 0,
            36: 0, 37: 0, 38: 0, 39: 0, 40: 0,
            41: 0, 42: 0, 43: 0, 44: 0, 45: 0
        };

        alert('Game data has been reset.');
    }
});

addButtonListeners('dev-tools-button', () => {
    console.log('Dev tools button clicked/touched');
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

addButtonListeners('unlock-all-button', () => {
    console.log('Unlock all button clicked/touched');
    for (let i = 2; i <= 45; i++) { // Changed from 60 to 45
        levelUnlocks[i] = true;
        const button = document.getElementById(`level-${i}-button`);
        if (button) {
            button.textContent = `Level ${i}`;
            button.disabled = false;
        }
    }
    localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
    console.log('All levels unlocked');
    showNotification('All levels have been unlocked!');
});

addButtonListeners('spawn-power-up-button', () => {
    console.log('Spawn power-up button clicked/touched');
    devToolsBubble.style.display = 'none';
    powerUpMenu.style.display = 'block';
});

addButtonListeners('spawn-slow-conveyor', () => {
    console.log('Spawn slow conveyor clicked/touched');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('slow');
        console.log('Spawned Slow Conveyor power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

addButtonListeners('spawn-speed-boost', () => {
    console.log('Spawn speed boost clicked/touched');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('speed');
        console.log('Spawned Speed Boost power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

addButtonListeners('spawn-extra-life', () => {
    console.log('Spawn extra life clicked/touched');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('extraLife');
        console.log('Spawned Extra Life power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

addButtonListeners('spawn-freeze', () => {
    console.log('Spawn freeze clicked/touched');
    if (gameUI.style.display === 'block') {
        spawnPowerUp('freeze');
        console.log('Spawned Freeze power-up');
    } else {
        console.log('Start a level to spawn power-ups');
    }
});

addButtonListeners('back-to-dev-tools', () => {
    console.log('Back to dev tools clicked/touched');
    powerUpMenu.style.display = 'none';
    devToolsBubble.style.display = 'block';
});

addButtonListeners('close-power-up-menu', () => {
    console.log('Close power-up menu clicked/touched');
    powerUpMenu.style.display = 'none';
    if (gameUI.style.display === 'block' && isPaused) {
        pauseScreen.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
});

addButtonListeners('close-dev-tools', () => {
    console.log('Close dev tools clicked/touched');
    devToolsBubble.style.display = 'none';
    if (gameUI.style.display === 'block') {
        pauseScreen.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
});

addButtonListeners('level-start-button', () => {
    console.log('Level start button clicked/touched');
    levelStartScreen.style.display = 'none';
    gameUI.style.display = 'block';
    startGame(selectedLevel);
});

addButtonListeners('back-to-level-select-from-start', () => {
    console.log('Back to level select from start clicked/touched');
    levelStartScreen.style.display = 'none';
    if (selectedLevel <= 15) {
        levelSelectScreen.style.display = 'block';
    } else if (selectedLevel <= 30) {
        levelSelectPage2.style.display = 'block';
    } else if (selectedLevel <= 45) {
        levelSelectPage3.style.display = 'block';
    } else {
        levelSelectPage4.style.display = 'block';
    }
    updateLevelButtons(); // Update buttons when returning to level select from start screen
});

addButtonListeners('back-to-main-menu-from-start', () => {
    console.log('Back to main menu from level start clicked/touched');
    levelStartScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('back-to-main-menu', () => {
    console.log('Back to main menu clicked/touched');
    levelCompleteScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('restart-button', () => {
    console.log('Restart button clicked/touched');
    restartGame();
});

addButtonListeners('next-page-button-page-4', () => {
    console.log('Next page from page 4 clicked/touched');
    levelSelectPage4.style.display = 'none';
    levelSelectPage5.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 5
});

addButtonListeners('prev-page-button-page-5', () => {
    console.log('Previous page from page 5 clicked/touched');
    levelSelectPage5.style.display = 'none';
    levelSelectPage4.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 4
});

addButtonListeners('back-to-start-page-5', () => {
    console.log('Back to start from page 5 clicked/touched');
    levelSelectPage5.style.display = 'none';
    startScreen.style.display = 'block';
});
addButtonListeners('next-page-button-page-5', () => {
    console.log('Next page from page 5 clicked/touched');
    levelSelectPage5.style.display = 'none';
    levelSelectPage6.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 6
});

addButtonListeners('prev-page-button-page-6', () => {
    console.log('Previous page from page 6 clicked/touched');
    levelSelectPage6.style.display = 'none';
    levelSelectPage5.style.display = 'block';
    updateLevelButtons(); // Update buttons when showing page 5
});

addButtonListeners('back-to-start-page-6', () => {
    console.log('Back to start from page 6 clicked/touched');
    levelSelectPage6.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('change-username', () => {
    console.log('Change Username button clicked/touched');
    const newUsername = document.getElementById('new-username').value.trim();
    if (newUsername) {
        username = newUsername;
        localStorage.setItem('username', username);
        document.getElementById('current-username').textContent = username;
        document.getElementById('username-message').textContent = 'Username changed successfully!';
        document.getElementById('username-message').style.display = 'block';
    } else {
        document.getElementById('username-message').textContent = 'Please enter a valid username.';
        document.getElementById('username-message').style.display = 'block';
    }
});
addButtonListeners('leaderboard-button', () => {
    startScreen.style.display = 'none';
    leaderboardScreen.style.display = 'block';
    fetchLeaderboard();
});

addButtonListeners('back-to-start-from-leaderboard', () => {
    leaderboardScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

addButtonListeners('spawn-auto-sort', () => {
    console.log('Spawn Auto Sort button clicked/touched');
    spawnPowerUp('autoSort');
});
addButtonListeners('spawn-magnet', () => {
    console.log('Spawn Magnet button clicked/touched');
    spawnPowerUp('magnet');
});
addButtonListeners('spawn-speed-surge', () => {
    console.log('Spawn Speed Surge button clicked/touched');
    spawnPowerUp('speedSurge');
});

document.getElementById('use-power-up-button').addEventListener('click', () => {
    if (!isPaused) {
        togglePause();
    }
    playerPowerUpMenu.style.display = 'block';
    updatePlayerPowerUpMenu();
});

document.getElementById('use-slow').addEventListener('click', () => {
    if (savedPowerUps.slow > 0) {
        spawnPowerUp('slow');
        savedPowerUps.slow--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});
document.getElementById('use-speed').addEventListener('click', () => {
    if (savedPowerUps.speed > 0) {
        spawnPowerUp('speed');
        savedPowerUps.speed--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});
document.getElementById('use-extraLife').addEventListener('click', () => {
    if (savedPowerUps.extraLife > 0) {
        spawnPowerUp('extraLife');
        savedPowerUps.extraLife--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});
document.getElementById('use-freeze').addEventListener('click', () => {
    if (savedPowerUps.freeze > 0) {
        spawnPowerUp('freeze');
        savedPowerUps.freeze--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});
document.getElementById('use-autoSort').addEventListener('click', () => {
    if (savedPowerUps.autoSort > 0) {
        spawnPowerUp('autoSort');
        savedPowerUps.autoSort--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});
document.getElementById('use-magnet').addEventListener('click', () => {
    if (savedPowerUps.magnet > 0) {
        spawnPowerUp('magnet');
        savedPowerUps.magnet--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});
document.getElementById('use-speedSurge').addEventListener('click', () => {
    if (savedPowerUps.speedSurge > 0) {
        spawnPowerUp('speedSurge');
        savedPowerUps.speedSurge--;
        localStorage.setItem('savedPowerUps', JSON.stringify(savedPowerUps));
        updatePlayerPowerUpMenu();
        playerPowerUpMenu.style.display = 'none';
        if (isPaused) {
            togglePause();
        }
    }
});

document.getElementById('back-to-game').addEventListener('click', () => {
    playerPowerUpMenu.style.display = 'none';
    if (isPaused) {
        togglePause();
    }
});

// Achievement Functions
const achievements = [
    { id: "novice_sorter", name: "Novice Sorter", description: "Sort 50 items in total", difficulty: "easy" },
    { id: "red_master", name: "Red Master", description: "Sort 25 red cubes", difficulty: "easy" },
    { id: "blue_expert", name: "Blue Expert", description: "Sort 25 blue triangles", difficulty: "easy" },
    { id: "yellow_pro", name: "Yellow Pro", description: "Sort 25 yellow spheres", difficulty: "easy" },
    { id: "survivor", name: "Survivor", description: "Complete a level without losing any lives", difficulty: "medium" },
    { id: "power_up_user", name: "Power-Up User", description: "Use any power-up", difficulty: "easy" },
    { id: "speed_demon", name: "Speed Demon", description: "Complete a level in under 2 minutes", difficulty: "medium" },
    { id: "perfectionist", name: "Perfectionist", description: "Sort all items correctly without any mistakes in a level", difficulty: "medium" },
    { id: "combo_king", name: "Combo King", description: "Sort 10 items in a row without mistakes", difficulty: "medium" },
    { id: "green_guru", name: "Green Guru", description: "Sort 25 green cones", difficulty: "easy" },
    { id: "shape_shifter", name: "Shape Shifter", description: "Sort one of each shape in a single level", difficulty: "easy" },
    { id: "color_coordinator", name: "Color Coordinator", description: "Sort 5 items of the same color in a row", difficulty: "medium" },
    { id: "power_up_pro", name: "Power-Up Pro", description: "Use 3 different power-ups in a single level", difficulty: "hard" },
    { id: "quick_sorter", name: "Quick Sorter", description: "Sort 20 items in under 1 minute", difficulty: "medium" },
    { id: "marathon_sorter", name: "Marathon Sorter", description: "Sort 100 items in a single session", difficulty: "medium" },
    { id: "level_conqueror", name: "Level Conqueror", description: "Complete level 10", difficulty: "medium" },
    { id: "master_sorter", name: "Master Sorter", description: "Complete all levels", difficulty: "expert" },
    { id: "power_up_collector", name: "Power-Up Collector", description: "Collect 10 power-ups in total", difficulty: "hard" },
    { id: "speed_runner", name: "Speed Runner", description: "Complete a level in under 1 minute", difficulty: "medium" },
    { id: "endurance_tester", name: "Endurance Tester", description: "Play for 30 minutes in a single session", difficulty: "medium" },
    { id: "shape_specialist", name: "Shape Specialist", description: "Sort 50 of any single shape", difficulty: "easy" },
    { id: "color_specialist", name: "Color Specialist", description: "Sort 50 items of any single color", difficulty: "easy" },
    { id: "lucky_sorter", name: "Lucky Sorter", description: "Sort an item correctly on the first try in a level", difficulty: "easy" },
    { id: "power_up_master", name: "Power-Up Master", description: "Use each type of power-up at least once", difficulty: "hard" },
    // NEW: Added new achievements
    { id: "level_1_no_lives_lost", name: "Level 1 Survivor", description: "Complete level 1 without losing any lives", difficulty: "easy" },
    { id: "sort_10_in_level", name: "Deca Sorter", description: "Sort 10 items in a single level", difficulty: "easy" },
    { id: "first_slow_powerup", name: "Slow Starter", description: "Use the 'Slow Conveyor' power-up for the first time", difficulty: "easy" },
    { id: "five_red_in_row", name: "Red Streak", description: "Sort 5 red cubes in a row", difficulty: "easy" },
    { id: "five_blue_in_row", name: "Blue Streak", description: "Sort 5 blue triangles in a row", difficulty: "easy" },
    { id: "sort_20_in_row", name: "Twenty in a Row", description: "Sort 20 items in a row without mistakes", difficulty: "medium" },
    { id: "three_levels_no_lives_lost", name: "Triple Survivor", description: "Complete 3 levels in a row without losing any lives", difficulty: "medium" },
    { id: "all_powerups_in_level", name: "Power-Up Master", description: "Use all types of power-ups in a single level", difficulty: "medium" },
    { id: "complete_with_one_life", name: "Close Call", description: "Complete a level with only one life remaining", difficulty: "medium" },
    { id: "sort_100_in_level", name: "Century Sorter", description: "Sort 100 items in a single level", difficulty: "hard" },
    { id: "level_10_no_powerups", name: "Purist", description: "Complete level 10 without using any power-ups", difficulty: "hard" },
    { id: "sort_50_in_row", name: "Unstoppable", description: "Sort 50 items in a row without mistakes", difficulty: "hard" },
    { id: "complete_level_under_1_min", name: "Minute Master", description: "Complete a level in under 1 minute", difficulty: "hard" },
    { id: "sort_10_powerups_in_level", name: "Power-Up Collector", description: "Sort 10 power-ups in a single level", difficulty: "hard" },
    { id: "five_levels_no_lives_lost", name: "Quintuple Survivor", description: "Complete 5 levels in a row without losing any lives", difficulty: "hard" },
    { id: "sort_20_red_in_level", name: "Red Specialist", description: "Sort 20 red cubes in a single level", difficulty: "hard" },
    { id: "sort_20_blue_in_level", name: "Blue Specialist", description: "Sort 20 blue triangles in a single level", difficulty: "hard" },
    { id: "sort_20_yellow_in_level", name: "Yellow Specialist", description: "Sort 20 yellow spheres in a single level", difficulty: "hard" },
    { id: "sort_20_green_in_level", name: "Green Specialist", description: "Sort 20 green cones in a single level", difficulty: "hard" },
    { id: "all_levels_no_lives_lost", name: "Invincible", description: "Complete all levels without losing any lives", difficulty: "expert" },
    { id: "score_1000_in_level", name: "High Scorer", description: "Achieve a score of 1000 in a single level", difficulty: "expert" },
    { id: "sort_500_total", name: "Grand Master Sorter", description: "Sort 500 items in total", difficulty: "expert" }
];

let currentDifficulty = "easy";

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
    if (totalItemsSorted >= 50) unlockAchievement("novice_sorter");
    if (redCubesSorted >= 25) unlockAchievement("red_master");
    if (blueTrianglesSorted >= 25) unlockAchievement("blue_expert");
    if (yellowSpheresSorted >= 25) unlockAchievement("yellow_pro");
    if (greenConesSorted >= 25) unlockAchievement("green_guru");
    // NEW: Check for total items sorted achievement
    if (totalItemsSorted >= 500) unlockAchievement("sort_500_total");
}

function updateAchievementsList() {
    const totalAchievements = achievements.filter(a => a.difficulty === currentDifficulty).length;
    const unlockedCount = achievements.filter(a => a.difficulty === currentDifficulty && unlockedAchievements[a.id]).length;
    document.getElementById('achievement-counter').textContent = `Unlocked: ${unlockedCount} / ${totalAchievements}`;

    achievementsList.innerHTML = '';
    const unlocked = achievements.filter(a => unlockedAchievements[a.id] && a.difficulty === currentDifficulty);
    if (unlocked.length === 0) {
        const li = document.createElement('li');
        li.textContent = `No ${currentDifficulty} achievements unlocked yet.`;
        achievementsList.appendChild(li);
    } else {
        unlocked.forEach(achievement => {
            const li = document.createElement('li');
            li.textContent = `🏆 ${achievement.name}: ${achievement.description}`;
            li.classList.add(achievement.difficulty);
            achievementsList.appendChild(li);
        });
    }
}

// Add event listeners for tab buttons
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        currentDifficulty = button.getAttribute('data-difficulty');
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        updateAchievementsList();
    });
});

// Set initial active tab
document.querySelector('.tab-button[data-difficulty="easy"]').classList.add('active');

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
    sortedShapesThisLevel.clear();
    consecutiveColorStreak = 0;
    lastSortedColor = null;
    firstSortInLevel = true;
    powerUpsUsedThisLevel.clear();
    levelItemsSorted = 0;
    // NEW: Reset new per-level variables
    currentRedStreak = 0;
    currentBlueStreak = 0;
    powerUpsSortedThisLevel = 0;
    redCubesSortedThisLevel = 0;
    blueTrianglesSortedThisLevel = 0;
    yellowSpheresSortedThisLevel = 0;
    greenConesSortedThisLevel = 0;
    // NEW: Reset new power-up states
    autoSortCount = 0;
    magnetPosition = null;
}

function startGame(level) {
    console.log(`Starting level ${level}`);
    currentLevel = level;
    levelDisplay.textContent = `Level ${currentLevel}`;
    if (level >= 36 && level <= 45) {
        itemsNeeded = 110 + (level - 36) * 10;
    } else {
        itemsNeeded = 15 + (level - 1) * 5;
    }
    baseConveyorSpeed = level === 1 ? 0.02 : 0.025 + (level - 2) * 0.003;
    if (currentLevel >= 26 && currentLevel <= 35) {
        baseConveyorSpeed *= 0.5;
    }
    conveyorSpeed = baseConveyorSpeed;
    if (currentLevel >= 26 && currentLevel <= 35) {
        leftConveyorDirection = -1;
        rightConveyorDirection = -1;
    } else if (currentLevel >= 36 && currentLevel <= 45) {
        leftConveyorDirection = 1; // Reverse direction for left conveyor
        rightConveyorDirection = -1;
    } else {
        conveyorDirection = -1;
    }
    neededTotalDisplay.textContent = itemsNeeded;
    completedLevelDisplay.textContent = currentLevel;
    nextLevelDisplay.textContent = currentLevel + 1;
    endLevelButton.style.display = 'none';
    cleanupBins();
    setupBins();
    conveyorBelts.forEach(belt => scene.remove(belt));
    troughs.forEach(trough => scene.remove(trough));
    conveyorBelts = [];
    troughs = [];
    setupConveyors();
    setupTroughs();
    restartGame();
    // Initialize player level and XP display
    playerLevelDisplay.textContent = `Level: ${playerLevel}`;
    if (playerLevel < 100) {
        xpDisplay.textContent = `XP: ${xpTowardsNext} / ${100 * playerLevel}`;
    } else {
        xpDisplay.textContent = 'XP: Max Level';
    }
    fetchTopPlayerForLevel(currentLevel);
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
        localStorage.setItem('totalPlayTime', totalPlayTime); // Save totalPlayTime when pausing
        if (spawnInterval) {
            clearInterval(spawnInterval);
            spawnInterval = null;
        }
        pauseScreen.style.display = 'block';
        loadAdIfNeeded('pause-ad', '4400265656');
        pauseResumeButton.textContent = 'Resume';
        gameMusic.pause();
    } else {
        startSpawning();
        pauseScreen.style.display = 'none';
        pauseResumeButton.textContent = 'Pause';
        if (!isMutedMusic) {
            console.log('Playing game music');
            gameMusic.play().catch(e => console.log('Error playing game music:', e));
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
    document.getElementById('current-username').textContent = username;
    document.getElementById('new-username').value = '';
    document.getElementById('username-message').style.display = 'none';
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
    particles.forEach(particle => scene.remove(particle));
    particles.length = 0;
    localStorage.setItem('totalPlayTime', totalPlayTime); // Save totalPlayTime when cleaning up
}

function restartGame() {
    cleanupGame();
    resetGameState();
    startSpawning();
    if (!isMutedMusic) {
        console.log('Playing game music');
        gameMusic.play().catch(e => console.log('Error playing game music:', e));
    }
}

function getEventPosition(event) {
    let x, y;
    if (event.type.startsWith('mouse')) {
        x = event.clientX;
        y = event.clientY;
    } else if (event.type.startsWith('touch')) {
        const touch = event.touches[0] || event.changedTouches[0];
        x = touch.clientX;
        y = touch.clientY;
    }
    return { x, y };
}

function onStart(event) {
    event.preventDefault();
    if (isPaused) return;

    const pos = getEventPosition(event);
    mouse.x = (pos.x / window.innerWidth) * 2 - 1;
    mouse.y = -(pos.y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(items);

    if (intersects.length > 0) {
        selectedItem = intersects[0].object;
        selectedItem.userData.isDragging = true;
    }
}

function onMove(event) {
    event.preventDefault();
    const pos = getEventPosition(event);
    mouse.x = (pos.x / window.innerWidth) * 2 - 1;
    mouse.y = -(pos.y / window.innerHeight) * 2 + 1;

    // Update magnet position
    if (activePowerUps.some(p => p.effect === 'magnet')) {
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
            magnetPosition = intersectPoint.clone();
            magnetPosition.z = Math.max(-18, Math.min(20, magnetPosition.z));
        }
    }

    if (selectedItem && !isPaused) {
        if (!selectedItem.userData || !selectedItem.userData.type) {
            console.error('selectedItem has no userData.type', selectedItem);
            return; // Skip this frame to prevent crash
        }
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
            const shapeType = selectedItem.userData.type;
            const offset = getOffset({type: shapeType});
            selectedItem.position.set(intersectPoint.x, conveyorHeight + offset, intersectPoint.z);
            selectedItem.position.z = Math.max(-18, Math.min(20, selectedItem.position.z));
            updatePowerUpTextPosition(selectedItem);
        }

        if (window.bins) {
            window.bins.forEach(bin => {
                const binPos = bin.mesh.position;
                const itemPos = selectedItem.position;
                const distance = Math.sqrt(Math.pow(itemPos.x - binPos.x, 2) + Math.pow(itemPos.z - binPos.z, 2));
                const isCorrectBin = bin.color === selectedItem.material.color.getHex();
                bin.highlightOutline.visible = distance < 1.65 && isCorrectBin && !selectedItem.userData.effect;
            });
        }
    } else if (window.bins) {
        window.bins.forEach(bin => bin.highlightOutline.visible = false);
    }
}

function onEnd(event) {
    event.preventDefault();
    if (selectedItem && !isPaused) {
        const itemColor = selectedItem.material.color.getHex();
        let sorted = false;
        let sortedItem = selectedItem;
        const itemPos = sortedItem.position;

        if (window.bins) {
            for (const bin of window.bins) {
                const binPos = bin.mesh.position;
                const distance = Math.sqrt(Math.pow(itemPos.x - binPos.x, 2) + Math.pow(itemPos.z - binPos.z, 2));
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
                            powerUpsUsed.slow = true;
                            powerUpsUsedThisLevel.add('slow');
                            unlockAchievement("first_slow_powerup");
                        } else if (sortedItem.userData.effect === 'speed') {
                            const existingSpeed = activePowerUps.find(p => p.effect === 'speed');
                            if (existingSpeed) {
                                existingSpeed.timer += 5;
                            } else {
                                activePowerUps.push({ effect: 'speed', timer: 5 });
                            }
                            powerUpsUsed.speed = true;
                            powerUpsUsedThisLevel.add('speed');
                        } else if (sortedItem.userData.effect === 'extraLife') {
                            if (lives < 3) {
                                lives++;
                                livesText.textContent = `Lives: ${lives}`;
                                hearts[lives - 1].classList.remove('lost');
                                showNotification('Extra Life Gained!');
                            }
                            powerUpsUsed.extraLife = true;
                            powerUpsUsedThisLevel.add('extraLife');
                        } else if (sortedItem.userData.effect === 'freeze') {
                            const existingFreeze = activePowerUps.find(p => p.effect === 'freeze');
                            if (existingFreeze) {
                                existingFreeze.timer += 3;
                            } else {
                                activePowerUps.push({ effect: 'freeze', timer: 3 });
                            }
                            powerUpsUsed.freeze = true;
                            powerUpsUsedThisLevel.add('freeze');
                        } else if (sortedItem.userData.effect === 'autoSort') {
                            autoSortCount += 5;
                            powerUpsUsed.autoSort = true;
                            powerUpsUsedThisLevel.add('autoSort');
                            showNotification('Auto Sort Activated: 5 items');
                        } else if (sortedItem.userData.effect === 'magnet') {
                            const existingMagnet = activePowerUps.find(p => p.effect === 'magnet');
                            if (existingMagnet) {
                                existingMagnet.timer += 5;
                            } else {
                                activePowerUps.push({ effect: 'magnet', timer: 5 });
                            }
                            powerUpsUsed.magnet = true;
                            powerUpsUsedThisLevel.add('magnet');
                        } else if (sortedItem.userData.effect === 'speedSurge') {
                            const existingSpeedSurge = activePowerUps.find(p => p.effect === 'speedSurge');
                            if (existingSpeedSurge) {
                                existingSpeedSurge.timer += 5;
                            } else {
                                activePowerUps.push({ effect: 'speedSurge', timer: 5 });
                            }
                            powerUpsUsed.speedSurge = true;
                            powerUpsUsedThisLevel.add('speedSurge');
                            startSpawning(); // Update spawn interval
                        }
                        totalPowerUpsCollected++;
                        localStorage.setItem('totalPowerUpsCollected', totalPowerUpsCollected);
                        localStorage.setItem('powerUpsUsed', JSON.stringify(powerUpsUsed));
                        powerUpsSortedThisLevel++;
                        if (powerUpsSortedThisLevel >= 10) unlockAchievement("sort_10_powerups_in_level");
                        if (powerUpsUsedThisLevel.size >= 4) unlockAchievement("all_powerups_in_level");
                        
                        if (totalPowerUpsCollected >= 10) unlockAchievement("power_up_collector");
                        if (powerUpsUsed.slow && powerUpsUsed.speed && powerUpsUsed.extraLife && powerUpsUsed.freeze && powerUpsUsed.autoSort && powerUpsUsed.magnet && powerUpsUsed.speedSurge) unlockAchievement("power_up_master");
                        if (powerUpsUsedThisLevel.size >= 3) unlockAchievement("power_up_pro");

                        updatePowerUpStatus();
                        animatePowerUp(sortedItem, 'shrink', () => {
                            if (sortedItem.userData.textDiv) {
                                document.body.removeChild(sortedItem.userData.textDiv);
                            }
                            scene.remove(sortedItem);
                            const index = items.indexOf(sortedItem);
                            if (index !== -1) items.splice(index, 1);
                            if (!isMutedSounds) {
                                console.log('Playing success sound');
                                successSound.play().catch(e => console.log('Error playing success sound:', e));
                            }
                            currentStreak++;
                            if (currentStreak >= 10) unlockAchievement("combo_king");
                            if (currentStreak >= 20) unlockAchievement("sort_20_in_row");
                            if (currentStreak >= 50) unlockAchievement("sort_50_in_row");
                        });
                        unlockAchievement("power_up_user");
                    } else if (sortedItem.userData.needsSorting) {
                        if (bin.color === itemColor) {
                            animatePowerUp(sortedItem, 'shrink', () => {
                                createParticles(sortedItem.position, sortedItem.material.color);
                                scene.remove(sortedItem);
                                const index = items.indexOf(sortedItem);
                                if (index !== -1) items.splice(index, 1);
                                sortCount++;
                                console.log('Sorted item, sortCount =', sortCount, 'itemsNeeded =', itemsNeeded);
                                totalItemsSorted++;
                                sessionItemsSorted++;
                                levelItemsSorted++;
                                if (sortedItem.userData.type === 'cube') {
                                    redCubesSorted++;
                                    shapeCounts.cube++;
                                    colorCounts[0xff0000]++;
                                    localStorage.setItem('redCubesSorted', redCubesSorted);
                                    localStorage.setItem('shape_cube', shapeCounts.cube);
                                    localStorage.setItem('color_red', colorCounts[0xff0000]);
                                    redCubesSortedThisLevel++;
                                    currentRedStreak++;
                                    if (currentRedStreak >= 5) unlockAchievement("five_red_in_row");
                                    currentBlueStreak = 0;
                                    if (redCubesSortedThisLevel >= 20) unlockAchievement("sort_20_red_in_level");
                                } else if (sortedItem.userData.type === 'triangle') {
                                    blueTrianglesSorted++;
                                    shapeCounts.triangle++;
                                    colorCounts[0x0000ff]++;
                                    localStorage.setItem('blueTrianglesSorted', blueTrianglesSorted);
                                    localStorage.setItem('shape_triangle', shapeCounts.triangle);
                                    localStorage.setItem('color_blue', colorCounts[0x0000ff]);
                                    blueTrianglesSortedThisLevel++;
                                    currentBlueStreak++;
                                    if (currentBlueStreak >= 5) unlockAchievement("five_blue_in_row");
                                    currentRedStreak = 0;
                                    if (blueTrianglesSortedThisLevel >= 20) unlockAchievement("sort_20_blue_in_level");
                                } else if (sortedItem.userData.type === 'sphere') {
                                    yellowSpheresSorted++;
                                    shapeCounts.sphere++;
                                    colorCounts[0xffff00]++;
                                    localStorage.setItem('yellowSpheresSorted', yellowSpheresSorted);
                                    localStorage.setItem('shape_sphere', shapeCounts.sphere);
                                    localStorage.setItem('color_yellow', colorCounts[0xffff00]);
                                    yellowSpheresSortedThisLevel++;
                                    if (yellowSpheresSortedThisLevel >= 20) unlockAchievement("sort_20_yellow_in_level");
                                } else if (sortedItem.userData.type === 'cone') {
                                    greenConesSorted++;
                                    shapeCounts.cone++;
                                    colorCounts[0x00ff00]++;
                                    localStorage.setItem('greenConesSorted', greenConesSorted);
                                    localStorage.setItem('shape_cone', shapeCounts.cone);
                                    localStorage.setItem('color_green', colorCounts[0x00ff00]);
                                    greenConesSortedThisLevel++;
                                    if (greenConesSortedThisLevel >= 20) unlockAchievement("sort_20_green_in_level");
                                }
                                localStorage.setItem('totalItemsSorted', totalItemsSorted);
                                checkSortingAchievements();
                                neededCountDisplay.textContent = Math.min(sortCount, itemsNeeded);
                                topSortedCountDisplay.textContent = Math.max(sortCount, topSortedPerLevel[currentLevel]);
                                topSortedPerLevel[currentLevel] = Math.max(sortCount, topSortedPerLevel[currentLevel]);
                                progressBar.style.width = `${Math.min((sortCount / itemsNeeded) * 100, 100)}%`;
                                if (!isMutedSounds) {
                                    console.log('Playing success sound');
                                    successSound.play().catch(e => console.log('Error playing success sound:', e));
                                }
                                currentStreak++;
                                if (currentStreak >= 10) unlockAchievement("combo_king");
                                if (currentStreak >= 20) unlockAchievement("sort_20_in_row");
                                if (currentStreak >= 50) unlockAchievement("sort_50_in_row");

                                sortedShapesThisLevel.add(sortedItem.userData.type);
                                const currentColor = sortedItem.material.color.getHex();
                                if (currentColor === lastSortedColor) {
                                    consecutiveColorStreak++;
                                    if (consecutiveColorStreak >= 5) unlockAchievement("color_coordinator");
                                } else {
                                    consecutiveColorStreak = 1;
                                    lastSortedColor = currentColor;
                                }
                                if (firstSortInLevel) {
                                    firstSortInLevel = false;
                                    unlockAchievement("lucky_sorter");
                                }
                                if (sortedShapesThisLevel.size >= 4) unlockAchievement("shape_shifter");
                                const timeElapsed = (Date.now() - levelStartTime) / 1000;
                                if (levelItemsSorted >= 20 && timeElapsed < 60) unlockAchievement("quick_sorter");
                                if (sessionItemsSorted >= 100) unlockAchievement("marathon_sorter");
                                for (const shape in shapeCounts) {
                                    if (shapeCounts[shape] >= 50) {
                                        unlockAchievement("shape_specialist");
                                        break;
                                    }
                                }
                                for (const color in colorCounts) {
                                    if (colorCounts[color] >= 50) {
                                        unlockAchievement("color_specialist");
                                        break;
                                    }
                                }
                                if (sortCount >= 10) unlockAchievement("sort_10_in_level");
                                if (sortCount >= 100) unlockAchievement("sort_100_in_level");
                                if (sortCount >= 1000) unlockAchievement("score_1000_in_level");

                                // Award XP
                                const xpGained = sortedItem.userData.xp || 0;
                                xpTowardsNext += xpGained;
                                while (xpTowardsNext >= 100 * playerLevel && playerLevel < 100) {
                                    xpTowardsNext -= 100 * playerLevel;
                                    playerLevel++;
                                    showNotification(`Leveled up to level ${playerLevel}!`);
                                }
                                if (playerLevel >= 100) {
                                    xpTowardsNext = 0;
                                }
                                localStorage.setItem('playerLevel', playerLevel);
                                localStorage.setItem('xpTowardsNext', xpTowardsNext);
                                playerLevelDisplay.textContent = `Level: ${playerLevel}`;
                                if (playerLevel < 100) {
                                    xpDisplay.textContent = `XP: ${xpTowardsNext} / ${100 * playerLevel}`;
                                } else {
                                    xpDisplay.textContent = 'XP: Max Level';
                                }

                                if (sortCount >= itemsNeeded) {
                                    console.log('Condition met, showing end level button');
                                    const timeElapsed = (Date.now() - levelStartTime) / 1000;
                                    if (timeElapsed < 60) unlockAchievement("speed_runner");
                                    if (timeElapsed < 120) unlockAchievement("speed_demon");
                                    if (!mistakesMade) unlockAchievement("perfectionist");
                                    if (lives === 3) unlockAchievement("survivor");
                                    if (currentLevel === 10) unlockAchievement("level_conqueror");
                                    if (currentLevel === 45) unlockAchievement("master_sorter");
                                    if (currentLevel == 1 && lives == 3) unlockAchievement("level_1_no_lives_lost");
                                    if (lives == 3) {
                                        consecutiveLevelsNoLivesLost++;
                                        if (consecutiveLevelsNoLivesLost >= 3) unlockAchievement("three_levels_no_lives_lost");
                                        if (consecutiveLevelsNoLivesLost >= 5) unlockAchievement("five_levels_no_lives_lost");
                                    } else {
                                        consecutiveLevelsNoLivesLost = 0;
                                    }
                                    if (currentLevel == 10 && powerUpsUsedThisLevel.size == 0) unlockAchievement("level_10_no_powerups");
                                    if (lives == 1) unlockAchievement("complete_with_one_life");
                                    if (timeElapsed < 60) unlockAchievement("complete_level_under_1_min");
                                    if (currentLevel === 45 && levelsFailed === 0) unlockAchievement("all_levels_no_lives_lost");

                                    if (currentLevel < 45) {
                                        levelUnlocks[currentLevel + 1] = true;
                                        localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
                                    }
                                    endLevelButton.style.display = 'block';
                                    if (!isMutedSounds) {
                                        console.log('Playing level success sound');
                                        levelSuccessSound.play().catch(e => console.log('Error playing level success sound:', e));
                                    }
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
                                if (!isMutedSounds) {
                                    console.log('Playing fail sound');
                                    failSound.play().catch(e => console.log('Error playing fail sound:', e));
                                }
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
                if (selectedItem.userData.textDiv) {
                    document.body.removeChild(selectedItem.userData.textDiv);
                }
                scene.remove(selectedItem);
                const index = items.indexOf(selectedItem);
                if (index !== -1) items.splice(index, 1);
                if (selectedItem.userData.needsSorting) {
                    loseLife();
                    if (!isMutedSounds) {
                        console.log('Playing fail sound');
                        failSound.play().catch(e => console.log('Error playing fail sound:', e));
                    }
                }
            } else {
                selectedItem.userData.isDragging = false;
            }
        }
        selectedItem = null;
        if (window.bins) {
            window.bins.forEach(bin => bin.highlightOutline.visible = false);
        }
    }
}

renderer.domElement.addEventListener('mousedown', onStart);
renderer.domElement.addEventListener('touchstart', onStart, { passive: false });
renderer.domElement.addEventListener('mousemove', onMove);
renderer.domElement.addEventListener('touchmove', onMove, { passive: false });
renderer.domElement.addEventListener('mouseup', onEnd);
renderer.domElement.addEventListener('touchend', onEnd, { passive: false });

function loseLife() {
    mistakesMade = true;
    currentStreak = 0;
    // NEW: Reset type-specific streaks
    currentRedStreak = 0;
    currentBlueStreak = 0;
    lives--;
    livesText.textContent = `Lives: ${lives}`;
    if (lives >= 0) hearts[lives].classList.add('lost');
    if (lives <= 0) {
        levelsFailed++;
        localStorage.setItem('levelsFailed', levelsFailed);
        gameUI.style.display = 'none';
        gameOverScreen.style.display = 'block';
        loadAdIfNeeded('gameover-ad', '7921742100');
        gameOverSortCount.textContent = sortCount;
        gameOverNeededCount.textContent = itemsNeeded;
        cleanupGame();
        sendLevelDataToSheetDB(currentLevel, sortCount);
        sendDataToSheetDB();
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

endLevelButton.addEventListener('click', () => {
    totalLevelsPassed++;
    localStorage.setItem('totalLevelsPassed', totalLevelsPassed);
    sendLevelDataToSheetDB(currentLevel, sortCount);
    sendDataToSheetDB();
    cleanupGame();
    levelCompleteScreen.style.display = 'block';
    gameUI.style.display = 'none';
    levelCompleteSortCount.textContent = sortCount;
    if (currentLevel < 45) {
        startGame(currentLevel + 1);
    } else {
        // Handle max level reached, if desired
        console.log('All levels completed!');
    }
});

let lastTime = 0;
function animate(timestamp) {
    requestAnimationFrame(animate);
    
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!isPaused) {
        totalPlayTime += delta;
    }

    if (!isPaused && beltMaterial && beltMaterial.map) {
        conveyorSpeed = baseConveyorSpeed;
        if (activePowerUps.length > 0) {
            const hasFreeze = activePowerUps.some(p => p.effect === 'freeze');
            const hasSpeed = activePowerUps.some(p => p.effect === 'speed');
            const hasSlow = activePowerUps.some(p => p.effect === 'slow');
            const hasSpeedSurge = activePowerUps.some(p => p.effect === 'speedSurge');
            
            if (hasFreeze) {
                conveyorSpeed = 0;
            } else if (hasSpeedSurge) {
                conveyorSpeed = baseConveyorSpeed * 3;
            } else if (hasSpeed) {
                conveyorSpeed = baseConveyorSpeed * 2;
            } else if (hasSlow) {
                conveyorSpeed = baseConveyorSpeed * 0.5;
            }
            
            activePowerUps.forEach((powerUp, idx) => {
                powerUp.timer -= delta;
                if (powerUp.timer <= 0) {
                    activePowerUps.splice(idx, 1);
                    if (powerUp.effect === 'speedSurge') {
                        startSpawning(); // Reset spawn interval
                    }
                }
            });
            updatePowerUpStatus();
        }
        
        conveyorBelts.forEach(belt => {
            const textureDirectionMultiplier = belt.userData.textureDirectionMultiplier || 1;
            const textureOffsetUpdate = textureDirectionMultiplier * belt.userData.direction * conveyorSpeed;
            belt.userData.textureOffset += textureOffsetUpdate;
            belt.material.map.offset.y = belt.userData.textureOffset % 1;
        });

        const toRemove = [];
        items.forEach((item, index) => {
            if (!item.userData.isDragging) {
                const speed = conveyorSpeed;
                item.position.z += (item.userData.direction > 0 ? 1 : -1) * speed;
                item.rotation.y += 0.02;
                
                // Magnet effect
                if (magnetPosition && activePowerUps.some(p => p.effect === 'magnet') && !item.userData.isPowerUp) {
                    const direction = magnetPosition.clone().sub(item.position);
                    const distance = direction.length();
                    if (distance > 0.1) {
                        direction.normalize();
                        const attractionSpeed = 0.1 * delta * 50; // Adjust speed as needed
                        item.position.add(direction.multiplyScalar(Math.min(attractionSpeed, distance)));
                        item.position.z = Math.max(-18, Math.min(20, item.position.z));
                        updatePowerUpTextPosition(item);
                    }
                }

                if ((item.userData.direction > 0 && item.position.z > item.userData.endZ) || (item.userData.direction < 0 && item.position.z < item.userData.endZ)) {
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
                if (!isMutedSounds) {
                    console.log('Playing fail sound');
                    failSound.play().catch(e => console.log('Error playing fail sound:', e));
                }
            }
        });

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

        const sessionTime = (Date.now() - sessionStartTime) / 1000 / 60;
        if (sessionTime >= 30) unlockAchievement("endurance_tester");
    }

    renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);

setupBins();

function sendDataToSheetDB() {
    const data = {
        "data": [            {                "username": username,                "totalItemsSorted": totalItemsSorted,                "levelsPassed": totalLevelsPassed,                "levelsFailed": levelsFailed,                "totalHoursPlayed": (totalPlayTime / 3600).toFixed(2),                "timestamp": new Date().toISOString()            }        ]
    };
    fetch('https://sheetdb.io/api/v1/alykvz0kwp4lg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error sending data to SheetDB:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error sending data to SheetDB:', error);
    });
}

function fetchLeaderboard() {
    leaderboardList.innerHTML = 'Loading...';
    fetch('https://sheetdb.io/api/v1/alykvz0kwp4lg')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                leaderboardList.innerHTML = 'No data available.';
                return;
            }

            const latestEntries = {};
            data.forEach(entry => {
                // Ensure entry has required properties
                if (!entry || typeof entry.username !== 'string' || !entry.timestamp) {
                    console.warn('Invalid entry in leaderboard data:', entry);
                    return;
                }
                const parsedEntry = {
                    username: entry.username,
                    totalItemsSorted: parseInt(entry.totalItemsSorted, 10) || 0,
                    levelsPassed: parseInt(entry.levelsPassed, 10) || 0,
                    levelsFailed: parseInt(entry.levelsFailed, 10) || 0,
                    totalHoursPlayed: parseFloat(entry.totalHoursPlayed) || 0,
                    timestamp: entry.timestamp
                };
                if (!latestEntries[parsedEntry.username] || new Date(parsedEntry.timestamp) > new Date(latestEntries[parsedEntry.username].timestamp)) {
                    latestEntries[parsedEntry.username] = parsedEntry;
                }
            });

            const latestData = Object.values(latestEntries);
            if (latestData.length === 0) {
                leaderboardList.innerHTML = 'No valid data available.';
                return;
            }

            // Sort for Top Sorters (totalItemsSorted)
            const topSorters = latestData
                .sort((a, b) => b.totalItemsSorted - a.totalItemsSorted)
                .slice(0, 3);
            const topSortersHTML = topSorters.length > 0
                ? topSorters.map((entry, index) => 
                    `<p>${index + 1}. ${entry.username} - ${entry.totalItemsSorted} items</p>`
                  ).join('')
                : '<p>No sorters available.</p>';

            // Sort for Most Levels Passed
            const topLevelsPassed = latestData
                .sort((a, b) => b.levelsPassed - a.levelsPassed)
                .slice(0, 3);
            const topLevelsPassedHTML = topLevelsPassed.length > 0
                ? topLevelsPassed.map((entry, index) => 
                    `<p>${index + 1}. ${entry.username} - ${entry.levelsPassed} levels</p>`
                  ).join('')
                : '<p>No levels passed data available.</p>';

            // Sort for Most Levels Failed
            const topLevelsFailed = latestData
                .sort((a, b) => b.levelsFailed - a.levelsFailed)
                .slice(0, 3);
            const topLevelsFailedHTML = topLevelsFailed.length > 0
                ? topLevelsFailed.map((entry, index) => 
                    `<p>${index + 1}. ${entry.username} - ${entry.levelsFailed} levels</p>`
                  ).join('')
                : '<p>No levels failed data available.</p>';

            // Sort for Longest Play Time
            const topHoursPlayed = latestData
                .sort((a, b) => b.totalHoursPlayed - a.totalHoursPlayed)
                .slice(0, 3);
            const topHoursPlayedHTML = topHoursPlayed.length > 0
                ? topHoursPlayed.map((entry, index) => 
                    `<p>${index + 1}. ${entry.username} - ${entry.totalHoursPlayed.toFixed(2)} hours</p>`
                  ).join('')
                : '<p>No play time data available.</p>';

            // Combine all categories with headers
            leaderboardList.innerHTML = `
                <h3>Top Sorters</h3>
                ${topSortersHTML}
                <h3>Most Levels Passed</h3>
                ${topLevelsPassedHTML}
                <h3>Most Levels Failed</h3>
                ${topLevelsFailedHTML}
                <h3>Longest Play Time</h3>
                ${topHoursPlayedHTML}
            `;
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
            leaderboardList.innerHTML = 'Error loading leaderboard.';
        });
}

function fetchTopPlayerForLevel(level) {
    fetch(`https://sheetdb.io/api/v1/alykvz0kwp4lg?level=${level}&sort_by=score&sort_order=desc&limit=1`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0 || !data[0].username || !data[0].score) {
                topPlayerNameDisplay.textContent = "No top player yet";
                topPlayerScoreDisplay.textContent = "0";
                return;
            }
            const topPlayer = data[0];
            topPlayerNameDisplay.textContent = topPlayer.username;
            topPlayerScoreDisplay.textContent = topPlayer.score;
        })
        .catch(error => {
            console.error('Error fetching top player:', error);
            topPlayerNameDisplay.textContent = "Error";
            topPlayerScoreDisplay.textContent = "0";
        });
}

function fetchTopPlayerForLevel(level) {
    fetch(`https://sheetdb.io/api/v1/alykvz0kwp4lg?level=${level}&sort_by=score&sort_order=desc&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const topPlayer = data[0];
                topPlayerNameDisplay.textContent = topPlayer.username;
                topPlayerScoreDisplay.textContent = topPlayer.score;
            } else {
                topPlayerNameDisplay.textContent = "No top player yet";
                topPlayerScoreDisplay.textContent = "0";
            }
        })
        .catch(error => {
            console.error('Error fetching top player:', error);
            topPlayerNameDisplay.textContent = "Error";
            topPlayerScoreDisplay.textContent = "0";
        });
}

function sendLevelDataToSheetDB(level, score) {
    const data = {
        "data": [
            {
                "username": username,
                "level": level,
                "score": score,
                "timestamp": new Date().toISOString()
            }
        ]
    };
    fetch('https://sheetdb.io/api/v1/alykvz0kwp4lg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error sending level data to SheetDB:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error sending level data to SheetDB:', error);
    });
}