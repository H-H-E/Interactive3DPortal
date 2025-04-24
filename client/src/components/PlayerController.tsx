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
const CHARACTER_SPEED = 8; // Increased speed for more obvious movement
const CHARACTER_TURN_SPEED = 3;
const CHARACTER_HEIGHT = 1.8;
const CAMERA_DISTANCE = 10;
const CAMERA_HEIGHT = 5;
const CAMERA_LERP = 0.1; // Camera smoothing
const GRAVITY = 30;
const JUMP_FORCE = 10;
const GROUND_FRICTION = 0.8;

export function PlayerController() {
  // Character references
  const characterRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Player state
  const [rotation, setRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  
  // Mouse control state
  const mouseStartRef = useRef<{x: number, y: number} | null>(null);
  const yawRef = useRef(0);
  
  // Platform detection
  const isMobile = useIsMobile();
  
  // Three.js context
  const { camera, scene, gl } = useThree();
  
  // Portals state
  const portals = usePortals(state => state.portals);
  const setNearPortal = usePortals(state => state.setNearPortal);
  const enterPortal = usePortals(state => state.enterPortal);
  const nearPortal = usePortals(state => state.nearPortal);
  
  // Input controls
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Debug logging
  useEffect(() => {
    console.log("Controls: WASD to move, hold mouse and drag to look around");
    console.log("Press E near portals to interact");
  }, []);
  
  // Initialize character position
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.position.set(0, 0, 0);
      
      // Set up camera initial position
      camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
      camera.lookAt(0, CHARACTER_HEIGHT / 2, 0);
    }
  }, [camera]);
  
  // Setup mouse controls
  useEffect(() => {
    if (!isMobile) {
      const canvas = gl.domElement;
      
      const handleMouseDown = (e: MouseEvent) => {
        if (mouseStartRef.current === null) {
          mouseStartRef.current = { x: e.clientX, y: e.clientY };
          canvas.style.cursor = 'grabbing';
        }
      };
      
      const handleMouseUp = () => {
        mouseStartRef.current = null;
        canvas.style.cursor = 'grab';
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (mouseStartRef.current) {
          const deltaX = e.clientX - mouseStartRef.current.x;
          mouseStartRef.current = { x: e.clientX, y: e.clientY };
          
          // Update character rotation
          yawRef.current -= deltaX * 0.01;
          setRotation(yawRef.current);
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
  }, [gl, isMobile]);
  
  // Main update loop
  useFrame((state, delta) => {
    if (!characterRef.current) return;
    
    // Get character reference
    const character = characterRef.current;
    
    // Get input state
    const { forward, backward, leftward, rightward, interact, jump } = getKeys();
    
    // Calculate if character is moving
    const moving = forward || backward || leftward || rightward;
    setIsMoving(moving);
    
    // Update character rotation
    character.rotation.y = yawRef.current;
    
    // Calculate movement direction
    const direction = new THREE.Vector3();
    
    // Forward/backward movement
    if (forward) {
      direction.z = -1;
    } else if (backward) {
      direction.z = 1;
    }
    
    // Left/right movement
    if (leftward) {
      direction.x = -1;
    } else if (rightward) {
      direction.x = 1;
    }
    
    // Normalize direction if moving diagonally
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Apply character orientation to movement direction
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
    
    // Store direction for debugging
    directionRef.current.copy(direction);
    
    // Calculate movement
    const moveSpeed = CHARACTER_SPEED * delta;
    
    // Apply movement
    if (moving) {
      // Calculate movement with increased speed for visibility
      const actualSpeed = moveSpeed * 3; // Triple the speed for clear visibility
      
      // Move character
      character.position.x += direction.x * actualSpeed;
      character.position.z += direction.z * actualSpeed;
      
      // Debug log the movement for clarity (limit to avoid console spam)
      if (Math.random() < 0.1) {
        console.log(
          `Character moving: pos=(${character.position.x.toFixed(2)}, ${character.position.y.toFixed(2)}, ${character.position.z.toFixed(2)})`
        );
      }
    }
    
    // Add large visual marker to show movement (floats above character)
    if (moving) {
      // Create floating text above character to show movement
      const floatingText = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      floatingText.position.set(
        character.position.x,
        character.position.y + 3,
        character.position.z
      );
      
      // Remove after 0.5 seconds
      setTimeout(() => {
        if (scene.children.includes(floatingText)) {
          scene.remove(floatingText);
        }
      }, 500);
      
      // Add to scene
      scene.add(floatingText);
    }
    
    // Update camera position
    const idealCameraPos = new THREE.Vector3(
      character.position.x - Math.sin(yawRef.current) * CAMERA_DISTANCE,
      character.position.y + CAMERA_HEIGHT,
      character.position.z - Math.cos(yawRef.current) * CAMERA_DISTANCE
    );
    
    // Smooth camera follow
    camera.position.lerp(idealCameraPos, CAMERA_LERP);
    
    // Make camera look at character
    camera.lookAt(
      character.position.x,
      character.position.y + CHARACTER_HEIGHT / 2,
      character.position.z
    );
    
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
      
      const distance = characterRef.current.position.distanceTo(portalPosition);
      
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
      {/* 3D Character model with animation state */}
      <CharacterModel 
        castShadow 
        receiveShadow
        isMoving={isMoving}
        isJumping={isJumping}
        // The model should face the negative Z direction by default
        rotation={[0, Math.PI, 0]}
      />
      
      {/* Direction indicator - forward arrow */}
      <mesh 
        position={[0, 1.5, -1.0]} 
        rotation={[0, 0, 0]} 
        scale={[0.2, 0.2, 1.0]}
        visible={true} // Show direction arrow for debugging
      >
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color="red" />
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