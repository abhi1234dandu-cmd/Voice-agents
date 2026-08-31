"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  radius: number;
  phase: number;
};

const palette = ["#19d3c5", "#8b5cf6", "#f6b84b", "#fb7185", "#94a3b8"];

export function SignalConstellation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const drawingCanvas = canvas;
    const drawingContext = context;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const nodes: NodePoint[] = [
      { x: 0.16, y: 0.28, radius: 5, phase: 0 },
      { x: 0.31, y: 0.56, radius: 4, phase: 1.2 },
      { x: 0.48, y: 0.34, radius: 6, phase: 2.3 },
      { x: 0.64, y: 0.62, radius: 4, phase: 0.7 },
      { x: 0.78, y: 0.31, radius: 5, phase: 1.7 },
      { x: 0.87, y: 0.72, radius: 4, phase: 2.9 },
    ];
    let frame = 0;
    let raf = 0;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      const rect = drawingCanvas.getBoundingClientRect();
      drawingCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      drawingCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
      drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw() {
      const { width, height } = drawingCanvas.getBoundingClientRect();
      drawingContext.clearRect(0, 0, width, height);
      drawingContext.globalCompositeOperation = "source-over";

      const t = reduceMotion ? 18 : frame * 0.014;
      const points = nodes.map((node) => ({
        x: node.x * width + Math.sin(t + node.phase) * 12,
        y: node.y * height + Math.cos(t * 0.7 + node.phase) * 10,
        radius: node.radius,
        phase: node.phase,
      }));

      drawingContext.lineWidth = 1;
      points.forEach((point, index) => {
        const next = points[(index + 1) % points.length]!;
        const gradient = drawingContext.createLinearGradient(
          point.x,
          point.y,
          next.x,
          next.y,
        );
        gradient.addColorStop(0, "rgba(25, 211, 197, 0.42)");
        gradient.addColorStop(1, "rgba(139, 92, 246, 0.22)");
        drawingContext.strokeStyle = gradient;
        drawingContext.beginPath();
        drawingContext.moveTo(point.x, point.y);
        drawingContext.bezierCurveTo(
          point.x + width * 0.08,
          point.y - height * 0.12,
          next.x - width * 0.08,
          next.y + height * 0.12,
          next.x,
          next.y,
        );
        drawingContext.stroke();
      });

      points.forEach((point, index) => {
        const pulse = 1 + Math.sin(t * 2 + point.phase) * 0.18;
        drawingContext.fillStyle = palette[index % palette.length]!;
        drawingContext.shadowColor = palette[index % palette.length]!;
        drawingContext.shadowBlur = 22;
        drawingContext.beginPath();
        drawingContext.arc(
          point.x,
          point.y,
          point.radius * pulse,
          0,
          Math.PI * 2,
        );
        drawingContext.fill();
        drawingContext.shadowBlur = 0;
      });

      const baseY = height * 0.82;
      drawingContext.strokeStyle = "rgba(25, 211, 197, 0.62)";
      drawingContext.lineWidth = 2;
      drawingContext.beginPath();
      for (let x = 0; x < width; x += 8) {
        const y =
          baseY + Math.sin(x * 0.03 + t * 3) * 16 + Math.sin(x * 0.09 + t) * 6;
        if (x === 0) {
          drawingContext.moveTo(x, y);
        } else {
          drawingContext.lineTo(x, y);
        }
      }
      drawingContext.stroke();

      frame += 1;
      if (!reduceMotion) {
        raf = window.requestAnimationFrame(draw);
      }
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
