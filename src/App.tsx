import { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { LibrarySelector } from './components/LibrarySelector';
import { ChartTypeSelector } from './components/ChartTypeSelector';
import { MetricControls } from './components/MetricControls';
import { ChartContainer } from './components/ChartContainer';
import { DataPreview, ColumnList } from './components/DataPreview';
import { ThemeToggle } from './components/ThemeToggle';
import { getChartRecommendations, getDefaultChartConfig, getLibraryChartTypes } from './utils/chartRecommender';
import type { ParsedData, ChartConfig, Library, ChartRecommendation, ChartType } from './types/types';
import { BarChart3, Settings, Sparkles } from 'lucide-react';

function App() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [library, setLibrary] = useState<Library>('echarts');
  const [config, setConfig] = useState<ChartConfig | null>(null);
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  const handleDataLoaded = useCallback((loadedData: ParsedData) => {
    setData(loadedData);

    // Get recommendations and default config
    const recs = getChartRecommendations(loadedData);
    setRecommendations(recs);

    const defaultConfig = getDefaultChartConfig(loadedData);
    setConfig(defaultConfig);

    // Hide preview after short delay
    setTimeout(() => setShowPreview(false), 500);
  }, []);

  const handleLibraryChange = useCallback((newLibrary: Library) => {
    setLibrary(newLibrary);

    // Check if current chart type is supported
    if (config) {
      const supportedTypes = getLibraryChartTypes(newLibrary);
      if (!supportedTypes.includes(config.type)) {
        // Find the closest supported type from recommendations
        const newType = recommendations.find(r => supportedTypes.includes(r.type))?.type
          || supportedTypes[0];
        setConfig({ ...config, type: newType });
      }
    }
  }, [config, recommendations]);

  const handleChartTypeChange = useCallback((type: ChartType) => {
    if (config) {
      setConfig({ ...config, type });
    }
  }, [config]);

  const handleConfigChange = useCallback((newConfig: ChartConfig) => {
    setConfig(newConfig);
  }, []);

  const availableChartTypes = getLibraryChartTypes(library);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <BarChart3 size={28} />
            <h1>ChartForge</h1>
          </div>
          <span className="tagline">Multi-Library CSV Visualization</span>
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          {data && (
            <button
              className="preview-toggle"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Settings size={16} />
              {showPreview ? 'Hide Raw Data' : 'Show Raw Data'}
            </button>
          )}
        </div>
      </header>

      <div className="app-content">
        {/* File Upload (shown when no data) */}
        {!data && (
          <div className="upload-section">
            <div className="upload-card">
              <div className="upload-header">

                <h2>Visualize Your Data</h2>

              </div>
              <FileUpload onDataLoaded={handleDataLoaded} />

              <div className="features-preview">
                <div className="feature">
                  <span>5 Chart Libraries</span>
                </div>
                <div className="feature">
                  <span>Auto-Recommend</span>
                </div>
                <div className="feature">
                  <span>Multi-Select Metrics</span>
                </div>
                <div className="feature">
                  <span>Interactive Charts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard (shown when data is loaded) */}
        {data && config && (
          <div className="dashboard">
            {/* Column List Sidebar */}
            {showPreview && (
              <aside className="column-list-sidebar">
                <ColumnList data={data} />
              </aside>
            )}

            {/* Main Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-section">
                <FileUpload onDataLoaded={handleDataLoaded} />
              </div>



              <div className="sidebar-section">
                <LibrarySelector
                  selected={library}
                  onChange={handleLibraryChange}
                />
              </div>

              <div className="sidebar-section">
                <ChartTypeSelector
                  selected={config.type}
                  recommendations={recommendations}
                  availableTypes={availableChartTypes}
                  onChange={handleChartTypeChange}
                />
              </div>



              <div className="sidebar-section">
                <MetricControls
                  data={data}
                  config={config}
                  onConfigChange={handleConfigChange}
                />
              </div>
            </aside>

            {/* Chart Area */}
            <main className="chart-area">
              <div className="chart-header">
                <h2>{data.fileName}</h2>
                <div className="chart-badges">
                  <span className="badge library">{library}</span>
                  <span className="badge type">{config.type}</span>
                  <span className="badge metrics">{config.yAxis.length} metric{config.yAxis.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              {showPreview && (
                <div className="raw-data-panel">
                  <DataPreview data={data} />
                </div>
              )}

              <div className="chart-wrapper">
                <ChartContainer
                  data={data}
                  config={config}
                  library={library}
                />
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
