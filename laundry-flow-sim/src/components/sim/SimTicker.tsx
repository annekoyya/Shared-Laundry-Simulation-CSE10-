import { useFrame } from '@react-three/fiber';

interface Props {
  onTick: (dt: number) => void;
}

export function SimTicker({ onTick }: Props) {
  useFrame((_, delta) => {
    onTick(delta);
  });
  return null;
}
