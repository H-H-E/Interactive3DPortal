import { useState, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, Box } from "@react-three/drei";
import * as THREE from "three";
import { Root, Container } from "@react-three/uikit";

interface SpeechBubbleProps {
  position: [number, number, number];
  content: string;
  width?: number;
  height?: number;
  followCamera?: boolean;
  duration?: number;
}

export function SpeechBubble({
  position,
  content,
  width = 2.5,
  height = 1.2,
  followCamera = true,
  duration = 0, // 0 means permanent, > 0 means auto-close after duration
}: SpeechBubbleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [visible, setVisible] = useState(true);
  
  // Automatically hide after duration if specified
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);
  
  // Make speech bubble face the camera
  useFrame(() => {
    if (groupRef.current && followCamera) {
      groupRef.current.lookAt(camera.position);
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Speech bubble background */}
      <Box 
        args={[width, height, 0.05]} 
        position={[0, 0, 0]}
      >
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </Box>
      
      {/* Triangle pointer at bottom */}
      <mesh position={[0, -height/2 - 0.2, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              -0.2, 0, 0,
              0.2, 0, 0,
              0, -0.4, 0
            ])}
            count={3}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={new Uint16Array([0, 1, 2])}
            count={3}
            itemSize={1}
          />
        </bufferGeometry>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      
      {/* Text content */}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.17}
        maxWidth={width - 0.3}
        textAlign="center"
        color="#000000"
      >
        {content}
      </Text>
    </group>
  );
}

// Alternative implementation using UIkit
export function UikitSpeechBubble({
  position,
  content,
  width = 2.5,
  height = 1,
  followCamera = true,
}: SpeechBubbleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Make speech bubble face the camera
  useFrame(() => {
    if (groupRef.current && followCamera) {
      groupRef.current.lookAt(camera.position);
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <Root>
        <Container
          backgroundColor="white"
          backgroundOpacity={0.8}
          padding={0.2}
          borderRadius={0.1}
          width={width}
          height={height}
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={0.17} color="#000000">
            {content}
          </Text>
        </Container>
      </Root>
    </group>
  );
}
