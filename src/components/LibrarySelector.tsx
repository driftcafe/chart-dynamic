import type { Library } from '../types/types';
import { LibraryIcons } from './LibraryIcons';

interface LibrarySelectorProps {
    selected: Library;
    onChange: (library: Library) => void;
}

const libraries: { id: Library; name: string }[] = [
    { id: 'echarts', name: 'ECharts' },
    { id: 'plotly', name: 'Plotly' },
    { id: 'chartjs', name: 'Chart.js' },
    { id: 'apexcharts', name: 'ApexCharts' },
    { id: 'd3', name: 'D3.js' },
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
                        <span className="library-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {LibraryIcons[lib.id]}
                        </span>
                        <span className="library-name">{lib.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
