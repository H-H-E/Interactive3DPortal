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
      console.log("Available animations:", Object.keys(actions));
      
      // Get default animation names from the model
      const availableAnimations = Object.keys(actions);
      
      // Play the first animation as default
      if (availableAnimations.length > 0) {
        const defaultAction = actions[availableAnimations[0]];
        if (defaultAction) {
          defaultAction.reset().play();
          console.log(`Playing default animation: ${availableAnimations[0]}`);
        }
      }
    }
  }, [actions]);
  
  // Update animation when movement state changes
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      // Get all available animations
      const availableAnimations = Object.keys(actions);
      
      // Try to find walking/running animations
      const walkAnimations = availableAnimations.filter(name => 
        name.toLowerCase().includes('walk') || name.toLowerCase().includes('run'));
        
      // Try to find idle animations
      const idleAnimations = availableAnimations.filter(name => 
        name.toLowerCase().includes('idle') || name.toLowerCase().includes('stand'));
        
      if (props.isMoving && walkAnimations.length > 0) {
        // Play walking animation
        const walkAnimation = walkAnimations[0];
        
        // Stop all current animations
        Object.values(actions).forEach(action => action.stop());
        
        // Play the walk animation
        actions[walkAnimation].reset().play();
        console.log(`Playing walk animation: ${walkAnimation}`);
      } else if (!props.isMoving && idleAnimations.length > 0) {
        // Play idle animation
        const idleAnimation = idleAnimations[0];
        
        // Stop all current animations
        Object.values(actions).forEach(action => action.stop());
        
        // Play the idle animation
        actions[idleAnimation].reset().play();
        console.log(`Playing idle animation: ${idleAnimation}`);
      }
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