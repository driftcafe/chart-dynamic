import * as d3 from 'd3';
import type { ParsedData, ChartConfig, ChartType } from '../types/types';

const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * Aggregate data for D3 charts
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
                    return aggregate(matchingRows.map(r => Number(r[metric]) || 0), aggregation);
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
                return aggregate(matchingRows.map(r => Number(r[metric]) || 0), aggregation);
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

/**
 * Get supported D3 chart types
 */
export function getD3ChartTypes(): ChartType[] {
    return ['bar', 'line', 'scatter', 'area', 'grouped-bar', 'stacked-bar', 'pie'];
}

/**
 * Render a D3 chart in the given container
 */
export function renderD3Chart(
    container: HTMLElement,
    data: ParsedData,
    config: ChartConfig
): void {
    // Clear previous chart
    d3.select(container).selectAll('*').remove();

    const { type } = config;

    switch (type) {
        case 'bar':
        case 'grouped-bar':
            renderGroupedBarChart(container, data, config);
            break;
        case 'stacked-bar':
            renderStackedBarChart(container, data, config);
            break;
        case 'line':
            renderLineChart(container, data, config);
            break;
        case 'area':
            renderAreaChart(container, data, config);
            break;
        case 'scatter':
            renderScatterChart(container, data, config);
            break;
        case 'pie':
        case 'doughnut':
            renderPieChart(container, data, config, type === 'doughnut');
            break;
        default:
            renderGroupedBarChart(container, data, config);
    }
}

function createSvg(container: HTMLElement, margin: Margin) {
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    return {
        svg,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
}

function addTooltip(container: HTMLElement) {
    return d3.select(container)
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(20, 20, 35, 0.95)')
        .style('color', '#e2e8f0')
        .style('padding', '8px 12px')
        .style('border-radius', '8px')
        .style('border', '1px solid rgba(99, 102, 241, 0.3)')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '100');
}

function addLegend(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    names: string[],
    width: number,
    height: number
) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(0, ${height + 40})`);

    const legendItems = legend.selectAll('.legend-item')
        .data(names)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (_, i) => `translate(${i * 120}, 0)`);

    legendItems.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', (_, i) => colors[i % colors.length]);

    legendItems.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('fill', '#94a3b8')
        .style('font-size', '12px')
        .text(d => d.length > 15 ? d.slice(0, 15) + '...' : d);
}

function renderGroupedBarChart(container: HTMLElement, data: ParsedData, config: ChartConfig) {
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const { svg, width, height } = createSvg(container, margin);
    const tooltip = addTooltip(container);

    const { categories, series } = aggregateData(data, config);

    const x0 = d3.scaleBand()
        .domain(categories)
        .rangeRound([0, width])
        .paddingInner(0.2);

    const x1 = d3.scaleBand()
        .domain(series.map(s => s.name))
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);

    const allValues = series.flatMap(s => s.values);
    const y = d3.scaleLinear()
        .domain([0, Math.max(...allValues) * 1.1])
        .rangeRound([height, 0]);

    // X axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0).tickSize(0))
        .selectAll('text')
        .style('fill', '#94a3b8')
        .attr('transform', categories.length > 8 ? 'rotate(-45)' : 'rotate(0)')
        .style('text-anchor', categories.length > 8 ? 'end' : 'middle');

    svg.select('.x-axis path').style('stroke', '#334155');

    // Y axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', '#94a3b8');

    svg.select('.y-axis path').style('stroke', '#334155');
    svg.selectAll('.y-axis .tick line')
        .style('stroke', '#1e293b')
        .attr('x2', width);

    // Bars
    const categoryGroups = svg.append('g')
        .selectAll('g')
        .data(categories)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x0(d)},0)`);

    categoryGroups.selectAll('rect')
        .data((cat, catIdx) => series.map((s, i) => ({
            name: s.name,
            value: s.values[catIdx],
            colorIdx: i,
            category: cat,
        })))
        .enter()
        .append('rect')
        .attr('x', d => x1(d.name) || 0)
        .attr('y', d => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => colors[d.colorIdx % colors.length])
        .attr('rx', 3)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            tooltip
                .style('visibility', 'visible')
                .html(`<strong>${d.category}</strong><br/>${d.name}: ${d.value.toLocaleString()}`);
        })
        .on('mousemove', function (event) {
            tooltip
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
            tooltip.style('visibility', 'hidden');
        });

    addLegend(svg, series.map(s => s.name), width, height);
}

function renderStackedBarChart(container: HTMLElement, data: ParsedData, config: ChartConfig) {
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const { svg, width, height } = createSvg(container, margin);
    const tooltip = addTooltip(container);

    const { categories, series } = aggregateData(data, config);

    // Transform data for stacking
    const stackData = categories.map((cat, i) => {
        const obj: Record<string, string | number> = { category: cat };
        series.forEach(s => {
            obj[s.name] = s.values[i];
        });
        return obj;
    });

    const keys = series.map(s => s.name);
    const stack = d3.stack<Record<string, string | number>>()
        .keys(keys);

    const stackedData = stack(stackData);

    const x = d3.scaleBand()
        .domain(categories)
        .rangeRound([0, width])
        .padding(0.2);

    const maxY = d3.max(stackedData, layer => d3.max(layer, d => d[1])) || 0;
    const y = d3.scaleLinear()
        .domain([0, maxY * 1.1])
        .rangeRound([height, 0]);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll('text')
        .style('fill', '#94a3b8');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', '#94a3b8');

    // Stacked bars
    svg.append('g')
        .selectAll('g')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('fill', (_, i) => colors[i % colors.length])
        .selectAll('rect')
        .data(d => d)
        .enter()
        .append('rect')
        .attr('x', d => x(String(d.data.category)) || 0)
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            const value = d[1] - d[0];
            tooltip
                .style('visibility', 'visible')
                .html(`<strong>${d.data.category}</strong><br/>Value: ${value.toLocaleString()}`);
        })
        .on('mousemove', function (event) {
            tooltip
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
            tooltip.style('visibility', 'hidden');
        });

    addLegend(svg, keys, width, height);
}

function renderLineChart(container: HTMLElement, data: ParsedData, config: ChartConfig) {
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const { svg, width, height } = createSvg(container, margin);
    const tooltip = addTooltip(container);

    const { categories, series } = aggregateData(data, config);

    const x = d3.scalePoint()
        .domain(categories)
        .range([0, width]);

    const allValues = series.flatMap(s => s.values);
    const y = d3.scaleLinear()
        .domain([0, Math.max(...allValues) * 1.1])
        .range([height, 0]);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll('text')
        .style('fill', '#94a3b8');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', '#94a3b8');

    // Grid lines
    svg.append('g')
        .selectAll('line')
        .data(y.ticks(5))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .style('stroke', '#1e293b')
        .style('stroke-dasharray', '4');

    // Lines
    const line = d3.line<{ cat: string; value: number }>()
        .x(d => x(d.cat) || 0)
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    series.forEach((s, i) => {
        const lineData = categories.map((cat, j) => ({ cat, value: s.values[j] }));

        svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', colors[i % colors.length])
            .attr('stroke-width', 2)
            .attr('d', line);

        // Points
        svg.selectAll(`.dot-${i}`)
            .data(lineData)
            .enter()
            .append('circle')
            .attr('class', `dot-${i}`)
            .attr('cx', d => x(d.cat) || 0)
            .attr('cy', d => y(d.value))
            .attr('r', 5)
            .attr('fill', colors[i % colors.length])
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 7);
                tooltip
                    .style('visibility', 'visible')
                    .html(`<strong>${d.cat}</strong><br/>${s.name}: ${d.value.toLocaleString()}`);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5);
                tooltip.style('visibility', 'hidden');
            });
    });

    addLegend(svg, series.map(s => s.name), width, height);
}

function renderAreaChart(container: HTMLElement, data: ParsedData, config: ChartConfig) {
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const { svg, width, height } = createSvg(container, margin);
    const tooltip = addTooltip(container);

    const { categories, series } = aggregateData(data, config);

    const x = d3.scalePoint()
        .domain(categories)
        .range([0, width]);

    const allValues = series.flatMap(s => s.values);
    const y = d3.scaleLinear()
        .domain([0, Math.max(...allValues) * 1.1])
        .range([height, 0]);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('fill', '#94a3b8');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .style('fill', '#94a3b8');

    // Areas
    const area = d3.area<{ cat: string; value: number }>()
        .x(d => x(d.cat) || 0)
        .y0(height)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

    series.forEach((s, i) => {
        const areaData = categories.map((cat, j) => ({ cat, value: s.values[j] }));

        svg.append('path')
            .datum(areaData)
            .attr('fill', colors[i % colors.length])
            .attr('fill-opacity', 0.3)
            .attr('d', area);

        // Line on top
        const line = d3.line<{ cat: string; value: number }>()
            .x(d => x(d.cat) || 0)
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(areaData)
            .attr('fill', 'none')
            .attr('stroke', colors[i % colors.length])
            .attr('stroke-width', 2)
            .attr('d', line);
    });

    addLegend(svg, series.map(s => s.name), width, height);
}

function renderScatterChart(container: HTMLElement, data: ParsedData, config: ChartConfig) {
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const { svg, width, height } = createSvg(container, margin);
    const tooltip = addTooltip(container);

    const { xAxis, yAxis, series: seriesColumn } = config;

    const xValues = data.rows.map(r => Number(r[xAxis]) || 0);
    const yValues = data.rows.map(r => Number(r[yAxis[0]]) || 0);

    const x = d3.scaleLinear()
        .domain([Math.min(...xValues) * 0.9, Math.max(...xValues) * 1.1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([Math.min(...yValues) * 0.9, Math.max(...yValues) * 1.1])
        .range([height, 0]);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('fill', '#94a3b8');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .style('fill', '#94a3b8')
        .style('text-anchor', 'middle')
        .text(xAxis);

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#94a3b8');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .style('fill', '#94a3b8')
        .style('text-anchor', 'middle')
        .text(yAxis[0]);

    if (seriesColumn) {
        const seriesValues = [...new Set(data.rows.map(row => String(row[seriesColumn])))];

        seriesValues.forEach((seriesVal, i) => {
            const filteredRows = data.rows.filter(row => String(row[seriesColumn]) === seriesVal);

            svg.selectAll(`.dot-${i}`)
                .data(filteredRows)
                .enter()
                .append('circle')
                .attr('class', `dot-${i}`)
                .attr('cx', d => x(Number(d[xAxis]) || 0))
                .attr('cy', d => y(Number(d[yAxis[0]]) || 0))
                .attr('r', 8)
                .attr('fill', colors[i % colors.length])
                .attr('opacity', 0.7)
                .on('mouseover', function (event, d) {
                    d3.select(this).attr('r', 10).attr('opacity', 1);
                    tooltip
                        .style('visibility', 'visible')
                        .html(`<strong>${seriesVal}</strong><br/>${xAxis}: ${d[xAxis]}<br/>${yAxis[0]}: ${d[yAxis[0]]}`);
                })
                .on('mousemove', function (event) {
                    tooltip
                        .style('top', (event.pageY - 10) + 'px')
                        .style('left', (event.pageX + 10) + 'px');
                })
                .on('mouseout', function () {
                    d3.select(this).attr('r', 8).attr('opacity', 0.7);
                    tooltip.style('visibility', 'hidden');
                });
        });

        addLegend(svg, seriesValues, width, height);
    } else {
        svg.selectAll('.dot')
            .data(data.rows)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(Number(d[xAxis]) || 0))
            .attr('cy', d => y(Number(d[yAxis[0]]) || 0))
            .attr('r', 8)
            .attr('fill', colors[0])
            .attr('opacity', 0.7)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 10).attr('opacity', 1);
                tooltip
                    .style('visibility', 'visible')
                    .html(`${xAxis}: ${d[xAxis]}<br/>${yAxis[0]}: ${d[yAxis[0]]}`);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 8).attr('opacity', 0.7);
                tooltip.style('visibility', 'hidden');
            });
    }
}

function renderPieChart(container: HTMLElement, data: ParsedData, config: ChartConfig, isDoughnut: boolean) {
    const margin = { top: 20, right: 30, bottom: 60, left: 30 };
    const { svg, width, height } = createSvg(container, margin);
    const tooltip = addTooltip(container);

    const { xAxis, yAxis, aggregation } = config;

    const categories = [...new Set(data.rows.map(row => String(row[xAxis])))];
    const pieData = categories.map(cat => {
        const matchingRows = data.rows.filter(row => String(row[xAxis]) === cat);
        const values = matchingRows.map(r => Number(r[yAxis[0]]) || 0);
        return {
            label: cat,
            value: aggregate(values, aggregation),
        };
    });

    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = isDoughnut ? radius * 0.5 : 0;

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<{ label: string; value: number }>()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(innerRadius)
        .outerRadius(radius);

    const total = pieData.reduce((sum, d) => sum + d.value, 0);

    g.selectAll('path')
        .data(pie(pieData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (_, i) => colors[i % colors.length])
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            const percent = ((d.data.value / total) * 100).toFixed(1);
            tooltip
                .style('visibility', 'visible')
                .html(`<strong>${d.data.label}</strong><br/>Value: ${d.data.value.toLocaleString()}<br/>${percent}%`);
        })
        .on('mousemove', function (event) {
            tooltip
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
            tooltip.style('visibility', 'hidden');
        });

    // Labels
    g.selectAll('text')
        .data(pie(pieData))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('fill', '#e2e8f0')
        .style('font-size', '12px')
        .text(d => {
            const percent = ((d.data.value / total) * 100).toFixed(0);
            return Number(percent) > 5 ? `${percent}%` : '';
        });
}
