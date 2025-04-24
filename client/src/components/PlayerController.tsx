import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Controls } from "../hooks/useControls";
import { PORTAL_INTERACTION_DISTANCE } from "../lib/constants";
import { usePortals } from "../lib/stores/usePortals";

// Character properties
const CHARACTER_SPEED = 5;
const CHARACTER_TURN_SPEED = 2.5;
const CHARACTER_HEIGHT = 1.8;
const CAMERA_DISTANCE = 5;
const CAMERA_HEIGHT = 3;

export function PlayerController() {
  // Character and camera references
  const characterRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const targetRotationRef = useRef(0);
  
  // Get scene and camera from Three.js context
  const { camera, scene } = useThree();
  
  // Get portals state
  const { portals, setNearPortal } = usePortals();
  
  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Initialize the character
  useEffect(() => {
    if (characterRef.current) {
      // Set initial position and rotation
      characterRef.current.position.set(0, CHARACTER_HEIGHT / 2, 0);
      
      // Set initial camera position
      updateCameraPosition(camera, characterRef.current.position);
    }
  }, [camera]);
  
  // Update camera position based on character position
  const updateCameraPosition = (camera: THREE.Camera, characterPosition: THREE.Vector3) => {
    // Position camera behind and above character
    camera.position.x = characterPosition.x;
    camera.position.y = characterPosition.y + CAMERA_HEIGHT; 
    camera.position.z = characterPosition.z + CAMERA_DISTANCE;
    
    // Look at character
    camera.lookAt(
      characterPosition.x,
      characterPosition.y + CHARACTER_HEIGHT / 2,
      characterPosition.z
    );
  };

  // Handle character movement and camera follow
  useFrame((state, delta) => {
    if (!characterRef.current) return;
    
    // Get keyboard controls state
    const { forward, backward, leftward, rightward } = getKeys();
    
    // Reference the character position
    const characterPosition = characterRef.current.position;
    
    // Reset velocity
    const velocity = velocityRef.current;
    velocity.set(0, 0, 0);
    
    // Calculate movement direction
    const moving = forward || backward || leftward || rightward;
    
    // Update rotation based on left/right controls
    if (leftward) {
      targetRotationRef.current += CHARACTER_TURN_SPEED * delta;
    } else if (rightward) {
      targetRotationRef.current -= CHARACTER_TURN_SPEED * delta;
    }
    
    // Apply rotation to character
    characterRef.current.rotation.y = targetRotationRef.current;
    
    // Calculate forward direction based on character rotation
    const forwardDirection = new THREE.Vector3(
      Math.sin(targetRotationRef.current),
      0,
      Math.cos(targetRotationRef.current)
    );
    
    // Set movement speed based on input
    if (forward) {
      velocity.add(forwardDirection.clone().multiplyScalar(CHARACTER_SPEED * delta));
    } else if (backward) {
      velocity.add(forwardDirection.clone().multiplyScalar(-CHARACTER_SPEED * delta * 0.5));
    }
    
    // Apply movement
    if (moving) {
      characterPosition.add(velocity);
    }
    
    // Update camera position to follow character
    updateCameraPosition(camera, characterPosition);
    
    // Check for proximity to portals
    let nearestPortal = null;
    let shortestDistance = PORTAL_INTERACTION_DISTANCE;
    
    // Check distance to each portal
    portals.forEach(portal => {
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
    });
    
    // Update nearest portal in state
    setNearPortal(nearestPortal);
  });

  return (
    <group ref={characterRef} name="character">
      {/* Character model here */}
      <mesh position={[0, CHARACTER_HEIGHT / 2, 0]} castShadow>
        <capsuleGeometry args={[0.4, CHARACTER_HEIGHT - 0.8, 8, 16]} />
        <meshStandardMaterial color="#4285f4" />
      </mesh>
      
      {/* Character eyes for direction reference */}
      <mesh position={[0, CHARACTER_HEIGHT - 0.3, 0.35]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      <mesh position={[0.2, CHARACTER_HEIGHT - 0.3, 0.4]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      <mesh position={[-0.2, CHARACTER_HEIGHT - 0.3, 0.4]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  );
}