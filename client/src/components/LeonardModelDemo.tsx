import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { LeonardWithAnimations } from '../models/LeonardWithAnimations';

type AnimationName = 'idle' | 'walking' | 'running' | 'jump' | 'leftTurn' | 
                     'rightTurn' | 'leftTurn90' | 'rightTurn90' | 'leftStrafe' | 
                     'rightStrafe' | 'leftStrafeWalking' | 'rightStrafeWalking';

export function LeonardModelDemo() {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('idle');

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ position: 'absolute', zIndex: 10, left: 10, top: 10, background: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 5 }}>
        <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Leonard Animations</h3>
        {['idle', 'walking', 'running', 'jump', 'leftTurn', 'rightTurn', 
          'leftTurn90', 'rightTurn90', 'leftStrafe', 'rightStrafe', 
          'leftStrafeWalking', 'rightStrafeWalking'].map((anim) => (
          <button 
            key={anim} 
            type="button"
            onClick={() => setCurrentAnimation(anim as AnimationName)}
            style={{ 
              margin: '5px', 
              padding: '5px 10px',
              backgroundColor: currentAnimation === anim ? '#4CAF50' : '#ddd',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {anim}
          </button>
        ))}
      </div>
      
      <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 50 }}>
        <color attach="background" args={['#f0f0f0']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        
        <group position={[0, 0, 0]}>
          <LeonardWithAnimations 
            animation={currentAnimation} 
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]} 
            scale={1}
          />
        </group>
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.4} />
        </mesh>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
          target={[0, 1, 0]}
        />
        
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
} 