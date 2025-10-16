import * as THREE from "three";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Array to hold all polyhedron groups
let polyhedrons = [];

// Polyhedron data structures
const polyhedronData = {
  4: {
    // Tetrahedron
    vertices: (size = 1) => {
      const scale = size / Math.sqrt(3); // normalize to match other shapes
      const a = scale;
      return [
        [a, a, a],
        [a, -a, -a],
        [-a, a, -a],
        [-a, -a, a],
      ];
    },
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  },
  6: {
    // Cube
    vertices: (size = 1) => {
      const half = size / 2;
      return [
        [-half, -half, -half],
        [half, -half, -half],
        [half, half, -half],
        [-half, half, -half],
        [-half, -half, half],
        [half, -half, half],
        [half, half, half],
        [-half, half, half],
      ];
    },
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0], // front face
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4], // back face
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7], // connecting edges
    ],
  },
  8: {
    // Octahedron
    vertices: (size = 1) => {
      const s = size / Math.sqrt(2); // normalize to match object size
      return [
        [s, 0, 0],
        [-s, 0, 0], // right, left
        [0, s, 0],
        [0, -s, 0], // top, bottom
        [0, 0, s],
        [0, 0, -s], // front, back
      ];
    },
    edges: [
      [0, 2],
      [0, 4],
      [0, 3],
      [0, 5], // right vertex
      [1, 2],
      [1, 4],
      [1, 3],
      [1, 5], // left vertex
      [2, 4],
      [2, 5],
      [3, 4],
      [3, 5], // middle edges
    ],
  },
  12: {
    // Dodecahedron
    vertices: (size = 1) => {
      const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
      const scale = size / (2 * Math.sqrt(3)); // normalize size
      const a = scale;
      const b = scale / phi;
      const c = scale * phi;
      return [
        [a, a, a],
        [a, a, -a],
        [a, -a, a],
        [a, -a, -a],
        [-a, a, a],
        [-a, a, -a],
        [-a, -a, a],
        [-a, -a, -a],
        [0, b, c],
        [0, b, -c],
        [0, -b, c],
        [0, -b, -c],
        [b, c, 0],
        [b, -c, 0],
        [-b, c, 0],
        [-b, -c, 0],
        [c, 0, b],
        [c, 0, -b],
        [-c, 0, b],
        [-c, 0, -b],
      ];
    },
    edges: [
      [0, 8],
      [0, 12],
      [0, 16],
      [1, 9],
      [1, 12],
      [1, 17],
      [2, 10],
      [2, 13],
      [2, 16],
      [3, 11],
      [3, 13],
      [3, 17],
      [4, 8],
      [4, 14],
      [4, 18],
      [5, 9],
      [5, 14],
      [5, 19],
      [6, 10],
      [6, 15],
      [6, 18],
      [7, 11],
      [7, 15],
      [7, 19],
      [8, 10],
      [9, 11],
      [12, 14],
      [13, 15],
      [16, 17],
      [18, 19],
    ],
  },
  20: {
    // Icosahedron
    vertices: (size = 1) => {
      const phi = (1 + Math.sqrt(5)) / 2;
      const scale = size / (2 * phi); // normalize size
      const a = scale;
      const b = scale * phi;
      return [
        [0, a, b],
        [0, a, -b],
        [0, -a, b],
        [0, -a, -b],
        [a, b, 0],
        [a, -b, 0],
        [-a, b, 0],
        [-a, -b, 0],
        [b, 0, a],
        [b, 0, -a],
        [-b, 0, a],
        [-b, 0, -a],
      ];
    },
    edges: [
      [0, 2],
      [0, 4],
      [0, 6],
      [0, 8],
      [0, 10],
      [1, 3],
      [1, 4],
      [1, 6],
      [1, 9],
      [1, 11],
      [2, 5],
      [2, 7],
      [2, 8],
      [2, 10],
      [3, 5],
      [3, 7],
      [3, 9],
      [3, 11],
      [4, 6],
      [4, 8],
      [4, 9],
      [5, 7],
      [5, 8],
      [5, 9],
      [6, 10],
      [6, 11],
      [7, 10],
      [7, 11],
      [8, 9],
      [10, 11],
    ],
  },
};

// Legacy functions for backward compatibility
const edges = polyhedronData[6].edges;
function getVertices(size = 1) {
  return polyhedronData[6].vertices(size);
}

// Calculate positions for multiple objects in a grid
function getObjPosition(index, total, spacing = 1.5) {
  if (total === 1) return { x: 0, y: 0, z: 0 };

  const gridSize = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;

  // Center the grid
  const offsetX = ((gridSize - 1) * spacing) / 2;
  const offsetY = ((gridSize - 1) * spacing) / 2;

  return {
    x: col * spacing - offsetX,
    y: -row * spacing + offsetY,
    z: 0,
  };
}

function createObjGeometry(
  objGroup,
  gap = 0,
  color = 0x00ff00,
  size = 1,
  shapeType = 6,
) {
  // Remove existing children from this group
  while (objGroup.children.length > 0) {
    objGroup.remove(objGroup.children[0]);
  }

  const edgeLines = [];
  const vertexPoints = [];

  // Get vertices and edges for the selected polyhedron type
  const polyhedron = polyhedronData[shapeType];
  const vertices = polyhedron.vertices(size);
  const edgeList = polyhedron.edges;

  // Create edge lines with gaps
  edgeList.forEach(([startIdx, endIdx]) => {
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
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        newStart,
        newEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: color });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      objGroup.add(line);
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

    pointsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    const pointsMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.05,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    objGroup.add(points);
    vertexPoints.push(points);
  }

  return { edgeLines, vertexPoints };
}

function updateObjCount(
  count,
  gap = 0,
  color = 0x00ff00,
  size = 1,
  spacing = 1.5,
  shapeType = 6,
) {
  // Remove excess objects
  while (polyhedrons.length > count) {
    const polyhedron = polyhedrons.pop();
    scene.remove(polyhedron);
  }

  // Add new objects if needed
  while (polyhedrons.length < count) {
    const objGroup = new THREE.Group();
    scene.add(objGroup);
    polyhedrons.push(objGroup);
  }

  // Position and create geometry for all objects
  polyhedrons.forEach((polyhedron, index) => {
    const pos = getObjPosition(index, count, spacing);
    polyhedron.position.set(pos.x, pos.y, pos.z);
    createObjGeometry(polyhedron, gap, color, size, shapeType);
  });
}

// Initial object creation
updateObjCount(1, 0, 0x00ff00, 1, 1.5, 6);

// Position camera (further back to accommodate larger grids)
camera.position.z = 10;

// Spin settings
const spinSettings = {
  rate: 0.01,
  x: true,
  y: true,
  z: false,
};

// Color cycling settings
const colorCycleSettings = {
  enabled: false,
  rate: 0.5,
  hue: 0,
};

// Current settings
let currentGap = 0;
let currentColor = "#00ff00";
let currentObjCount = 1;
let currentSize = 1;
let currentSpacing = 1.5;
let currentBackgroundColor = "#000000";
let currentShapeType = 6;

// UI Controls
const spinRateSlider = document.getElementById("spinRate");
const spinRateValue = document.getElementById("spinRateValue");
const spinXCheckbox = document.getElementById("spinX");
const spinYCheckbox = document.getElementById("spinY");
const spinZCheckbox = document.getElementById("spinZ");
const colorPicker = document.getElementById("color");
const backgroundColorPicker = document.getElementById("backgroundColor");
const edgeGapSlider = document.getElementById("edgeGap");
const edgeGapValue = document.getElementById("edgeGapValue");
const countSlider = document.getElementById("count");
const countValue = document.getElementById("countValue");
const sizeSlider = document.getElementById("size");
const sizeValue = document.getElementById("sizeValue");
const spacingSlider = document.getElementById("spacing");
const spacingValue = document.getElementById("spacingValue");
const captureButton = document.getElementById("captureButton");
const toggleButton = document.getElementById("toggleButton");
const controlsPanel = document.querySelector(".controls");
const shapeTypeSelect = document.getElementById("shapeType");
const colorCycleToggle = document.getElementById("colorCycleToggle");
const colorCycleRateSlider = document.getElementById("colorCycleRate");
const colorCycleRateValue = document.getElementById("colorCycleRateValue");

// Spin rate control
spinRateSlider.addEventListener("input", (e) => {
  spinSettings.rate = parseFloat(e.target.value);
  spinRateValue.textContent = spinSettings.rate.toFixed(3);
});

// Spin axis controls
spinXCheckbox.addEventListener("change", (e) => {
  spinSettings.x = e.target.checked;
});

spinYCheckbox.addEventListener("change", (e) => {
  spinSettings.y = e.target.checked;
});

spinZCheckbox.addEventListener("change", (e) => {
  spinSettings.z = e.target.checked;
});

// Shape type control
shapeTypeSelect.addEventListener("change", (e) => {
  currentShapeType = parseInt(e.target.value);
  // Recreate all obj with new shape
  polyhedrons.forEach((polyhedron) => {
    createObjGeometry(
      polyhedron,
      currentGap,
      currentColor,
      currentSize,
      currentShapeType,
    );
  });
});

// Color control
colorPicker.addEventListener("input", (e) => {
  currentColor = e.target.value;
  // Disable color cycling when manually setting color
  if (colorCycleSettings.enabled) {
    colorCycleSettings.enabled = false;
    colorCycleToggle.checked = false;
  }
  // Update all objects
  polyhedrons.forEach((polyhedron) => {
    polyhedron.children.forEach((child) => {
      if (child.material) {
        child.material.color.set(currentColor);
      }
    });
  });
});

// Color cycling toggle
colorCycleToggle.addEventListener("change", (e) => {
  colorCycleSettings.enabled = e.target.checked;
  if (!colorCycleSettings.enabled) {
    // Reset to the manual color when disabling
    polyhedrons.forEach((polyhedron) => {
      polyhedron.children.forEach((child) => {
        if (child.material) {
          child.material.color.set(currentColor);
        }
      });
    });
  }
});

// Color cycle rate control
colorCycleRateSlider.addEventListener("input", (e) => {
  colorCycleSettings.rate = parseFloat(e.target.value);
  colorCycleRateValue.textContent = colorCycleSettings.rate.toFixed(2);
});

// Background color control
backgroundColorPicker.addEventListener("input", (e) => {
  currentBackgroundColor = e.target.value;
  scene.background = new THREE.Color(currentBackgroundColor);
});

// Edge gap control
edgeGapSlider.addEventListener("input", (e) => {
  currentGap = parseFloat(e.target.value);
  edgeGapValue.textContent = currentGap.toFixed(2);

  // Recreate all objects with new gap
  polyhedrons.forEach((polyhedron) => {
    createObjGeometry(
      polyhedron,
      currentGap,
      currentColor,
      currentSize,
      currentShapeType,
    );
  });
});

// Count control
countSlider.addEventListener("input", (e) => {
  currentObjCount = parseInt(e.target.value);
  countValue.textContent = currentObjCount;
  updateObjCount(
    currentObjCount,
    currentGap,
    currentColor,
    currentSize,
    currentSpacing,
    currentShapeType,
  );
});

// Size control
sizeSlider.addEventListener("input", (e) => {
  currentSize = parseFloat(e.target.value);
  sizeValue.textContent = currentSize.toFixed(2);

  // Recreate all objects with new size
  polyhedrons.forEach((polyhedron) => {
    createObjGeometry(
      polyhedron,
      currentGap,
      currentColor,
      currentSize,
      currentShapeType,
    );
  });
});

// Spacing control
spacingSlider.addEventListener("input", (e) => {
  currentSpacing = parseFloat(e.target.value);
  spacingValue.textContent = currentSpacing.toFixed(2);

  // Reposition all objects with new spacing
  polyhedrons.forEach((polyhedron, index) => {
    const pos = getObjPosition(index, currentObjCount, currentSpacing);
    polyhedron.position.set(pos.x, pos.y, pos.z);
  });
});

// Toggle control panel functionality
toggleButton.addEventListener("click", () => {
  controlsPanel.classList.toggle("collapsed");
  toggleButton.textContent = controlsPanel.classList.contains("collapsed")
    ? "+"
    : "−";
});

// Capture frame functionality
let captureCount = 0;

captureButton.addEventListener("click", () => {
  // Render current frame
  renderer.render(scene, camera);

  // Get the canvas data as a PNG
  const canvas = renderer.domElement;
  canvas.toBlob((blob) => {
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `captures/capture_${timestamp}_${String(captureCount).padStart(4, "0")}.png`;

    link.href = url;
    link.download = filename;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
    captureCount++;

    // Visual feedback
    captureButton.textContent = "Captured!";
    setTimeout(() => {
      captureButton.textContent = "Capture Frame";
    }, 500);
  }, "image/png");
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate all objects based on settings
  polyhedrons.forEach((polyhedron) => {
    if (spinSettings.x) polyhedron.rotation.x += spinSettings.rate;
    if (spinSettings.y) polyhedron.rotation.y += spinSettings.rate;
    if (spinSettings.z) polyhedron.rotation.z += spinSettings.rate;
  });

  // Color cycling
  if (colorCycleSettings.enabled) {
    colorCycleSettings.hue =
      (colorCycleSettings.hue + colorCycleSettings.rate) % 360;
    const color = new THREE.Color().setHSL(
      colorCycleSettings.hue / 360,
      1,
      0.5,
    );

    // Update all polyhedron colors
    polyhedrons.forEach((polyhedron) => {
      polyhedron.children.forEach((child) => {
        if (child.material) {
          child.material.color.copy(color);
        }
      });
    });
  }

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
