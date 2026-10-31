import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';

export const COLORES = {
  hoja: '#16804F',
  tapa: '#21448E',
  sol: '#E0B700',
  gris: '#C9D1DD',
  ambar: '#C27C0E',
  serie: ['#21448E', '#16804F', '#E0B700', '#7A4FC2', '#0E8A9A'],
};

const eje = { tick: { fill: '#6B7588', fontSize: 12 }, axisLine: false, tickLine: false };
const tooltip = {
  contentStyle: { borderRadius: 10, border: '1px solid #D5DBE5', fontSize: 13, boxShadow: '0 4px 14px rgba(21,34,56,.08)' },
  cursor: { fill: 'rgba(35,80,200,0.06)' },
};

export function Barras({ datos, x, series, alto = 240, apilado = false, formatoY }) {
  return (
    <div style={{ width: '100%', height: alto }}>
      <ResponsiveContainer>
        <BarChart data={datos} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E6EAF0" />
          <XAxis dataKey={x} {...eje} interval="preserveStartEnd" minTickGap={12} />
          <YAxis {...eje} allowDecimals={false} tickFormatter={formatoY} />
          <Tooltip {...tooltip} />
          {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />}
          {series.map((s, i) => (
            <Bar key={s.clave} dataKey={s.clave} name={s.nombre} fill={s.color || COLORES.serie[i]}
              stackId={apilado ? 'a' : undefined} radius={apilado && i < series.length - 1 ? 0 : [4, 4, 0, 0]} maxBarSize={38} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Lineas({ datos, x, series, alto = 240, formatoY, dominioY }) {
  return (
    <div style={{ width: '100%', height: alto }}>
      <ResponsiveContainer>
        <LineChart data={datos} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E6EAF0" />
          <XAxis dataKey={x} {...eje} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...eje} tickFormatter={formatoY} domain={dominioY} />
          <Tooltip {...tooltip} cursor={{ stroke: '#D5DBE5' }} />
          {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />}
          {series.map((s, i) => (
            <Line key={s.clave} type="monotone" dataKey={s.clave} name={s.nombre} stroke={s.color || COLORES.serie[i]}
              strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
