import { create } from "zustand";

export interface Portal {
  id: string;
  position: [number, number, number];
  destination: string;
  label: string;
}

interface PortalState {
  // Portal data
  portals: Portal[];
  nearPortal: Portal | null;
  isInPortal: boolean;
  currentScene: string;
  
  // Actions
  addPortal: (portal: Portal) => void;
  removePortal: (id: string) => void;
  setNearPortal: (portal: Portal | null) => void;
  enterPortal: () => void;
  setIsInPortal: (status: boolean) => void;
  setCurrentScene: (scene: string) => void;
}

export const usePortals = create<PortalState>((set) => ({
  // Initial state
  portals: [],
  nearPortal: null,
  isInPortal: false,
  currentScene: "city",
  
  // Actions
  addPortal: (portal) => set((state) => ({
    portals: [...state.portals.filter(p => p.id !== portal.id), portal]
  })),
  
  removePortal: (id) => set((state) => ({
    portals: state.portals.filter(p => p.id !== id)
  })),
  
  setNearPortal: (portal) => set({
    nearPortal: portal
  }),
  
  enterPortal: () => set({
    isInPortal: true
  }),
  
  setIsInPortal: (status) => set({
    isInPortal: status
  }),
  
  setCurrentScene: (scene) => set({
    currentScene: scene
  }),
}));
