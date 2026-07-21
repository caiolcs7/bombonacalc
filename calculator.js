/**
 * Módulo de Regras de Negócio e Motor de Cálculo do BombonaCalc Pro
 */

// Constantes operacionais de fábrica imutáveis
export const BOMBONA_TARAS = {
    branca: 6.400, // 6,400 kg
    marrom: 9.200  // 9,200 kg
};

/**
 * Executa o cálculo industrial com base nos parâmetros inseridos e validações severas.
 * Fórmula aplicada: ((Peso Bruto - Tara) * 1000 / Gramatura) * 0.95
 * * @param {number} pesoBruto - Peso lido na balança (em kg).
 * @param {number} gramatura - Peso da embalagem vazia/fator (em g).
 * @param {string} tipoBombona - Tipo da bombona ('branca' ou 'marrom').
 * @returns {Object} Objeto com o status do cálculo e dados decompostos.
 */
export function calculateProduction(pesoBruto, gramatura, tipoBombona) {
    const tara = BOMBONA_TARAS[tipoBombona] || 0;
    
    // 1. Validação de preenchimento inicial básico
    if (pesoBruto === 0 || gramatura === 0) {
        return { success: false, error: 'Aguardando dados...', result: 0, details: null };
    }

    // 2. Validação de inconsistência física (Peso Bruto menor que a Tara)
    if (pesoBruto < tara) {
        return { 
            success: false, 
            error: 'Peso bruto menor que a tara da bombona.', 
            result: 0,
            details: null 
        };
    }

    // 3. Segurança Matemática contra divisão por zero ou números negativos
    if (gramatura <= 0) {
        return { 
            success: false, 
            error: 'Gramatura inválida (deve ser maior que zero).', 
            result: 0,
            details: null 
        };
    }

    // 4. Execução dos passos lógicos do peso líquido
    const pesoLiquido = pesoBruto - tara;

    // 5. Aplicação da fórmula industrial estrita
    // ((Peso Líquido * 1000) / Gramatura) * 0.95
    const resultadoBruto = (pesoLiquido * 1000) / gramatura;
    const resultadoFinal = resultadoBruto * 0.95;

    // Retorna a payload estruturada com alta precisão matemática
    return {
        success: true,
        error: null,
        result: resultadoFinal,
        details: {
            pesoBruto,
            tara,
            pesoLiquido,
            gramatura,
            resultadoFinal
        }
    };
}