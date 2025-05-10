import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Define our control scheme
export enum Controls {
  forward = "forward",
  backward = "backward",
  leftward = "leftward",
  rightward = "rightward",
  jump = "jump",
  interact = "interact",
}

// Character movement hook
export const useCharacterControls = (
  speed = 5,
  rotationSpeed = 3,
) => {
  // We don't want React to re-render when we read key states
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Track character state
  const characterRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const rotation = useRef(0);
  const isMoving = useRef(false);
  
  useFrame((state, delta) => {
    if (!characterRef.current) return;
    
    const character = characterRef.current;
    const velocity = velocityRef.current;
    
    // Get current key states
    const { forward, backward, leftward, rightward } = getKeys();
    
    // Reset velocity
    velocity.set(0, 0, 0);
    
    // Calculate movement direction
    if (forward) {
      velocity.z = -speed * delta;
    } else if (backward) {
      velocity.z = speed * delta;
    }
    
    if (leftward) {
      rotation.current += rotationSpeed * delta;
    } else if (rightward) {
      rotation.current -= rotationSpeed * delta;
    }
    
    // Apply movement
    if (forward || backward) {
      isMoving.current = true;
      
      // Apply rotation to movement direction
      velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current);
      
      // Move character
      character.position.add(velocity);
    } else {
      isMoving.current = false;
    }
    
    // Update rotation
    character.rotation.y = rotation.current;
    
    // Debug log for movement status
    if (Math.random() < 0.01) { // Log rarely to avoid console spam
      console.log(`[Controls] Position: ${character.position.x.toFixed(2)}, ${character.position.z.toFixed(2)}, Moving: ${isMoving.current}`);
    }
  });
  
  return {
    characterRef,
    isMoving,
    velocityRef,
  };
};

// Hook for checking interaction controls
export const useInteractionControls = (callback: () => void) => {
  const [subscribeKeys, getKeys] = useKeyboardControls<Controls>();

  useFrame(() => {
    const { interact } = getKeys();
    if (interact) {
      callback();
    }
  });
};
