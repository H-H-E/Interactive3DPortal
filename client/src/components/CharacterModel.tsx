import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function CharacterModel(props: any) {
  const modelUrl = 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/male/model.gltf';
  const { scene } = useGLTF(modelUrl);
  const ref = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (ref.current) {
      // Scale and position the model
      ref.current.scale.set(0.7, 0.7, 0.7);
      ref.current.position.y = -0.9; // Adjust height to match ground
    }
  }, []);
  
  return (
    <group ref={ref} {...props}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Preload the model
useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/male/model.gltf');