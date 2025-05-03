import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePortals } from "../lib/stores/usePortals";

interface PortalCameraProps {
  transitionDuration?: number;
}

export function PortalCamera({ transitionDuration = 1.0 }: PortalCameraProps) {
  const { camera } = useThree();
  const { isInPortal, nearPortal } = usePortals();
  
  // References for transition animation
  const inTransition = useRef(false);
  const transitionStartTime = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startRotation = useRef(new THREE.Euler());
  const targetPosition = useRef(new THREE.Vector3());
  const targetRotation = useRef(new THREE.Euler());
  
  // Handle portal transition
  useEffect(() => {
    if (isInPortal && nearPortal) {
      // Start transition
      inTransition.current = true;
      transitionStartTime.current = Date.now();
      
      // Store current camera position and rotation
      startPosition.current.copy(camera.position);
      startRotation.current.copy(camera.rotation);
      
      // Set target position (move camera into the portal)
      const portalPosition = new THREE.Vector3(
        nearPortal.position[0],
        nearPortal.position[1],
        nearPortal.position[2]
      );
      
      // Calculate target position (move slightly into the portal)
      targetPosition.current.copy(portalPosition);
      
      // Look at portal
      const lookAt = new THREE.Vector3();
      camera.getWorldDirection(lookAt);
      
      // Store target rotation
      const tempCamera = camera.clone();
      tempCamera.position.copy(targetPosition.current);
      tempCamera.lookAt(portalPosition.clone().add(lookAt.multiplyScalar(5)));
      targetRotation.current.copy(tempCamera.rotation);
    }
  }, [isInPortal, nearPortal, camera]);
  
  // Animate camera when in transition
  useFrame(() => {
    if (inTransition.current) {
      const currentTime = Date.now();
      const elapsed = (currentTime - transitionStartTime.current) / 1000;
      const progress = Math.min(elapsed / transitionDuration, 1);
      
      // Ease in-out function for smooth transition
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const eased = easeInOut(progress);
      
      // Interpolate position and rotation
      camera.position.lerpVectors(startPosition.current, targetPosition.current, eased);
      
      // Interpolate rotation with quaternions for smoother rotation
      const startQuaternion = new THREE.Quaternion().setFromEuler(startRotation.current);
      const targetQuaternion = new THREE.Quaternion().setFromEuler(targetRotation.current);
      const tempQuaternion = new THREE.Quaternion();
      tempQuaternion.slerpQuaternions(startQuaternion, targetQuaternion, eased);
      camera.quaternion.copy(tempQuaternion);
      
      // End transition when complete
      if (progress >= 1) {
        inTransition.current = false;
      }
    }
  });
  
  return null;
}