/**
 * Utilitários e formatadores do BombonaCalc Pro.
 */

export function parseBrToFloat(stringValue) {
    if (!stringValue) return 0;

    const sanitized = String(stringValue)
        .replace(/\./g, '')
        .replace(',', '.');

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPeso(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(value);
}

export function formatResultado(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
}

export function getFormattedDateTime() {
    const agora = new Date();

    return {
        data: agora.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }),
        hora: agora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    };
}

export function sanitizeInput(value) {
    let clean = String(value).replace(/[^0-9,]/g, '');
    const parts = clean.split(',');

    if (parts.length > 2) {
        clean = `${parts[0]},${parts.slice(1).join('')}`;
    }

    return clean;
}
