import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import type { ParsedData } from '../types/types';

interface FileUploadProps {
    onDataLoaded: (data: ParsedData) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadedFile, setLoadedFile] = useState<string | null>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await parseCSV(file);
            setLoadedFile(file.name);
            onDataLoaded(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
        } finally {
            setIsLoading(false);
        }
    }, [onDataLoaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    return (
        <div className="file-upload-container">
            <div
                className={`file-upload-zone ${isDragging ? 'dragging' : ''} ${loadedFile ? 'loaded' : ''} ${error ? 'error' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />

                {isLoading ? (
                    <div className="upload-content">
                        <div className="loading-spinner" />
                        <p>Processing file...</p>
                    </div>
                ) : loadedFile ? (
                    <div className="upload-content loaded">
                        <div className="success-icon">
                            <Check size={24} />
                        </div>
                        <FileSpreadsheet size={32} className="file-icon" />
                        <p className="file-name">{loadedFile}</p>
                        <span className="hint">Click or drop to replace</span>
                    </div>
                ) : (
                    <div className="upload-content">
                        <Upload size={40} className={`upload-icon ${isDragging ? 'bouncing' : ''}`} />
                        <h3>Drop your CSV file here</h3>
                        <p>or click to browse</p>
                        <span className="hint">Supports .csv files with headers</span>
                    </div>
                )}

                {error && (
                    <div className="upload-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
