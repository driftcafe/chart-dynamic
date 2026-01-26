import { useEffect, useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import Plot from 'react-plotly.js';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import ReactApexChart from 'react-apexcharts';
import type { ParsedData, ChartConfig, Library } from '../types/types';
import { createEChartsOption } from '../adapters/echartsAdapter';
import { createPlotlyData } from '../adapters/plotlyAdapter';
import { createChartJsConfig, getChartJsType } from '../adapters/chartjsAdapter';
import { createApexChartsConfig, getApexChartType } from '../adapters/apexchartsAdapter';
import { renderD3Chart } from '../adapters/d3Adapter';
import { useTheme } from '../hooks/useTheme';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ChartContainerProps {
    data: ParsedData;
    config: ChartConfig;
    library: Library;
}



export function ChartContainer({ data, config, library }: ChartContainerProps) {
    const d3ContainerRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();

    // Memoize chart configurations to prevent unnecessary re-renders
    const echartsOption = useMemo(() => {
        if (library === 'echarts') {
            return createEChartsOption(data, config, theme);
        }
        return null;
    }, [data, config, library, theme]);

    const plotlyConfig = useMemo(() => {
        if (library === 'plotly') {
            return createPlotlyData(data, config);
        }
        return null;
    }, [data, config, library]);

    const chartjsConfig = useMemo(() => {
        if (library === 'chartjs') {
            return createChartJsConfig(data, config);
        }
        return null;
    }, [data, config, library]);

    const apexConfig = useMemo(() => {
        if (library === 'apexcharts') {
            return createApexChartsConfig(data, config);
        }
        return null;
    }, [data, config, library]);

    // D3 rendering effect
    useEffect(() => {
        if (library === 'd3' && d3ContainerRef.current) {
            renderD3Chart(d3ContainerRef.current, data, config);
        }
    }, [data, config, library]);

    // Handle resize for D3
    useEffect(() => {
        if (library !== 'd3') return;

        const handleResize = () => {
            if (d3ContainerRef.current) {
                renderD3Chart(d3ContainerRef.current, data, config);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [data, config, library]);

    return (
        <div className="chart-container">
            {library === 'echarts' && echartsOption && (
                <ReactECharts
                    option={echartsOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                    notMerge={true}
                />
            )}

            {library === 'plotly' && plotlyConfig && (
                <Plot
                    data={plotlyConfig.data}
                    layout={{
                        ...plotlyConfig.layout,
                        autosize: true,
                    }}
                    config={plotlyConfig.config}
                    style={{ height: '100%', width: '100%' }}
                    useResizeHandler={true}
                />
            )}

            {library === 'chartjs' && chartjsConfig && (
                <Chart
                    type={getChartJsType(config.type) as 'bar' | 'line' | 'scatter' | 'pie' | 'doughnut' | 'radar'}
                    data={chartjsConfig.data}
                    options={chartjsConfig.options}
                />
            )}

            {library === 'apexcharts' && apexConfig && (
                <ReactApexChart
                    options={apexConfig.options}
                    series={apexConfig.series}
                    type={getApexChartType(config.type) as 'bar' | 'line' | 'scatter' | 'pie' | 'radar' | 'heatmap' | 'area'}
                    height="100%"
                    width="100%"
                />
            )}

            {library === 'd3' && (
                <div
                    ref={d3ContainerRef}
                    className="d3-container"
                    style={{ height: '100%', width: '100%', position: 'relative' }}
                />
            )}
        </div>
    );
}
