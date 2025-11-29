
"use client";

import * as React from "react";
import { Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const demographicsChartConfig = {
  male: { label: "Male", color: "hsl(var(--chart-1))" },
  female: { label: "Female", color: "hsl(var(--chart-2))" },
  other: { label: "Other", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

interface ActiveShapeProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  payload?: any;
  percent?: number;
  value?: number;
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const RADIAN = Math.PI / 180;
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill, payload, percent = 0, value = 0 } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold">
        {payload.gender}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))">{`Count ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

interface PatientDemographicsChartProps {
    data: { gender: string; count: number; fill: string }[];
}

export default function PatientDemographicsChart({ data }: PatientDemographicsChartProps) {
    const [activeIndex, setActiveIndex] = React.useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    return (
        <ChartContainer config={demographicsChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
                onMouseEnter={onPieEnter}
                />
                <ChartLegend content={<ChartLegendContent nameKey="gender" />} className="mt-4" />
            </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
