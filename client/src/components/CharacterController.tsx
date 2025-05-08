import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { Controls } from "../hooks/useControls";
import { PORTAL_INTERACTION_DISTANCE } from "../lib/constants";
import { usePortals } from "../lib/stores/usePortals";
import { useIsMobile } from "../hooks/use-is-mobile";

export function CharacterController() {
  // Get portals state from store
  const portals = usePortals(state => state.portals);
  const setNearPortal = usePortals(state => state.setNearPortal);
  const enterPortal = usePortals(state => state.enterPortal);
  const nearPortal = usePortals(state => state.nearPortal);

  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();

  // Character reference and scene
  const rigidBodyRef = useRef<any>(null);
  const { camera } = useThree();
  const isMobile = useIsMobile();

  // Component mount debug message
  useEffect(() => {
    console.log("[DEBUG] NEW CharacterController mounted - controls should be WASD/Arrows, Space to jump");
  }, []);

  // Camera follow logic
  useFrame(() => {
    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation();
      camera.position.lerp(new THREE.Vector3(pos.x, pos.y + 2, pos.z + 6), 0.1);
      camera.lookAt(pos.x, pos.y + 1, pos.z);
    }
  });

  // Movement logic
  useFrame(() => {
    if (!rigidBodyRef.current) return;
    
    const { forward, backward, leftward, rightward, jump } = getKeys();
    const impulse = { x: 0, y: 0, z: 0 };
    const speed = 1.0; // Significantly increased for more responsiveness
    
    if (forward) impulse.z -= speed;
    if (backward) impulse.z += speed;
    if (leftward) impulse.x -= speed;
    if (rightward) impulse.x += speed;
    
    // Apply damping to current velocity for better control
    const velocity = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel({ 
      x: velocity.x * 0.9, 
      y: velocity.y, 
      z: velocity.z * 0.9 
    }, true);
    
    if (impulse.x !== 0 || impulse.z !== 0) {
      rigidBodyRef.current.applyImpulse(impulse, true);
      console.log("Moving:", impulse);
    }
    
    // Improved jump with stronger impulse
    if (jump) {
      // Check if character is on or near the ground
      const vel = rigidBodyRef.current.linvel();
      if (Math.abs(vel.y) < 0.15) { // Slightly more lenient ground detection
        rigidBodyRef.current.applyImpulse({ x: 0, y: 6, z: 0 }, true); // Stronger jump
        console.log("Jumping");
      }
    }
  });

  // Portal proximity check
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!rigidBodyRef.current) return;
      const position = rigidBodyRef.current.translation();
      const characterPosition = new THREE.Vector3(position.x, position.y, position.z);
      let nearestPortal = null;
      let shortestDistance = PORTAL_INTERACTION_DISTANCE;
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
      setNearPortal(nearestPortal);
    }, 500);
    return () => clearInterval(intervalId);
  }, [portals, setNearPortal]);

  const isNearPortal = nearPortal !== null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 3, 0]}
      colliders={false}
      mass={1}
      type="dynamic"
      enabledRotations={[false, false, false]}
      linearDamping={0.3} // Further reduced for less drag
      angularDamping={0.9}
      restitution={0.1}
      friction={0.7}
    >
      <CapsuleCollider args={[0.9, 0.4]} />
      <group name="character">
        {/* Character model here */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.9 * 2, 8, 16]} />
          <meshStandardMaterial 
            color={isNearPortal ? "#42b4f4" : "#4285f4"} 
            emissive={isNearPortal ? "#42b4f4" : "#000000"}
            emissiveIntensity={isNearPortal ? 0.3 : 0}
          />
        </mesh>
        {/* Character eyes for direction reference */}
        <mesh position={[0, 1.5, 0.35]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.2, 1.5, 0.4]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.2, 1.5, 0.4]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        {/* Interaction indicator when near portal */}
        {isNearPortal && (
          <mesh position={[0, 2.5, 0]}>
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
      </group>
    </RigidBody>
  );
} 