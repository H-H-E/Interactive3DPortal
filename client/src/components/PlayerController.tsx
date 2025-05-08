import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import type { Controls } from "../hooks/useControls";
import { PORTAL_INTERACTION_DISTANCE } from "../lib/constants";
import { usePortals } from "../lib/stores/usePortals";
import { useIsMobile } from "../hooks/use-is-mobile";
// Import the new component with Mixamo animations
import { ModelWithAnimations } from "../models/HusseinWithAnimations";

// Character properties
const CHARACTER_SPEED = 5;
const CHARACTER_TURN_SPEED = 2.5;
const CHARACTER_HEIGHT = 1.8;

// Type for orbit controls that focuses on the properties we need
interface OrbitControlsType {
  target: THREE.Vector3;
}

export function PlayerController() {
  // Character and camera references
  const characterRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<OrbitControlsType>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const targetRotationRef = useRef(0);
  
  // Enhanced animation state to match available Mixamo animations
  const [animationState, setAnimationState] = useState<'idle' | 'walk' | 'run' | 'jump' | 'leftStrafe' | 'rightStrafe' | 'stand' | 'jumpingDown'>('idle');
  const jumpingRef = useRef(false);
  
  const isMobile = useIsMobile();
  
  // Get scene and camera from Three.js context
  const { camera } = useThree();
  
  // Get portals state from store
  const portals = usePortals(state => state.portals);
  const setNearPortal = usePortals(state => state.setNearPortal);
  const nearPortal = usePortals(state => state.nearPortal);
  
  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Initialize the character
  useEffect(() => {
    if (characterRef.current) {
      // Set initial position and rotation
      characterRef.current.position.set(0, CHARACTER_HEIGHT / 2, 0);
    }
  }, []);

  // Handle character movement
  useFrame((_, delta) => {
    if (!characterRef.current) return;
    
    // Get keyboard controls state
    const { forward, backward, leftward, rightward, jump } = getKeys();
    
    // Reference the character position
    const characterPosition = characterRef.current.position;
    
    // Reset velocity
    const velocity = velocityRef.current;
    velocity.set(0, 0, 0);
    
    // Calculate movement direction
    const moving = forward || backward || leftward || rightward;
    
    // Handle jump animation
    if (jump && !jumpingRef.current) {
      jumpingRef.current = true;
      setAnimationState('jump');
      
      // Reset jump state after animation time
      setTimeout(() => {
        jumpingRef.current = false;
        if (!moving) {
          setAnimationState('idle');
        }
      }, 1200); // Approximate jump animation length
    }
    
    // Update animation state based on movement (if not currently jumping)
    if (!jumpingRef.current) {
      if (!moving) {
        // Clearly not moving - use idle
        if (animationState !== 'idle') {
          setAnimationState('idle');
        }
      } else if (forward && !backward) {
        // Forward movement - use run
        if (animationState !== 'run') {
          setAnimationState('run');
        }
      } else if (leftward && !rightward && !forward && !backward) {
        // Pure left movement - use left strafe
        if (animationState !== 'leftStrafe') {
          setAnimationState('leftStrafe');
        }
      } else if (rightward && !leftward && !forward && !backward) {
        // Pure right movement - use right strafe
        if (animationState !== 'rightStrafe') {
          setAnimationState('rightStrafe');
        }
      } else {
        // Other movement - use walk
        if (animationState !== 'walk') {
          setAnimationState('walk');
        }
      }
    }
    
    // Update rotation based on keyboard controls
    if (leftward && !forward && !backward) {
      targetRotationRef.current += CHARACTER_TURN_SPEED * delta;
    } else if (rightward && !forward && !backward) {
      targetRotationRef.current -= CHARACTER_TURN_SPEED * delta;
    }
    
    // Apply rotation to character
    characterRef.current.rotation.y = targetRotationRef.current;
    
    // Get current camera direction vector (for movement relative to camera view)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement on XZ plane
    cameraDirection.normalize();
    
    // Calculate right vector from camera direction
    const rightVector = new THREE.Vector3(
      cameraDirection.z,
      0,
      -cameraDirection.x
    );
    
    // Movement vectors
    const moveForward = new THREE.Vector3();
    const moveRight = new THREE.Vector3();
    
    // Calculate movement direction relative to camera
    if (forward) {
      moveForward.copy(cameraDirection).multiplyScalar(CHARACTER_SPEED * delta);
    } else if (backward) {
      moveForward.copy(cameraDirection).multiplyScalar(-CHARACTER_SPEED * delta * 0.5);
    }
    
    if (leftward && (forward || backward)) {
      moveRight.copy(rightVector).multiplyScalar(-CHARACTER_SPEED * delta * 0.8);
    } else if (rightward && (forward || backward)) {
      moveRight.copy(rightVector).multiplyScalar(CHARACTER_SPEED * delta * 0.8);
    }
    
    // Combine movement vectors
    velocity.add(moveForward).add(moveRight);
    
    // Apply movement
    if (moving) {
      characterPosition.add(velocity);
      
      // Make character face movement direction when moving forward/backward
      if ((forward || backward) && (leftward || rightward)) {
        const moveDirection = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
        if (moveDirection.length() > 0.1) {
          const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
          targetRotationRef.current = targetRotation;
        }
      }
    }
    
    // Update orbit controls target to follow character
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(
        characterPosition.x,
        characterPosition.y + CHARACTER_HEIGHT / 2,
        characterPosition.z
      );
    }
    
    // Check for proximity to portals
    let nearestPortal = null;
    let shortestDistance = PORTAL_INTERACTION_DISTANCE;
    
    // Check distance to each portal
    for (const portal of portals) {
      const portalPosition = new THREE.Vector3(
        portal.position[0], 
        portal.position[1], 
        portal.position[2]
      );
      
      const distance = characterPosition.distanceTo(portalPosition);
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestPortal = portal;
      }
    }
    
    // Update nearest portal in state
    setNearPortal(nearestPortal);
  });

  // Check if we're near a portal for visual indicators
  const isNearPortal = nearPortal !== null;
  
  return (
    <group ref={characterRef} name="character">
      {/* Using the enhanced character model with Mixamo animations */}
      <ModelWithAnimations animation={animationState} />
      
      {/* Interaction indicator when near portal */}
      {isNearPortal && (
        <mesh position={[0, CHARACTER_HEIGHT + 0.5, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.8}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Orbit controls for both mobile and desktop */}
      <OrbitControls 
        // @ts-ignore - Types are complex between drei/three-stdlib, but this works at runtime
        ref={orbitControlsRef}
        makeDefault
        target={new THREE.Vector3(
          characterRef.current?.position.x || 0,
          (characterRef.current?.position.y || 0) + CHARACTER_HEIGHT / 2,
          characterRef.current?.position.z || 0
        )}
        enableZoom={true}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={3}
        maxDistance={10}
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={isMobile ? 0.5 : 0.8}
      />
    </group>
  );
}