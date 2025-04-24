import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function CharacterModel(props: any) {
  const group = useRef<THREE.Group>(null);
  const modelUrl = 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/male/model.gltf';
  const { scene } = useGLTF(modelUrl);
  
  // We'll use the whole scene as a primitive to avoid type issues
  const model = scene.clone();
  
  // Adjust the model position and scale
  model.scale.set(0.64, 0.64, 0.64);
  model.position.y = -0.9;

  return (
    <group ref={group} {...props}>
      <primitive object={model} castShadow receiveShadow />
    </group>
  );
}

// Preload the model
useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/male/model.gltf');