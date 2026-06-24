"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  varying vec2 vUv;

  // Simple pseudo-random
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise based on Morgan McGuire @morgan3d
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f*f*(3.0-2.0*f);

      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  // Fractal Brownian Motion
  float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = .5;
      float frequency = 0.;
      for (int i = 0; i < 5; i++) {
          value += amplitude * noise(st);
          st *= 2.;
          amplitude *= .5;
      }
      return value;
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;

    // Distort coordinates with FBM for a liquid feel
    vec2 q = vec2(0.);
    q.x = fbm(st + 0.00 * uTime);
    q.y = fbm(st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

    float f = fbm(st + r);

    // Mouse interaction - ripple effect
    float dist = distance(st, vec2(uMouse.x * uResolution.x / uResolution.y, 1.0 - uMouse.y));
    float ripple = sin(dist * 20.0 - uTime * 5.0) * exp(-dist * 5.0);
    f += ripple * 0.15; // Distort fluid based on cursor

    // Mix colors based on noise
    vec3 color = mix(
      uColor1,
      uColor2,
      clamp((f * f) * 4.0, 0.0, 1.0)
    );

    color = mix(
      color,
      uColor3,
      clamp(length(q), 0.0, 1.0)
    );

    color = mix(
      color,
      uColor4,
      clamp(length(r.x), 0.0, 1.0)
    );

    gl_FragColor = vec4(color, 1.0);
  }
`;

function FluidMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uColor1: { value: new THREE.Color("#ffffff") }, // Pure White
      uColor2: { value: new THREE.Color("#f8fae6") }, // Light Yellowish White
      uColor3: { value: new THREE.Color("#fff2f9") }, // Light Pinkish White
      uColor4: { value: new THREE.Color("#f2fae6") }, // Light Greenish/Yellow
    }),
    [size]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uResolution.value.set(
        size.width,
        size.height
      );
      
      // Update mouse uniformly based on global pointer
      materialRef.current.uniforms.uMouse.value.lerp(
        new THREE.Vector2(
          (state.pointer.x + 1) / 2,
          1.0 - (state.pointer.y + 1) / 2
        ),
        0.1
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Cover entire screen by scaling plane to viewport size */}
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export function LiquidBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-full h-full bg-white">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
        onCreated={(state) => {
          state.events.connect?.(document.documentElement);
        }}
      >
        <FluidMesh />
      </Canvas>
    </div>
  );
}
