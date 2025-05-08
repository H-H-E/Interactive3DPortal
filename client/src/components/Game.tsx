import { Suspense, useEffect } from "react";
import { Sky, Environment, useKeyboardControls } from "@react-three/drei";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { Portal } from "./Portal";
import { City } from "./City";
import { Environment as GameEnvironment } from "./Environment";
import { usePortals } from "../lib/stores/usePortals";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";
import { PlayerController } from "./PlayerController";
import { PortalCamera } from "./PortalCamera";
import { useIsMobile } from "../hooks/use-is-mobile";
import type { Controls } from "../hooks/useControls";
import { useFrame } from "@react-three/fiber";

export default function Game() {
  const { phase, start } = useGame();
  const { isInPortal, currentScene, setCurrentScene, nearPortal, enterPortal } = usePortals();
  const audio = useAudio();
  const isMobile = useIsMobile();
  
  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();

  // Initialize game
  useEffect(() => {
    start();
    
    // Set initial scene
    setCurrentScene("city");
    
    // Add helper text to show controls
    if (isMobile) {
      console.log("Mobile controls: Use the joystick to move, tap E button to interact");
    } else {
      console.log("Controls: WASD to move, drag to rotate camera, click and drag to look around");
      console.log("Press E near portals to interact with them");
    }
  }, [start, setCurrentScene, isMobile]);
  
  // Effect for portal transitions
  useEffect(() => {
    if (isInPortal && audio.playSuccess) {
      // Play sound effect when entering portal
      audio.playSuccess();
    }
  }, [isInPortal, audio]);
  
  // ADDED: Centralized portal interaction handler
  useFrame(() => {
    // Get the current state of the interact key
    const { interact } = getKeys();
    
    // If interact key is pressed and player is near a portal, trigger portal entry
    if (interact && nearPortal) {
      console.log(`[Game] Interact key pressed near portal: ${nearPortal.id}`);
      enterPortal();
    }
  });
  
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
        
        {/* Player character with improved controls */}
        <PlayerController />
        
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
        
        {/* Portal camera handles smooth transitions when using portals */}
        <PortalCamera transitionDuration={1.0} />
      </Suspense>
    </>
  );
}
