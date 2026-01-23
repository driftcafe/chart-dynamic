import { Check, X } from 'lucide-react';
import type { ParsedData, ChartConfig, Aggregation } from '../types/types';

interface MetricControlsProps {
    data: ParsedData;
    config: ChartConfig;
    onConfigChange: (config: ChartConfig) => void;
}

export function MetricControls({ data, config, onConfigChange }: MetricControlsProps) {
    const categoricalColumns = data.columns.filter(c => c.type === 'categorical' || c.type === 'date');
    const numericColumns = data.columns.filter(c => c.type === 'numeric');

    const handleXAxisChange = (value: string) => {
        onConfigChange({ ...config, xAxis: value });
    };

    const handleYAxisToggle = (column: string) => {
        const currentY = config.yAxis;
        let newY: string[];

        if (currentY.includes(column)) {
            newY = currentY.filter(c => c !== column);
            // Ensure at least one Y axis is selected
            if (newY.length === 0 && numericColumns.length > 0) {
                newY = [numericColumns[0].name];
            }
        } else {
            newY = [...currentY, column];
        }

        onConfigChange({ ...config, yAxis: newY });
    };

    const handleSeriesChange = (value: string) => {
        onConfigChange({ ...config, series: value || undefined });
    };

    const handleAggregationChange = (value: Aggregation) => {
        onConfigChange({ ...config, aggregation: value });
    };

    const handleSizeChange = (value: string) => {
        onConfigChange({ ...config, size: value || undefined });
    };

    const showSizeSelector = config.type === 'bubble';
    const showSeriesSelector = !['pie', 'doughnut', 'radar'].includes(config.type);

    return (
        <div className="metric-controls">
            {/* X-Axis Selector */}
            <div className="control-group">
                <label className="control-label">X-Axis (Categories)</label>
                <select
                    className="control-select"
                    value={config.xAxis}
                    onChange={(e) => handleXAxisChange(e.target.value)}
                >
                    {data.columns.map(col => (
                        <option key={col.name} value={col.name}>
                            {col.name} ({col.type})
                        </option>
                    ))}
                </select>
            </div>

            {/* Y-Axis Multi-Select */}
            <div className="control-group">
                <label className="control-label">Y-Axis Metrics (Multi-select)</label>
                <div className="metric-chips">
                    {numericColumns.map(col => {
                        const isSelected = config.yAxis.includes(col.name);
                        return (
                            <button
                                key={col.name}
                                className={`metric-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleYAxisToggle(col.name)}
                            >
                                {isSelected ? <Check size={14} /> : null}
                                <span>{col.name}</span>
                                {isSelected && config.yAxis.length > 1 && (
                                    <X size={14} className="chip-remove" />
                                )}
                            </button>
                        );
                    })}
                </div>
                <span className="control-hint">
                    Click to toggle metrics. Selected: {config.yAxis.length}
                </span>
            </div>

            {/* Series/Grouping Selector */}
            {showSeriesSelector && (
                <div className="control-group">
                    <label className="control-label">Group By (Optional)</label>
                    <select
                        className="control-select"
                        value={config.series || ''}
                        onChange={(e) => handleSeriesChange(e.target.value)}
                    >
                        <option value="">None</option>
                        {categoricalColumns
                            .filter(col => col.name !== config.xAxis)
                            .map(col => (
                                <option key={col.name} value={col.name}>
                                    {col.name} ({col.uniqueValues} values)
                                </option>
                            ))}
                    </select>
                </div>
            )}

            {/* Size Selector for Bubble Charts */}
            {showSizeSelector && (
                <div className="control-group">
                    <label className="control-label">Bubble Size</label>
                    <select
                        className="control-select"
                        value={config.size || ''}
                        onChange={(e) => handleSizeChange(e.target.value)}
                    >
                        <option value="">Auto (use Y-axis)</option>
                        {numericColumns
                            .filter(col => !config.yAxis.includes(col.name))
                            .map(col => (
                                <option key={col.name} value={col.name}>
                                    {col.name}
                                </option>
                            ))}
                    </select>
                </div>
            )}

            {/* Aggregation Method */}
            <div className="control-group">
                <label className="control-label">Aggregation</label>
                <div className="aggregation-buttons">
                    {(['sum', 'avg', 'count', 'min', 'max'] as Aggregation[]).map(agg => (
                        <button
                            key={agg}
                            className={`agg-button ${config.aggregation === agg ? 'active' : ''}`}
                            onClick={() => handleAggregationChange(agg)}
                        >
                            {agg.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
