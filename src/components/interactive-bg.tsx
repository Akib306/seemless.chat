"use client";

import { useEffect, useRef, useState } from "react";

interface WebNode {
  x: number;
  y: number;
  ox: number;
  oy: number;
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let nodes: WebNode[] = [];
    let cols = 0;
    let rows = 0;
    const GRID = 80;
    const MAX_DIST = 200;
    const RETURN_SPEED = 0.05;

    const build = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      // Reset transform before resizing/scaling
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      setSize({ w: window.innerWidth, h: window.innerHeight });

      cols = Math.ceil(window.innerWidth / GRID) + 2;
      rows = Math.ceil(window.innerHeight / GRID) + 2;

      nodes = [];
      const offsetX = -GRID;
      const offsetY = -GRID;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * GRID;
          const y = offsetY + r * GRID;
          nodes.push({ x, y, ox: x, oy: y });
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animate = () => {
      ctx.clearRect(0, 0, size.w, size.h);

      // Update
      for (const n of nodes) {
        const dx = mouse.current.x - n.ox;
        const dy = mouse.current.y - n.oy;
        const dist = Math.hypot(dx, dy);
        if (!prefersReduced && dist < MAX_DIST) {
          const force = ((MAX_DIST - dist) / MAX_DIST) * 0.3;
          n.x = n.ox + dx * force;
          n.y = n.oy + dy * force;
        } else {
          n.x += (n.ox - n.x) * RETURN_SPEED;
          n.y += (n.oy - n.y) * RETURN_SPEED;
        }
      }

      // Draw
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.fillStyle = "rgba(255,255,255,0.3)";

      for (let i = 0; i < nodes.length; i++) {
        const col = i % cols;
        const row = (i / cols) | 0;

        if (col < cols - 1 && row < rows - 1) {
          const d = nodes[i + cols + 1];
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
        if (col > 0 && row < rows - 1) {
          const d = nodes[i + cols - 1];
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const onVisibility = () => {
      if (document.hidden && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    build();
    window.addEventListener("resize", build, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size.w, size.h]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full pointer-events-none opacity-30"
      aria-hidden
    />
  );
}
