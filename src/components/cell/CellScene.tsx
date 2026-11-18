import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ElementRef,
  type MutableRefObject,
} from "react";
import { MathUtils, Vector3, type Group } from "three";
import { useFinePointer, useIsNarrow, useReduced } from "@/hooks/useMedia";
import { usePointerRef, type PointerPosition } from "@/hooks/usePointerRef";
import type { OrganelleId } from "@/lib/types";
import { DEFAULT_DISTANCE, MAX_DISTANCE, MIN_DISTANCE, ORGANELLE_META } from "./cellData";
import {
  EndoplasmicReticulum,
  Golgi,
  Lights,
  Membrane,
  Mitochondria,
  Nucleus,
  Ribosomes,
  type OrganelleProps,
} from "./organelles";

export interface CellSceneHandle {
  zoomBy: (factor: number) => void;
  resetView: () => void;
}

interface CellSceneProps {
  /** "hero": decorative, follows the cursor. "explorer": clickable, orbit controls, zoom to organelles. */
  variant: "hero" | "explorer";
  selectedId?: OrganelleId | null;
  /** Called with an organelle id on click, or null when the view is reset or empty space is clicked. */
  onSelect?: (id: OrganelleId | null) => void;
  /** True while the canvas is off screen: rendering stops completely. */
  paused?: boolean;
}

interface CameraApi {
  zoomBy: (factor: number) => void;
  reset: () => void;
  /** Re-arms the automatic camera move (used when the same organelle is clicked again). */
  engage: () => void;
}

/* ------------------------------------------------------------------ the cell itself */

interface CellModelProps extends OrganelleProps {
  variant: CellSceneProps["variant"];
  pointer: MutableRefObject<PointerPosition>;
}

function CellModel({ variant, pointer, ...organelle }: CellModelProps) {
  const group = useRef<Group>(null);
  const spin = useRef(0);

  // Hero only: a slow turn plus a lean toward the cursor (parallax).
  useFrame((_, delta) => {
    const cell = group.current;
    if (!cell || variant !== "hero") return;
    if (organelle.animate) spin.current += delta * 0.12;
    cell.rotation.y = MathUtils.damp(
      cell.rotation.y,
      spin.current + pointer.current.x * 0.5,
      3,
      delta,
    );
    cell.rotation.x = MathUtils.damp(cell.rotation.x, -pointer.current.y * 0.3, 3, delta);
  });

  return (
    <group ref={group}>
      <Membrane {...organelle} />
      <Nucleus {...organelle} />
      <EndoplasmicReticulum {...organelle} />
      <Mitochondria {...organelle} />
      <Golgi {...organelle} />
      <Ribosomes {...organelle} />
    </group>
  );
}

/* ------------------------------------------------------------------ explorer camera */

interface ExplorerControlsProps {
  selectedId: OrganelleId | null;
  reduced: boolean;
  zoomEnabled: boolean;
  apiRef: MutableRefObject<CameraApi | null>;
}

/**
 * Orbit controls plus the camera moves:
 * - selecting an organelle eases the camera (lerp) to a point facing it;
 * - clearing the selection eases it back out to frame the whole cell;
 * - as soon as the visitor drags or zooms, the automatic move stops until the next selection.
 */
function ExplorerControls({ selectedId, reduced, zoomEnabled, apiRef }: ExplorerControlsProps) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);

  const userMoving = useRef(false);
  const returning = useRef(false);
  const scratch = useMemo(
    () => ({
      focus: new Vector3(),
      direction: new Vector3(),
      position: new Vector3(),
      target: new Vector3(),
      offset: new Vector3(),
    }),
    [],
  );

  // A new selection (or clearing it) hands the camera back to the automatic move.
  useEffect(() => {
    userMoving.current = false;
    returning.current = selectedId === null;
    invalidate();
  }, [selectedId, invalidate]);

  // On touch screens a vertical swipe over the canvas must still scroll the page.
  useEffect(() => {
    const element = gl.domElement;
    element.style.touchAction = "pan-y";
    // OrbitControls sets "none" when it connects; set ours again right after.
    const frame = requestAnimationFrame(() => {
      element.style.touchAction = "pan-y";
    });
    return () => cancelAnimationFrame(frame);
  }, [gl]);

  useEffect(() => {
    apiRef.current = {
      zoomBy: (factor) => {
        const c = controls.current;
        if (!c) return;
        scratch.offset.copy(camera.position).sub(c.target);
        const distance = MathUtils.clamp(
          scratch.offset.length() * factor,
          MIN_DISTANCE,
          MAX_DISTANCE,
        );
        scratch.offset.setLength(distance);
        camera.position.copy(c.target).add(scratch.offset);
        userMoving.current = true;
        c.update();
        invalidate();
      },
      reset: () => {
        userMoving.current = false;
        returning.current = true;
        invalidate();
      },
      engage: () => {
        userMoving.current = false;
        returning.current = false;
        invalidate();
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, invalidate, scratch]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || userMoving.current) return;

    const { focus, direction, position, target } = scratch;
    if (selectedId) {
      const meta = ORGANELLE_META[selectedId];
      focus.set(...meta.focus);
      if (meta.approach === "radial") direction.copy(focus).normalize();
      else direction.copy(camera.position).sub(c.target).normalize();
      position.copy(focus).addScaledVector(direction, meta.distance);
      target.copy(focus);
    } else if (returning.current) {
      direction.copy(camera.position).sub(c.target).normalize();
      position.copy(direction).multiplyScalar(DEFAULT_DISTANCE);
      target.set(0, 0, 0);
    } else {
      return;
    }

    const ease = reduced ? 1 : 1 - Math.exp(-delta * 3.2);
    camera.position.lerp(position, ease);
    c.target.lerp(target, ease);
    if (!selectedId && camera.position.distanceTo(position) < 0.02) returning.current = false;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      enableZoom={zoomEnabled}
      autoRotate={!selectedId && !reduced}
      autoRotateSpeed={0.7}
      onStart={() => {
        userMoving.current = true;
      }}
    />
  );
}

/* ------------------------------------------------------------------ canvas */

const CellScene = forwardRef<CellSceneHandle, CellSceneProps>(function CellScene(
  { variant, selectedId = null, onSelect, paused = false },
  ref,
) {
  const reduced = useReduced();
  const narrow = useIsNarrow();
  const finePointer = useFinePointer();
  const pointer = usePointerRef(variant === "hero" && finePointer && !reduced);
  const apiRef = useRef<CameraApi | null>(null);
  // Mouse wheel zooms the cell only after a click on it, so the page keeps scrolling normally.
  const [zoomEnabled, setZoomEnabled] = useState(false);

  const explorer = variant === "explorer";
  const animate = !reduced;

  const handleSelect = useCallback(
    (id: OrganelleId) => {
      apiRef.current?.engage();
      onSelect?.(id);
    },
    [onSelect],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (factor) => apiRef.current?.zoomBy(factor),
      resetView: () => {
        onSelect?.(null);
        apiRef.current?.reset();
      },
    }),
    [onSelect],
  );

  return (
    <div
      className="size-full"
      style={explorer ? undefined : { pointerEvents: "none" }}
      onPointerDown={explorer ? () => setZoomEnabled(true) : undefined}
      onPointerLeave={explorer ? () => setZoomEnabled(false) : undefined}
      onBlur={explorer ? () => setZoomEnabled(false) : undefined}
    >
      <Canvas
        frameloop={paused ? "never" : reduced ? "demand" : "always"}
        dpr={narrow ? [1, 1.25] : [1, 1.75]}
        camera={{ position: [0, 0, DEFAULT_DISTANCE], fov: 38, near: 0.1, far: 60 }}
        gl={{ antialias: !narrow, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={explorer ? () => onSelect?.(null) : undefined}
      >
        <Lights animate={animate} />
        <CellModel
          variant={variant}
          pointer={pointer}
          selectedId={selectedId}
          onSelect={explorer ? handleSelect : undefined}
          animate={animate}
        />
        {explorer && (
          <ExplorerControls
            selectedId={selectedId}
            reduced={reduced}
            zoomEnabled={zoomEnabled}
            apiRef={apiRef}
          />
        )}
      </Canvas>
    </div>
  );
});

// Default export so the scene can be loaded with React.lazy (it pulls in three.js).
export default CellScene;
