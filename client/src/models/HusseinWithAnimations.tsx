import * as THREE from 'three';
import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

// Expanded animation types to match available animations
type AnimationName = 'idle' | 'walk' | 'run' | 'jump' | 'leftStrafe' | 'leftStrafeWalking' | 'rightStrafe' | 'rightStrafeWalking' | 'leftTurn' | 'leftTurn90' | 'rightTurn' | 'rightTurn90';

interface ModelProps {
  animation?: AnimationName;
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  scale?: THREE.Vector3 | [number, number, number] | number;
  [key: string]: unknown; // More specific than 'any'
}

// Animation file mapping - corrected paths to match your actual file structure
const ANIMATION_FILES: Record<AnimationName, string> = {
  idle: '/animations/huss_animations/idle.fbx',
  walk: '/animations/huss_animations/walking.fbx',
  run: '/animations/huss_animations/running.fbx',
  jump: '/animations/huss_animations/jump.fbx',
  leftStrafe: '/animations/huss_animations/left strafe.fbx',
  leftStrafeWalking: '/animations/huss_animations/left strafe walking.fbx',
  rightStrafe: '/animations/huss_animations/right strafe.fbx',
  rightStrafeWalking: '/animations/huss_animations/right strafe walking.fbx',
  leftTurn: '/animations/huss_animations/left turn.fbx',
  leftTurn90: '/animations/huss_animations/left turn 90.fbx',
  rightTurn: '/animations/huss_animations/right turn.fbx',
  rightTurn90: '/animations/huss_animations/right turn 90.fbx'
};

export function ModelWithAnimations({ animation = 'idle', ...props }: ModelProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load character model from the correct path
  const { scene } = useGLTF('/geometries/husseinlopol-transformed.glb');
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
    leftStrafeWalking: null,
    rightStrafe: null,
    rightStrafeWalking: null,
    leftTurn: null,
    leftTurn90: null,
    rightTurn: null,
    rightTurn90: null
  });
  
  // Current animation state
  const [currentAnimation, setCurrentAnimation] = useState<AnimationName>(animation);
  const [fadeInProgress, setFadeInProgress] = useState(false);
  
  // Load FBX animations
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
            leftStrafeWalking: null,
            rightStrafe: null,
            rightStrafeWalking: null,
            leftTurn: null,
            leftTurn90: null,
            rightTurn: null,
            rightTurn90: null
          };
          
          // Load animations one at a time
          for (const [name, path] of Object.entries(ANIMATION_FILES)) {
            try {
              const fbx = await useFBX(path);
              if (mixerRef.current && fbx.animations && fbx.animations.length > 0) {
                const anim = fbx.animations[0];
                // Fix orientation issues if needed - rotate animation if model is rotated
                // This helps align the FBX animations with the GLB model orientation
                
                const action = mixerRef.current.clipAction(anim);
                action.clampWhenFinished = true;
                action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
                actions[name as AnimationName] = action;
                console.log(`Loaded animation: ${name}`);
              }
            } catch (error) {
              console.error(`Failed to load ${name} animation:`, error);
            }
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
  
  // This rotation helps align the model with the FBX animations
  // You may need to adjust these values based on how the model is oriented
  return (
    <group ref={group} {...props} dispose={null}>
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

// Preload the model
useGLTF.preload('/geometries/husseinlopol-transformed.glb'); 