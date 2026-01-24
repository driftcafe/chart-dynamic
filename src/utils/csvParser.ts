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

/**
 * Transpose a 2D array (matrix)
 */
function transposeMatrix(matrix: unknown[][]): unknown[][] {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

/**
 * Check if data appears to be transposed (headers in first column)
 */
function shouldTranspose(data: unknown[][]): boolean {
    if (data.length < 2) return false;
    const firstRow = data[0];
    const totalCols = firstRow.length;
    if (totalCols < 3) return false; // Too small to judge

    // Count duplicates in first row (potential horizontal headers failure)
    const firstRowStr = firstRow.map(String);
    const uniqueFirstRow = new Set(firstRowStr);
    const duplicateRatio = 1 - (uniqueFirstRow.size / totalCols);

    // Count distinct values in first column (potential vertical headers)
    const firstCol = data.map(r => String(r[0]));
    const uniqueFirstCol = new Set(firstCol);
    const colUniqueness = uniqueFirstCol.size / data.length;

    // If row has significant duplicates (>30%) AND column is highly unique (>80%)
    // This strongly suggests headers are vertical
    return duplicateRatio > 0.3 && colUniqueness > 0.8;
}

/**
 * Process raw row data into ParsedData structure
 */
function processRawData(rawData: unknown[][], fileName: string): ParsedData {
    // Check for transposition
    let dataToUse = rawData;
    if (shouldTranspose(rawData)) {
        console.log('Detected transposed CSV data. Transposing...');
        dataToUse = transposeMatrix(rawData);
    }

    if (dataToUse.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Extract headers and rows
    const headers = dataToUse[0].map(String);
    const dataRows = dataToUse.slice(1);

    if (headers.length === 0) {
        throw new Error('No valid headers found');
    }

    // Convert to array of objects
    const rows = dataRows.map(row => {
        const obj: Record<string, unknown> = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        return obj;
    });

    // Analyze columns
    const columns: ColumnMeta[] = headers.map((header, i) => {
        const values = dataRows.map(row => row[i]);
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

/**
 * Parse a CSV file and extract metadata
 */
export function parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: false, // Read as arrays to detect structure
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

                try {
                    const parsedData = processRawData(results.data as unknown[][], file.name);
                    resolve(parsedData);
                } catch (err) {
                    reject(err);
                }
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
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true,
    });

    return processRawData(results.data as unknown[][], fileName);
}
