/**
 * Módulo de Gerenciamento de Armazenamento Local (LocalStorage)
 */

const CACHE_KEYS = {
    HISTORY: 'bombonacalc_history',
    SETTINGS: 'bombonacalc_settings'
};

const DEFAULT_SETTINGS = {
    theme: 'dark',
    defaultBombona: 'branca'
};

/**
 * Obtém as configurações salvas ou retorna as configurações padrão.
 * @returns {Object} Configurações do app.
 */
export function getSettings() {
    const settings = localStorage.getItem(CACHE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
}

/**
 * Salva ou atualiza as configurações do aplicativo.
 * @param {Object} newSettings - Novas diretrizes de configuração.
 */
export function saveSettings(newSettings) {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(updated));
}

/**
 * Obtém a lista histórica de cálculos guardados.
 * @returns {Array} Lista de itens gravados.
 */
export function getHistory() {
    const history = localStorage.getItem(CACHE_KEYS.HISTORY);
    return history ? JSON.parse(history) : [];
}

/**
 * Adiciona um novo cálculo ao topo do histórico local (limite de 30 registros para performance).
 * @param {Object} calculationItem - Dados completos do cálculo.
 * @returns {Array} O histórico atualizado.
 */
export function saveToHistory(calculationItem) {
    const history = getHistory();
    
    // Adiciona o novo item no começo da lista
    history.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        ...calculationItem
    });
    
    // Limita o tamanho do histórico para não degradar performance do DOM
    const limitedHistory = history.slice(0, 30);
    
    localStorage.setItem(CACHE_KEYS.HISTORY, JSON.stringify(limitedHistory));
    return limitedHistory;
}

/**
 * Apaga completamente o histórico de cálculos do LocalStorage.
 */
export function clearHistory() {
    localStorage.removeItem(CACHE_KEYS.HISTORY);
}