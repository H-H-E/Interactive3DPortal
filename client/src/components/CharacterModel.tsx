import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

export function CharacterModel(props: any) {
  const group = useRef<THREE.Group>(null);
  
  // Use a fully rigged animated character from the Three.js examples
  const modelUrl = 'https://threejs.org/examples/models/gltf/Xbot.glb';
  const { scene, animations } = useGLTF(modelUrl);
  const { actions, mixer } = useAnimations(animations, group);
  
  // Log available animations once on load and set up animations
  useEffect(() => {
    if (actions) {
      const animationNames = Object.keys(actions);
      console.log("Available animations:", animationNames);
      
      // Play the first animation as default
      if (animationNames.length > 0) {
        const defaultAction = actions[animationNames[0]];
        if (defaultAction) {
          defaultAction.reset().play();
          console.log(`Playing default animation: ${animationNames[0]}`);
        }
      }
    }
  }, [actions]);
  
  // Update animation when movement state changes
  useEffect(() => {
    if (!actions) return;
    
    const animationNames = Object.keys(actions);
    if (animationNames.length === 0) return;
    
    // Find appropriate animations
    let walkAnim = null;
    let idleAnim = null;
    
    // Get walk and idle animations
    for (const name of animationNames) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('walk') || lowerName.includes('run')) {
        walkAnim = name;
      }
      if (lowerName.includes('idle') || lowerName.includes('stand')) {
        idleAnim = name;
      }
    }
    
    // Use first animation as fallback
    const fallbackAnim = animationNames[0];
    
    // Default animation to play
    let animToPlay = props.isMoving ? (walkAnim || fallbackAnim) : (idleAnim || fallbackAnim);
    
    // Stop all animations
    animationNames.forEach(name => {
      const action = actions[name];
      if (action) action.stop();
    });
    
    // Play the selected animation
    const currentAction = actions[animToPlay];
    if (currentAction) {
      currentAction.reset().play();
      console.log(`Playing ${props.isMoving ? 'walk' : 'idle'} animation: ${animToPlay}`);
    }
  }, [actions, props.isMoving]);
  
  // Clone and prepare model
  const model = scene.clone();
  
  // Scale model to appropriate size and position
  model.scale.set(1.2, 1.2, 1.2);
  model.position.y = -1.7;
  
  // Make sure all meshes cast shadows
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={model} />
    </group>
  );
}

// Preload the model
useGLTF.preload('https://threejs.org/examples/models/gltf/Xbot.glb');