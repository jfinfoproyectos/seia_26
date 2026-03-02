import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

/**
 * Export data to Excel file with styling
 */
export async function exportToExcel(data: any[], filename: string, sheetName: string = 'Datos') {
    if (data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    setupWorksheetComp(worksheet, data);

    // Buffer and Download
    const buffer = await workbook.xlsx.writeBuffer();
    triggerDownload(buffer, filename);
}

/**
 * Export multiple sheets to Excel with styling
 */
export async function exportMultiSheetExcel(sheets: { name: string; data: any[] }[], filename: string) {
    const workbook = new ExcelJS.Workbook();

    sheets.forEach(sheetData => {
        if (sheetData.data.length > 0) {
            const worksheet = workbook.addWorksheet(sheetData.name);
            setupWorksheetComp(worksheet, sheetData.data);
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    triggerDownload(buffer, filename);
}

/**
 * Helper to setup worksheet columns and styles
 */
function setupWorksheetComp(worksheet: ExcelJS.Worksheet, data: any[]) {
    if (data.length === 0) return;

    // Get headers
    const headers = Object.keys(data[0]);
    const columns = headers.map(header => ({
        header: header,
        key: header,
        width: Math.max(header.length + 2, 15)
    }));

    worksheet.columns = columns;
    worksheet.addRows(data);

    // Styling
    // 1. Header Row Style
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // 2. Data Rows Style
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.alignment = { vertical: 'middle', horizontal: 'left' };

        row.eachCell((cell, colNumber) => {
            const columnKey = columns[colNumber - 1].key;

            // Borders
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };

            // Grade Coloring
            const val = cell.value?.toString();

            if (val) {
                if (val === '0.0' || val === '0,0') {
                    cell.font = { color: { argb: 'FFEF4444' }, bold: true };
                    cell.alignment = { horizontal: 'center' };
                }
                else if (/^[0-5][.,]\d$/.test(val) || /^[0-5]$/.test(val)) {
                    cell.alignment = { horizontal: 'center' };
                    const numGrade = parseFloat(val.replace(',', '.'));
                    if (numGrade < 3.0) {
                        cell.font = { color: { argb: 'FFEF4444' } };
                    } else if (numGrade >= 4.5) {
                        cell.font = { color: { argb: 'FF15803D' }, bold: true };
                    }
                }
            }

            if (columnKey === 'Nota Final' || columnKey === 'Promedio') {
                cell.font = { bold: true };
                const val = cell.value?.toString();
                if (val) {
                    const numGrade = parseFloat(val.replace(',', '.'));
                    if (numGrade < 3.0) {
                        cell.font = { color: { argb: 'FFEF4444' }, bold: true };
                    }
                }
            }
        });
    });

    // Auto-filter
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length }
    };
}

/**
 * Export data to CSV file
 */
export function exportToCSV(data: any[], filename: string) {
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);

    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(ws);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function triggerDownload(buffer: ExcelJS.Buffer, filename: string) {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
}

/**
 * Format grade for export
 */
export function formatGradeForExport(grade: number | null): string {
    if (grade === null || grade === undefined) return '-';
    return grade.toFixed(1);
}
