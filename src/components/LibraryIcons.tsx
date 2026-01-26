
import React from 'react';

export const LibraryIcons: Record<string, React.ReactNode> = {
    echarts: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12.75 3C12.75 2.58579 12.4142 2.25 12 2.25C11.5858 2.25 11.25 2.58579 11.25 3V9.75H4.5C4.08579 9.75 3.75 10.0858 3.75 10.5C3.75 10.9142 4.08579 11.25 4.5 11.25H12.75V3Z" fill="#5470C6" />
            <path d="M14.25 3C14.25 2.58579 14.5858 2.25 15 2.25C15.4142 2.25 15.75 2.58579 15.75 3V11.25H21C21.4142 11.25 21.75 10.9142 21.75 10.5C21.75 10.0858 21.4142 9.75 21 9.75H14.25V3Z" fill="#91CC75" />
            <path d="M14.25 12.75V21C14.25 21.4142 14.5858 21.75 15 21.75C15.4142 21.75 15.75 21.4142 15.75 21V12.75H14.25Z" fill="#FAC858" />
            <path d="M12.75 21V12.75H4.5C4.08579 12.75 3.75 13.0858 3.75 13.5C3.75 13.9142 4.08579 14.25 4.5 14.25H12.75V21Z" fill="#EE6666" />
        </svg>
    ),
    plotly: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M3 12h3v9H3v-9zm4-5h3v14H7V7zm4 3h3v11h-3V10zm4-5h3v16h-3V5zm4 7h3v9h-3v-9z" fill="#3F4F75" />
        </svg>
    ),
    chartjs: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25ZM12 4.5C13.4312 4.5 14.7891 4.90379 15.9613 5.66014L13.125 10.3125L8.03871 7.23871C9.21094 5.56879 10.5688 4.5 12 4.5ZM12 19.5C9.51478 19.5 7.29379 18.3375 5.92218 16.536L9.67389 12.1589L14.3261 16.146C13.6825 18.0664 12.6375 19.5 12 19.5ZM18.0778 16.536C17.2938 17.6538 16.2738 18.5264 15.086 19.0666L12.5714 14.5714L16.2857 10.2857L19.5 12.4286C19.227 13.986 18.7525 15.3585 18.0778 16.536Z" fill="#FF6384" />
            <circle cx="12" cy="12" r="3" fill="#36A2EB" />
        </svg>
    ),
    apexcharts: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12 2L2 20h20L12 2z" fill="#00E396" />
            <path d="M12 8l-5 9h10l-5-9z" fill="#fff" />
            <path d="M12 12l-2.5 4.5h5L12 12z" fill="#008FFB" />
        </svg>
    ),
    d3: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#F9A03C" />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">D3</text>
        </svg>
    )
};
