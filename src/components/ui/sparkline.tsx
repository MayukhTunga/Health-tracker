"use client";

import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts';

export function Sparkline({ data }: { data: number[] }) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="w-full h-[120px] bg-muted/20 animate-pulse rounded-md" />;
  }

  if (!data || data.length < 2) {
    return <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Need more data</div>;
  }

  const chartData = data.map((val, idx) => ({
    name: `T - ${data.length - idx - 1}`,
    value: val
  }));

  const startVal = data[0];
  const endVal = data[data.length - 1];
  const isProgressing = endVal >= startVal;
  
  // recharts expects strict hex strings or CSS strings that it can parse, 
  // but it usually works well with exact hex values.
  const strokeColor = isProgressing ? "#22c55e" : "#ef4444"; 

  // Min max for Y-Axis padding so line doesn't hit the ceiling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.1 || 5;

  return (
    <div className="w-full h-[120px] relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[min - padding, max + padding]} 
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}
            formatter={(value: any) => [`${value} kg`, 'Est 1RM']}
            labelFormatter={(label: any) => label === "T - 0" ? "Latest Session" : `${(label || "").toString().replace('T - ', '')} sessions ago`}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor} 
            strokeWidth={3} 
            dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: strokeColor }} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
