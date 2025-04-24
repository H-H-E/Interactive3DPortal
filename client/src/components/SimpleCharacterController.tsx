import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../hooks/useControls';
import { usePortals } from '../lib/stores/usePortals';
import { PORTAL_INTERACTION_DISTANCE } from '../lib/constants';

// Create a simple colored box character model
function BoxCharacter(props: { color?: string }) {
  const { color = 'blue' } = props;
  
  return (
    <group>
      {/* Main character body */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Direction indicator (narrow part points forward) */}
      <mesh castShadow receiveShadow position={[0, 0.5, -0.6]}>
        <boxGeometry args={[0.4, 0.4, 0.2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </group>
  );
}

export function SimpleCharacterController() {
  // Setup refs
  const characterRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  
  // Character settings
  const speed = 25;  // Very high to ensure it's noticeable
  const turnSpeed = 5;
  
  // Get Three.js objects
  const { camera, scene } = useThree();
  
  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Get portal state
  const { portals, setNearPortal, enterPortal, nearPortal } = usePortals();
  
  // Initialize character
  useEffect(() => {
    if (characterRef.current) {
      // Set initial position
      characterRef.current.position.set(0, 0, 0);
      console.log("Simple character controller initialized");
      console.log("Use WASD to move, E to interact with portals");
    }
  }, []);
  
  // Game loop
  useFrame((state, delta) => {
    if (!characterRef.current) return;
    
    const character = characterRef.current;
    
    // Get current control states
    const { forward, backward, leftward, rightward, interact } = getKeys();
    
    // Calculate direction
    const direction = new THREE.Vector3();
    
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (leftward) direction.x -= 1;
    if (rightward) direction.x += 1;
    
    // Only normalize if we're moving
    if (direction.length() > 0) {
      direction.normalize();
      
      // Convert to world space direction
      const angle = Math.atan2(direction.x, direction.z);
      character.rotation.y = angle;
    }
    
    // Apply movement in the direction the character is facing
    if (direction.length() > 0) {
      // Calculate forward vector based on character's rotation
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(character.quaternion);
      forward.multiplyScalar(speed * delta);
      
      // Apply movement
      character.position.add(forward.multiplyScalar(direction.length()));
      
      // Debug visual feedback (green sphere above player when moving)
      const indicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 'green', transparent: true, opacity: 0.7 })
      );
      indicator.position.set(
        character.position.x, 
        character.position.y + 3, 
        character.position.z
      );
      scene.add(indicator);
      
      // Clean up indicator
      setTimeout(() => scene.remove(indicator), 100);
      
      // Log position occasionally
      if (Math.random() < 0.05) {
        console.log(`Character position: ${character.position.x.toFixed(2)}, ${character.position.y.toFixed(2)}, ${character.position.z.toFixed(2)}`);
      }
    }
    
    // Update camera to follow character
    const idealOffset = new THREE.Vector3(-0, 7, 10); // Behind and above
    const idealLookAt = new THREE.Vector3(0, 0, -5); // Slightly ahead
    
    // Transform ideal offset to character's local space
    const cameraOffset = idealOffset.clone().applyQuaternion(character.quaternion);
    const targetPosition = character.position.clone().add(cameraOffset);
    
    // Transform ideal lookAt to character's local space
    const cameraLookAt = idealLookAt.clone().applyQuaternion(character.quaternion);
    const targetLookAt = character.position.clone().add(cameraLookAt);
    
    // Smoothly move camera
    camera.position.lerp(targetPosition, 0.1);
    
    // Make camera look at a point slightly ahead of character
    camera.lookAt(targetLookAt);
    
    // Portal interaction
    if (portals.length > 0) {
      // Find closest portal within interaction distance
      let closestPortal = null;
      let closestDistance = PORTAL_INTERACTION_DISTANCE;
      
      for (const portal of portals) {
        const portalPos = new THREE.Vector3(...portal.position);
        const distance = portalPos.distanceTo(character.position);
        
        if (distance < closestDistance) {
          closestPortal = portal;
          closestDistance = distance;
        }
      }
      
      // Update near portal
      setNearPortal(closestPortal);
      
      // Check for interaction
      if (interact && nearPortal) {
        console.log(`Entering portal to ${nearPortal.destination}`);
        enterPortal();
      }
    }
  });
  
  return (
    <group ref={characterRef}>
      <BoxCharacter color="dodgerblue" />
    </group>
  );
}