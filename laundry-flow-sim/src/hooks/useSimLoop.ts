import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export function useSimLoop(onTick: (dt: number) => void) {
  const callbackRef = useRef(onTick);
  callbackRef.current = onTick;

  useFrame((_, delta) => {
    callbackRef.current(delta);
  });
}
