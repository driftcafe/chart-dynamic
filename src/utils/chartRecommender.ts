import type { ParsedData, ChartRecommendation, ChartType, ChartConfig } from '../types/types';

/**
 * Analyze data and recommend appropriate chart types
 */
export function getChartRecommendations(data: ParsedData): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = [];

    const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
    const numericColumns = data.columns.filter(c => c.type === 'numeric');
    const dateColumns = data.columns.filter(c => c.type === 'date');
    const metricColumns = data.columns.filter(c => c.isMetric);

    const hasCategories = categoricalColumns.length > 0;
    const hasMultipleMetrics = metricColumns.length > 1;
    const hasTimeSeries = dateColumns.length > 0;
    const hasTwoNumeric = numericColumns.length >= 2;
    const hasThreeNumeric = numericColumns.length >= 3;
    const lowCardinality = categoricalColumns.some(c => c.uniqueValues <= 8);

    // Time series data → Line chart
    if (hasTimeSeries && metricColumns.length > 0) {
        recommendations.push({
            type: 'line',
            confidence: 0.95,
            reason: 'Time series data detected - line chart shows trends over time',
        });
        recommendations.push({
            type: 'area',
            confidence: 0.75,
            reason: 'Area chart can emphasize magnitude of time series data',
        });
    }

    // Category + metrics → Bar chart
    if (hasCategories && metricColumns.length > 0) {
        if (hasMultipleMetrics) {
            recommendations.push({
                type: 'grouped-bar',
                confidence: 0.9,
                reason: 'Multiple metrics per category - grouped bar enables comparison',
            });
            recommendations.push({
                type: 'stacked-bar',
                confidence: 0.8,
                reason: 'Stacked bar shows composition of total values',
            });
        } else {
            recommendations.push({
                type: 'bar',
                confidence: 0.85,
                reason: 'Category and metric detected - bar chart compares values across categories',
            });
        }
    }

    // Two numeric columns → Scatter
    if (hasTwoNumeric) {
        recommendations.push({
            type: 'scatter',
            confidence: 0.85,
            reason: 'Multiple numeric columns - scatter plot shows correlation',
        });
    }

    // Three numeric → Bubble
    if (hasThreeNumeric) {
        recommendations.push({
            type: 'bubble',
            confidence: 0.8,
            reason: 'Three numeric columns available - bubble chart adds size dimension',
        });
    }

    // Low cardinality category + single metric → Pie/Doughnut
    if (lowCardinality && metricColumns.length === 1) {
        const lowCardCategory = categoricalColumns.find(c => c.uniqueValues <= 8);
        if (lowCardCategory && lowCardCategory.uniqueValues >= 2) {
            recommendations.push({
                type: 'pie',
                confidence: 0.7,
                reason: `${lowCardCategory.uniqueValues} categories - pie chart shows parts of whole`,
            });
            recommendations.push({
                type: 'doughnut',
                confidence: 0.65,
                reason: 'Doughnut chart provides similar view with center space',
            });
        }
    }

    // Multiple categories → Heatmap
    if (categoricalColumns.length >= 2 && metricColumns.length === 1) {
        recommendations.push({
            type: 'heatmap',
            confidence: 0.7,
            reason: 'Two categorical dimensions - heatmap shows intensity patterns',
        });
    }

    // Few metrics, low cardinality → Radar
    if (metricColumns.length >= 3 && metricColumns.length <= 8 && lowCardinality) {
        recommendations.push({
            type: 'radar',
            confidence: 0.6,
            reason: 'Multiple metrics per item - radar chart shows multi-dimensional profile',
        });
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    // If no recommendations, suggest bar chart as safe default
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'bar',
            confidence: 0.5,
            reason: 'Bar chart is a versatile default for most data',
        });
    }

    return recommendations;
}

/**
 * Get a suggested default chart configuration based on data analysis
 */
export function getDefaultChartConfig(data: ParsedData): ChartConfig {
    const recommendations = getChartRecommendations(data);
    const topRecommendation = recommendations[0];

    const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
    const dateColumns = data.columns.filter(c => c.type === 'date');
    const metricColumns = data.columns.filter(c => c.isMetric);
    const numericColumns = data.columns.filter(c => c.type === 'numeric');

    // Determine X-axis (prefer date, then categorical, then first column)
    let xAxis = data.columns[0].name;
    if (dateColumns.length > 0) {
        xAxis = dateColumns[0].name;
    } else if (categoricalColumns.length > 0) {
        xAxis = categoricalColumns[0].name;
    }

    // Determine Y-axis (metrics, up to 4 by default)
    let yAxis: string[] = [];
    if (metricColumns.length > 0) {
        yAxis = metricColumns.slice(0, 4).map(c => c.name);
    } else if (numericColumns.length > 0) {
        yAxis = numericColumns.slice(0, 4).map(c => c.name);
    }

    // Determine series column for grouping
    let series: string | undefined;
    if (categoricalColumns.length > 1) {
        // Use the second categorical column for series if available
        series = categoricalColumns.find(c => c.name !== xAxis)?.name;
    }

    // Size column for bubble charts
    let size: string | undefined;
    if (topRecommendation.type === 'bubble' && numericColumns.length >= 3) {
        size = numericColumns.find(c => !yAxis.includes(c.name) && c.name !== xAxis)?.name;
    }

    return {
        type: topRecommendation.type,
        xAxis,
        yAxis,
        series,
        size,
        aggregation: 'sum',
    };
}

/**
 * Get chart types supported by a given library
 */
export function getLibraryChartTypes(library: string): ChartType[] {
    const commonTypes: ChartType[] = ['bar', 'line', 'scatter', 'pie', 'area'];

    switch (library) {
        case 'echarts':
            return [...commonTypes, 'heatmap', 'radar', 'bubble', 'stacked-bar', 'grouped-bar'];
        case 'plotly':
            return [...commonTypes, 'bubble', 'heatmap', 'stacked-bar', 'grouped-bar'];
        case 'chartjs':
            return [...commonTypes, 'doughnut', 'radar', 'bubble', 'stacked-bar', 'grouped-bar'];
        case 'apexcharts':
            return [...commonTypes, 'heatmap', 'radar', 'stacked-bar', 'grouped-bar'];
        case 'd3':
            return [...commonTypes, 'stacked-bar', 'grouped-bar'];
        default:
            return commonTypes;
    }
}
