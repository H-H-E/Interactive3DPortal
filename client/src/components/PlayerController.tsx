import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import type { Controls } from "../hooks/useControls";
import { PORTAL_INTERACTION_DISTANCE } from "../lib/constants";
import { usePortals } from "../lib/stores/usePortals";
import { useIsMobile } from "../hooks/use-is-mobile";
// Replace the Hussein model with Leonard model
import { LeonardWithAnimations } from "../models/LeonardWithAnimations";

// Character properties
const CHARACTER_SPEED = 5;
const CHARACTER_TURN_SPEED = 2.5;
const CHARACTER_HEIGHT = 1.7;
const GROUND_OFFSET = 0.1;

// Type for orbit controls that focuses on the properties we need
interface OrbitControlsType {
  target: THREE.Vector3;
}

// Animation type that matches Leonard's animations
type LeonardAnimationName = 'idle' | 'walking' | 'running' | 'jump' | 'leftTurn' | 
                     'rightTurn' | 'leftTurn90' | 'rightTurn90' | 'leftStrafe' | 
                     'rightStrafe' | 'leftStrafeWalking' | 'rightStrafeWalking';

export function PlayerController() {
  // Character and camera references
  const characterRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<OrbitControlsType>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const targetRotationRef = useRef(0);
  
  // Ground detection
  const groundRaycaster = useRef(new THREE.Raycaster());
  const [isGrounded, setIsGrounded] = useState(true);
  const jumpVelocity = useRef(0);
  const groundY = useRef(0);
  
  // Updated animation state to match Leonard's animations
  const [animationState, setAnimationState] = useState<LeonardAnimationName>('idle');
  const jumpingRef = useRef(false);
  
  const isMobile = useIsMobile();
  
  // Get scene and camera from Three.js context
  const { camera, scene } = useThree();
  
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
      characterRef.current.position.set(0, 0, 0);
      
      // Debug log for initial setup
      console.log('Character controller initialized');
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

    // Limit delta to prevent extreme values during frame drops
    const cappedDelta = Math.min(delta, 0.1);

    // Cast ray downward to detect ground
    groundRaycaster.current.set(
      new THREE.Vector3(characterPosition.x, 50, characterPosition.z),
      new THREE.Vector3(0, -1, 0)
    );
    
    // Filter function to exclude character and indicators
    const filterNonGroundObjects = (object: THREE.Object3D) => {
      return object.parent !== characterRef.current && object.name !== "portalIndicator";
    };
    
    const intersects = groundRaycaster.current.intersectObjects(scene.children, true);
    let foundGround = false;
    
    // Find the closest non-character intersection (ground)
    for (const hit of intersects) {
      if (filterNonGroundObjects(hit.object)) {
        foundGround = true;
        groundY.current = hit.point.y;
        
        // Uncomment for debugging
        // console.log('Ground detected at Y:', groundY.current.toFixed(2));
        break;
      }
    }
    
    // Apply gravity and ground detection logic
    if (foundGround) {
      const distanceToGround = characterPosition.y - (groundY.current + CHARACTER_HEIGHT / 2);
      
      if (distanceToGround <= GROUND_OFFSET && jumpVelocity.current <= 0) {
        // Character is on the ground
        if (!isGrounded) {
          // Just landed
          setIsGrounded(true);
          jumpVelocity.current = 0;
        }
        
        // Set character Y position to ground level
        characterPosition.y = groundY.current + CHARACTER_HEIGHT / 2 + GROUND_OFFSET;
      } else {
        // Character is above ground
        setIsGrounded(false);
        // Apply gravity (negative value to pull down)
        jumpVelocity.current -= 9.8 * cappedDelta;
      }
    } else {
      // No ground found, apply default gravity
      jumpVelocity.current -= 9.8 * cappedDelta;
    }
    
    // Apply vertical movement (jump or gravity)
    characterPosition.y += jumpVelocity.current * cappedDelta;
    
    // Prevent falling through the world - safety check
    if (characterPosition.y < -50) {
      characterPosition.y = 5;
      jumpVelocity.current = 0;
    }
    
    // Handle jump animation and physics
    if (jump && isGrounded && !jumpingRef.current) {
      // Start jump
      jumpingRef.current = true;
      setIsGrounded(false);
      jumpVelocity.current = 5; // Initial jump velocity (slightly reduced)
      setAnimationState('jump');
      
      // Reset jump state after animation time
      setTimeout(() => {
        jumpingRef.current = false;
        if (!moving && isGrounded) {
          setAnimationState('idle');
        }
      }, 1200); // Approximate jump animation length
    }
    
    // If we're not jumping but going upward too fast, cap the velocity
    if (!jumpingRef.current && jumpVelocity.current > 0) {
      jumpVelocity.current = Math.min(jumpVelocity.current, 1.0);
    }
    
    // Debug log
    // console.log('Jump velocity:', jumpVelocity.current.toFixed(2), 'Grounded:', isGrounded);
    
    // Update animation state based on movement (if not currently jumping)
    if (!jumpingRef.current) {
      if (!moving) {
        // Clearly not moving - use idle
        if (animationState !== 'idle' && isGrounded) {
          setAnimationState('idle');
        }
      } else if (forward && !backward) {
        // Forward movement - use running for Leonard
        if (animationState !== 'running' && isGrounded) {
          setAnimationState('running');
        }
      } else if (leftward && !rightward && !forward && !backward) {
        // Pure left movement - use left strafe walking for Leonard
        if (animationState !== 'leftStrafeWalking' && isGrounded) {
          setAnimationState('leftStrafeWalking');
        }
      } else if (rightward && !leftward && !forward && !backward) {
        // Pure right movement - use right strafe walking for Leonard
        if (animationState !== 'rightStrafeWalking' && isGrounded) {
          setAnimationState('rightStrafeWalking');
        }
      } else {
        // Other movement - use walking for Leonard
        if (animationState !== 'walking' && isGrounded) {
          setAnimationState('walking');
        }
      }
      
      // If in air and not jumping, use idle animation
      if (!isGrounded && !jumpingRef.current && animationState !== 'jump') {
        setAnimationState('jump'); // Use jump animation for falling too
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
    
    // Apply movement (only XZ, Y is handled by jump/gravity)
    if (moving) {
      characterPosition.x += velocity.x;
      characterPosition.z += velocity.z;
      
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
      {/* Leonard model with animations */}
      <LeonardWithAnimations 
        animation={animationState} 
        scale={1.2} // Adjust scale as needed for proper sizing
      />
      
      {/* Interaction indicator when near portal */}
      {isNearPortal && (
        <mesh position={[0, CHARACTER_HEIGHT + 0.5, 0]} name="portalIndicator">
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
      
      {/* Debug visualization of ground hit point */}
      <mesh position={[0, groundY.current, 0]} visible={false}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>
      
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