import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GeneratedGeometry } from "../../geometry";
import { RotateCcw, Layers, Loader2 } from "lucide-react";

interface ThreeViewportProps {
  geometry: GeneratedGeometry | null;
  isLoading: boolean;
  error?: string | null;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  geometry,
  isLoading,
  error,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);

  const [wireframeEnabled, setWireframeEnabled] = useState(false);

  // Initialize Scene, Camera, Lights, Grid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0e0f12");
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(60, 50, 70);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 10);
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't flip below ground
    controlsRef.current = controls;

    // 5. Lighting: Studio 3-point light
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight("#fff5eb", 1.8);
    keyLight.position.set(50, 80, 50);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#cbe3f7", 0.9);
    fillLight.position.set(-60, 30, -40);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight("#f59e0b", 0.6);
    rimLight.position.set(0, -50, 60);
    scene.add(rimLight);

    // 6. Grid Helper (1mm minor, 10mm major)
    const grid = new THREE.GridHelper(120, 24, "#f59e0b", "#272a33");
    grid.rotation.x = Math.PI / 2; // Lie on XY ground plane
    scene.add(grid);

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Geometry when changed
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !geometry) return;

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current = null;
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      wireframeMeshRef.current = null;
    }

    // Build Three.js BufferGeometry from manifold data
    const bufferGeo = new THREE.BufferGeometry();
    bufferGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(geometry.positions, 3)
    );
    bufferGeo.setAttribute(
      "normal",
      new THREE.BufferAttribute(geometry.normals, 3)
    );
    bufferGeo.setIndex(new THREE.BufferAttribute(geometry.indices, 1));

    // Center model on ground
    bufferGeo.computeBoundingBox();
    const box = bufferGeo.boundingBox;
    if (box) {
      const centerX = (box.min.x + box.max.x) / 2;
      const centerY = (box.min.y + box.max.y) / 2;
      const minZ = box.min.z;
      bufferGeo.translate(-centerX, -centerY, -minZ);
    }

    // Solid printable material (amber/industrial nylon look)
    const material = new THREE.MeshStandardMaterial({
      color: "#e28704",
      roughness: 0.32,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const mesh = new THREE.Mesh(bufferGeo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: "#fde68a",
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(bufferGeo, wireMat);
    wireMesh.visible = wireframeEnabled;
    scene.add(wireMesh);
    wireframeMeshRef.current = wireMesh;

    // Adjust camera target
    if (controlsRef.current && box) {
      const height = box.max.z - box.min.z;
      controlsRef.current.target.set(0, 0, height / 2);
    }
  }, [geometry]);

  // Toggle Wireframe
  useEffect(() => {
    if (wireframeMeshRef.current) {
      wireframeMeshRef.current.visible = wireframeEnabled;
    }
  }, [wireframeEnabled]);

  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(60, 50, 70);
    controlsRef.current.target.set(0, 0, 10);
    controlsRef.current.update();
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0e0f12] overflow-hidden select-none">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0e0f12]/60 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#18191e] border border-amber-500/40 text-amber-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Building CSG Geometry...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-4 left-4 right-4 p-3 rounded-lg bg-red-950/70 border border-red-500/40 text-xs text-red-200 z-20">
          <p className="font-semibold text-red-300">Geometry Error</p>
          <p className="text-[11px] font-mono mt-0.5">{error}</p>
        </div>
      )}

      {/* Viewport Top HUD: Stats */}
      {geometry && (
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 pointer-events-none">
          <div className="bg-[#18191e]/85 backdrop-blur px-2.5 py-1 rounded border border-[#2b2e37] text-[11px] font-mono text-[#9ea3b0]">
            <span className="text-[#6b7280]">Bounding Box: </span>
            <span className="text-amber-400 font-semibold">
              {geometry.boundingBox.dimensions[0].toFixed(1)} × {geometry.boundingBox.dimensions[1].toFixed(1)} × {geometry.boundingBox.dimensions[2].toFixed(1)} mm
            </span>
          </div>
          <div className="bg-[#18191e]/85 backdrop-blur px-2.5 py-1 rounded border border-[#2b2e37] text-[11px] font-mono text-[#9ea3b0]">
            <span className="text-[#6b7280]">Mesh: </span>
            <span className="text-[#f4f4f6]">{geometry.triangleCount.toLocaleString()} tris</span>
            <span className="text-[#6b7280] mx-1">•</span>
            <span className="text-[#f4f4f6]">{(geometry.volumeMm3 / 1000).toFixed(2)} cm³</span>
          </div>
        </div>
      )}

      {/* Viewport Floating Controls */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2 z-10">
        <button
          type="button"
          onClick={() => setWireframeEnabled(!wireframeEnabled)}
          title="Toggle Wireframe"
          className={`p-2 rounded-md border text-xs transition-colors shadow-md ${
            wireframeEnabled
              ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
              : "bg-[#18191e]/90 text-[#9ea3b0] border-[#2b2e37] hover:text-[#f4f4f6] hover:bg-[#212329]"
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset View"
          className="p-2 rounded-md bg-[#18191e]/90 text-[#9ea3b0] border border-[#2b2e37] hover:text-[#f4f4f6] hover:bg-[#212329] transition-colors shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Viewport Bottom Hint */}
      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-[#6b7280] pointer-events-none">
        Left Click: Rotate • Right Click: Pan • Scroll: Zoom
      </div>
    </div>
  );
};
