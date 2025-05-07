import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  animation?: string;
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  scale?: THREE.Vector3 | [number, number, number] | number;
  [key: string]: unknown;
}

export function UntitledModel({ animation = 'idle', ...props }: ModelProps) {
  const group = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Use the untitled.fbx model directly
  const model = useFBX('/animations/huss_animations/untitled.fbx');
  
  // Create the animation mixer when the model is loaded
  useEffect(() => {
    if (model && group.current) {
      console.log('Model loaded successfully:', model);
      
      // Clone the model before adding to scene
      const modelClone = model.clone();
      
      // Clear previous children if any
      while (group.current.children.length > 0) {
        group.current.remove(group.current.children[0]);
      }
      
      // Add the cloned model to the group
      group.current.add(modelClone);
      
      // Create animation mixer
      mixerRef.current = new THREE.AnimationMixer(modelClone);
      
      // If there are animations, play the first one
      if (model.animations && model.animations.length > 0) {
        console.log('Found animations:', model.animations.length);
        const action = mixerRef.current.clipAction(model.animations[0]);
        action.play();
      } else {
        console.log('No animations found in the model');
      }
    }
    
    // Cleanup
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [model]);
  
  // Update the animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return (
    <group ref={group} {...props} dispose={null}>
      {/* The model will be added as a child in the useEffect */}
    </group>
  );
}

export default UntitledModel; 