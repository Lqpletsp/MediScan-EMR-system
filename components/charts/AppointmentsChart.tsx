
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, YAxis, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const appointmentsChartConfig = {
  count: {
    label: "Appointments",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface AppointmentsChartProps {
    data: { month: string; count: number }[];
}

export default function AppointmentsChart({ data }: AppointmentsChartProps) {
  return (
    <ChartContainer config={appointmentsChartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip 
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
