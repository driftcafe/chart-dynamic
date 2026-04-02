import { ChartTypeIcons } from './ChartTypeIcons';
import type { ChartType, ChartRecommendation } from '../types/types';

interface ChartTypeSelectorProps {
    selected: ChartType;
    recommendations: ChartRecommendation[];
    availableTypes: ChartType[];
    onChange: (type: ChartType) => void;
}

const chartTypeInfo: Record<ChartType, { name: string; }> = {
    'bar': { name: 'Bar' },
    'grouped-bar': { name: 'Grouped Bar' },
    'stacked-bar': { name: 'Stacked Bar' },
    'line': { name: 'Line' },
    'area': { name: 'Area' },
    'scatter': { name: 'Scatter' },
    'bubble': { name: 'Bubble' },
    'pie': { name: 'Pie' },
    'doughnut': { name: 'Doughnut' },
    'radar': { name: 'Radar' },
    'heatmap': { name: 'Heatmap' },
};

export function ChartTypeSelector({
    selected,
    recommendations,
    availableTypes,
    onChange
}: ChartTypeSelectorProps) {
    const recommendedTypes = recommendations.slice(0, 3).map(r => r.type);

    return (
        <div className="chart-type-selector">
            <label className="selector-label">Chart Type</label>
            <div className="chart-type-grid">
                {availableTypes.map((type) => {
                    const info = chartTypeInfo[type];
                    const isRecommended = recommendedTypes.includes(type);
                    const recommendationIndex = recommendedTypes.indexOf(type);

                    return (
                        <button
                            key={type}
                            className={`chart-type-button ${selected === type ? 'active' : ''} ${isRecommended ? 'recommended' : ''}`}
                            onClick={() => onChange(type)}
                            title={info.name}
                        >
                            <div className="chart-type-icon">{ChartTypeIcons[type]}</div>
                            <span className="chart-type-name">{info.name}</span>
                            {isRecommended && (
                                <span
                                    className="recommendation-badge"
                                    title={recommendationIndex === 0 ? "Best match" : "Good match"}
                                >
                                    {recommendationIndex === 0 ? '★' : '•'}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {recommendations.length > 0 && (
                <div className="recommendation-hint">
                    <span className="recommendation-star">★</span>
                    <span>{recommendations[0].reason}</span>
                </div>
            )}
        </div>
    );
}
