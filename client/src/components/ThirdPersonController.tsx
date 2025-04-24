import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../hooks/useControls';
import { useIsMobile } from '../hooks/use-is-mobile';
import { CharacterModel } from './CharacterModel';
import { usePortals } from '../lib/stores/usePortals';
import { PORTAL_INTERACTION_DISTANCE } from '../lib/constants';

// Character properties
const SPEED = 15; // Very high speed to make movement obvious
const CAMERA_HEIGHT = 5;
const CAMERA_DISTANCE = 8;

export function ThirdPersonController() {
  // Refs
  const characterRef = useRef<THREE.Group>(null);
  const directionRef = useRef(new THREE.Vector3());
  const cameraTargetRef = useRef(new THREE.Vector3());
  
  // State
  const [isMoving, setIsMoving] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  
  // Controls
  const { camera, scene } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Portal state
  const portals = usePortals(state => state.portals);
  const setNearPortal = usePortals(state => state.setNearPortal);
  const enterPortal = usePortals(state => state.enterPortal);
  const nearPortal = usePortals(state => state.nearPortal);
  const isNearPortal = nearPortal !== null;
  
  // Setup initial position
  useEffect(() => {
    // Set character at origin
    if (characterRef.current) {
      characterRef.current.position.set(0, 0, 0);
    }
    
    // Set camera behind character
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    
    console.log("Third-person controller initialized");
    console.log("WASD: move, Mouse: look (unavailable in this version)");
  }, [camera]);
  
  // Main game loop
  useFrame((state, delta) => {
    if (!characterRef.current) return;
    
    // Get character reference
    const character = characterRef.current;
    
    // Get keyboard state
    const { forward, backward, leftward, rightward, interact } = getKeys();
    
    // Calculate if moving
    const moving = forward || backward || leftward || rightward;
    setIsMoving(moving);
    
    // Create a movement vector
    const movement = new THREE.Vector3();
    
    if (forward) movement.z -= 1;
    if (backward) movement.z += 1;
    if (leftward) movement.x -= 1;
    if (rightward) movement.x += 1;
    
    // Normalize for consistent speed in diagonal movement
    if (movement.length() > 0) {
      movement.normalize();
    }
    
    // Apply speed and delta time
    movement.multiplyScalar(SPEED * delta);
    
    // Move character
    if (moving) {
      character.position.add(movement);
      
      // Point character in movement direction
      if (movement.length() > 0) {
        const angle = Math.atan2(movement.x, movement.z);
        character.rotation.y = angle;
        console.log(`Character facing: ${angle.toFixed(2)} radians`);
      }
      
      // Create visual indicator (green box above character)
      const indicator = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 'green' })
      );
      indicator.position.set(
        character.position.x, 
        character.position.y + 4, 
        character.position.z
      );
      scene.add(indicator);
      
      // Remove indicator after a short time
      setTimeout(() => {
        scene.remove(indicator);
      }, 300);
      
      // Log movement occasionally (not every frame)
      if (Math.random() < 0.1) {
        console.log(`Character position: (${character.position.x.toFixed(2)}, ${character.position.y.toFixed(2)}, ${character.position.z.toFixed(2)})`);
      }
    }
    
    // Update camera to follow character
    const cameraTarget = new THREE.Vector3(
      character.position.x,
      character.position.y + 2,
      character.position.z
    );
    cameraTargetRef.current.lerp(cameraTarget, 0.1);
    
    // Position camera behind character
    camera.position.x = character.position.x;
    camera.position.y = character.position.y + CAMERA_HEIGHT;
    camera.position.z = character.position.z + CAMERA_DISTANCE;
    
    // Look at character
    camera.lookAt(cameraTargetRef.current);
    
    // Portal interaction
    // Check for nearby portals
    if (portals.length > 0) {
      let closestPortal = null;
      let closestDistance = PORTAL_INTERACTION_DISTANCE;
      
      // Calculate distance to each portal
      portals.forEach(portal => {
        const portalPosition = new THREE.Vector3(...portal.position);
        const distance = portalPosition.distanceTo(character.position);
        
        // Update closest portal if this one is closer
        if (distance < closestDistance) {
          closestPortal = portal;
          closestDistance = distance;
        }
      });
      
      // Update near portal state
      setNearPortal(closestPortal);
      
      // If interact key pressed and near a portal, enter it
      if (interact && isNearPortal) {
        enterPortal();
        console.log(`Entering portal to ${nearPortal?.destination}`);
      }
    }
  });
  
  // Render character
  return (
    <group ref={characterRef}>
      <CharacterModel 
        isMoving={isMoving}
        isJumping={isJumping}
        castShadow
        receiveShadow
      />
      
      {/* Movement direction indicator */}
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </group>
  );
}