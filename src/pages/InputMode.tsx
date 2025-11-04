import { useState } from "react";
import { pickFormula } from "../utils/pickFormula";

export default function InputMode() {
  const [vertices, setVertices] = useState<{ x: number; y: number }[]>([]);
  const [xInput, setXInput] = useState<string>("");
  const [yInput, setYInput] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [interiorPoints, setInteriorPoints] = useState<{ x: number; y: number }[]>([]);
  const [borderPoints, setBorderPoints] = useState<{ x: number; y: number }[]>([]);
  const [roundedNotice, setRoundedNotice] = useState<boolean>(false);

  const handleAddVertex = () => {
    if (xInput === "" || yInput === "") return;

    const rawX = parseFloat(xInput);
    const rawY = parseFloat(yInput);
    if (isNaN(rawX) || isNaN(rawY)) return;

    const roundedX = Math.round(rawX);
    const roundedY = Math.round(rawY);

    // Verificar si hubo redondeo
    if (roundedX !== rawX || roundedY !== rawY) {
      setRoundedNotice(true);
    }

    setVertices([...vertices, { x: roundedX, y: roundedY }]);
    setXInput("");
    setYInput("");
  };

  const handleCalculate = () => {
    if (vertices.length < 3) return;

    // Calcular área con fórmula del polígono (shoelace)

    // Determinar límites de la cuadrícula
    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const borders: { x: number; y: number }[] = [];
    const interiors: { x: number; y: number }[] = [];

    const isPointOnBorder = (x: number, y: number) => {
      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        const cross = (x - v1.x) * (v2.y - v1.y) - (y - v1.y) * (v2.x - v1.x);
        if (cross === 0) {
          const minXb = Math.min(v1.x, v2.x);
          const maxXb = Math.max(v1.x, v2.x);
          const minYb = Math.min(v1.y, v2.y);
          const maxYb = Math.max(v1.y, v2.y);
          if (x >= minXb && x <= maxXb && y >= minYb && y <= maxYb) {
            return true;
          }
        }
      }
      return false;
    };

    const isInside = (x: number, y: number) => {
      let count = 0;
      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        if (((v1.y > y) !== (v2.y > y)) &&
            (x < ((v2.x - v1.x) * (y - v1.y)) / (v2.y - v1.y) + v1.x)) {
          count++;
        }
      }
      return count % 2 === 1;
    };

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (isPointOnBorder(x, y)) borders.push({ x, y });
        else if (isInside(x, y)) interiors.push({ x, y });
      }
    }

    const I = interiors.length;
    const B = borders.length;
    setInteriorPoints(interiors);
    setBorderPoints(borders);
    setResult(pickFormula(I, B));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-6">
        Modo Coordenadas — Fórmula de Pick
      </h1>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg w-full max-w-md">
        <p className="text-sm text-gray-400 mb-3">Agregar vértices:</p>
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={xInput}
            onChange={(e) => setXInput(e.target.value)}
            placeholder="x"
            className="w-1/2 rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="number"
            value={yInput}
            onChange={(e) => setYInput(e.target.value)}
            placeholder="y"
            className="w-1/2 rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleAddVertex}
            className="bg-indigo-500 hover:bg-indigo-600 transition-colors px-4 rounded-md font-bold text-white"
          >
            +
          </button>
        </div>

        {roundedNotice && (
          <p className="text-xs text-yellow-400 mb-3">
            ⚠️ Algunas coordenadas fueron ajustadas a enteros.
          </p>
        )}

        <p className="text-sm text-gray-300 mb-3">
          <strong>Vértices:</strong>
        </p>
        <ul className="text-sm text-gray-400 mb-4">
          {vertices.map((v, i) => (
            <li key={i}>
              ({v.x}, {v.y})
            </li>
          ))}
        </ul>

        <button
          onClick={handleCalculate}
          className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white py-2 rounded-md font-semibold"
        >
          Calcular
        </button>

        {result !== null && (
          <div className="mt-6 text-center">
            <p className="text-lg">
              Área: <span className="font-bold">{result}</span>
            </p>
            <p className="text-sm text-gray-400">
              I: {interiorPoints.length} internos — B: {borderPoints.length} frontera
            </p>
          </div>
        )}
      </div>

      {/* Dibujo */}
      <svg width="400" height="400" className="mt-6 bg-slate-800 rounded-lg">
        {/* Puntos frontera */}
        {borderPoints.map((p, i) => (
          <circle
            key={`b-${i}`}
            cx={p.x * 20 + 50}
            cy={400 - (p.y * 20 + 50)}
            r="4"
            fill="red"
          />
        ))}
        {/* Puntos internos */}
        {interiorPoints.map((p, i) => (
          <circle
            key={`i-${i}`}
            cx={p.x * 20 + 50}
            cy={400 - (p.y * 20 + 50)}
            r="3"
            fill="blue"
          />
        ))}
        {/* Polígono */}
        {vertices.length > 1 && (
          <polyline
            points={vertices
              .concat([vertices[0]])
              .map(v => `${v.x * 20 + 50},${400 - (v.y * 20 + 50)}`)
              .join(" ")}
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
