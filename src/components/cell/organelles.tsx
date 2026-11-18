import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AdditiveBlending,
  Color,
  EdgesGeometry,
  FrontSide,
  IcosahedronGeometry,
  MathUtils,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type Intersection,
  type Mesh,
  type MeshStandardMaterial,
  type PointLight,
} from "three";
import type { OrganelleId } from "@/lib/types";
import {
  CELL_RADIUS,
  ER_LOOPS,
  MITOCHONDRIA,
  NUCLEUS_POSITION,
  ORGANELLE_META,
  RIBOSOME_POINTS,
  type MitochondrionPlacement,
} from "./cellData";

export interface OrganelleProps {
  selectedId: OrganelleId | null;
  /** Leave undefined for a decorative, non-clickable cell (the hero). */
  onSelect?: (id: OrganelleId) => void;
  /** Breathing and drifting. Off when the visitor asked for reduced motion. */
  animate: boolean;
}

/* ------------------------------------------------------------------ shared helpers */

/** Walks up the scene graph to find which organelle a mesh belongs to. */
function organelleIdOf(object: Object3D | null): OrganelleId | null {
  let node: Object3D | null = object;
  while (node) {
    const id = node.userData?.organelle as OrganelleId | undefined;
    if (id) return id;
    node = node.parent;
  }
  return null;
}

/** True when the pointer ray also passes through an organelle other than the membrane. */
function hitsInnerOrganelle(intersections: Intersection[]): boolean {
  return intersections.some((hit) => {
    const id = organelleIdOf(hit.object);
    return id !== null && id !== "membrane";
  });
}

/**
 * Hover and click wiring shared by every organelle.
 * `boost` multiplies the glow: 3 selected, 2 hovered, 0.6 when something else is selected, 1 otherwise.
 */
function useOrganelle(
  id: OrganelleId,
  selectedId: OrganelleId | null,
  onSelect?: (id: OrganelleId) => void,
) {
  const [hovered, setHovered] = useState(false);
  const boost = selectedId === id ? 3 : hovered ? 2 : selectedId ? 0.6 : 1;

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  const handlers = useMemo(
    () =>
      onSelect
        ? {
            onClick: (event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              onSelect(id);
            },
            onPointerOver: (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "pointer";
            },
            onPointerOut: () => {
              setHovered(false);
              document.body.style.cursor = "";
            },
          }
        : {},
    [id, onSelect],
  );

  return { boost, handlers };
}

/** Slow scale pulse and drift around the starting position, so the cell reads as alive. */
function useBreathing(
  ref: RefObject<Group>,
  enabled: boolean,
  phase: number,
  scaleAmplitude = 0.025,
  drift = 0.025,
) {
  const base = useRef<{ position: Vector3; scale: number } | null>(null);
  useFrame((state) => {
    const group = ref.current;
    if (!group || !enabled) return;
    if (!base.current) base.current = { position: group.position.clone(), scale: group.scale.x };
    const t = state.clock.elapsedTime;
    const start = base.current;
    group.scale.setScalar(start.scale * (1 + scaleAmplitude * Math.sin(t * 1.1 + phase)));
    group.position.set(
      start.position.x + drift * Math.sin(t * 0.7 + phase),
      start.position.y + drift * Math.cos(t * 0.9 + phase * 1.3),
      start.position.z + drift * Math.sin(t * 0.6 + phase * 0.7),
    );
  });
}

interface GlowMaterialProps {
  color: string;
  /** Resting emissive intensity. */
  base?: number;
  /** Glow multiplier from useOrganelle. */
  boost: number;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  flatShading?: boolean;
}

/** MeshStandardMaterial with an emissive glow that eases toward its target (instantly when frames are on demand). */
function GlowMaterial({
  color,
  base = 0.5,
  boost,
  opacity = 1,
  roughness = 0.4,
  metalness = 0.1,
  flatShading = false,
}: GlowMaterialProps) {
  const ref = useRef<MeshStandardMaterial>(null);
  const onDemand = useThree((state) => state.frameloop === "demand");

  useFrame((_, delta) => {
    const material = ref.current;
    if (!material || onDemand) return;
    material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, base * boost, 7, delta);
  });

  return (
    <meshStandardMaterial
      ref={ref}
      color={color}
      emissive={color}
      emissiveIntensity={onDemand ? base * boost : base}
      roughness={roughness}
      metalness={metalness}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
      flatShading={flatShading}
    />
  );
}

/** Many identical small spheres drawn in one call (nuclear pores, ribosomes). */
function Dots({
  points,
  radius,
  color,
  boost,
}: {
  points: Float32Array;
  radius: number;
  color: string;
  boost: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const count = points.length / 3;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const helper = new Object3D();
    for (let i = 0; i < count; i += 1) {
      helper.position.set(points[i * 3]!, points[i * 3 + 1]!, points[i * 3 + 2]!);
      helper.updateMatrix();
      mesh.setMatrixAt(i, helper.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [points, count]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[radius, 10, 10]} />
      <GlowMaterial color={color} base={0.8} boost={boost} roughness={0.3} />
    </instancedMesh>
  );
}

/** Sphere with a gentle lumpy displacement, for a nucleus that is not a perfect ball. */
function lumpySphere(radius: number, amount: number, seed: number): SphereGeometry {
  const geometry = new SphereGeometry(radius, 64, 48);
  const position = geometry.attributes.position!;
  const v = new Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    const wave =
      Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 1.3) +
      0.5 * Math.sin(v.z * 4.3 + v.x * 1.9 + seed);
    v.multiplyScalar(1 + amount * wave);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Evenly spread points on a sphere (Fibonacci lattice). */
function fibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = golden * i;
    out[i * 3] = Math.cos(angle) * ring * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(angle) * ring * radius;
  }
  return out;
}

const NUCLEAR_PORES = fibonacciSphere(22, 0.645);

/* ------------------------------------------------------------------ membrane */

const MEMBRANE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

// Fresnel rim: transparent in the middle, glowing at the silhouette.
const MEMBRANE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBoost;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.6);
    float alpha = clamp(rim * 0.95 * uBoost + 0.035, 0.0, 1.0);
    gl_FragColor = vec4(uColor * (0.55 + rim), alpha);
  }
`;

export function Membrane({ selectedId, onSelect }: OrganelleProps) {
  const [hovered, setHovered] = useState(false);
  const onDemand = useThree((state) => state.frameloop === "demand");
  const invalidate = useThree((state) => state.invalidate);
  const selected = selectedId === "membrane";
  const target = selected ? 2.4 : hovered ? 1.7 : selectedId ? 0.7 : 1;

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color(ORGANELLE_META.membrane.color) },
          uBoost: { value: 1 },
        },
        vertexShader: MEMBRANE_VERTEX,
        fragmentShader: MEMBRANE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: FrontSide,
      }),
    [],
  );
  const wire = useMemo(
    () => new EdgesGeometry(new IcosahedronGeometry(CELL_RADIUS * 1.012, 2)),
    [],
  );
  useEffect(
    () => () => {
      material.dispose();
      wire.dispose();
      document.body.style.cursor = "";
    },
    [material, wire],
  );

  useFrame((_, delta) => {
    if (onDemand) return;
    material.uniforms.uBoost!.value = MathUtils.damp(
      material.uniforms.uBoost!.value as number,
      target,
      6,
      delta,
    );
  });
  useEffect(() => {
    if (!onDemand) return;
    material.uniforms.uBoost!.value = target;
    invalidate();
  }, [onDemand, target, material, invalidate]);

  // The membrane is the closest surface, so it sees every ray first. It only acts when the ray
  // reaches no inner organelle, which is what makes the organelles inside clickable.
  const interactive = Boolean(onSelect);
  return (
    <group userData={{ organelle: "membrane" }}>
      <mesh
        material={material}
        userData={{ organelle: "membrane" }}
        onClick={
          interactive
            ? (event: ThreeEvent<MouseEvent>) => {
                if (hitsInnerOrganelle(event.intersections)) return;
                event.stopPropagation();
                onSelect?.("membrane");
              }
            : undefined
        }
        onPointerMove={
          interactive
            ? (event: ThreeEvent<PointerEvent>) => {
                const free = !hitsInnerOrganelle(event.intersections);
                setHovered(free);
                if (free) document.body.style.cursor = "pointer";
              }
            : undefined
        }
        onPointerOut={
          interactive
            ? () => {
                setHovered(false);
                document.body.style.cursor = "";
              }
            : undefined
        }
      >
        <sphereGeometry args={[CELL_RADIUS, 64, 48]} />
      </mesh>
      {/* Faint lattice just outside the surface: a nod to a computational model. */}
      <lineSegments geometry={wire} raycast={() => null}>
        <lineBasicMaterial
          color={ORGANELLE_META.membrane.color}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------------ nucleus */

export function Nucleus({ selectedId, onSelect, animate }: OrganelleProps) {
  const { boost, handlers } = useOrganelle("nucleus", selectedId, onSelect);
  const group = useRef<Group>(null);
  const chromatin = useRef<Mesh>(null);
  const envelope = useMemo(() => lumpySphere(0.62, 0.045, 1.3), []);
  useEffect(() => () => envelope.dispose(), [envelope]);

  useBreathing(group, animate, 0.4);
  useFrame((_, delta) => {
    if (!animate || !chromatin.current) return;
    chromatin.current.rotation.y += delta * 0.25;
    chromatin.current.rotation.x += delta * 0.12;
  });

  return (
    <group
      ref={group}
      position={NUCLEUS_POSITION}
      userData={{ organelle: "nucleus" }}
      {...handlers}
    >
      <mesh geometry={envelope}>
        <GlowMaterial color="#4f8cff" base={0.5} boost={boost} opacity={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0.12, 0.06, 0.1]}>
        <icosahedronGeometry args={[0.2, 2]} />
        <GlowMaterial color="#dbe8ff" base={0.8} boost={boost} flatShading />
      </mesh>
      <mesh ref={chromatin}>
        <torusKnotGeometry args={[0.3, 0.022, 140, 8, 2, 3]} />
        <GlowMaterial color="#ffb3d1" base={0.7} boost={boost} />
      </mesh>
      <Dots points={NUCLEAR_PORES} radius={0.03} color="#bcd6ff" boost={boost} />
    </group>
  );
}

/* ------------------------------------------------------------------ endoplasmic reticulum */

export function EndoplasmicReticulum({ selectedId, onSelect, animate }: OrganelleProps) {
  const { boost, handlers } = useOrganelle("er", selectedId, onSelect);
  const group = useRef<Group>(null);
  const tubes = useMemo(
    () => ER_LOOPS.map((curve) => new TubeGeometry(curve, 140, 0.04, 8, true)),
    [],
  );
  useEffect(() => () => tubes.forEach((tube) => tube.dispose()), [tubes]);
  useBreathing(group, animate, 1.7, 0.012, 0.02);

  return (
    <group ref={group} position={NUCLEUS_POSITION} userData={{ organelle: "er" }} {...handlers}>
      {tubes.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <GlowMaterial color="#9d8cff" base={0.45} boost={boost} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ mitochondria */

const CRISTAE = [-0.18, -0.09, 0, 0.09, 0.18];

function Mitochondrion({
  placement,
  boost,
  animate,
  phase,
}: {
  placement: MitochondrionPlacement;
  boost: number;
  animate: boolean;
  phase: number;
}) {
  const ref = useRef<Group>(null);
  useBreathing(ref, animate, phase, 0.03, 0.04);

  return (
    <group
      ref={ref}
      position={placement.position}
      rotation={placement.rotation}
      scale={placement.scale}
    >
      {/* Outer membrane */}
      <mesh>
        <capsuleGeometry args={[0.17, 0.5, 8, 24]} />
        <GlowMaterial color="#ff8f70" base={0.45} boost={boost} opacity={0.55} />
      </mesh>
      {/* Inner membrane and the folds (cristae) across it */}
      <mesh>
        <capsuleGeometry args={[0.11, 0.46, 6, 16]} />
        <GlowMaterial color="#ffc2ad" base={0.35} boost={boost} />
      </mesh>
      {CRISTAE.map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.125, 0.014, 8, 28]} />
          <GlowMaterial color="#ff8f70" base={0.7} boost={boost} />
        </mesh>
      ))}
    </group>
  );
}

export function Mitochondria({ selectedId, onSelect, animate }: OrganelleProps) {
  const { boost, handlers } = useOrganelle("mitochondria", selectedId, onSelect);
  return (
    <group userData={{ organelle: "mitochondria" }} {...handlers}>
      {MITOCHONDRIA.map((placement, index) => (
        <Mitochondrion
          key={index}
          placement={placement}
          boost={boost}
          animate={animate}
          phase={index * 1.4}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ Golgi apparatus */

const GOLGI_LAYERS = [0, 1, 2, 3, 4].map((i) => ({ radius: 0.44 - i * 0.035, y: (i - 2) * 0.115 }));
const GOLGI_VESICLES: [number, number, number][] = [
  [0.52, 0.28, 0.12],
  [-0.5, 0.12, 0.3],
  [0.1, -0.4, 0.5],
  [0.55, -0.25, -0.2],
  [-0.45, 0.35, -0.3],
  [0.2, 0.42, -0.45],
];

export function Golgi({ selectedId, onSelect, animate }: OrganelleProps) {
  const { boost, handlers } = useOrganelle("golgi", selectedId, onSelect);
  const group = useRef<Group>(null);
  useBreathing(group, animate, 2.6);

  return (
    <group
      ref={group}
      position={[1.05, -0.1, -0.35]}
      rotation={[0.35, -0.6, 0.25]}
      userData={{ organelle: "golgi" }}
      {...handlers}
    >
      {/* Stacked, slightly curved sacs (cisternae) */}
      {GOLGI_LAYERS.map((layer, index) => (
        <mesh key={index} position={[0, layer.y, 0]} rotation={[Math.PI / 2 + index * 0.05, 0, 0]}>
          <torusGeometry args={[layer.radius, 0.034, 10, 40, Math.PI * 1.2]} />
          <GlowMaterial color="#ffcf5c" base={0.5} boost={boost} />
        </mesh>
      ))}
      {/* Vesicles budding off the stack */}
      {GOLGI_VESICLES.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.06, 14, 14]} />
          <GlowMaterial color="#ffe7a3" base={0.6} boost={boost} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ ribosomes */

export function Ribosomes({ selectedId, onSelect }: OrganelleProps) {
  const { boost, handlers } = useOrganelle("ribosomes", selectedId, onSelect);
  return (
    <group userData={{ organelle: "ribosomes" }} {...handlers}>
      <Dots points={RIBOSOME_POINTS} radius={0.042} color="#dfe8ff" boost={boost} />
    </group>
  );
}

/* ------------------------------------------------------------------ lights */

/** Ambient light plus a blue and a teal point light that circle the cell, so highlights slowly shift. */
export function Lights({ animate }: { animate: boolean }) {
  const blue = useRef<PointLight>(null);
  const teal = useRef<PointLight>(null);

  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    blue.current?.position.set(
      Math.cos(t * 0.35) * 5,
      3 + Math.sin(t * 0.5),
      Math.sin(t * 0.35) * 5,
    );
    teal.current?.position.set(
      Math.cos(t * 0.3 + 3) * 5,
      -2 + Math.cos(t * 0.45),
      Math.sin(t * 0.3 + 3) * 5,
    );
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight ref={blue} position={[4, 3, 4]} color="#4f8cff" intensity={90} decay={2} />
      <pointLight ref={teal} position={[-4, -2, 3]} color="#3fd9c8" intensity={80} decay={2} />
    </>
  );
}
