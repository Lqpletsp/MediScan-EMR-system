
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  appointments: {
    label: "Appointments",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface PatientAppointmentsChartProps {
    data: { name: string; appointments: number }[];
}

export default function PatientAppointmentsChart({ data }: PatientAppointmentsChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
            data={data} 
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            accessibilityLayer
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            tickFormatter={(value) => value.slice(0, 3)}
            />
          <YAxis 
            allowDecimals={false} 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            />
          <ChartTooltip 
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="appointments" fill="var(--color-appointments)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

    