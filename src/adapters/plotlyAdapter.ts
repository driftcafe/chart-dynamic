import type { Data, Layout, Config } from 'plotly.js';
import type { ParsedData, ChartConfig } from '../types/types';
import { parseNumeric } from '../utils/csvParser';

/**
 * Aggregate data for Plotly charts
 */
function aggregateData(
    data: ParsedData,
    config: ChartConfig
): { categories: string[]; series: { name: string; values: number[] }[] } {
    const { xAxis, yAxis, series: seriesColumn, aggregation } = config;

    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const series = seriesValues.flatMap(seriesVal => {
            return yAxis.map(metric => {
                const values = categories.map(cat => {
                    const matchingRows = data.rows.filter(
                        row => String(row[xAxis]) === cat && String(row[seriesColumn]) === seriesVal
                    );
                    return aggregate(matchingRows.map(r => parseNumeric(r[metric])), aggregation);
                });

                return {
                    name: yAxis.length > 1 ? `${seriesVal} - ${metric}` : seriesVal,
                    values,
                };
            });
        });

        return { categories, series };
    } else {
        const series = yAxis.map(metric => {
            const values = categories.map(cat => {
                const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
                return aggregate(matchingRows.map(r => parseNumeric(r[metric])), aggregation);
            });

            return { name: metric, values };
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

const baseLayout: Partial<Layout> = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif' },
    margin: { l: 60, r: 30, t: 40, b: 80 },
    legend: {
        orientation: 'h',
        y: -0.15,
        xanchor: 'center',
        x: 0.5,
    },
    xaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8' },
    },
    yaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8' },
    },
    hoverlabel: {
        bgcolor: 'rgba(20, 20, 35, 0.95)',
        bordercolor: 'rgba(99, 102, 241, 0.3)',
        font: { color: '#e2e8f0' },
    },
};

const baseConfig: Partial<Config> = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
};

/**
 * Create Plotly data and layout for various chart types
 */
export function createPlotlyData(
    data: ParsedData,
    config: ChartConfig
): { data: Data[]; layout: Partial<Layout>; config: Partial<Config> } {
    const { type } = config;

    switch (type) {
        case 'bar':
        case 'grouped-bar':
            return createBarData(data, config);
        case 'stacked-bar':
            return createStackedBarData(data, config);
        case 'line':
            return createLineData(data, config);
        case 'area':
            return createAreaData(data, config);
        case 'scatter':
            return createScatterData(data, config);
        case 'bubble':
            return createBubbleData(data, config);
        case 'pie':
        case 'doughnut':
            return createPieData(data, config, type === 'doughnut');
        case 'heatmap':
            return createHeatmapData(data, config);
        default:
            return createBarData(data, config);
    }
}

function createBarData(data: ParsedData, config: ChartConfig) {
    const { categories, series } = aggregateData(data, config);

    const traces: Data[] = series.map((s, i) => ({
        type: 'bar' as const,
        name: s.name,
        x: categories,
        y: s.values,
        marker: { color: colors[i % colors.length] },
    }));

    return {
        data: traces,
        layout: {
            ...baseLayout,
            barmode: 'group' as const,
            xaxis: { ...baseLayout.xaxis, title: { text: config.xAxis } },
        },
        config: baseConfig,
    };
}

function createStackedBarData(data: ParsedData, config: ChartConfig) {
    const { categories, series } = aggregateData(data, config);

    const traces: Data[] = series.map((s, i) => ({
        type: 'bar' as const,
        name: s.name,
        x: categories,
        y: s.values,
        marker: { color: colors[i % colors.length] },
    }));

    return {
        data: traces,
        layout: {
            ...baseLayout,
            barmode: 'stack' as const,
            xaxis: { ...baseLayout.xaxis, title: { text: config.xAxis } },
        },
        config: baseConfig,
    };
}

function createLineData(data: ParsedData, config: ChartConfig) {
    const { categories, series } = aggregateData(data, config);

    const traces: Data[] = series.map((s, i) => ({
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        name: s.name,
        x: categories,
        y: s.values,
        line: { color: colors[i % colors.length], shape: 'spline' as const },
        marker: { color: colors[i % colors.length], size: 6 },
    }));

    return {
        data: traces,
        layout: {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: { text: config.xAxis } },
        },
        config: baseConfig,
    };
}

function createAreaData(data: ParsedData, config: ChartConfig) {
    const { categories, series } = aggregateData(data, config);

    const traces: Data[] = series.map((s, i) => ({
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: s.name,
        x: categories,
        y: s.values,
        fill: 'tozeroy' as const,
        line: { color: colors[i % colors.length], shape: 'spline' as const },
        fillcolor: colors[i % colors.length] + '40',
    }));

    return {
        data: traces,
        layout: {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: { text: config.xAxis } },
        },
        config: baseConfig,
    };
}

function createScatterData(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, series: seriesColumn } = config;

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        const traces: Data[] = seriesValues.map((seriesVal, i) => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);
            return {
                type: 'scatter' as const,
                mode: 'markers' as const,
                name: seriesVal,
                x: filteredRows.map(row => parseNumeric(row[xAxis])),
                y: filteredRows.map(row => parseNumeric(row[yAxis[0]])),
                marker: { color: colors[i % colors.length], size: 10 },
            };
        });

        return {
            data: traces,
            layout: {
                ...baseLayout,
                xaxis: { ...baseLayout.xaxis, title: { text: xAxis } },
                yaxis: { ...baseLayout.yaxis, title: { text: yAxis[0] } },
            },
            config: baseConfig,
        };
    }

    const traces: Data[] = [{
        type: 'scatter' as const,
        mode: 'markers' as const,
        x: data.rows.map(row => parseNumeric(row[xAxis])),
        y: data.rows.map(row => parseNumeric(row[yAxis[0]])),
        marker: { color: colors[0], size: 10 },
    }];

    return {
        data: traces,
        layout: {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: { text: xAxis } },
            yaxis: { ...baseLayout.yaxis, title: { text: yAxis[0] } },
        },
        config: baseConfig,
    };
}

function createBubbleData(data: ParsedData, config: ChartConfig) {
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

        const traces: Data[] = seriesValues.map((seriesVal, i) => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);
            return {
                type: 'scatter' as const,
                mode: 'markers' as const,
                name: seriesVal,
                x: filteredRows.map(row => parseNumeric(row[xAxis])),
                y: filteredRows.map(row => parseNumeric(row[yAxis[0]])),
                marker: {
                    color: colors[i % colors.length],
                    size: filteredRows.map(row => normalizeSize(parseNumeric(row[sizeColumn]))),
                    sizemode: 'diameter' as const,
                },
                text: filteredRows.map(row => `${sizeColumn}: ${row[sizeColumn]}`),
            };
        });

        return {
            data: traces,
            layout: {
                ...baseLayout,
                xaxis: { ...baseLayout.xaxis, title: { text: xAxis } },
                yaxis: { ...baseLayout.yaxis, title: { text: yAxis[0] } },
            },
            config: baseConfig,
        };
    }

    const traces: Data[] = [{
        type: 'scatter' as const,
        mode: 'markers' as const,
        x: data.rows.map(row => parseNumeric(row[xAxis])),
        y: data.rows.map(row => parseNumeric(row[yAxis[0]])),
        marker: {
            color: colors[0],
            size: data.rows.map(row => normalizeSize(parseNumeric(row[sizeColumn]))),
            sizemode: 'diameter' as const,
        },
        text: data.rows.map(row => `${sizeColumn}: ${row[sizeColumn]}`),
    }];

    return {
        data: traces,
        layout: {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: { text: xAxis } },
            yaxis: { ...baseLayout.yaxis, title: { text: yAxis[0] } },
        },
        config: baseConfig,
    };
}

function createPieData(data: ParsedData, config: ChartConfig, isDoughnut: boolean) {
    const { xAxis, yAxis, aggregation } = config;

    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const values = categories.map(cat => {
        const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
        return aggregate(matchingRows.map(r => Number(r[yAxis[0]]) || 0), aggregation);
    });

    const traces: Data[] = [{
        type: 'pie' as const,
        labels: categories,
        values,
        hole: isDoughnut ? 0.4 : 0,
        marker: { colors },
        textinfo: 'label+percent' as const,
        textfont: { color: '#e2e8f0' },
    }];

    return {
        data: traces,
        layout: {
            ...baseLayout,
            showlegend: true,
        },
        config: baseConfig,
    };
}

function createHeatmapData(data: ParsedData, config: ChartConfig) {
    const { xAxis, yAxis, series: seriesColumn } = config;
    const yColumn = seriesColumn || yAxis[0];
    const valueColumn = yAxis[0];

    const xCategories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const yCategories = [...new Set(data.rows.map(row => String(row[yColumn])))];

    const zValues: number[][] = yCategories.map(yCat =>
        xCategories.map(xCat => {
            const matchingRows = data.rows.filter(
                row => String(row[xAxis]) === xCat && String(row[yColumn]) === yCat
            );
            return matchingRows.reduce((sum, row) => sum + (parseNumeric(row[valueColumn])), 0);
        })
    );

    const traces: Data[] = [{
        type: 'heatmap' as const,
        x: xCategories,
        y: yCategories,
        z: zValues,
        colorscale: [
            [0, '#312e81'],
            [0.25, '#4338ca'],
            [0.5, '#6366f1'],
            [0.75, '#818cf8'],
            [1, '#a5b4fc'],
        ],
        showscale: true,
        colorbar: {
            tickfont: { color: '#94a3b8' },
        },
    }];

    return {
        data: traces,
        layout: {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: { text: xAxis } },
            yaxis: { ...baseLayout.yaxis, title: { text: yColumn } },
        },
        config: baseConfig,
    };
}
