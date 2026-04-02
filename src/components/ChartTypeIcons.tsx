
import React from 'react';

export const ChartTypeIcons: Record<string, React.ReactNode> = {
    'bar': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    ),
    'grouped-bar': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M4 20h16" />
            <path d="M6 20v-8" />
            <path d="M10 20v-5" />
            <path d="M14 20v-10" />
            <path d="M18 20v-6" />
        </svg>
    ),
    'stacked-bar': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M12 20v-6" />
            <path d="M12 14v-4" />
            <path d="M12 10v-6" />
            <path d="M4 20h16" />
        </svg>
    ),
    'line': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    ),
    'area': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M3 20h18l-5-16-3 8-4-6-6 14z" fill="currentColor" fillOpacity="0.2" />
            <polyline points="3 20 9 6 13 12 16 4 21 20" />
        </svg>
    ),
    'scatter': (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="5" cy="19" r="2" />
            <circle cx="10" cy="8" r="2" />
            <circle cx="15" cy="15" r="2" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="9" cy="12" r="1.5" />
        </svg>
    ),
    'bubble': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <circle cx="6" cy="16" r="3" />
            <circle cx="16" cy="10" r="5" />
            <circle cx="10" cy="6" r="2" />
        </svg>
    ),
    'pie': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
        </svg>
    ),
    'doughnut': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
        </svg>
    ),
    'radar': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M12 2v20"></path>
            <path d="M2 12h20"></path>
        </svg>
    ),
    'heatmap': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
    ),
};
