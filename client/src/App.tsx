import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { Controls } from "./hooks/useControls";
import Game from "./components/Game";
import { MobileControls } from "./components/MobileControls";
import "@fontsource/inter";

// Define control keys for the game
const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.backward, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.leftward, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.rightward, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.interact, keys: ["KeyE"] },
  { name: Controls.jump, keys: ["Space"] },
];

function App() {
  const {
    setBackgroundMusic,
    setHitSound,
    setSuccessSound,
    isMuted,
    toggleMute,
  } = useAudio();

  // Initialize audio elements
  useEffect(() => {
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    const hit = new Audio("/sounds/hit.mp3");
    hit.volume = 0.5;
    setHitSound(hit);

    const success = new Audio("/sounds/success.mp3");
    success.volume = 0.5;
    setSuccessSound(success);

    // Start background music
    if (!isMuted) {
      bgMusic.play().catch((e) => console.log("Audio autoplay prevented:", e));
    }

    return () => {
      bgMusic.pause();
      hit.pause();
      success.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, isMuted]);

  return (
    <div className="h-screen bg-black">
      {/* Sound controls */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleMute}
          className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Interactive 3D scene */}
      <KeyboardControls map={keyMap}>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
          <Game />
        </Canvas>
        
        {/* Add mobile controls outside the Canvas but inside KeyboardControls provider */}
        <MobileControls />
      </KeyboardControls>
    </div>
  );
}

export default App;
