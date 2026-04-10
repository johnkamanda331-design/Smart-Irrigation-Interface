import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polyline, Polygon } from 'react-native-svg';

interface MiniChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  filled?: boolean;
}

export function MiniChart({ data, color, width, height = 32, filled = true }: MiniChartProps) {
  const chartWidth = width ?? Dimensions.get('window').width - 64;

  if (!data || data.length < 2) return <View style={{ width: chartWidth, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const fillPts = [
    `0,${height}`,
    ...pts,
    `${chartWidth},${height}`,
  ];

  return (
    <Svg width={chartWidth} height={height}>
      {filled && (
        <Polygon
          points={fillPts.join(' ')}
          fill={color}
          fillOpacity={0.15}
        />
      )}
      <Polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
