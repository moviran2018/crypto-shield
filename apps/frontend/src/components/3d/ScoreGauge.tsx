import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ArcProps {
  score: number;
  radius?: number;
}

function Arc({ score, radius = 2 }: ArcProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const percentage = Math.min(100, Math.max(0, score)) / 100;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const segments = 64;
    const innerRadius = radius - 0.15;
    const startAngle = -Math.PI * 0.75;
    const endAngle = startAngle + percentage * (Math.PI * 1.5);

    s.moveTo(Math.cos(startAngle) * innerRadius, Math.sin(startAngle) * innerRadius);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * (endAngle - startAngle);
      s.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const angle = startAngle + t * (endAngle - startAngle);
      s.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    }
    s.closePath();
    return s;
  }, [percentage, radius]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  const color = percentage >= 0.8 ? '#22c55e' : percentage >= 0.6 ? '#eab308' : percentage >= 0.4 ? '#f97316' : '#ef4444';

  return (
    <mesh ref={meshRef}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  return (
    <div className="w-48 h-48 mx-auto">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Arc score={score} />
      </Canvas>
    </div>
  );
}
