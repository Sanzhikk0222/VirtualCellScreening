import { useEffect, useRef, useState } from "react";
import { useIsNarrow, useReduced } from "@/hooks/useMedia";
import fragmentSource from "./background.frag?raw";
import vertexSource from "./background.vert?raw";
import { BASE_COLOR, PALETTE } from "./palette";
import { createProgram } from "./webgl";

/** Time shown when motion is reduced: a fixed, pleasant frame of the animation. */
const STILL_TIME = 14;

/**
 * Full-screen mesh-gradient background (WebGL fragment shader).
 *
 * - Colours shift from indigo through blue to teal as the page scrolls.
 * - It renders at a fraction of the screen size: the gradient is soft, and this keeps the GPU cool.
 * - Phones render smaller and at 30 fps. Reduced motion draws one still frame and only redraws on scroll.
 * - If WebGL is missing or the context is lost, a CSS-only gradient takes over.
 * - A navy overlay (50%) and a vignette keep text readable on top.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReduced();
  const narrow = useIsNarrow();
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    const program = gl ? createProgram(gl, vertexSource, fragmentSource) : null;
    if (!gl || !program) {
      setFallback(true);
      return;
    }

    gl.useProgram(program);

    // One triangle strip covering the screen.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uScroll = gl.getUniformLocation(program, "uScroll");
    gl.uniform3fv(gl.getUniformLocation(program, "uBase"), BASE_COLOR);
    gl.uniform3fv(gl.getUniformLocation(program, "uPalette"), PALETTE);

    const resolutionScale = narrow ? 0.3 : 0.5;
    const timeScale = narrow ? 0.6 : 1;
    const frameInterval = narrow ? 1000 / 30 : 0; // 0 means every frame

    let scrollTarget = 0;
    let scrollSmooth = 0;
    let frame = 0;
    let lastDraw = 0;
    let stillQueued = false;
    let disposed = false;

    const measureScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const resize = () => {
      const width = Math.max(2, Math.round(canvas.clientWidth * resolutionScale));
      const height = Math.max(2, Math.round(canvas.clientHeight * resolutionScale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const draw = (seconds: number) => {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, seconds);
      gl.uniform1f(uScroll, scrollSmooth);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // Reduced motion: one still frame, redrawn (at most once per frame) when the page scrolls.
    const drawStill = () => {
      stillQueued = false;
      if (disposed) return;
      scrollSmooth = scrollTarget;
      resize();
      draw(STILL_TIME);
    };
    const queueStill = () => {
      if (stillQueued) return;
      stillQueued = true;
      frame = requestAnimationFrame(drawStill);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (frameInterval && now - lastDraw < frameInterval - 1) return;
      const delta = lastDraw ? now - lastDraw : 16;
      lastDraw = now;
      // Ease toward the real scroll position so colour changes glide instead of jumping.
      scrollSmooth += (scrollTarget - scrollSmooth) * (1 - Math.exp(-delta * 0.004));
      draw((now / 1000) * timeScale);
    };

    const start = () => {
      if (reduced || frame) return;
      lastDraw = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onScroll = () => {
      measureScroll();
      if (reduced) queueStill();
    };
    const onResize = () => {
      measureScroll();
      resize();
      if (reduced) queueStill();
    };
    // Do not spend GPU time on a tab nobody is looking at.
    const onVisibility = () => (document.hidden ? stop() : start());
    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      setFallback(true);
    };

    measureScroll();
    scrollSmooth = scrollTarget;
    resize();
    draw(reduced ? STILL_TIME : performance.now() / 1000);
    setReady(true);
    if (reduced) {
      queueStill();
    } else {
      start();
    }

    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      // Free the GPU objects but keep the context itself: calling loseContext() here would make the
      // next getContext() on this canvas (StrictMode remount, breakpoint change) return a dead one.
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [reduced, narrow]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh overflow-hidden bg-ink-950"
    >
      {fallback && <MeshFallback />}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full transition-opacity duration-700"
        style={{ opacity: ready && !fallback ? 1 : 0 }}
      />
      {/* 50% navy overlay and a vignette keep body text readable over the brightest blobs. */}
      <div className="absolute inset-0 bg-ink-950/50" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 35%, rgb(4 6 14 / 0.72) 100%)",
        }}
      />
    </div>
  );
}

/** CSS-only version of the same idea, used when WebGL is unavailable. */
function MeshFallback() {
  return (
    <div className="mesh-fallback">
      <div
        className="mesh-blob animate-drift-a"
        style={{
          top: "-20vmax",
          left: "-15vmax",
          background: "radial-gradient(circle, #3b5bdb, transparent 65%)",
        }}
      />
      <div
        className="mesh-blob animate-drift-b"
        style={{
          top: "10vmax",
          right: "-25vmax",
          background: "radial-gradient(circle, #7048e8, transparent 65%)",
        }}
      />
      <div
        className="mesh-blob animate-drift-c"
        style={{
          bottom: "-30vmax",
          left: "10vmax",
          background: "radial-gradient(circle, #12b8a6, transparent 65%)",
        }}
      />
    </div>
  );
}
