import type { ApexOptions } from 'apexcharts';
import type { ParsedData, ChartConfig, ChartType } from '../types/types';
import { parseNumeric } from '../utils/csvParser';

/**
 * Aggregate data for ApexCharts
 */
function aggregateData(
    data: ParsedData,
    config: ChartConfig
): { categories: string[]; series: { name: string; data: number[] }[] } {
    const { xAxis, yAxis, series: seriesColumn, aggregation } = config;

    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const series = seriesValues.flatMap(seriesVal => {
            return yAxis.map(metric => {
                const seriesData = categories.map(cat => {
                    const matchingRows = data.rows.filter(
                        row => String(row[xAxis]) === cat && String(row[seriesColumn]) === seriesVal
                    );
                    return aggregate(matchingRows.map(r => parseNumeric(r[metric])), aggregation);
                });

                return {
                    name: yAxis.length > 1 ? `${seriesVal} - ${metric}` : seriesVal,
                    data: seriesData,
                };
            });
        });

        return { categories, series };
    } else {
        const series = yAxis.map(metric => {
            const seriesData = categories.map(cat => {
                const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
                return aggregate(matchingRows.map(r => parseNumeric(r[metric])), aggregation);
            });

            return { name: metric, data: seriesData };
        });

        return { categories, series };
    }
}

function aggregate(values: number[], method: string): number {
    if (values.length === 0) return 0;

    switch (method) {
        case 'sum': return values.reduce((a, b) => a + b, 0);
        case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
        case 'count': return values.length;
        case 'min': return Math.min(...values);
        case 'max': return Math.max(...values);
        default: return values[0];
    }
}

const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const baseOptions: ApexOptions = {
    chart: {
        background: 'transparent',
        foreColor: '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true,
            },
        },
        zoom: { enabled: true },
        animations: {
            enabled: true,
            speed: 500,
        },
    },
    colors,
    grid: {
        borderColor: '#1e293b',
        strokeDashArray: 4,
    },
    legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        labels: { colors: '#94a3b8' },
        markers: { fillColors: colors },
    },
    tooltip: {
        theme: 'dark',
        style: { fontSize: '12px' },
        x: { show: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
        labels: { style: { colors: '#94a3b8' } },
        axisBorder: { color: '#334155' },
        axisTicks: { color: '#334155' },
    },
    yaxis: {
        labels: { style: { colors: '#94a3b8' } },
    },
};

/**
 * Get ApexCharts chart type
 */
export function getApexChartType(type: ChartType): string {
    switch (type) {
        case 'bar':
        case 'grouped-bar':
        case 'stacked-bar':
            return 'bar';
        case 'line':
            return 'line';
        case 'area':
            return 'area';
        case 'scatter':
        case 'bubble':
            return 'scatter';
        case 'pie':
        case 'doughnut':
            return 'pie';
        case 'radar':
            return 'radar';
        case 'heatmap':
            return 'heatmap';
        default:
            return 'bar';
    }
}

/**
 * Create ApexCharts options for various chart types
 */
export function createApexChartsConfig(
    data: ParsedData,
    config: ChartConfig
): { options: ApexOptions; series: ApexAxisChartSeries | ApexNonAxisChartSeries } {
    const { type } = config;

    switch (type) {
        case 'bar':
        case 'grouped-bar':
            return createBarConfig(data, config, false);
        case 'stacked-bar':
            return createBarConfig(data, config, true);
        case 'line':
            return createLineConfig(data, config);
        case 'area':
            return createAreaConfig(data, config);
        case 'scatter':
            return createScatterConfig(data, config);
        case 'bubble':
            return createBubbleConfig(data, config);
        case 'pie':
        case 'doughnut':
            return createPieConfig(data, config, type === 'doughnut');
        case 'radar':
            return createRadarConfig(data, config);
        case 'heatmap':
            return createHeatmapConfig(data, config);
        default:
            return createBarConfig(data, config, false);
    }
}

function createBarConfig(data: ParsedData, config: ChartConfig, stacked: boolean) {
    const { categories, series } = aggregateData(data, config);

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'bar' as const,
                stacked,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '60%',
                    borderRadius: 4,
                },
            },
            xaxis: {
                ...baseOptions.xaxis,
                categories,
                labels: {
                    ...baseOptions.xaxis?.labels,
                    rotate: categories.length > 8 ? -45 : 0,
                },
            },
        },
        series,
    };
}

function createLineConfig(data: ParsedData, config: ChartConfig) {
    const { categories, series } = aggregateData(data, config);

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'line' as const,
            },
            xaxis: {
                ...baseOptions.xaxis,
                categories,
            },
            markers: { size: 4 },
        },
        series,
    };
}

function createAreaConfig(data: ParsedData, config: ChartConfig) {
    const { categories, series } = aggregateData(data, config);

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'area' as const,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.6,
                    opacityTo: 0.1,
                    stops: [0, 90, 100],
                },
            },
            xaxis: {
                ...baseOptions.xaxis,
                categories,
            },
        },
        series,
    };
}

function createScatterConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, series: seriesColumn } = config;

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const series = seriesValues.map(seriesVal => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);
            return {
                name: seriesVal,
                data: filteredRows.map(row => ({
                    x: parseNumeric(row[xAxis]),
                    y: parseNumeric(row[yAxis[0]]),
                })),
            };
        });

        return {
            options: {
                ...baseOptions,
                chart: {
                    ...baseOptions.chart,
                    type: 'scatter' as const,
                },
                markers: { size: 10 },
                xaxis: {
                    ...baseOptions.xaxis,
                    type: 'numeric',
                    title: { text: xAxis, style: { color: '#94a3b8' } },
                },
                yaxis: {
                    ...baseOptions.yaxis,
                    title: { text: yAxis[0], style: { color: '#94a3b8' } },
                },
            },
            series,
        };
    }

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'scatter' as const,
            },
            markers: { size: 10 },
            xaxis: {
                ...baseOptions.xaxis,
                type: 'numeric',
                title: { text: xAxis, style: { color: '#94a3b8' } },
            },
            yaxis: {
                ...baseOptions.yaxis,
                title: { text: yAxis[0], style: { color: '#94a3b8' } },
            },
        },
        series: [{
            name: 'Data',
            data: data.rows.map(row => ({
                x: parseNumeric(row[xAxis]),
                y: parseNumeric(row[yAxis[0]]),
            })),
        }],
    };
}

function createBubbleConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, size, series: seriesColumn } = config;
    const sizeColumn = size || yAxis[1] || yAxis[0];

    const sizeValues = data.rows.map(row => parseNumeric(row[sizeColumn]));
    const minSize = Math.min(...sizeValues);
    const maxSize = Math.max(...sizeValues);
    const sizeRange = maxSize - minSize || 1;

    function normalizeSize(value: number): number {
        return 10 + ((value - minSize) / sizeRange) * 50;
    }

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const series = seriesValues.map(seriesVal => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);
            return {
                name: seriesVal,
                data: filteredRows.map(row => ({
                    x: parseNumeric(row[xAxis]),
                    y: parseNumeric(row[yAxis[0]]),
                    z: normalizeSize(parseNumeric(row[sizeColumn])),
                })),
            };
        });

        return {
            options: {
                ...baseOptions,
                chart: {
                    ...baseOptions.chart,
                    type: 'bubble' as const,
                },
                xaxis: {
                    ...baseOptions.xaxis,
                    type: 'numeric',
                    title: { text: xAxis, style: { color: '#94a3b8' } },
                },
                yaxis: {
                    ...baseOptions.yaxis,
                    title: { text: yAxis[0], style: { color: '#94a3b8' } },
                },
            },
            series,
        };
    }

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'bubble' as const,
            },
            xaxis: {
                ...baseOptions.xaxis,
                type: 'numeric',
                title: { text: xAxis, style: { color: '#94a3b8' } },
            },
            yaxis: {
                ...baseOptions.yaxis,
                title: { text: yAxis[0], style: { color: '#94a3b8' } },
            },
        },
        series: [{
            name: 'Data',
            data: data.rows.map(row => ({
                x: parseNumeric(row[xAxis]),
                y: parseNumeric(row[yAxis[0]]),
                z: normalizeSize(parseNumeric(row[sizeColumn])),
            })),
        }],
    };
}

function createPieConfig(data: ParsedData, config: ChartConfig, isDoughnut: boolean) {
    const { xAxis, yAxis, aggregation } = config;

    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const values = categories.map(cat => {
        const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
        return aggregate(matchingRows.map(r => Number(r[yAxis[0]]) || 0), aggregation);
    });

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'pie' as const,
            },
            labels: categories,
            plotOptions: {
                pie: {
                    donut: {
                        size: isDoughnut ? '50%' : '0%',
                    },
                },
            },
            legend: {
                ...baseOptions.legend,
                position: 'bottom',
            },
        },
        series: values,
    };
}

function createRadarConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis } = config;

    const entities = [...new Set(data.rows.map(row => String(row[xAxis])))].slice(0, 5);

    const series = entities.map(entity => {
        const row = data.rows.find(r => String(r[xAxis]) === entity);
        return {
            name: entity,
            data: yAxis.map(metric => parseNumeric(row?.[metric])),
        };
    });

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'radar' as const,
            },
            xaxis: {
                ...baseOptions.xaxis,
                categories: yAxis,
            },
            yaxis: {
                ...baseOptions.yaxis,
                show: false,
            },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: '#1e293b',
                        fill: { colors: ['#0f172a', '#1e293b'] },
                    },
                },
            },
        },
        series,
    };
}

function createHeatmapConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, series: seriesColumn } = config;
    const yColumn = seriesColumn || yAxis[0];
    const valueColumn = yAxis[0];

    const xCategories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const yCategories = [...new Set(data.rows.map(row => String(row[yColumn])))];

    const series = yCategories.map(yCat => ({
        name: yCat,
        data: xCategories.map(xCat => {
            const matchingRows = data.rows.filter(
                row => String(row[xAxis]) === xCat && String(row[yColumn]) === yCat
            );
            return matchingRows.reduce((sum, row) => sum + (parseNumeric(row[valueColumn])), 0);
        }),
    }));

    return {
        options: {
            ...baseOptions,
            chart: {
                ...baseOptions.chart,
                type: 'heatmap' as const,
            },
            xaxis: {
                ...baseOptions.xaxis,
                categories: xCategories,
            },
            plotOptions: {
                heatmap: {
                    colorScale: {
                        ranges: [
                            { from: -30, to: 0, color: '#312e81', name: 'low' },
                            { from: 1, to: 30, color: '#4338ca', name: 'medium-low' },
                            { from: 31, to: 60, color: '#6366f1', name: 'medium' },
                            { from: 61, to: 90, color: '#818cf8', name: 'medium-high' },
                            { from: 91, to: 1000000, color: '#a5b4fc', name: 'high' },
                        ],
                    },
                },
            },
        },
        series,
    };
}
