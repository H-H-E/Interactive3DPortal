import * as THREE from 'three';
import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

// Animation types based on available files
type AnimationName = 'idle' | 'walking' | 'running' | 'jump' | 'leftTurn' | 
                     'rightTurn' | 'leftTurn90' | 'rightTurn90' | 'leftStrafe' | 
                     'rightStrafe' | 'leftStrafeWalking' | 'rightStrafeWalking';

// Props for the Leonard model component
interface LeonardProps {
  animation?: AnimationName;
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  scale?: THREE.Vector3 | [number, number, number] | number;
  [key: string]: unknown;
}

export function LeonardWithAnimations({ animation = 'idle', ...props }: LeonardProps) {
  // Reference to the group that will hold our model
  const group = useRef<THREE.Group>(null);
  
  // Load the base model
  const model = useFBX('/geometries/Leonard locomotion Pack/Ch31_nonPBR.fbx');
  const modelRef = useRef<THREE.Group | null>(null);
  
  // Load all animations directly with useFBX (useFBX can't be used in a loop)
  const idleAnimation = useFBX('/geometries/Leonard locomotion Pack/idle.fbx');
  const walkingAnimation = useFBX('/geometries/Leonard locomotion Pack/walking.fbx');
  const runningAnimation = useFBX('/geometries/Leonard locomotion Pack/running.fbx');
  const jumpAnimation = useFBX('/geometries/Leonard locomotion Pack/jump.fbx');
  const leftTurnAnimation = useFBX('/geometries/Leonard locomotion Pack/left turn.fbx');
  const rightTurnAnimation = useFBX('/geometries/Leonard locomotion Pack/right turn.fbx');
  const leftTurn90Animation = useFBX('/geometries/Leonard locomotion Pack/left turn 90.fbx');
  const rightTurn90Animation = useFBX('/geometries/Leonard locomotion Pack/right turn 90.fbx');
  const leftStrafeAnimation = useFBX('/geometries/Leonard locomotion Pack/left strafe.fbx');
  const rightStrafeAnimation = useFBX('/geometries/Leonard locomotion Pack/right strafe.fbx');
  const leftStrafeWalkingAnimation = useFBX('/geometries/Leonard locomotion Pack/left strafe walking.fbx');
  const rightStrafeWalkingAnimation = useFBX('/geometries/Leonard locomotion Pack/right strafe walking.fbx');
  
  // Animation mixer
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Current animation state
  const [currentAnimation, setCurrentAnimation] = useState<AnimationName>(animation);
  const [actions, setActions] = useState<Record<AnimationName, THREE.AnimationAction | null>>({
    idle: null,
    walking: null,
    running: null,
    jump: null,
    leftTurn: null,
    rightTurn: null,
    leftTurn90: null,
    rightTurn90: null,
    leftStrafe: null,
    rightStrafe: null,
    leftStrafeWalking: null,
    rightStrafeWalking: null
  });
  
  // Set up model
  useEffect(() => {
    if (model && group.current) {
      console.log('Setting up Leonard model');
      
      // Clone the model to avoid issues with reusing the same geometry
      const modelClone = SkeletonUtils.clone(model) as THREE.Group;
      
      // Clear previous children if any
      while (group.current.children.length > 0) {
        group.current.remove(group.current.children[0]);
      }
      
      // Store the reference to the model
      modelRef.current = modelClone;
      
      // Apply scale for Mixamo Unity FBX @Web format
      modelClone.scale.set(0.01, 0.01, 0.01);
      
      // Apply transformations based on the specific FBX format
      // For Mixamo Unity FBX @Web format:
      
      // Create a container to handle the orientation correctly
      const container = new THREE.Group();
      group.current.add(container);
      container.add(modelClone);
      
      // Rotate the container to stand upright
      container.rotation.x = 1 ;
      
      // Rotate the model to face forward
      modelClone.rotation.x = Math.PI/2;
      
      // Create animation mixer for the model
      // Important: Create the mixer AFTER all transformations are applied
      mixerRef.current = new THREE.AnimationMixer(modelClone);
      
      // Log the model setup for debugging
      console.log('Leonard model setup complete with container rotation');
    }
  }, [model]);
  
  // Set up animations after model and mixer are created
  useEffect(() => {
    if (!mixerRef.current) return;
    
    // Create an action for each animation
    const newActions: Record<AnimationName, THREE.AnimationAction | null> = {
      idle: null,
      walking: null,
      running: null,
      jump: null,
      leftTurn: null,
      rightTurn: null,
      leftTurn90: null,
      rightTurn90: null,
      leftStrafe: null,
      rightStrafe: null,
      leftStrafeWalking: null,
      rightStrafeWalking: null
    };
    
    // Create actions for each animation if it has animations
    if (idleAnimation.animations && idleAnimation.animations.length > 0) {
      newActions.idle = mixerRef.current.clipAction(idleAnimation.animations[0]);
      newActions.idle.clampWhenFinished = true;
      newActions.idle.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (walkingAnimation.animations && walkingAnimation.animations.length > 0) {
      newActions.walking = mixerRef.current.clipAction(walkingAnimation.animations[0]);
      newActions.walking.clampWhenFinished = true;
      newActions.walking.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (runningAnimation.animations && runningAnimation.animations.length > 0) {
      newActions.running = mixerRef.current.clipAction(runningAnimation.animations[0]);
      newActions.running.clampWhenFinished = true;
      newActions.running.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (jumpAnimation.animations && jumpAnimation.animations.length > 0) {
      newActions.jump = mixerRef.current.clipAction(jumpAnimation.animations[0]);
      newActions.jump.clampWhenFinished = true;
      newActions.jump.setLoop(THREE.LoopOnce, 1);
    }
    
    if (leftTurnAnimation.animations && leftTurnAnimation.animations.length > 0) {
      newActions.leftTurn = mixerRef.current.clipAction(leftTurnAnimation.animations[0]);
      newActions.leftTurn.clampWhenFinished = true;
      newActions.leftTurn.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (rightTurnAnimation.animations && rightTurnAnimation.animations.length > 0) {
      newActions.rightTurn = mixerRef.current.clipAction(rightTurnAnimation.animations[0]);
      newActions.rightTurn.clampWhenFinished = true;
      newActions.rightTurn.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (leftTurn90Animation.animations && leftTurn90Animation.animations.length > 0) {
      newActions.leftTurn90 = mixerRef.current.clipAction(leftTurn90Animation.animations[0]);
      newActions.leftTurn90.clampWhenFinished = true;
      newActions.leftTurn90.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (rightTurn90Animation.animations && rightTurn90Animation.animations.length > 0) {
      newActions.rightTurn90 = mixerRef.current.clipAction(rightTurn90Animation.animations[0]);
      newActions.rightTurn90.clampWhenFinished = true;
      newActions.rightTurn90.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (leftStrafeAnimation.animations && leftStrafeAnimation.animations.length > 0) {
      newActions.leftStrafe = mixerRef.current.clipAction(leftStrafeAnimation.animations[0]);
      newActions.leftStrafe.clampWhenFinished = true;
      newActions.leftStrafe.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (rightStrafeAnimation.animations && rightStrafeAnimation.animations.length > 0) {
      newActions.rightStrafe = mixerRef.current.clipAction(rightStrafeAnimation.animations[0]);
      newActions.rightStrafe.clampWhenFinished = true;
      newActions.rightStrafe.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (leftStrafeWalkingAnimation.animations && leftStrafeWalkingAnimation.animations.length > 0) {
      newActions.leftStrafeWalking = mixerRef.current.clipAction(leftStrafeWalkingAnimation.animations[0]);
      newActions.leftStrafeWalking.clampWhenFinished = true;
      newActions.leftStrafeWalking.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    if (rightStrafeWalkingAnimation.animations && rightStrafeWalkingAnimation.animations.length > 0) {
      newActions.rightStrafeWalking = mixerRef.current.clipAction(rightStrafeWalkingAnimation.animations[0]);
      newActions.rightStrafeWalking.clampWhenFinished = true;
      newActions.rightStrafeWalking.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    
    setActions(newActions);
    
    // Start the default animation
    if (newActions[currentAnimation]) {
      newActions[currentAnimation]?.play();
    }
  }, [
    idleAnimation,
    walkingAnimation,
    runningAnimation,
    jumpAnimation,
    leftTurnAnimation,
    rightTurnAnimation,
    leftTurn90Animation,
    rightTurn90Animation,
    leftStrafeAnimation,
    rightStrafeAnimation,
    leftStrafeWalkingAnimation,
    rightStrafeWalkingAnimation,
    currentAnimation
  ]);
  
  // Handle animation changes
  useEffect(() => {
    if (!mixerRef.current) return;
    
    const currentAction = actions[currentAnimation];
    const newAnimation = animation;
    
    if (currentAnimation === newAnimation) return;
    
    const newAction = actions[newAnimation];
    
    if (currentAction && newAction) {
      // Fade out current animation
      currentAction.fadeOut(0.3);
      
      // Fade in new animation
      newAction.reset().fadeIn(0.3).play();
      
      // Update current animation
      setCurrentAnimation(newAnimation);
    } else if (newAction) {
      newAction.reset().play();
      setCurrentAnimation(newAnimation);
    }
  }, [animation, actions, currentAnimation]);
  
  // Update animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return (
    <group ref={group} {...props} dispose={null}>
      {/* The model will be added as a child in the useEffect */}
      
      {/* Debug axes helper - uncomment to see orientation */}
      <axesHelper args={[1]} />
    </group>
  );
} 