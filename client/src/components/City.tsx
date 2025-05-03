import { useMemo } from "react";
import * as THREE from "three";
import { Building } from "./Building";
import { useTexture } from "@react-three/drei";
import { WORLD_SIZE } from "../lib/constants";
import { SpeechBubble } from "./SpeechBubble";

export function City() {
  // Create multiple buildings with predefined positions
  const buildings = useMemo(() => {
    const buildingData = [
      { position: [5, 0, -5], height: 3, width: 2, depth: 2, color: "#8a8a8a" },
      { position: [-5, 0, -5], height: 4, width: 2, depth: 3, color: "#6c6c6c" },
      { position: [8, 0, -8], height: 6, width: 3, depth: 3, color: "#757575" },
      { position: [-8, 0, -8], height: 5, width: 3, depth: 2, color: "#9a9a9a" },
      { position: [12, 0, 0], height: 8, width: 4, depth: 4, color: "#7a7a7a" },
      { position: [-12, 0, 0], height: 7, width: 4, depth: 3, color: "#8c8c8c" },
      { position: [0, 0, -12], height: 10, width: 5, depth: 5, color: "#707070" },
    ];

    return buildingData.map((building, index) => (
      <Building
        key={`building-${index}`}
        position={building.position as [number, number, number]}
        height={building.height}
        width={building.width}
        depth={building.depth}
        color={building.color}
      />
    ));
  }, []);

  // Load road texture
  const asphaltTexture = useTexture("/textures/asphalt.png");
  
  // Configure road texture
  const roadTextureConfig = useMemo(() => {
    asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(5, 5);
    
    return {
      map: asphaltTexture,
    };
  }, [asphaltTexture]);

  return (
    <group>
      {/* City buildings */}
      {buildings}
      
      {/* Roads */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.01, 0]} 
        receiveShadow
      >
        <planeGeometry args={[5, WORLD_SIZE]} />
        <meshStandardMaterial 
          {...roadTextureConfig} 
          color="#555555"
        />
      </mesh>
      
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.01, 0]} 
        receiveShadow
      >
        <planeGeometry args={[WORLD_SIZE, 5]} />
        <meshStandardMaterial 
          {...roadTextureConfig} 
          color="#555555"
        />
      </mesh>
      
      {/* Info speech bubbles */}
      <SpeechBubble
        position={[0, 2, 0]}
        content="Welcome to the city! Use WASD to move and E to interact with portals."
        duration={10000}
      />
      
      <SpeechBubble
        position={[8, 2, 8]}
        content="Check out the portals to visit other areas!"
        duration={15000}
      />
    </group>
  );
}
