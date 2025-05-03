import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { WORLD_SIZE } from "../lib/constants";

export function Ground() {
  // Load ground textures
  const grassTexture = useTexture("/textures/grass.png");
  
  // Configure texture repeat for tiling
  const textureConfig = useMemo(() => {
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(WORLD_SIZE / 10, WORLD_SIZE / 10);
    grassTexture.encoding = THREE.sRGBEncoding;
    
    return {
      map: grassTexture,
      normalScale: new THREE.Vector2(0.15, 0.15),
    };
  }, [grassTexture]);
  
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow
    >
      <planeGeometry args={[WORLD_SIZE, WORLD_SIZE, 32, 32]} />
      <meshStandardMaterial 
        {...textureConfig} 
        color="#88ff88"
        roughness={0.8}
      />
    </mesh>
  );
}
