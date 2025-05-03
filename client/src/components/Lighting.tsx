import { useRef } from "react";
import * as THREE from "three";
import { useHelper } from "@react-three/drei";

export function Lighting() {
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  
  // Uncomment for debugging light direction
  // useHelper(directionalRef, THREE.DirectionalLightHelper, 5, "red");
  
  return (
    <>
      {/* Ambient light for global illumination */}
      <ambientLight intensity={0.5} />
      
      {/* Main directional light with shadows */}
      <directionalLight
        ref={directionalRef}
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Hemisphere light for better environment lighting */}
      <hemisphereLight 
        args={["#b1e1ff", "#b97a20", 0.7]} 
      />
    </>
  );
}
