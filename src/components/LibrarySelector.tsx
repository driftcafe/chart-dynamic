import type { Library } from '../types/types';

interface LibrarySelectorProps {
    selected: Library;
    onChange: (library: Library) => void;
}

const libraries: { id: Library; name: string; icon: string }[] = [
    { id: 'echarts', name: 'ECharts', icon: '📊' },
    { id: 'plotly', name: 'Plotly', icon: '📈' },
    { id: 'chartjs', name: 'Chart.js', icon: '📉' },
    { id: 'apexcharts', name: 'ApexCharts', icon: '📋' },
    { id: 'd3', name: 'D3.js', icon: '🎨' },
];

export function LibrarySelector({ selected, onChange }: LibrarySelectorProps) {
    return (
        <div className="library-selector">
            <label className="selector-label">Charting Library</label>
            <div className="library-buttons">
                {libraries.map((lib) => (
                    <button
                        key={lib.id}
                        className={`library-button ${selected === lib.id ? 'active' : ''}`}
                        onClick={() => onChange(lib.id)}
                        title={lib.name}
                    >
                        <span className="library-icon">{lib.icon}</span>
                        <span className="library-name">{lib.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
