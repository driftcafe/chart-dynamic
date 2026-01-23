// Data type detected for each column
export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean';

// Available chart types
export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'scatter' 
  | 'pie' 
  | 'area' 
  | 'heatmap' 
  | 'bubble' 
  | 'radar'
  | 'doughnut'
  | 'stacked-bar'
  | 'grouped-bar';

// Supported charting libraries
export type Library = 'echarts' | 'plotly' | 'chartjs' | 'apexcharts' | 'd3';

// Aggregation methods for metrics
export type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

// Metadata for each column in the CSV
export interface ColumnMeta {
  name: string;
  type: ColumnType;
  isMetric: boolean;
  uniqueValues: number;
  sampleValues: (string | number | boolean | Date)[];
  nullCount: number;
}

// Parsed CSV data structure
export interface ParsedData {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  fileName: string;
  rowCount: number;
}

// Chart configuration
export interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string[];  // Multi-select for comparing metrics
  series?: string;  // Column to use for grouping/coloring
  size?: string;    // Column for bubble size
  aggregation: Aggregation;
}

// Chart recommendation with confidence score
export interface ChartRecommendation {
  type: ChartType;
  confidence: number;
  reason: string;
}

// Chart library info for UI
export interface LibraryInfo {
  id: Library;
  name: string;
  description: string;
  supportedCharts: ChartType[];
}

// Chart type info for UI
export interface ChartTypeInfo {
  id: ChartType;
  name: string;
  icon: string;
  description: string;
  requiresNumericY: boolean;
  supportsMultipleY: boolean;
  requiresCategorialX: boolean;
}

// State for the main application
export interface AppState {
  data: ParsedData | null;
  library: Library;
  chartConfig: ChartConfig;
  recommendations: ChartRecommendation[];
  isLoading: boolean;
  error: string | null;
}
