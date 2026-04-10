import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, Polygon } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface LineChartProps {
  data: { time: string; value: number }[];
  color: string;
  unit: string;
  width?: number;
  height?: number;
  xLabelInterval?: number;
}

export function LineChart({ data, color, unit, width, height = 120, xLabelInterval }: LineChartProps) {
  const colors = useColors();
  const chartWidth = width || Dimensions.get('window').width - 64;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 8;
  const padBottom = 24;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  if (!data || data.length < 2) return null;

  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const pts = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * plotW;
    const y = padTop + plotH - ((d.value - min) / range) * plotH;
    return `${x},${y}`;
  });

  const fillPts = [
    `${padLeft},${padTop + plotH}`,
    ...pts,
    `${padLeft + plotW},${padTop + plotH}`,
  ];

  const yTicks = 3;
  const effectiveXLabelInterval = xLabelInterval ?? Math.max(1, Math.floor(data.length / 5));

  return (
    <Svg width={chartWidth} height={height}>
      {Array.from({ length: yTicks }, (_, i) => {
        const v = min + (range * i) / (yTicks - 1);
        const y = padTop + plotH - (i / (yTicks - 1)) * plotH;
        return (
          <React.Fragment key={i}>
            <Line
              x1={padLeft}
              y1={y}
              x2={padLeft + plotW}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={padLeft - 4}
              y={y + 4}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {v.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {data.map((d, i) => {
        if (i % effectiveXLabelInterval !== 0) return null;
        const x = padLeft + (i / (data.length - 1)) * plotW;
        return (
          <SvgText
            key={i}
            x={x}
            y={padTop + plotH + 14}
            fontSize={9}
            fill={colors.mutedForeground}
            textAnchor="middle"
          >
            {d.time}
          </SvgText>
        );
      })}

      <Polygon
        points={fillPts.join(' ')}
        fill={color}
        fillOpacity={0.12}
      />

      <Polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.length <= 24 && data.map((d, i) => {
        const x = padLeft + (i / (data.length - 1)) * plotW;
        const y = padTop + plotH - ((d.value - min) / range) * plotH;
        if (i === data.length - 1) {
          return (
            <React.Fragment key={i}>
              <Circle cx={x} cy={y} r={4} fill={color} />
              <Circle cx={x} cy={y} r={2} fill="white" />
            </React.Fragment>
          );
        }
        return null;
      })}
    </Svg>
  );
}
