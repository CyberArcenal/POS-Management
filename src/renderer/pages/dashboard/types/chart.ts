import type { ChartData, ChartOptions } from "chart.js";

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'radar';
  data: ChartData;
  options: ChartOptions;
  height?: number;
  width?: number;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface ChartAxis {
  categories: string[];
  title?: string;
}

export interface ChartMetadata {
  title: string;
  description?: string;
  updatedAt: string;
  dataSource: string;
}

export interface ChartExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf';
  quality?: number;
  width?: number;
  height?: number;
}