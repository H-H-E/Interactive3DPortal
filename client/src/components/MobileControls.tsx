import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../hooks/useControls';
import { useIsMobile } from '../hooks/use-is-mobile';

// Styling constants
const JOYSTICK_SIZE = 100;
const JOYSTICK_INNER_SIZE = 40;
const JOYSTICK_COLOR = 'rgba(100, 100, 200, 0.5)';
const JOYSTICK_INNER_COLOR = 'rgba(100, 100, 200, 0.8)';
const INTERACT_BUTTON_COLOR = 'rgba(100, 200, 100, 0.7)';
const BUTTON_SIZE = 60;

export function MobileControls() {
  const isMobile = useIsMobile();
  // Fixed typing for useKeyboardControls
  const [subscribeKeys, getKeys] = useKeyboardControls<Controls>();
  
  // Joystick state
  const [joystickActive, setJoystickActive] = useState(false);
  const [innerPosition, setInnerPosition] = useState({ x: JOYSTICK_SIZE / 2, y: JOYSTICK_SIZE / 2 });
  const joystickRef = useRef<HTMLDivElement>(null);
  
  // Setup key states - will use direct DOM events instead
  const simulateKeyPress = useCallback((key: Controls, pressed: boolean) => {
    // Create and dispatch keyboard events to simulate key presses
    const eventType = pressed ? 'keydown' : 'keyup';
    let keyCode: string;
    
    switch(key) {
      case Controls.forward:
        keyCode = 'KeyW';
        break;
      case Controls.backward:
        keyCode = 'KeyS';
        break;
      case Controls.leftward:
        keyCode = 'KeyA';
        break;
      case Controls.rightward:
        keyCode = 'KeyD';
        break;
      case Controls.interact:
        keyCode = 'KeyE';
        break;
      default:
        keyCode = '';
    }
    
    // Dispatch a synthetic event
    const event = new KeyboardEvent(eventType, {
      code: keyCode,
      key: keyCode.slice(-1).toLowerCase(),
      bubbles: true
    });
    
    document.dispatchEvent(event);
  }, []);
  
  // Handle joystick touch start
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    
    setJoystickActive(true);
    
    // Get touch position
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    
    // Set initial inner position to center
    setInnerPosition({ x: JOYSTICK_SIZE / 2, y: JOYSTICK_SIZE / 2 });
    
    // Prevent scrolling
    e.preventDefault();
  }, []);
  
  // Handle joystick movement
  const handleJoystickMove = useCallback((e: TouchEvent) => {
    if (!joystickActive || !joystickRef.current) return;
    
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    
    // Calculate joystick position relative to joystick center
    const centerX = rect.left + JOYSTICK_SIZE / 2;
    const centerY = rect.top + JOYSTICK_SIZE / 2;
    const touchX = touch.clientX - centerX;
    const touchY = touch.clientY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(touchX * touchX + touchY * touchY);
    
    // Normalize for max distance
    const maxDistance = JOYSTICK_SIZE / 2 - JOYSTICK_INNER_SIZE / 2;
    const normalizedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(touchY, touchX);
    
    // Set inner joystick position with max bounds
    const innerX = JOYSTICK_SIZE / 2 + normalizedDistance * Math.cos(angle);
    const innerY = JOYSTICK_SIZE / 2 + normalizedDistance * Math.sin(angle);
    setInnerPosition({ x: innerX, y: innerY });
    
    // Determine movement direction based on joystick position
    const threshold = 0.3; // Deadzone
    const normalizedX = touchX / maxDistance;
    const normalizedY = touchY / maxDistance;
    
    // Update movement keys based on joystick position
    if (Math.abs(normalizedY) > threshold) {
      simulateKeyPress(Controls.forward, normalizedY < -threshold);
      simulateKeyPress(Controls.backward, normalizedY > threshold);
    } else {
      simulateKeyPress(Controls.forward, false);
      simulateKeyPress(Controls.backward, false);
    }
    
    if (Math.abs(normalizedX) > threshold) {
      simulateKeyPress(Controls.leftward, normalizedX < -threshold);
      simulateKeyPress(Controls.rightward, normalizedX > threshold);
    } else {
      simulateKeyPress(Controls.leftward, false);
      simulateKeyPress(Controls.rightward, false);
    }
    
    // Prevent scrolling
    e.preventDefault();
  }, [joystickActive, simulateKeyPress]);
  
  // Handle joystick touch end
  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setInnerPosition({ x: JOYSTICK_SIZE / 2, y: JOYSTICK_SIZE / 2 });
    
    // Reset all movement keys
    simulateKeyPress(Controls.forward, false);
    simulateKeyPress(Controls.backward, false);
    simulateKeyPress(Controls.leftward, false);
    simulateKeyPress(Controls.rightward, false);
  }, [simulateKeyPress]);
  
  // Handle interaction button
  const handleInteractPress = () => {
    simulateKeyPress(Controls.interact, true);
    setTimeout(() => simulateKeyPress(Controls.interact, false), 200);
  };
  
  // Add global touch event listeners
  useEffect(() => {
    if (isMobile) {
      window.addEventListener('touchmove', handleJoystickMove, { passive: false });
      window.addEventListener('touchend', handleJoystickEnd);
      window.addEventListener('touchcancel', handleJoystickEnd);
      
      // Prevent page scrolling while using joystick
      const preventScroll = (e: TouchEvent) => {
        if (joystickActive) {
          e.preventDefault();
        }
      };
      
      window.addEventListener('touchmove', preventScroll, { passive: false });
      
      return () => {
        window.removeEventListener('touchmove', handleJoystickMove);
        window.removeEventListener('touchend', handleJoystickEnd);
        window.removeEventListener('touchcancel', handleJoystickEnd);
        window.removeEventListener('touchmove', preventScroll);
      };
    }
  }, [isMobile, joystickActive, handleJoystickMove, handleJoystickEnd]);
  
  // Don't render anything if not on mobile
  if (!isMobile) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000,
      touchAction: 'none',
    }}>
      {/* Virtual joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        style={{
          position: 'absolute',
          bottom: 50,
          left: 50,
          width: `${JOYSTICK_SIZE}px`,
          height: `${JOYSTICK_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: JOYSTICK_COLOR,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${innerPosition.x - JOYSTICK_INNER_SIZE / 2}px`,
            top: `${innerPosition.y - JOYSTICK_INNER_SIZE / 2}px`,
            width: `${JOYSTICK_INNER_SIZE}px`,
            height: `${JOYSTICK_INNER_SIZE}px`,
            borderRadius: '50%',
            backgroundColor: JOYSTICK_INNER_COLOR,
            transition: joystickActive ? 'none' : 'all 0.2s ease-out',
          }}
        />
      </div>
      
      {/* Interact button */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          right: 80,
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: INTERACT_BUTTON_COLOR,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'auto',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onTouchStart={handleInteractPress}
      >
        E
      </div>
    </div>
  );
} 