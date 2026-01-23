import Papa from 'papaparse';
import type { ParsedData, ColumnMeta, ColumnType } from '../types/types';

/**
 * Robust numeric parser that handles formatted numbers
 * Strips common formatting characters like $, %, and commas
 */
export function parseNumeric(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined || value === '') return 0;

    // Strip common formatting: $, %, commas
    const cleaned = String(value).replace(/[$,%]/g, '').replace(/,/g, '').trim();
    const num = Number(cleaned);

    return isNaN(num) || !isFinite(num) ? 0 : num;
}

/**
 * Check if a value can be parsed as numeric
 */
function isNumericValue(value: unknown): boolean {
    if (typeof value === 'number') return true;
    if (value === null || value === undefined || value === '') return false;

    // Try to parse with formatting stripped
    const cleaned = String(value).replace(/[$,%]/g, '').replace(/,/g, '').trim();
    const num = Number(cleaned);

    return !isNaN(num) && isFinite(num);
}


/**
 * Detect the type of a column based on sample values
 */
function detectColumnType(values: unknown[]): ColumnType {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

    if (nonNullValues.length === 0) return 'categorical';

    // Check if all values are boolean
    const booleanValues = ['true', 'false', 'yes', 'no', '1', '0'];
    const allBoolean = nonNullValues.every(v =>
        booleanValues.includes(String(v).toLowerCase())
    );
    if (allBoolean) return 'boolean';

    // Check if all values are numeric (using robust parser)
    const allNumeric = nonNullValues.every(v => isNumericValue(v));
    if (allNumeric) return 'numeric';

    // Check if values look like dates
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/,         // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
        /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
        /^\w{3}\s+\d{1,2},?\s+\d{4}$/i,  // Mon DD, YYYY
    ];

    const looksLikeDate = nonNullValues.slice(0, 10).every(v => {
        const str = String(v);
        return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
    });
    if (looksLikeDate) return 'date';

    return 'categorical';
}

/**
 * Determine if a column should be treated as a metric (for Y-axis)
 */
function isMetricColumn(type: ColumnType, uniqueValues: number, totalRows: number): boolean {
    if (type === 'numeric') {
        // If numeric column has high cardinality relative to row count, it's likely a metric
        const cardinalityRatio = uniqueValues / totalRows;
        return cardinalityRatio > 0.1 || uniqueValues > 10;
    }
    return false;
}

/**
 * Parse a CSV file and extract metadata
 */
export function parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    const criticalErrors = results.errors.filter(e => e.type === 'Quotes' || e.type === 'Delimiter');
                    if (criticalErrors.length > 0) {
                        reject(new Error(`Parse error: ${criticalErrors[0].message}`));
                        return;
                    }
                }

                const rows = results.data as Record<string, unknown>[];
                const headers = results.meta.fields || [];

                if (rows.length === 0 || headers.length === 0) {
                    reject(new Error('CSV file is empty or has no valid headers'));
                    return;
                }

                // Analyze each column
                const columns: ColumnMeta[] = headers.map(header => {
                    const values = rows.map(row => row[header]);
                    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
                    const uniqueValues = new Set(nonNullValues).size;
                    const type = detectColumnType(values);

                    return {
                        name: header,
                        type,
                        isMetric: isMetricColumn(type, uniqueValues, rows.length),
                        uniqueValues,
                        sampleValues: nonNullValues.slice(0, 5) as (string | number | boolean | Date)[],
                        nullCount: values.length - nonNullValues.length,
                    };
                });

                resolve({
                    columns,
                    rows,
                    fileName: file.name,
                    rowCount: rows.length,
                });
            },
            error: (error) => {
                reject(new Error(`Failed to parse CSV: ${error.message}`));
            },
        });
    });
}

/**
 * Parse CSV from string (for testing or direct input)
 */
export function parseCSVString(csvString: string, fileName = 'data.csv'): ParsedData {
    const results = Papa.parse(csvString, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });

    const rows = results.data as Record<string, unknown>[];
    const headers = results.meta.fields || [];

    const columns: ColumnMeta[] = headers.map(header => {
        const values = rows.map(row => row[header]);
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const uniqueValues = new Set(nonNullValues).size;
        const type = detectColumnType(values);

        return {
            name: header,
            type,
            isMetric: isMetricColumn(type, uniqueValues, rows.length),
            uniqueValues,
            sampleValues: nonNullValues.slice(0, 5) as (string | number | boolean | Date)[],
            nullCount: values.length - nonNullValues.length,
        };
    });

    return {
        columns,
        rows,
        fileName,
        rowCount: rows.length,
    };
}
