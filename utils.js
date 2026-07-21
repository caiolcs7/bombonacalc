/**
 * Módulo de Utilitários e Formatadores do BombonaCalc Pro
 */

/**
 * Converte uma string formatada em padrão brasileiro (ex: "1.250,50" ou "6,400") para um número flutuante válido.
 * @param {string} stringValue - O valor vindo do input.
 * @returns {number} O número convertido ou 0 se for inválido.
 */
export function parseBrToFloat(stringValue) {
    if (!stringValue) return 0;
    // Remove todos os pontos de milhar e substitui a vírgula decimal por ponto
    const sanitized = stringValue
        .replace(/\./g, '')
        .replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata um número para o padrão de peso brasileiro (3 casas decimais).
 * @param {number} value - O número a ser formatado.
 * @returns {string} String formatada (ex: 6,400).
 */
export function formatPeso(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(value);
}

/**
 * Formata um número inteiro ou decimal para a exibição principal do resultado.
 * Se for inteiro, não exibe casas decimais desnecessárias.
 * @param {number} value - O resultado do cálculo.
 * @returns {string} String formatada para o display.
 */
export function formatResultado(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Retorna a data e hora atual formatada no padrão brasileiro curto (DD/MM - HH:MM).
 * Ideal para exibição otimizada em telas industriais compactas.
 * @returns {Object} Objeto contendo data e hora separadas.
 */
export function getFormattedDateTime() {
    const agora = new Date();
    
    const data = agora.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    });
    
    const hora = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return { data, hora };
}

/**
 * Valida a digitação em tempo real permitindo apenas números, uma única vírgula e bloqueando caracteres especiais.
 * @param {string} value - Valor atual do input.
 * @returns {string} Valor limpo e tratado.
 */
export function sanitizeInput(value) {
    // Permite apenas números e vírgula
    let clean = value.replace(/[^0-9,]/g, '');
    
    // Garante que exista apenas uma vírgula
    const parts = clean.split(',');
    if (parts.length > 2) {
        clean = parts[0] + ',' + parts.slice(1).join('');
    }
    
    return clean;
}