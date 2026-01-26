import type { EChartsOption } from 'echarts';
import type { ParsedData, ChartConfig } from '../types/types';
import { parseNumeric } from '../utils/csvParser';

/**
 * Aggregate data for chart rendering
 */
function aggregateData(
    data: ParsedData,
    config: ChartConfig
): { categories: string[]; series: { name: string; data: number[] }[] } {
    const { xAxis, yAxis, series: seriesColumn, aggregation } = config;

    // Get unique X values
    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];

    if (seriesColumn) {
        // Group by series column
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
        // Simple aggregation by X axis
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
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'avg':
            return values.reduce((a, b) => a + b, 0) / values.length;
        case 'count':
            return values.length;
        case 'min':
            return Math.min(...values);
        case 'max':
            return Math.max(...values);
        default:
            return values[0];
    }
}

/**
 * Generate ECharts options for various chart types
 */
export function createEChartsOption(data: ParsedData, config: ChartConfig, theme: 'light' | 'dark' = 'dark'): EChartsOption {
    const { type } = config;
    const isDark = theme !== 'light';

    // Theme colors
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';
    const lineColor = isDark ? '#334155' : '#cbd5e1';
    const splitLineColor = isDark ? '#1e293b' : '#e2e8f0';
    const tooltipBg = isDark ? 'rgba(20, 20, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = isDark ? '#e2e8f0' : '#0f172a';
    const tooltipBorder = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)';

    const baseOption: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: type === 'scatter' || type === 'bubble' ? 'item' : 'axis',
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            textStyle: { color: tooltipText },
            padding: 12,
        },
        legend: {
            type: 'scroll',
            bottom: 10,
            textStyle: { color: subTextColor },
            pageTextStyle: { color: subTextColor },
            pageIconColor: subTextColor,
            pageIconInactiveColor: isDark ? '#334155' : '#cbd5e1',
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true,
        },
        toolbox: {
            feature: {
                dataZoom: { yAxisIndex: 'none' },
                restore: {},
                saveAsImage: {},
            },
            iconStyle: { borderColor: subTextColor },
        },
        // Defaults for axes (can be overridden)
        xAxis: { axisLabel: { color: subTextColor }, axisLine: { lineStyle: { color: lineColor } }, splitLine: { lineStyle: { color: splitLineColor } } },
        yAxis: { axisLabel: { color: subTextColor }, axisLine: { lineStyle: { color: lineColor } }, splitLine: { lineStyle: { color: splitLineColor } } },
    };

    switch (type) {
        case 'bar':
        case 'grouped-bar':
            return createBarOption(data, config, baseOption);
        case 'stacked-bar':
            return createStackedBarOption(data, config, baseOption);
        case 'line':
        case 'area':
            return createLineOption(data, config, baseOption, type === 'area');
        case 'scatter':
            return createScatterOption(data, config, baseOption);
        case 'bubble':
            return createBubbleOption(data, config, baseOption);
        case 'pie':
        case 'doughnut':
            return createPieOption(data, config, baseOption, type === 'doughnut');
        case 'radar':
            return createRadarOption(data, config, baseOption);
        case 'heatmap':
            return createHeatmapOption(data, config, baseOption);
        default:
            return createBarOption(data, config, baseOption);
    }
}

function createBarOption(data: ParsedData, config: ChartConfig, base: EChartsOption): EChartsOption {
    const { categories, series } = aggregateData(data, config);

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return {
        ...base,
        color: colors,
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: '#94a3b8', rotate: categories.length > 8 ? 45 : 0 },
            axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { type: 'slider', start: 0, end: 100, height: 20, bottom: 35 },
        ],
        series: series.map(s => ({
            name: s.name,
            type: 'bar',
            data: s.data,
            emphasis: { focus: 'series' },
            itemStyle: { borderRadius: [4, 4, 0, 0] },
        })),
    };
}

function createStackedBarOption(data: ParsedData, config: ChartConfig, base: EChartsOption): EChartsOption {
    const { categories, series } = aggregateData(data, config);

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return {
        ...base,
        color: colors,
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: '#94a3b8', rotate: categories.length > 8 ? 45 : 0 },
            axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: series.map(s => ({
            name: s.name,
            type: 'bar',
            stack: 'total',
            data: s.data,
            emphasis: { focus: 'series' },
        })),
    };
}

function createLineOption(data: ParsedData, config: ChartConfig, base: EChartsOption, isArea: boolean): EChartsOption {
    const { categories, series } = aggregateData(data, config);

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return {
        ...base,
        color: colors,
        xAxis: {
            type: 'category',
            data: categories,
            boundaryGap: false,
            axisLabel: { color: '#94a3b8' },
            axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { type: 'slider', start: 0, end: 100, height: 20, bottom: 35 },
        ],
        series: series.map((s, i) => ({
            name: s.name,
            type: 'line',
            data: s.data,
            smooth: true,
            emphasis: { focus: 'series' },
            areaStyle: isArea ? {
                opacity: 0.3,
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: colors[i % colors.length] },
                        { offset: 1, color: 'transparent' },
                    ],
                },
            } : undefined,
        })),
    };
}

function createScatterOption(data: ParsedData, config: ChartConfig, base: EChartsOption): EChartsOption {
    const { xAxis, yAxis, series: seriesColumn } = config;

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        return {
            ...base,
            color: colors,
            xAxis: {
                type: 'value',
                name: xAxis,
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#1e293b' } },
            },
            yAxis: {
                type: 'value',
                name: yAxis[0],
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#1e293b' } },
            },
            series: seriesValues.map(seriesVal => ({
                name: seriesVal,
                type: 'scatter',
                data: data.rows
                    .filter(row => String(row[seriesColumn]) === seriesVal)
                    .map(row => [parseNumeric(row[xAxis]), parseNumeric(row[yAxis[0]])]),
                symbolSize: 12,
                emphasis: { focus: 'series' },
            })),
        };
    }

    return {
        ...base,
        color: colors,
        xAxis: {
            type: 'value',
            name: xAxis,
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        yAxis: {
            type: 'value',
            name: yAxis[0],
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: [{
            type: 'scatter',
            data: data.rows.map(row => [parseNumeric(row[xAxis]), parseNumeric(row[yAxis[0]])]),
            symbolSize: 12,
        }],
    };
}

function createBubbleOption(data: ParsedData, config: ChartConfig, base: EChartsOption): EChartsOption {
    const { xAxis, yAxis, size, series: seriesColumn } = config;
    const sizeColumn = size || yAxis[1] || yAxis[0];

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    // Calculate size range
    const sizeValues = data.rows.map(row => parseNumeric(row[sizeColumn]));
    const minSize = Math.min(...sizeValues);
    const maxSize = Math.max(...sizeValues);
    const sizeRange = maxSize - minSize || 1;

    function getSymbolSize(value: number): number {
        return 10 + ((value - minSize) / sizeRange) * 40;
    }

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        return {
            ...base,
            color: colors,
            xAxis: {
                type: 'value',
                name: xAxis,
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#1e293b' } },
            },
            yAxis: {
                type: 'value',
                name: yAxis[0],
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#1e293b' } },
            },
            series: seriesValues.map(seriesVal => ({
                name: seriesVal,
                type: 'scatter',
                data: data.rows
                    .filter(row => String(row[seriesColumn]) === seriesVal)
                    .map(row => ({
                        value: [parseNumeric(row[xAxis]), parseNumeric(row[yAxis[0]])],
                        symbolSize: getSymbolSize(parseNumeric(row[sizeColumn])),
                    })),
                emphasis: { focus: 'series' },
            })),
        };
    }

    return {
        ...base,
        xAxis: {
            type: 'value',
            name: xAxis,
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        yAxis: {
            type: 'value',
            name: yAxis[0],
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: [{
            type: 'scatter',
            data: data.rows.map(row => ({
                value: [parseNumeric(row[xAxis]), parseNumeric(row[yAxis[0]])],
                symbolSize: getSymbolSize(parseNumeric(row[sizeColumn])),
            })),
        }],
    };
}

function createPieOption(data: ParsedData, config: ChartConfig, base: EChartsOption, isDoughnut: boolean): EChartsOption {
    const { xAxis, yAxis, aggregation } = config;

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

    // Aggregate by category
    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const pieData = categories.map(cat => {
        const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
        const values = matchingRows.map(r => parseNumeric(r[yAxis[0]]));
        return {
            name: cat,
            value: aggregate(values, aggregation),
        };
    });

    return {
        ...base,
        color: colors,
        series: [{
            type: 'pie',
            radius: isDoughnut ? ['45%', '70%'] : '70%',
            center: ['50%', '45%'],
            data: pieData,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
            label: {
                color: '#94a3b8',
                formatter: '{b}: {d}%',
            },
            labelLine: {
                lineStyle: { color: '#475569' },
            },
        }],
    };
}

function createRadarOption(data: ParsedData, config: ChartConfig, base: EChartsOption): EChartsOption {
    const { xAxis, yAxis } = config;

    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

    // Get max values for each metric to normalize radar
    const maxValues = yAxis.map(metric =>
        Math.max(...data.rows.map(row => parseNumeric(row[metric])))
    );

    const indicator = yAxis.map((metric, i) => ({
        name: metric,
        max: maxValues[i] * 1.1 || 100,
    }));

    // Get unique entities to compare
    const entities = [...new Set(data.rows.map(row => String(row[xAxis])))].slice(0, 5);

    const seriesData = entities.map(entity => {
        const row = data.rows.find(r => String(r[xAxis]) === entity);
        return {
            name: entity,
            value: yAxis.map(metric => parseNumeric(row?.[metric])),
        };
    });

    return {
        ...base,
        color: colors,
        radar: {
            indicator,
            axisName: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1e293b' } },
            splitArea: { areaStyle: { color: ['rgba(30, 41, 59, 0.3)', 'rgba(30, 41, 59, 0.5)'] } },
        },
        series: [{
            type: 'radar',
            data: seriesData,
            emphasis: { areaStyle: { opacity: 0.5 } },
        }],
    };
}

function createHeatmapOption(data: ParsedData, config: ChartConfig, base: EChartsOption): EChartsOption {
    const { xAxis, yAxis, series: seriesColumn } = config;
    const yColumn = seriesColumn || yAxis[0];
    const valueColumn = yAxis[0];

    const xCategories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const yCategories = [...new Set(data.rows.map(row => String(row[yColumn])))];

    const heatmapData: [number, number, number][] = [];
    const values: number[] = [];

    xCategories.forEach((xCat, xIdx) => {
        yCategories.forEach((yCat, yIdx) => {
            const matchingRows = data.rows.filter(
                row => String(row[xAxis]) === xCat && String(row[yColumn]) === yCat
            );
            const value = matchingRows.reduce((sum, row) => sum + parseNumeric(row[valueColumn]), 0);
            heatmapData.push([xIdx, yIdx, value]);
            values.push(value);
        });
    });

    return {
        ...base,
        grid: { ...base.grid, left: '15%' },
        xAxis: {
            type: 'category',
            data: xCategories,
            axisLabel: { color: '#94a3b8', rotate: 45 },
            axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
            type: 'category',
            data: yCategories,
            axisLabel: { color: '#94a3b8' },
            axisLine: { lineStyle: { color: '#334155' } },
        },
        visualMap: {
            min: Math.min(...values),
            max: Math.max(...values),
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 10,
            inRange: {
                color: ['#312e81', '#4338ca', '#6366f1', '#818cf8', '#a5b4fc'],
            },
            textStyle: { color: '#94a3b8' },
        },
        series: [{
            type: 'heatmap',
            data: heatmapData,
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
            },
        }],
    };
}
