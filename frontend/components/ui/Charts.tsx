import React from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { cn } from '../../lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common chart options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
  },
};

export interface BaseChartProps {
  data: any;
  options?: any;
  className?: string;
  height?: number;
  title?: string;
}

// Line Chart Component
export interface LineChartProps extends BaseChartProps {
  tension?: number;
  fill?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  options = {},
  className,
  height = 300,
  title,
  tension = 0.4,
  fill = false,
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        ...options.plugins?.title,
      },
    },
    elements: {
      line: {
        tension,
        fill,
      },
      ...options.elements,
    },
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Line data={data} options={chartOptions} />
    </div>
  );
};

// Bar Chart Component
export interface BarChartProps extends BaseChartProps {
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  options = {},
  className,
  height = 300,
  title,
  horizontal = false,
}) => {
  const chartOptions = {
    ...defaultOptions,
    indexAxis: horizontal ? 'y' : 'x',
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        ...options.plugins?.title,
      },
    },
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Bar data={data} options={chartOptions} />
    </div>
  );
};

// Pie Chart Component
export interface PieChartProps extends BaseChartProps {
  variant?: 'pie' | 'doughnut';
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  options = {},
  className,
  height = 300,
  title,
  variant = 'pie',
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        ...options.plugins?.title,
      },
    },
  };

  const ChartComponent = variant === 'doughnut' ? Doughnut : Pie;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ChartComponent data={data} options={chartOptions} />
    </div>
  );
};

// Area Chart Component
export interface AreaChartProps extends BaseChartProps {
  stacked?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  options = {},
  className,
  height = 300,
  title,
  stacked = false,
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        ...options.plugins?.title,
      },
    },
    scales: {
      y: {
        stacked,
        ...options.scales?.y,
      },
      x: {
        stacked,
        ...options.scales?.x,
      },
    },
    elements: {
      line: {
        fill: true,
        tension: 0.4,
      },
      ...options.elements,
    },
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Line data={data} options={chartOptions} />
    </div>
  );
};

// Chart Container Component
export interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  loading?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  title,
  description,
  className,
  loading = false,
}) => {
  return (
    <div className={cn('bg-white p-6 rounded-lg shadow', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// Chart utility functions
export const chartColors = {
  primary: 'rgb(59, 130, 246)',
  secondary: 'rgb(139, 92, 246)',
  success: 'rgb(34, 197, 94)',
  warning: 'rgb(251, 191, 36)',
  danger: 'rgb(239, 68, 68)',
  info: 'rgb(6, 182, 212)',
  gray: 'rgb(107, 114, 128)',
};

export const generateChartData = (
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }>
) => ({
  labels,
  datasets: datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || Object.values(chartColors)[index % Object.values(chartColors).length],
    borderColor: dataset.borderColor || Object.values(chartColors)[index % Object.values(chartColors).length],
  })),
});

// Chart presets
export const createLineChartData = (
  labels: string[],
  label: string,
  data: number[],
  color = chartColors.primary
) => ({
  labels,
  datasets: [
    {
      label,
      data,
      borderColor: color,
      backgroundColor: color + '20',
      tension: 0.4,
    },
  ],
});

export const createBarChartData = (
  labels: string[],
  label: string,
  data: number[],
  color = chartColors.primary
) => ({
  labels,
  datasets: [
    {
      label,
      data,
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1,
    },
  ],
});

export const createPieChartData = (
  labels: string[],
  data: number[],
  colors = Object.values(chartColors)
) => ({
  labels,
  datasets: [
    {
      data,
      backgroundColor: colors.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#fff',
    },
  ],
});