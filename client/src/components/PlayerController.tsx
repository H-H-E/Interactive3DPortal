import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Controls } from "../hooks/useControls";
import { PORTAL_INTERACTION_DISTANCE } from "../lib/constants";
import { usePortals } from "../lib/stores/usePortals";
import { useIsMobile } from "../hooks/use-is-mobile";
import { CharacterModel } from "./CharacterModel";

// Character properties
const CHARACTER_SPEED = 5;
const CHARACTER_TURN_SPEED = 2.5;
const CHARACTER_HEIGHT = 1.8;
const CAMERA_DISTANCE = 8;  // Increased to see more of the character
const CAMERA_HEIGHT = 4;    // Increased for a better view with the new model
const MOUSE_SENSITIVITY = 0.007;
const MOUSE_SMOOTHING = 0.1;

export function PlayerController() {
  // Character and camera references
  const characterRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<any>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const targetRotationRef = useRef(0);
  const lastMouseXRef = useRef(0);
  const [autoRotate, setAutoRotate] = useState(false);
  
  const isMobile = useIsMobile();
  
  // Get scene and camera from Three.js context
  const { camera, scene, gl, mouse } = useThree();
  
  // Get portals state from store
  const portals = usePortals(state => state.portals);
  const setNearPortal = usePortals(state => state.setNearPortal);
  const enterPortal = usePortals(state => state.enterPortal);
  const nearPortal = usePortals(state => state.nearPortal);
  
  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Initialize the character
  useEffect(() => {
    if (characterRef.current) {
      // Set initial position and rotation
      characterRef.current.position.set(0, CHARACTER_HEIGHT / 2, 0);
      
      // Set up mouse event listeners for desktop
      if (!isMobile) {
        const canvas = gl.domElement;
        
        const handleMouseDown = (e: MouseEvent) => {
          document.body.style.cursor = 'grabbing';
          setAutoRotate(true);
          lastMouseXRef.current = e.clientX;
        };
        
        const handleMouseUp = () => {
          document.body.style.cursor = 'auto';
          setAutoRotate(false);
        };
        
        const handleMouseMove = (e: MouseEvent) => {
          if (autoRotate) {
            const deltaX = e.clientX - lastMouseXRef.current;
            targetRotationRef.current -= deltaX * MOUSE_SENSITIVITY;
            lastMouseXRef.current = e.clientX;
          }
        };
        
        canvas.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        
        return () => {
          canvas.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('mousemove', handleMouseMove);
        };
      }
    }
  }, [gl, isMobile, autoRotate]);

  // Handle character movement with combined keyboard and mouse input
  useFrame((state, delta) => {
    if (!characterRef.current) return;
    
    // Get keyboard controls state
    const { forward, backward, leftward, rightward, interact } = getKeys();
    
    // Reference the character position
    const characterPosition = characterRef.current.position;
    
    // Reset velocity
    const velocity = velocityRef.current;
    velocity.set(0, 0, 0);
    
    // Calculate movement direction
    const moving = forward || backward || leftward || rightward;
    
    // Update rotation based on keyboard controls when not using mouse drag
    if (!autoRotate) {
      if (leftward) {
        targetRotationRef.current += CHARACTER_TURN_SPEED * delta;
      } else if (rightward) {
        targetRotationRef.current -= CHARACTER_TURN_SPEED * delta;
      }
    }
    
    // Apply rotation to character
    characterRef.current.rotation.y = targetRotationRef.current;
    
    // Get character forward direction based on its rotation
    const characterDirection = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationRef.current);
    
    // Get character right direction
    const characterRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationRef.current);
    
    // Movement vectors
    const moveForward = new THREE.Vector3();
    const moveRight = new THREE.Vector3();
    
    // Calculate movement direction based on character orientation
    if (forward) {
      moveForward.copy(characterDirection).multiplyScalar(CHARACTER_SPEED * delta);
    } else if (backward) {
      moveForward.copy(characterDirection).multiplyScalar(-CHARACTER_SPEED * delta * 0.5);
    }
    
    if (leftward && !autoRotate) {
      moveRight.copy(characterRight).multiplyScalar(-CHARACTER_SPEED * delta * 0.8);
    } else if (rightward && !autoRotate) {
      moveRight.copy(characterRight).multiplyScalar(CHARACTER_SPEED * delta * 0.8);
    }
    
    // Combine movement vectors
    velocity.add(moveForward).add(moveRight);
    
    // Apply movement - this actually moves the character
    if (moving) {
      characterPosition.add(velocity);
    }
    
    // Position camera to follow character
    if (isMobile) {
      // Mobile uses orbit controls
    } else {
      // On desktop, position camera behind character at fixed distance
      const cameraOffset = new THREE.Vector3(
        -Math.sin(targetRotationRef.current) * CAMERA_DISTANCE,
        CAMERA_HEIGHT,
        -Math.cos(targetRotationRef.current) * CAMERA_DISTANCE
      );
      
      camera.position.copy(characterPosition).add(cameraOffset);
      camera.lookAt(
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
    
    // Handle portal interaction with 'E' key
    if (interact && nearestPortal) {
      // Just toggle the state, the portal component handles the transition
      enterPortal();
    }
  });

  // Check if we're near a portal for visual indicators
  const isNearPortal = nearPortal !== null;
  
  return (
    <group ref={characterRef} name="character">
      {/* 3D Character model */}
      <CharacterModel 
        castShadow 
        receiveShadow
        // The model should face the negative Z direction by default
        rotation={[0, Math.PI, 0]}
      />
      
      {/* Direction indicator - forward arrow */}
      <mesh 
        position={[0, 0.1, -0.6]} 
        rotation={[Math.PI / 2, 0, 0]} 
        scale={[0.2, 0.3, 0.1]}
        visible={false} // Hidden direction indicator, useful for debugging
      >
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
      
      {/* Interaction indicator when near portal */}
      {isNearPortal && (
        <group position={[0, CHARACTER_HEIGHT + 0.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.8}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Pulse animation */}
          <pointLight
            color="#42b4f4"
            intensity={2}
            distance={2}
            decay={2}
          />
        </group>
      )}
      
      {/* Orbit controls for mobile devices only */}
      {isMobile && (
        <OrbitControls 
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
        />
      )}
    </group>
  );
}