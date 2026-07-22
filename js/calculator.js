/**
 * Regras de negócio e motor de cálculo do BombonaCalc Pro.
 */

export const CONTAINER_TYPES = Object.freeze({
    branca: Object.freeze({
        label: 'Bombona Branca',
        shortLabel: 'Branca',
        tara: 6.400
    }),
    marrom: Object.freeze({
        label: 'Bombona Marrom',
        shortLabel: 'Marrom',
        tara: 9.200
    }),
    'caixa-vermelha': Object.freeze({
        label: 'Caixa Vermelha',
        shortLabel: 'Caixa Vermelha',
        tara: 3.000
    }),
    galao: Object.freeze({
        label: 'Galão',
        shortLabel: 'Galão',
        tara: 1.000
    })
});

// Mantido para compatibilidade com integrações que já consumiam esta constante.
export const BOMBONA_TARAS = Object.freeze(
    Object.fromEntries(
        Object.entries(CONTAINER_TYPES).map(([key, config]) => [key, config.tara])
    )
);

export function getContainerConfig(tipoRecipiente) {
    return CONTAINER_TYPES[tipoRecipiente] ?? null;
}

/**
 * Fórmula: ((Peso Bruto - Tara) * 1000 / Gramatura) * 0.95
 */
export function calculateProduction(pesoBruto, gramatura, tipoRecipiente) {
    const containerConfig = getContainerConfig(tipoRecipiente);

    if (!containerConfig) {
        return {
            success: false,
            error: 'Selecione um recipiente válido.',
            result: 0,
            details: null
        };
    }

    if (pesoBruto === 0 || gramatura === 0) {
        return {
            success: false,
            error: 'Aguardando dados...',
            result: 0,
            details: null
        };
    }

    if (!Number.isFinite(pesoBruto) || pesoBruto < 0) {
        return {
            success: false,
            error: 'Peso bruto inválido.',
            result: 0,
            details: null
        };
    }

    if (!Number.isFinite(gramatura) || gramatura <= 0) {
        return {
            success: false,
            error: 'Gramatura inválida. Insira um valor maior que zero.',
            result: 0,
            details: null
        };
    }

    if (pesoBruto < containerConfig.tara) {
        return {
            success: false,
            error: 'Valor adicionado menor que a tara, insira um valor válido.',
            result: 0,
            details: {
                pesoBruto,
                tara: containerConfig.tara,
                tipoRecipiente
            }
        };
    }

    const pesoLiquido = pesoBruto - containerConfig.tara;
    const resultadoBruto = (pesoLiquido * 1000) / gramatura;
    const resultadoFinal = resultadoBruto * 0.95;

    return {
        success: true,
        error: null,
        result: resultadoFinal,
        details: {
            pesoBruto,
            tara: containerConfig.tara,
            pesoLiquido,
            gramatura,
            resultadoFinal,
            tipoRecipiente,
            nomeRecipiente: containerConfig.label
        }
    };
}
