import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Controls } from "../hooks/useControls";
import { PORTAL_INTERACTION_DISTANCE } from "../lib/constants";
import { usePortals } from "../lib/stores/usePortals";
import { useIsMobile } from "../hooks/use-is-mobile";
import { Model as HusseinCharacter } from "../models/Husseinlopol";

// Character properties
const CHARACTER_SPEED = 5;
const CHARACTER_TURN_SPEED = 2.5;
const CHARACTER_HEIGHT = 1.8;
const CAMERA_DISTANCE = 5;
const CAMERA_HEIGHT = 3;
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
  const prevAutoRotateRef = useRef(false);
  const cameraPositionRef = useRef(new THREE.Vector3());
  const cameraTargetRef = useRef(new THREE.Vector3());
  
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
          // Store current character rotation when starting mouse control
          prevAutoRotateRef.current = autoRotate;
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
    
    // Calculate movement direction
    if (forward) {
      // Mobile always uses camera-relative movement
      if (isMobile) {
        moveForward.copy(cameraDirection).multiplyScalar(CHARACTER_SPEED * delta);
      } else {
        // On desktop, movement depends on control mode
        moveForward.copy(cameraDirection).multiplyScalar(CHARACTER_SPEED * delta);
      }
    } else if (backward) {
      if (isMobile) {
        moveForward.copy(cameraDirection).multiplyScalar(-CHARACTER_SPEED * delta * 0.5);
      } else {
        moveForward.copy(cameraDirection).multiplyScalar(-CHARACTER_SPEED * delta * 0.5);
      }
    }
    
    // Use consistent movement regardless of control method
    if (leftward && !autoRotate) {
      if (isMobile) {
        // On mobile, left/right need to strafe instead of rotate
        moveRight.copy(rightVector).multiplyScalar(-CHARACTER_SPEED * delta * 0.8);
      } else {
        moveRight.copy(rightVector).multiplyScalar(-CHARACTER_SPEED * delta * 0.8);
      }
    } else if (rightward && !autoRotate) {
      if (isMobile) {
        // On mobile, left/right need to strafe instead of rotate
        moveRight.copy(rightVector).multiplyScalar(CHARACTER_SPEED * delta * 0.8);
      } else {
        moveRight.copy(rightVector).multiplyScalar(CHARACTER_SPEED * delta * 0.8);
      }
    }
    
    // Combine movement vectors
    velocity.add(moveForward).add(moveRight);
    
    // Apply movement
    if (moving) {
      characterPosition.add(velocity);
      
      // Make character face movement direction
      if (isMobile) {
        // For mobile, always face the direction of movement
        const moveDirection = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
        if (moveDirection.length() > 0.1) {
          const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
          characterRef.current.rotation.y = targetRotation;
        }
      } else if ((forward || backward) && (leftward || rightward) && !autoRotate) {
        // For desktop, face direction only when moving diagonally
        const moveDirection = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
        if (moveDirection.length() > 0.1) {
          const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
          targetRotationRef.current = targetRotation;
        }
      }
    }
    
    // Calculate the target camera position regardless of control method
    const targetCameraPos = new THREE.Vector3(
      -Math.sin(targetRotationRef.current) * CAMERA_DISTANCE,
      CAMERA_HEIGHT,
      -Math.cos(targetRotationRef.current) * CAMERA_DISTANCE
    ).add(characterPosition);
    
    const targetLookAt = new THREE.Vector3(
      characterPosition.x,
      characterPosition.y + CHARACTER_HEIGHT / 2,
      characterPosition.z
    );
    
    // Position camera to follow character (if not using orbit controls)
    if (isMobile) {
      // On mobile, update the orbit controls target to follow the character
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(
          characterPosition.x,
          characterPosition.y + CHARACTER_HEIGHT / 2,
          characterPosition.z
        );
      }
    } else {
      // Store current camera position and target for smooth transition
      if (!cameraPositionRef.current.equals(camera.position)) {
        cameraPositionRef.current.copy(camera.position);
      }
      
      if (!cameraTargetRef.current.equals(targetLookAt)) {
        cameraTargetRef.current.copy(targetLookAt);
      }
      
      // Smooth transition for camera position and target
      camera.position.lerp(targetCameraPos, 0.05);
      cameraTargetRef.current.lerp(targetLookAt, 0.05);
      
      // Make the camera look at the character
      camera.lookAt(cameraTargetRef.current);
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
      {/* Optimized 3D Character model */}
      <HusseinCharacter />
      
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
      
      {/* Orbit controls for mobile devices only */}
      {isMobile && (
        <OrbitControls 
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
        />
      )}
    </group>
  );
}