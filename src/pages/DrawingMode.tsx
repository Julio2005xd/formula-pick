import { Stage, Layer, Line, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useState, useMemo, type JSX } from "react";
import { pickFormula } from "../utils/pickFormula";

interface Point {
  x: number;
  y: number;
}

export default function DrawingMode() {
  const [points, setPoints] = useState<Point[]>([]);
  const [resultado, setResultado] = useState<string>("");
  const [borderPoints, setBorderPoints] = useState<Point[]>([]);
  const [innerPoints, setInnerPoints] = useState<Point[]>([]);

  const gridSize = 40;
  const numCells = 15;
  const stageSize = gridSize * numCells;

  // ========================
  // 🔹 1. Dibujo del grid
  // ========================
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let i = 0; i <= numCells; i++) {
      const pos = i * gridSize;
      lines.push(
        <Line
          key={`v-${i}`}
          points={[pos, 0, pos, stageSize]}
          stroke="#444"
          strokeWidth={1}
        />,
        <Line
          key={`h-${i}`}
          points={[0, pos, stageSize, pos]}
          stroke="#444"
          strokeWidth={1}
        />
      );
    }
    return lines;
  }, [numCells, gridSize, stageSize]);

  // ========================
  // 🔹 2. Manejar clics
  // ========================
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = Math.round(pointer.x / gridSize) * gridSize;
    const y = Math.round(pointer.y / gridSize) * gridSize;
    if (x < 0 || y < 0 || x > stageSize || y > stageSize) return;

    setPoints((prev) =>
      prev.some((p) => p.x === x && p.y === y) ? prev : [...prev, { x, y }]
    );
  };

  // ====================================================
  // 🔹 3. Detección de frontera e interiores
  // ====================================================
  const isOnEdge = (p: Point, a: Point, b: Point, tolerance = 1): boolean => {
    const { x, y } = p;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (
      x < Math.min(a.x, b.x) - tolerance ||
      x > Math.max(a.x, b.x) + tolerance ||
      y < Math.min(a.y, b.y) - tolerance ||
      y > Math.max(a.y, b.y) + tolerance
    )
      return false;
    if (Math.abs(dx) < tolerance) return Math.abs(x - a.x) < tolerance;
    if (Math.abs(dy) < tolerance) return Math.abs(y - a.y) < tolerance;
    const m = dy / dx;
    const expectedY = a.y + m * (x - a.x);
    return Math.abs(y - expectedY) < tolerance;
  };

  const isPointInsidePolygon = (point: Point, vertices: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x <
          ((xj - xi) * (point.y - yi)) / (yj - yi + 0.0001) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // ====================================================
  // 🔹 4. Detección de intersecciones de aristas
  // ====================================================
  const ccw = (A: Point, B: Point, C: Point): boolean =>
    (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);

  const segmentsIntersect = (A: Point, B: Point, C: Point, D: Point): boolean =>
    ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);

  const isPolygonSimple = (points: Point[]): boolean => {
    const n = points.length;
    if (n < 3) return false;
    for (let i = 0; i < n; i++) {
      const a1 = points[i];
      const a2 = points[(i + 1) % n];
      for (let j = i + 1; j < n; j++) {
        const b1 = points[j];
        const b2 = points[(j + 1) % n];
        if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;
        if (segmentsIntersect(a1, a2, b1, b2)) return false;
      }
    }
    return true;
  };

  // ====================================================
  // 🔹 5. Cálculo de área (Pick) + coloreado
  // ====================================================
  const calculo = (): void => {
    setBorderPoints([]);
    setInnerPoints([]);

    if (points.length < 3) {
      setResultado("Debes dibujar al menos un triángulo.");
      return;
    }

    if (!isPolygonSimple(points)) {
      setResultado(
        "❌ El teorema de Pick solo se aplica a polígonos simples (sin aristas que se crucen)."
      );
      return;
    }

    const gridPoints: Point[] = [];
    for (let x = 0; x <= stageSize; x += gridSize) {
      for (let y = 0; y <= stageSize; y += gridSize) {
        gridPoints.push({ x, y });
      }
    }

    const borders: Point[] = [];
    const insides: Point[] = [];

    for (const gp of gridPoints) {
      const onEdge = points.some((p, i) => {
        const next = points[(i + 1) % points.length];
        return isOnEdge(gp, p, next, gridSize / 10);
      });

      if (onEdge) {
        borders.push(gp);
      } else if (isPointInsidePolygon(gp, points)) {
        insides.push(gp);
      }
    }

    setBorderPoints(borders);
    setInnerPoints(insides);

    const area = pickFormula(insides.length, borders.length);
    setResultado(
      `✅ Área (Pick): ${area.toFixed(2)} | I=${insides.length}, B=${borders.length}`
    );
  };

  // ====================================================
  // 🔹 6. Renderizado
  // ====================================================
  return (
    <div className="flex flex-col items-center">
      <Stage
        width={stageSize}
        height={stageSize}
        onClick={handleClick}
        className="bg-slate-900 rounded-lg shadow-lg"
      >
        <Layer>{gridLines}</Layer>

        <Layer>
          {/* Vértices del usuario */}
          {points.map((p, i) => (
            <Circle key={`v-${i}`} x={p.x} y={p.y} radius={5} fill="#00e676" />
          ))}

          {/* Aristas */}
          {points.length > 1 &&
            points.slice(0, -1).map((p, i) => (
              <Line
                key={`edge-${i}`}
                points={[p.x, p.y, points[i + 1].x, points[i + 1].y]}
                stroke="#00ff84"
                strokeWidth={2}
                lineCap="round"
              />
            ))}

          {/* Cierre */}
          {points.length > 2 && (
            <Line
              key="edge-close"
              points={[
                points[0].x,
                points[0].y,
                points[points.length - 1].x,
                points[points.length - 1].y,
              ]}
              stroke="#00ff84"
              strokeWidth={2}
              lineCap="round"
            />
          )}

          {/* 🔴 Puntos interiores */}
          {innerPoints.map((p, i) => (
            <Circle key={`in-${i}`} x={p.x} y={p.y} radius={4} fill="#ff1744" />
          ))}

          {/* 🟡 Puntos frontera */}
          {borderPoints.map((p, i) => (
            <Circle key={`b-${i}`} x={p.x} y={p.y} radius={4} fill="#ffeb3b" />
          ))}
        </Layer>
      </Stage>

      <p className="mt-4 text-gray-300 text-sm">
        Clic en las intersecciones del grid para colocar puntos
      </p>
      <p className="mt-2 text-gray-300 text-sm">
        Puntos colocados: {points.length}
      </p>

      <button
        className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        onClick={calculo}
      >
        Calcular Área (Pick)
      </button>

      <p className="mt-4 text-gray-200">{resultado}</p>
    </div>
  );
}
