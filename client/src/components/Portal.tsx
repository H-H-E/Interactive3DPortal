import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture, Text, MeshPortalMaterial, RoundedBox } from "@react-three/drei";
import { usePortals, Portal as PortalType } from "../lib/stores/usePortals";
import { SpeechBubble } from "./SpeechBubble";
import { useAudio } from "../lib/stores/useAudio";

interface PortalProps {
  id: string;
  position: [number, number, number];
  destination: string;
  label: string;
}

export function Portal({ id, position, destination, label }: PortalProps) {
  const [hovered, setHovered] = useState(false);
  const portalRef = useRef<THREE.Mesh>(null);
  const interactionLockRef = useRef(false);
  const registeredRef = useRef(false);
  
  const { 
    nearPortal, 
    addPortal, 
    removePortal, 
    setIsInPortal, 
    setCurrentScene,
    enterPortal
  } = usePortals();
  
  // Get audio controls
  const audio = useAudio();
  
  // Memoize portal data to prevent unnecessary rerenders
  const portalData = useMemo<PortalType>(() => ({
    id,
    position,
    destination,
    label
  }), [id, position, destination, label]);
  
  // Add this portal to the global list only once
  useEffect(() => {
    // Only register the portal once
    if (!registeredRef.current) {
      addPortal(portalData);
      registeredRef.current = true;
      
      // Clean up on unmount
      return () => {
        removePortal(id);
        registeredRef.current = false;
      };
    }
  }, []);  // Empty dependency array to run only once
  
  // Handle interaction with the portal
  const handleInteract = useCallback(() => {
    if (nearPortal?.id === id && !interactionLockRef.current) {
      interactionLockRef.current = true;
      enterPortal();
      
      // After a brief delay, change the scene
      setTimeout(() => {
        setCurrentScene(destination);
        setIsInPortal(false);
        
        // Try to play sound if the function exists
        if (audio.playSuccess) {
          audio.playSuccess();
        }
        
        interactionLockRef.current = false;
      }, 1000);
    }
  }, [nearPortal, id, enterPortal, setCurrentScene, destination, setIsInPortal, audio]);
  
  // NEW: Automatically enter the portal as soon as the player is close enough.
  useEffect(() => {
    if (nearPortal?.id === id) {
      handleInteract();
    }
  }, [nearPortal, id, handleInteract]);
  
  // Portal animation
  useFrame(() => {
    if (portalRef.current) {
      portalRef.current.rotation.y += 0.01;
      
      // Scale effect when near or hovered
      const isNear = nearPortal?.id === id;
      const targetScale = isNear || hovered ? 1.1 : 1;
      portalRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });
  
  // Texture to represent the destination
  const getEnvironmentTexture = () => {
    switch (destination) {
      case "forest":
        return "/textures/grass.png";
      case "beach":
        return "/textures/sand.jpg";
      default:
        return "/textures/asphalt.png";
    }
  };
  
  const texture = useTexture(getEnvironmentTexture());
  
  // Is this portal currently active (near the player)?
  const isActive = nearPortal?.id === id;
  
  return (
    <group position={position}>
      {/* Portal mesh */}
      <mesh
        ref={portalRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <RoundedBox args={[2, 3, 0.2]} radius={0.2}>
          <MeshPortalMaterial side={THREE.DoubleSide}>
            <ambientLight intensity={0.5} />
            <mesh position={[0, 0, -2]}>
              <planeGeometry args={[5, 5]} />
              <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
            </mesh>
            
            {/* Portal content hint */}
            <Text
              position={[0, 0.5, -1]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {label}
            </Text>
          </MeshPortalMaterial>
        </RoundedBox>
      </mesh>
      
      {/* Speech bubble when near */}
      {isActive && (
        <SpeechBubble 
          position={[0, 3.5, 0]}
          content={`Entering ${label}...`}
        />
      )}
    </group>
  );
}
