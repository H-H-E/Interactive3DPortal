import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useCharacterControls } from "../hooks/useControls";
import { usePortals, Portal } from "../lib/stores/usePortals";

const CHARACTER_SCALE = 0.8;
const CHARACTER_HEIGHT = 1.8;
const CHARACTER_RADIUS = 0.4;

// Simple character model
export function Character() {
  const { characterRef, isMoving } = useCharacterControls();
  const { nearPortal, setNearPortal, portals } = usePortals();
  
  // Collision detection sphere
  const collisionSphere = useRef(new THREE.Sphere(new THREE.Vector3(), CHARACTER_RADIUS));
  
  // Character movement animation
  useFrame(() => {
    if (!characterRef.current) return;
    
    // Update collision sphere position
    collisionSphere.current.center.copy(characterRef.current.position);
    collisionSphere.current.center.y += CHARACTER_HEIGHT / 2;
    
    // Check portal proximity
    let isNearAnyPortal = false;
    let nearestPortal: Portal | null = null;
    let shortestDistance = 5; // Detection radius
    
    // Explicitly cast portals as Portal[] to fix type issue
    const typedPortals = portals as Portal[];
    
    for (const portal of typedPortals) {
      const distance = characterRef.current.position.distanceTo(
        new THREE.Vector3(portal.position[0], portal.position[1], portal.position[2])
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestPortal = portal;
        isNearAnyPortal = true;
      }
    }
    
    // Check if the nearest portal is different from the current one
    if (isNearAnyPortal && nearestPortal && nearestPortal.id !== nearPortal?.id) {
      setNearPortal(nearestPortal);
    } else if (!isNearAnyPortal && nearPortal) {
      setNearPortal(null);
    }
  });
  
  return (
    <group ref={characterRef} position={[0, 0, 0]} dispose={null} name="character">
      {/* Simple character representation */}
      <mesh position={[0, CHARACTER_HEIGHT / 2, 0]} castShadow>
        <capsuleGeometry args={[CHARACTER_RADIUS, CHARACTER_HEIGHT - CHARACTER_RADIUS * 2, 4, 8]} />
        <meshStandardMaterial color={isMoving.current ? "#2c9aff" : "#4285f4"} />
      </mesh>
      
      {/* Character eyes for direction reference */}
      <mesh position={[0, CHARACTER_HEIGHT - 0.3, CHARACTER_RADIUS - 0.1]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.2, CHARACTER_HEIGHT - 0.3, CHARACTER_RADIUS - 0.05]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.2, CHARACTER_HEIGHT - 0.3, CHARACTER_RADIUS - 0.05]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  );
}
