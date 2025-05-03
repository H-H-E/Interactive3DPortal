import { useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { SpeechBubble } from "./SpeechBubble";

interface BuildingProps {
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  color?: string;
  interactive?: boolean;
}

export function Building({
  position,
  height,
  width,
  depth,
  color = "#888888",
  interactive = true,
}: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const buildingRef = useRef<THREE.Group>(null);
  
  // Load building texture
  const wallTexture = useTexture("/textures/wood.jpg");
  
  // Configure wall texture
  const wallTextureConfig = useMemo(() => {
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(width, height / 2);
    
    return {
      map: wallTexture,
    };
  }, [wallTexture, width, height]);
  
  // Building name and description for interactive buildings
  const buildingInfo = useMemo(() => {
    const names = ["Town Hall", "Library", "Museum", "Office", "Apartment", "School", "Hotel"];
    const name = names[Math.floor(Math.random() * names.length)];
    return {
      name,
      description: `This is the ${name}. A fine building indeed!`
    };
  }, []);
  
  // Hover effect and interaction
  useFrame(() => {
    if (buildingRef.current && interactive) {
      // Subtle hover effect
      const targetColor = hovered ? new THREE.Color(color).multiplyScalar(1.2) : new THREE.Color(color);
      
      // Apply to all meshes in the group
      buildingRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.lerp(targetColor, 0.1);
        }
      });
    }
  });
  
  // Building position with half height to align bottom with ground
  const buildingPosition: [number, number, number] = [
    position[0],
    position[1] + height / 2,
    position[2]
  ];
  
  return (
    <group 
      ref={buildingRef}
      position={buildingPosition}
      onPointerOver={() => {
        if (interactive) {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        if (interactive) {
          setHovered(false);
          document.body.style.cursor = "auto";
        }
      }}
      onClick={() => {
        if (interactive) {
          setShowInfo(!showInfo);
        }
      }}
    >
      {/* Main building body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          {...wallTextureConfig} 
          color={color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, height / 2 + 0.1, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
        <meshStandardMaterial color="#553333" />
      </mesh>
      
      {/* Windows - front side */}
      {Array.from({ length: Math.floor(height / 1.5) }).map((_, i) => (
        <mesh 
          key={`window-front-${i}`} 
          position={[0, -height / 2 + 1 + i * 1.5, depth / 2 + 0.01]} 
        >
          <planeGeometry args={[width * 0.6, 0.8]} />
          <meshStandardMaterial 
            color="#5ba8ff"
            emissive="#102030"
            emissiveIntensity={0.3}
            roughness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
      
      {/* Windows - back side */}
      {Array.from({ length: Math.floor(height / 1.5) }).map((_, i) => (
        <mesh 
          key={`window-back-${i}`} 
          position={[0, -height / 2 + 1 + i * 1.5, -depth / 2 - 0.01]} 
          rotation={[0, Math.PI, 0]} 
        >
          <planeGeometry args={[width * 0.6, 0.8]} />
          <meshStandardMaterial 
            color="#5ba8ff"
            emissive="#102030"
            emissiveIntensity={0.3}
            roughness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
      
      {/* Speech bubble with building info */}
      {showInfo && (
        <SpeechBubble
          position={[0, height / 2 + 1.5, 0]}
          content={buildingInfo.description}
          width={3}
          height={1.2}
        />
      )}
      
      {/* Building name on hover */}
      {hovered && !showInfo && (
        <SpeechBubble
          position={[0, height / 2 + 1, 0]}
          content={buildingInfo.name}
          width={2}
          height={0.8}
        />
      )}
    </group>
  );
}
