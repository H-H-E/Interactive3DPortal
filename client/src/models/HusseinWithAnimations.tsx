import * as THREE from 'three';
import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

// Expanded animation types to match available animations
type AnimationName = 'idle' | 'walk' | 'run' | 'jump' | 'leftStrafe' | 'rightStrafe' | 'stand' | 'jumpingDown';

interface ModelProps {
  animation?: AnimationName;
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  scale?: THREE.Vector3 | [number, number, number] | number;
  [key: string]: unknown; // More specific than 'any'
}

// Animation file mapping
const ANIMATION_FILES: Record<AnimationName, string> = {
  idle: '/animations/locomotion/idle.fbx',
  walk: '/animations/locomotion/walking.fbx',
  run: '/animations/locomotion/running.fbx',
  jump: '/animations/locomotion/jump.fbx',
  leftStrafe: '/animations/locomotion/left strafe.fbx',
  rightStrafe: '/animations/locomotion/right strafe.fbx',
  stand: '/animations/locomotion/stand.fbx',
  jumpingDown: '/animations/locomotion/jumping-down.fbx'
};

export function ModelWithAnimations({ animation = 'idle', ...props }: ModelProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load character model
  const { scene } = useGLTF('/husseinlopol-transformed.glb');
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  
  // Animation mixer
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  
  // Load the FBX animations
  const [animationsLoaded, setAnimationsLoaded] = useState(false);
  const [animationActions, setAnimationActions] = useState<Record<AnimationName, THREE.AnimationAction | null>>({
    idle: null,
    walk: null,
    run: null,
    jump: null,
    leftStrafe: null,
    rightStrafe: null,
    stand: null,
    jumpingDown: null
  });
  
  // Current animation state
  const [currentAnimation, setCurrentAnimation] = useState<AnimationName>(animation);
  const [fadeInProgress, setFadeInProgress] = useState(false);
  
  // Load FBX animations - this will be async
  useEffect(() => {
    let isMounted = true; // Track mounted state to prevent updates after unmount
    
    const loadAnimations = async () => {
      try {
        console.log('Loading animations...');
        // Create a mixer for our character
        if (!mixerRef.current && group.current) {
          mixerRef.current = new THREE.AnimationMixer(group.current);
        }
        
        // Try to load animations
        try {
          // Create a record to store the actions
          const actions: Record<AnimationName, THREE.AnimationAction | null> = {
            idle: null,
            walk: null,
            run: null,
            jump: null,
            leftStrafe: null,
            rightStrafe: null,
            stand: null,
            jumpingDown: null
          };
          
          // Since useFBX is a hook, we can't use it in a loop
          // Instead, we'll load specific animations one at a time
          
          // Load idle animation
          try {
            const idleFbx = await useFBX(ANIMATION_FILES.idle);
            if (mixerRef.current && idleFbx.animations && idleFbx.animations.length > 0) {
              actions.idle = mixerRef.current.clipAction(idleFbx.animations[0]);
              actions.idle.clampWhenFinished = true;
              actions.idle.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
            }
          } catch (error) {
            console.error('Failed to load idle animation:', error);
          }
          
          // Load walk animation
          try {
            const walkFbx = await useFBX(ANIMATION_FILES.walk);
            if (mixerRef.current && walkFbx.animations && walkFbx.animations.length > 0) {
              actions.walk = mixerRef.current.clipAction(walkFbx.animations[0]);
              actions.walk.clampWhenFinished = true;
              actions.walk.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
            }
          } catch (error) {
            console.error('Failed to load walk animation:', error);
          }
          
          // Load run animation
          try {
            const runFbx = await useFBX(ANIMATION_FILES.run);
            if (mixerRef.current && runFbx.animations && runFbx.animations.length > 0) {
              actions.run = mixerRef.current.clipAction(runFbx.animations[0]);
              actions.run.clampWhenFinished = true;
              actions.run.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
            }
          } catch (error) {
            console.error('Failed to load run animation:', error);
          }
          
          // Only update state if component is still mounted
          if (isMounted) {
            setAnimationActions(actions);
            console.log('Animations loaded successfully:', Object.keys(actions).filter(key => actions[key as AnimationName] !== null));
            setAnimationsLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load animations:', error);
          if (isMounted) {
            setAnimationsLoaded(true); // Still mark as loaded so we can proceed
          }
        }
      } catch (error) {
        console.error('Error setting up animations:', error);
      }
    };
    
    loadAnimations();
    
    // Cleanup
    return () => {
      isMounted = false;
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, []);
  
  // Handle animation changes
  useEffect(() => {
    if (!animationsLoaded || fadeInProgress || !mixerRef.current) return;
    
    if (animation !== currentAnimation) {
      setFadeInProgress(true);
      console.log(`Changing animation from ${currentAnimation} to ${animation}`);
      
      // Fade out current animation
      const current = animationActions[currentAnimation];
      if (current) {
        current.fadeOut(0.3);
      }
      
      // Fade in new animation
      const next = animationActions[animation];
      if (next) {
        next.reset().fadeIn(0.3).play();
      } else {
        console.warn(`Animation ${animation} not loaded or available`);
        // Fallback to idle if the requested animation isn't available
        if (animation !== 'idle' && animationActions.idle) {
          animationActions.idle.reset().fadeIn(0.3).play();
        }
      }
      
      setCurrentAnimation(animation);
      
      // Reset fade flag after transition completes
      setTimeout(() => setFadeInProgress(false), 350);
    }
  }, [animation, currentAnimation, animationActions, animationsLoaded, fadeInProgress]);
  
  // Initial animation play
  useEffect(() => {
    if (animationsLoaded && animationActions[currentAnimation]) {
      animationActions[currentAnimation]?.play();
    } else if (animationsLoaded && currentAnimation !== 'idle' && animationActions.idle) {
      // Fallback to idle
      animationActions.idle.play();
    }
  }, [animationsLoaded, animationActions, currentAnimation]);
  
  // Update the animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clone} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/husseinlopol-transformed.glb'); 