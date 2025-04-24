import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { Controls } from "./hooks/useControls";
import Game from "./components/Game";
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
    <>
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 10], fov: 50, near: 0.1, far: 1000 }}
          gl={{ antialias: true, powerPreference: "default" }}
        >
          <color attach="background" args={["#87CEEB"]} />
          <fog attach="fog" args={["#87CEEB", 30, 100]} />
          
          <Suspense fallback={null}>
            <Game />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* Audio toggle button */}
      <button
        onClick={toggleMute}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          padding: "12px",
          background: "rgba(0, 0, 0, 0.6)",
          color: "white",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </>
  );
}

export default App;
