import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Array to hold all cube groups
let cubes = [];

// Cube edges (pairs of vertex indices)
const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // front face
    [4, 5], [5, 6], [6, 7], [7, 4], // back face
    [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
];

// Generate cube vertices based on size
function getCubeVertices(size = 1) {
    const half = size / 2;
    return [
        [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
        [-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]
    ];
}

// Calculate positions for multiple cubes in a grid
function getCubePosition(index, total, spacing = 1.5) {
    if (total === 1) return { x: 0, y: 0, z: 0 };

    const gridSize = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    // Center the grid
    const offsetX = (gridSize - 1) * spacing / 2;
    const offsetY = (gridSize - 1) * spacing / 2;

    return {
        x: col * spacing - offsetX,
        y: -row * spacing + offsetY,
        z: 0
    };
}

function createCubeGeometry(cubeGroup, gap = 0, color = 0x00ff00, size = 1) {
    // Remove existing children from this cube group
    while (cubeGroup.children.length > 0) {
        cubeGroup.remove(cubeGroup.children[0]);
    }

    const edgeLines = [];
    const vertexPoints = [];
    const vertices = getCubeVertices(size);

    // Create edge lines with gaps
    edges.forEach(([startIdx, endIdx]) => {
        const start = new THREE.Vector3(...vertices[startIdx]);
        const end = new THREE.Vector3(...vertices[endIdx]);

        // Calculate direction and shorten line by gap amount
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        // Shrink from both ends
        const newStart = start.clone().add(direction.clone().multiplyScalar(gap));
        const newEnd = end.clone().sub(direction.clone().multiplyScalar(gap));

        // Only create line if there's still length left
        if (newStart.distanceTo(newEnd) > 0) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([newStart, newEnd]);
            const lineMaterial = new THREE.LineBasicMaterial({ color: color });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            cubeGroup.add(line);
            edgeLines.push(line);
        }
    });

    // Create vertex points (visible when there's a gap)
    if (gap > 0) {
        const pointsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(vertices.length * 3);

        vertices.forEach((vertex, i) => {
            positions[i * 3] = vertex[0];
            positions[i * 3 + 1] = vertex[1];
            positions[i * 3 + 2] = vertex[2];
        });

        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pointsMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.05,
            sizeAttenuation: true
        });
        const points = new THREE.Points(pointsGeometry, pointsMaterial);
        cubeGroup.add(points);
        vertexPoints.push(points);
    }

    return { edgeLines, vertexPoints };
}

function updateCubeCount(count, gap = 0, color = 0x00ff00, size = 1, spacing = 1.5) {
    // Remove excess cubes
    while (cubes.length > count) {
        const cube = cubes.pop();
        scene.remove(cube);
    }

    // Add new cubes if needed
    while (cubes.length < count) {
        const cubeGroup = new THREE.Group();
        scene.add(cubeGroup);
        cubes.push(cubeGroup);
    }

    // Position and create geometry for all cubes
    cubes.forEach((cube, index) => {
        const pos = getCubePosition(index, count, spacing);
        cube.position.set(pos.x, pos.y, pos.z);
        createCubeGeometry(cube, gap, color, size);
    });
}

// Initial cube creation
updateCubeCount(1, 0, 0x00ff00, 1);

// Position camera (further back to accommodate larger grids)
camera.position.z = 10;

// Spin settings
const spinSettings = {
    rate: 0.01,
    x: true,
    y: true,
    z: false
};

// Current settings
let currentGap = 0;
let currentColor = '#00ff00';
let currentCubeCount = 1;
let currentSize = 1;
let currentSpacing = 1.5;
let currentBackgroundColor = '#000000';

// UI Controls
const spinRateSlider = document.getElementById('spinRate');
const spinRateValue = document.getElementById('spinRateValue');
const spinXCheckbox = document.getElementById('spinX');
const spinYCheckbox = document.getElementById('spinY');
const spinZCheckbox = document.getElementById('spinZ');
const cubeColorPicker = document.getElementById('cubeColor');
const backgroundColorPicker = document.getElementById('backgroundColor');
const edgeGapSlider = document.getElementById('edgeGap');
const edgeGapValue = document.getElementById('edgeGapValue');
const cubeCountSlider = document.getElementById('cubeCount');
const cubeCountValue = document.getElementById('cubeCountValue');
const cubeSizeSlider = document.getElementById('cubeSize');
const cubeSizeValue = document.getElementById('cubeSizeValue');
const cubeSpacingSlider = document.getElementById('cubeSpacing');
const cubeSpacingValue = document.getElementById('cubeSpacingValue');

// Spin rate control
spinRateSlider.addEventListener('input', (e) => {
    spinSettings.rate = parseFloat(e.target.value);
    spinRateValue.textContent = spinSettings.rate.toFixed(3);
});

// Spin axis controls
spinXCheckbox.addEventListener('change', (e) => {
    spinSettings.x = e.target.checked;
});

spinYCheckbox.addEventListener('change', (e) => {
    spinSettings.y = e.target.checked;
});

spinZCheckbox.addEventListener('change', (e) => {
    spinSettings.z = e.target.checked;
});

// Color control
cubeColorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    // Update all cubes
    cubes.forEach(cube => {
        cube.children.forEach(child => {
            if (child.material) {
                child.material.color.set(currentColor);
            }
        });
    });
});

// Background color control
backgroundColorPicker.addEventListener('input', (e) => {
    currentBackgroundColor = e.target.value;
    scene.background = new THREE.Color(currentBackgroundColor);
});

// Edge gap control
edgeGapSlider.addEventListener('input', (e) => {
    currentGap = parseFloat(e.target.value);
    edgeGapValue.textContent = currentGap.toFixed(2);

    // Recreate all cubes with new gap
    cubes.forEach(cube => {
        createCubeGeometry(cube, currentGap, currentColor, currentSize);
    });
});

// Cube count control
cubeCountSlider.addEventListener('input', (e) => {
    currentCubeCount = parseInt(e.target.value);
    cubeCountValue.textContent = currentCubeCount;
    updateCubeCount(currentCubeCount, currentGap, currentColor, currentSize, currentSpacing);
});

// Cube size control
cubeSizeSlider.addEventListener('input', (e) => {
    currentSize = parseFloat(e.target.value);
    cubeSizeValue.textContent = currentSize.toFixed(2);

    // Recreate all cubes with new size
    cubes.forEach(cube => {
        createCubeGeometry(cube, currentGap, currentColor, currentSize);
    });
});

// Cube spacing control
cubeSpacingSlider.addEventListener('input', (e) => {
    currentSpacing = parseFloat(e.target.value);
    cubeSpacingValue.textContent = currentSpacing.toFixed(2);

    // Reposition all cubes with new spacing
    cubes.forEach((cube, index) => {
        const pos = getCubePosition(index, currentCubeCount, currentSpacing);
        cube.position.set(pos.x, pos.y, pos.z);
    });
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate all cubes based on settings
    cubes.forEach(cube => {
        if (spinSettings.x) cube.rotation.x += spinSettings.rate;
        if (spinSettings.y) cube.rotation.y += spinSettings.rate;
        if (spinSettings.z) cube.rotation.z += spinSettings.rate;
    });

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
