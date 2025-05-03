import { Suspense, useEffect } from "react";
import { Sky, Environment } from "@react-three/drei";
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

export default function Game() {
  const { phase, start } = useGame();
  const { isInPortal, currentScene, setCurrentScene } = usePortals();
  const audio = useAudio();

  // Initialize game
  useEffect(() => {
    start();
    
    // Set initial scene
    setCurrentScene("city");
    
    // Add helper text to show controls
    console.log("Controls: WASD to move, Mouse to look around (hold and drag)");
    console.log("Press E near portals to interact with them");
  }, [start, setCurrentScene]);
  
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
