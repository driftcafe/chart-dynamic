// Utility script to add parseNumeric import to all adapters
// Run this to update plotlyAdapter, chartjsAdapter, apexchartsAdapter, and d3Adapter

const adapters = [
    'plotlyAdapter.ts',
    'chartjsAdapter.ts',
    'apexchartsAdapter.ts',
    'd3Adapter.ts'
];

console.log('Add this import to each adapter:');
console.log("import { parseNumeric } from '../utils/csvParser';");
console.log('\nReplace all instances of:');
console.log('Number(value) || 0  →  parseNumeric(value)');
console.log('Number(...)  →  parseNumeric(...)');
