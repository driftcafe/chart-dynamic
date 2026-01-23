import type { ChartData, ChartOptions } from 'chart.js';
import type { ParsedData, ChartConfig, ChartType } from '../types/types';

/**
 * Aggregate data for Chart.js charts
 */
function aggregateData(
    data: ParsedData,
    config: ChartConfig
): { labels: string[]; datasets: { label: string; data: number[] }[] } {
    const { xAxis, yAxis, series: seriesColumn, aggregation } = config;

    const labels = [...new Set(data.rows.map(row => String(row[xAxis])))];

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const datasets = seriesValues.flatMap(seriesVal => {
            return yAxis.map(metric => {
                const dataPoints = labels.map(label => {
                    const matchingRows = data.rows.filter(
                        row => String(row[xAxis]) === label && String(row[seriesColumn]) === seriesVal
                    );
                    return aggregate(matchingRows.map(r => Number(r[metric]) || 0), aggregation);
                });

                return {
                    label: yAxis.length > 1 ? `${seriesVal} - ${metric}` : seriesVal,
                    data: dataPoints,
                };
            });
        });

        return { labels, datasets };
    } else {
        const datasets = yAxis.map(metric => {
            const dataPoints = labels.map(label => {
                const matchingRows = data.rows.filter(row => String(row[xAxis]) === label);
                return aggregate(matchingRows.map(r => Number(r[metric]) || 0), aggregation);
            });

            return { label: metric, data: dataPoints };
        });

        return { labels, datasets };
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

const colors = [
    { bg: 'rgba(99, 102, 241, 0.7)', border: '#6366f1' },
    { bg: 'rgba(139, 92, 246, 0.7)', border: '#8b5cf6' },
    { bg: 'rgba(6, 182, 212, 0.7)', border: '#06b6d4' },
    { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
    { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },
    { bg: 'rgba(239, 68, 68, 0.7)', border: '#ef4444' },
    { bg: 'rgba(236, 72, 153, 0.7)', border: '#ec4899' },
];

const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 15, usePointStyle: true },
        },
        tooltip: {
            backgroundColor: 'rgba(20, 20, 35, 0.95)',
            titleColor: '#e2e8f0',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
        },
    },
    scales: {
        x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' },
        },
        y: {
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8' },
        },
    },
};

/**
 * Get Chart.js chart type mapping
 */
export function getChartJsType(type: ChartType): string {
    switch (type) {
        case 'bar':
        case 'grouped-bar':
        case 'stacked-bar':
            return 'bar';
        case 'line':
        case 'area':
            return 'line';
        case 'scatter':
        case 'bubble':
            return 'scatter';
        case 'pie':
            return 'pie';
        case 'doughnut':
            return 'doughnut';
        case 'radar':
            return 'radar';
        default:
            return 'bar';
    }
}

/**
 * Create Chart.js data and options for various chart types
 */
export function createChartJsConfig(
    data: ParsedData,
    config: ChartConfig
): { data: ChartData; options: ChartOptions } {
    const { type } = config;

    switch (type) {
        case 'bar':
        case 'grouped-bar':
            return createBarConfig(data, config, false);
        case 'stacked-bar':
            return createBarConfig(data, config, true);
        case 'line':
            return createLineConfig(data, config, false);
        case 'area':
            return createLineConfig(data, config, true);
        case 'scatter':
            return createScatterConfig(data, config);
        case 'bubble':
            return createBubbleConfig(data, config);
        case 'pie':
        case 'doughnut':
            return createPieConfig(data, config);
        case 'radar':
            return createRadarConfig(data, config);
        default:
            return createBarConfig(data, config, false);
    }
}

function createBarConfig(data: ParsedData, config: ChartConfig, stacked: boolean) {
    const { labels, datasets } = aggregateData(data, config);

    return {
        data: {
            labels,
            datasets: datasets.map((ds, i) => ({
                ...ds,
                backgroundColor: colors[i % colors.length].bg,
                borderColor: colors[i % colors.length].border,
                borderWidth: 1,
                borderRadius: 4,
            })),
        },
        options: {
            ...baseOptions,
            scales: {
                ...baseOptions.scales,
                x: {
                    ...baseOptions.scales?.x,
                    stacked,
                },
                y: {
                    ...baseOptions.scales?.y,
                    stacked,
                    beginAtZero: true,
                },
            },
        },
    };
}

function createLineConfig(data: ParsedData, config: ChartConfig, filled: boolean) {
    const { labels, datasets } = aggregateData(data, config);

    return {
        data: {
            labels,
            datasets: datasets.map((ds, i) => ({
                ...ds,
                borderColor: colors[i % colors.length].border,
                backgroundColor: filled ? colors[i % colors.length].bg : 'transparent',
                fill: filled,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: colors[i % colors.length].border,
            })),
        },
        options: {
            ...baseOptions,
            scales: {
                ...baseOptions.scales,
                y: {
                    ...baseOptions.scales?.y,
                    beginAtZero: true,
                },
            },
        },
    };
}

function createScatterConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, series: seriesColumn } = config;

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const datasets = seriesValues.map((seriesVal, i) => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);
            return {
                label: seriesVal,
                data: filteredRows.map(row => ({
                    x: Number(row[xAxis]) || 0,
                    y: Number(row[yAxis[0]]) || 0,
                })),
                backgroundColor: colors[i % colors.length].bg,
                borderColor: colors[i % colors.length].border,
                pointRadius: 8,
                pointHoverRadius: 10,
            };
        });

        return {
            data: { datasets },
            options: {
                ...baseOptions,
                scales: {
                    x: {
                        ...baseOptions.scales?.x,
                        type: 'linear' as const,
                        title: { display: true, text: xAxis, color: '#94a3b8' },
                    },
                    y: {
                        ...baseOptions.scales?.y,
                        type: 'linear' as const,
                        title: { display: true, text: yAxis[0], color: '#94a3b8' },
                    },
                },
            },
        };
    }

    return {
        data: {
            datasets: [{
                label: 'Data',
                data: data.rows.map(row => ({
                    x: Number(row[xAxis]) || 0,
                    y: Number(row[yAxis[0]]) || 0,
                })),
                backgroundColor: colors[0].bg,
                borderColor: colors[0].border,
                pointRadius: 8,
                pointHoverRadius: 10,
            }],
        },
        options: {
            ...baseOptions,
            scales: {
                x: {
                    ...baseOptions.scales?.x,
                    type: 'linear' as const,
                    title: { display: true, text: xAxis, color: '#94a3b8' },
                },
                y: {
                    ...baseOptions.scales?.y,
                    type: 'linear' as const,
                    title: { display: true, text: yAxis[0], color: '#94a3b8' },
                },
            },
        },
    };
}

function createBubbleConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, size, series: seriesColumn } = config;
    const sizeColumn = size || yAxis[1] || yAxis[0];

    const sizeValues = data.rows.map(row => Number(row[sizeColumn]) || 0);
    const minSize = Math.min(...sizeValues);
    const maxSize = Math.max(...sizeValues);
    const sizeRange = maxSize - minSize || 1;

    function normalizeSize(value: number): number {
        return 5 + ((value - minSize) / sizeRange) * 30;
    }

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const datasets = seriesValues.map((seriesVal, i) => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);
            return {
                label: seriesVal,
                data: filteredRows.map(row => ({
                    x: Number(row[xAxis]) || 0,
                    y: Number(row[yAxis[0]]) || 0,
                    r: normalizeSize(Number(row[sizeColumn]) || 0),
                })),
                backgroundColor: colors[i % colors.length].bg,
                borderColor: colors[i % colors.length].border,
            };
        });

        return {
            data: { datasets },
            options: {
                ...baseOptions,
                scales: {
                    x: {
                        ...baseOptions.scales?.x,
                        type: 'linear' as const,
                        title: { display: true, text: xAxis, color: '#94a3b8' },
                    },
                    y: {
                        ...baseOptions.scales?.y,
                        type: 'linear' as const,
                        title: { display: true, text: yAxis[0], color: '#94a3b8' },
                    },
                },
            },
        };
    }

    return {
        data: {
            datasets: [{
                label: 'Data',
                data: data.rows.map(row => ({
                    x: Number(row[xAxis]) || 0,
                    y: Number(row[yAxis[0]]) || 0,
                    r: normalizeSize(Number(row[sizeColumn]) || 0),
                })),
                backgroundColor: colors[0].bg,
                borderColor: colors[0].border,
            }],
        },
        options: {
            ...baseOptions,
            scales: {
                x: {
                    ...baseOptions.scales?.x,
                    type: 'linear' as const,
                    title: { display: true, text: xAxis, color: '#94a3b8' },
                },
                y: {
                    ...baseOptions.scales?.y,
                    type: 'linear' as const,
                    title: { display: true, text: yAxis[0], color: '#94a3b8' },
                },
            },
        },
    };
}

function createPieConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, aggregation } = config;

    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const values = categories.map(cat => {
        const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
        return aggregate(matchingRows.map(r => Number(r[yAxis[0]]) || 0), aggregation);
    });

    return {
        data: {
            labels: categories,
            datasets: [{
                data: values,
                backgroundColor: colors.map(c => c.bg),
                borderColor: colors.map(c => c.border),
                borderWidth: 2,
            }],
        },
        options: {
            ...baseOptions,
            scales: undefined,
        },
    };
}

function createRadarConfig(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis } = config;

    const entities = [...new Set(data.rows.map(row => String(row[xAxis])))].slice(0, 5);

    const datasets = entities.map((entity, i) => {
        const row = data.rows.find(r => String(r[xAxis]) === entity);
        return {
            label: entity,
            data: yAxis.map(metric => Number(row?.[metric]) || 0),
            backgroundColor: colors[i % colors.length].bg,
            borderColor: colors[i % colors.length].border,
            borderWidth: 2,
            pointRadius: 4,
        };
    });

    return {
        data: {
            labels: yAxis,
            datasets,
        },
        options: {
            ...baseOptions,
            scales: {
                r: {
                    grid: { color: '#1e293b' },
                    angleLines: { color: '#1e293b' },
                    pointLabels: { color: '#94a3b8' },
                    ticks: { color: '#94a3b8', backdropColor: 'transparent' },
                },
            },
        },
    };
}
