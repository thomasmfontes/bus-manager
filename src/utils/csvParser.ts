export interface CsvRow {
    nome: string;
    documento: string;
    telefone: string;
    congregacao?: string;
    idade?: string;
    estadoCivil?: string;
    instrumento?: string;
    auxiliar?: string;
    statusPagamento?: string;
}

export interface ParsedCsvRow {
    data: CsvRow;
    isValid: boolean;
    errors: string[];
    lineNumber: number;
}

export interface CsvParseResult {
    rows: ParsedCsvRow[];
    validCount: number;
    invalidCount: number;
}

/**
 * Parse CSV content and validate each row
 */
export function parsePassengerCsv(csvContent: string): CsvParseResult {
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
        return { rows: [], validCount: 0, invalidCount: 0 };
    }

    // Parse header row to get column names
    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase());

    // Find column indices by matching header names (flexible matching for Portuguese and English)
    const nomeIndex = headers.findIndex(h =>
        h.includes('nome') && (h.includes('completo') || h === 'nome') || h.includes('full_name')
    );
    const documentoIndex = headers.findIndex(h =>
        h.includes('cpf') || h.includes('rg') || h.includes('documento')
    );
    const telefoneIndex = headers.findIndex(h =>
        h.includes('telefone') || h.includes('celular') || h.includes('phone')
    );
    const congregacaoIndex = headers.findIndex(h =>
        h.includes('congregação') || h.includes('congregacao') || h.includes('congregation')
    );
    const idadeIndex = headers.findIndex(h =>
        h.includes('idade') || h.includes('age')
    );
    const estadoCivilIndex = headers.findIndex(h =>
        h.includes('estado') && h.includes('civil') || h.includes('marital')
    );
    const instrumentoIndex = headers.findIndex(h =>
        h.includes('instrumento') || h.includes('instrument')
    );
    const auxiliarIndex = headers.findIndex(h =>
        h.includes('auxiliar')
    );
    const statusPagamentoIndex = headers.findIndex(h =>
        h.includes('pagamento') || h.includes('payment')
    );

    // Skip header row (first line)
    const dataLines = lines.slice(1);
    const rows: ParsedCsvRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    dataLines.forEach((line, index) => {
        const lineNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed
        const columns = parseCsvLine(line);

        // Extract data using the found indices
        const nome = nomeIndex >= 0 ? (columns[nomeIndex]?.trim() || '') : '';
        const documento = documentoIndex >= 0 ? (columns[documentoIndex]?.trim() || '') : '';
        const telefone = telefoneIndex >= 0 ? (columns[telefoneIndex]?.trim() || '') : '';
        const congregacao = congregacaoIndex >= 0 ? (columns[congregacaoIndex]?.trim() || undefined) : undefined;
        const idade = idadeIndex >= 0 ? (columns[idadeIndex]?.trim() || undefined) : undefined;
        const estadoCivil = estadoCivilIndex >= 0 ? (columns[estadoCivilIndex]?.trim() || undefined) : undefined;
        const instrumento = instrumentoIndex >= 0 ? (columns[instrumentoIndex]?.trim() || undefined) : undefined;
        const auxiliar = auxiliarIndex >= 0 ? (columns[auxiliarIndex]?.trim() || undefined) : undefined;
        const statusPagamento = statusPagamentoIndex >= 0 ? (columns[statusPagamentoIndex]?.trim() || undefined) : undefined;

        const errors: string[] = [];

        // Validate required fields
        if (!nome) {
            errors.push('Nome é obrigatório');
        }
        if (!documento) {
            errors.push('Documento é obrigatório');
        }

        const isValid = errors.length === 0;

        if (isValid) {
            validCount++;
        } else {
            invalidCount++;
        }

        rows.push({
            data: {
                nome,
                documento,
                telefone,
                congregacao,
                idade,
                estadoCivil,
                instrumento,
                auxiliar,
                statusPagamento
            },
            isValid,
            errors,
            lineNumber,
        });
    });

    return { rows, validCount, invalidCount };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Push the last field
    result.push(current);

    return result;
}
