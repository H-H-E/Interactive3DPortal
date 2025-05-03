import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { WORLD_SIZE } from "../lib/constants";
import { SpeechBubble } from "./SpeechBubble";

interface EnvironmentProps {
  type: "forest" | "beach" | "mountain";
}

export function Environment({ type }: EnvironmentProps) {
  // Select appropriate texture based on environment type
  const getTexturePath = () => {
    switch (type) {
      case "forest":
        return "/textures/grass.png";
      case "beach":
        return "/textures/sand.jpg";
      default:
        return "/textures/grass.png";
    }
  };
  
  // Load ground texture
  const groundTexture = useTexture(getTexturePath());
  
  // Configure texture repeat
  const textureConfig = useMemo(() => {
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(WORLD_SIZE / 8, WORLD_SIZE / 8);
    
    return {
      map: groundTexture,
    };
  }, [groundTexture]);
  
  // Environment-specific ground color
  const getGroundColor = () => {
    switch (type) {
      case "forest":
        return "#3b7d4f";
      case "beach":
        return "#e6d59e";
      default:
        return "#6b8e51";
    }
  };
  
  // Environment-specific elements
  const renderEnvironmentElements = () => {
    switch (type) {
      case "forest":
        return <ForestElements />;
      case "beach":
        return <BeachElements />;
      default:
        return null;
    }
  };
  
  // Welcome message based on environment
  const getWelcomeMessage = () => {
    switch (type) {
      case "forest":
        return "Welcome to the forest! The trees whisper ancient secrets...";
      case "beach":
        return "Welcome to the beach! Feel the warm sand between your toes...";
      default:
        return "Welcome to this new area!";
    }
  };
  
  return (
    <group>
      {/* Ground */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.05, 0]} 
        receiveShadow
      >
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial 
          {...textureConfig} 
          color={getGroundColor()}
          roughness={0.9}
        />
      </mesh>
      
      {/* Environment-specific elements */}
      {renderEnvironmentElements()}
      
      {/* Welcome speech bubble */}
      <SpeechBubble
        position={[0, 2, 0]}
        content={getWelcomeMessage()}
        duration={10000}
      />
    </group>
  );
}

// Forest environment elements
function ForestElements() {
  // Generate trees with predefined positions
  const trees = useMemo(() => {
    const treePositions = [
      [5, 0, -5],
      [-5, 0, -5],
      [8, 0, -8],
      [-8, 0, -8],
      [12, 0, 0],
      [-12, 0, 0],
      [0, 0, -12],
      [7, 0, 7],
      [-7, 0, 7],
      [2, 0, -10],
      [-2, 0, -10],
    ];
    
    return treePositions.map((position, index) => {
      const height = 4 + Math.random() * 3;
      const trunkRadius = 0.3 + Math.random() * 0.2;
      const leavesRadius = 1.5 + Math.random() * 1;
      
      return (
        <group key={`tree-${index}`} position={position as [number, number, number]}>
          {/* Tree trunk */}
          <mesh position={[0, height / 2, 0]} castShadow>
            <cylinderGeometry args={[trunkRadius, trunkRadius * 1.2, height, 8]} />
            <meshStandardMaterial color="#6b4226" roughness={0.8} />
          </mesh>
          
          {/* Tree leaves */}
          <mesh position={[0, height + leavesRadius * 0.7, 0]} castShadow>
            <coneGeometry args={[leavesRadius, leavesRadius * 2, 8]} />
            <meshStandardMaterial color="#2d5f32" roughness={0.8} />
          </mesh>
        </group>
      );
    });
  }, []);
  
  return (
    <group>
      {trees}
      
      {/* Forest-specific speech bubble */}
      <SpeechBubble
        position={[5, 3, 5]}
        content="The forest is dense with ancient trees..."
        duration={15000}
      />
    </group>
  );
}

// Beach environment elements
function BeachElements() {
  // Generate beach elements with predefined positions
  const palmTrees = useMemo(() => {
    const treePositions = [
      [8, 0, -8],
      [-8, 0, -8],
      [12, 0, 0],
      [-12, 0, 0],
      [7, 0, 7],
      [-7, 0, 7],
    ];
    
    return treePositions.map((position, index) => {
      const height = 5 + Math.random() * 2;
      const trunkRadius = 0.3 + Math.random() * 0.15;
      
      // Random trunk curve
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1 - Math.random() * 2, height / 2, 1 - Math.random() * 2),
        new THREE.Vector3(0, height, 0)
      );
      
      const points = curve.getPoints(10);
      
      return (
        <group key={`palm-${index}`} position={position as [number, number, number]}>
          {/* Palm trunk */}
          <mesh castShadow>
            <tubeGeometry args={[curve, 20, trunkRadius, 8, false]} />
            <meshStandardMaterial color="#8a6642" roughness={0.8} />
          </mesh>
          
          {/* Palm leaves */}
          <group position={[0, height, 0]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh 
                key={`leaf-${i}`} 
                position={[0, 0.2, 0]} 
                rotation={[0.3, (Math.PI * 2 / 6) * i, 0]} 
                castShadow
              >
                <boxGeometry args={[0.1, 0.05, 2.5]} />
                <meshStandardMaterial color="#3d8c40" roughness={0.8} />
              </mesh>
            ))}
          </group>
        </group>
      );
    });
  }, []);
  
  // Beach objects
  const beachObjects = useMemo(() => {
    return (
      <group>
        {/* Umbrella */}
        <group position={[4, 0, 4]}>
          <mesh position={[0, 2, 0]} castShadow>
            <coneGeometry args={[2, 0.5, 16]} />
            <meshStandardMaterial color="#e74c3c" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#ecf0f1" />
          </mesh>
        </group>
        
        {/* Beach ball */}
        <mesh position={[5.5, 0.5, 4.5]} castShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#3498db" />
        </mesh>
        
        {/* Beach towel */}
        <mesh position={[3, 0.05, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2, 1]} />
          <meshStandardMaterial color="#9b59b6" />
        </mesh>
      </group>
    );
  }, []);
  
  // Ocean
  const ocean = useMemo(() => {
    return (
      <mesh 
        position={[0, 0.1, WORLD_SIZE / 4]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE / 2]} />
        <meshStandardMaterial 
          color="#1a75ff"
          transparent
          opacity={0.8}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    );
  }, []);
  
  return (
    <group>
      {palmTrees}
      {beachObjects}
      {ocean}
      
      {/* Beach-specific speech bubble */}
      <SpeechBubble
        position={[4, 3, 3]}
        content="The beach has soft sand and swaying palm trees..."
        duration={15000}
      />
    </group>
  );
}
