import { forwardRef, ReactNode } from 'react';
import Ecctrl from 'ecctrl';

// Define a type that includes all props that Ecctrl accepts
type EcctrlProps = {
  children?: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  capsuleHalfHeight?: number;
  capsuleRadius?: number;
  floatHeight?: number;
  followLight?: boolean;
  camInitDis?: number;
  camMaxDis?: number;
  camMinDis?: number;
  camMinZoom?: number;
  camMaxZoom?: number;
  autoBalance?: boolean;
  mode?: "PointerControls" | "PointerLockControls" | "OrbitControls" | "CameraBasedMovement" | "TouchPad";
  // Add any other props that Ecctrl accepts
  [key: string]: any;
};

// Create a wrapper component that properly forwards refs to Ecctrl
// This avoids the "Function components cannot be given refs" warning
const EcctrlWrapper = forwardRef<any, EcctrlProps>((props, ref) => {
  return <Ecctrl {...props} ref={ref} />;
});

// Display name for debugging
EcctrlWrapper.displayName = 'EcctrlWrapper';

export default EcctrlWrapper; 