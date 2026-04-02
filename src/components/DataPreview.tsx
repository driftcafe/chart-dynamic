import { FileSpreadsheet, Database, Hash, Calendar, ToggleLeft } from 'lucide-react';
import type { ParsedData } from '../types/types';

interface DataPreviewProps {
    data: ParsedData;
}

const typeIcons = {
    numeric: <Hash size={14} />,
    categorical: <FileSpreadsheet size={14} />,
    date: <Calendar size={14} />,
    boolean: <ToggleLeft size={14} />,
};

export function ColumnList({ data }: DataPreviewProps) {
    return (
        <div className="column-tags">
            <span className="tags-label">Detected Columns</span>
            {data.columns.map(col => (
                <div key={col.name} className={`column-tag ${col.type}`}>
                    {typeIcons[col.type]}
                    <span className="tag-name">{col.name}</span>
                    <span className="tag-type">{col.type}</span>
                </div>
            ))}
        </div>
    );
}

export function DataPreview({ data }: DataPreviewProps) {
    const previewRows = data.rows.slice(0, 5);

    return (
        <div className="data-preview-table-view">
            <div className="preview-header">
                <Database size={16} />
                <span className="preview-stats">
                    {data.rowCount.toLocaleString()} rows • {data.columns.length} columns
                </span>
            </div>
            <div className="preview-table-container">
                <table className="preview-table">
                    <thead>
                        <tr>
                            {data.columns.map(col => (
                                <th key={col.name}>
                                    <div className="th-content">
                                        {typeIcons[col.type]}
                                        <span>{col.name}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {previewRows.map((row, i) => (
                            <tr key={i}>
                                {data.columns.map(col => (
                                    <td key={col.name}>
                                        {row[col.name] !== null && row[col.name] !== undefined
                                            ? String(row[col.name])
                                            : <span className="null-value">null</span>
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.rowCount > 5 && (
                    <div className="preview-more">
                        ... and {(data.rowCount - 5).toLocaleString()} more rows
                    </div>
                )}
            </div>
        </div>
    );
}
