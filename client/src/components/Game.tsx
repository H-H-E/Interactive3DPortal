import { Suspense, useState, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PointerLockControls, Sky, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "./Character";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { Portal } from "./Portal";
import { City } from "./City";
import { Environment as GameEnvironment } from "./Environment";
import { usePortals } from "../lib/stores/usePortals";
import { WORLD_SIZE } from "../lib/constants";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";

export default function Game() {
  const { camera, scene } = useThree();
  const [isMobile, setIsMobile] = useState(false);
  const { phase, start } = useGame();
  const { isInPortal, currentScene, setCurrentScene } = usePortals();
  const audio = useAudio();
  const characterRef = useRef<THREE.Group | null>(null);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Initialize game
  useEffect(() => {
    start();
    
    // Set initial scene
    setCurrentScene("city");
  }, [start, setCurrentScene]);
  
  // Third-person camera follow
  useFrame(() => {
    if (phase !== "playing") return;
    
    // Find character in the scene if not already referenced
    if (!characterRef.current) {
      const foundCharacter = scene.getObjectByName("character");
      if (foundCharacter) {
        characterRef.current = foundCharacter as THREE.Group;
      }
    }
    
    // Follow character in third-person view
    if (characterRef.current) {
      const characterPos = new THREE.Vector3();
      characterRef.current.getWorldPosition(characterPos);
      
      // Position camera behind and above character
      camera.position.x = characterPos.x;
      camera.position.y = characterPos.y + 3;
      camera.position.z = characterPos.z + 5;
      
      // Look at character
      camera.lookAt(characterPos);
    }
  });
  
  // Effect for portal transitions
  useEffect(() => {
    if (isInPortal && audio.playSuccess) {
      // Play sound effect when entering portal
      audio.playSuccess();
    }
  }, [isInPortal, audio]);
  
  return (
    <>
      {/* Environment lighting */}
      <Lighting />
      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="park" />
      
      {/* Main game content */}
      <Suspense fallback={null}>
        {/* Ground and environment */}
        <Ground />
        
        {/* Different scenes based on current state */}
        {currentScene === "city" && (
          <City />
        )}
        
        {currentScene === "forest" && (
          <GameEnvironment type="forest" />
        )}
        
        {currentScene === "beach" && (
          <GameEnvironment type="beach" />
        )}
        
        {/* Character */}
        <Character />
        
        {/* Portals */}
        <Portal 
          id="city-to-forest"
          position={[10, 1, 10]} 
          destination="forest"
          label="Forest"
        />
        
        <Portal 
          id="city-to-beach"
          position={[-10, 1, 10]} 
          destination="beach"
          label="Beach"
        />
        
        {currentScene === "forest" && (
          <Portal 
            id="forest-to-city"
            position={[0, 1, -10]} 
            destination="city"
            label="City"
          />
        )}
        
        {currentScene === "beach" && (
          <Portal 
            id="beach-to-city"
            position={[0, 1, -10]} 
            destination="city"
            label="City"
          />
        )}
      </Suspense>
      
      {/* Camera controls - OrbitControls for mobile, PointerLockControls for desktop */}
      {isMobile ? (
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={5}
          maxDistance={15}
        />
      ) : (
        <PointerLockControls />
      )}
    </>
  );
}
