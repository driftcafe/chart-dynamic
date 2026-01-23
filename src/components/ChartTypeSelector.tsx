import {
    BarChart3,
    LineChart,
    PieChart,
    Activity,
    Circle,
    Grid3X3,
    Target,
    TrendingUp,
    Layers,
    BarChart2
} from 'lucide-react';
import type { ChartType, ChartRecommendation } from '../types/types';

interface ChartTypeSelectorProps {
    selected: ChartType;
    recommendations: ChartRecommendation[];
    availableTypes: ChartType[];
    onChange: (type: ChartType) => void;
}

const chartTypeInfo: Record<ChartType, { name: string; icon: React.ReactNode }> = {
    'bar': { name: 'Bar', icon: <BarChart3 size={18} /> },
    'grouped-bar': { name: 'Grouped Bar', icon: <BarChart2 size={18} /> },
    'stacked-bar': { name: 'Stacked Bar', icon: <Layers size={18} /> },
    'line': { name: 'Line', icon: <LineChart size={18} /> },
    'area': { name: 'Area', icon: <TrendingUp size={18} /> },
    'scatter': { name: 'Scatter', icon: <Circle size={18} /> },
    'bubble': { name: 'Bubble', icon: <Activity size={18} /> },
    'pie': { name: 'Pie', icon: <PieChart size={18} /> },
    'doughnut': { name: 'Doughnut', icon: <PieChart size={18} /> },
    'radar': { name: 'Radar', icon: <Target size={18} /> },
    'heatmap': { name: 'Heatmap', icon: <Grid3X3 size={18} /> },
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
                            <div className="chart-type-icon">{info.icon}</div>
                            <span className="chart-type-name">{info.name}</span>
                            {isRecommended && (
                                <span className="recommendation-badge">
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
