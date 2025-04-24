import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "../hooks/use-is-mobile";

interface OrbitCameraProps {
  target?: THREE.Vector3;
  enableZoom?: boolean;
  autoRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  enablePan?: boolean;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  followTarget?: boolean;
}

export function OrbitCamera({
  target = new THREE.Vector3(0, 1, 0),
  enableZoom = true,
  autoRotate = false,
  minDistance = 3,
  maxDistance = 15,
  enablePan = false,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI / 2 - 0.1, // Slightly less than 90 degrees to prevent seeing under the ground
  followTarget = true,
}: OrbitCameraProps) {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();
  const isMobile = useIsMobile();
  
  // Set up camera to follow target
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      
      // Initialize camera position
      const offset = new THREE.Vector3(0, 3, 8);
      camera.position.copy(target).add(offset);
      
      // Update controls
      controlsRef.current.update();
    }
  }, [camera, target]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera]}
      enableZoom={enableZoom}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      minDistance={minDistance}
      maxDistance={maxDistance}
      enablePan={enablePan}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={isMobile ? 0.5 : 0.8}
      zoomSpeed={0.7}
      makeDefault
    />
  );
}