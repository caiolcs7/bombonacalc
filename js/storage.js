/**
 * Persistência local segura do BombonaCalc Pro.
 */

const CACHE_KEYS = Object.freeze({
    HISTORY: 'bombonacalc_history',
    SETTINGS: 'bombonacalc_settings'
});

const DEFAULT_SETTINGS = Object.freeze({
    theme: 'dark',
    defaultBombona: 'branca'
});

function safeParse(value, fallback) {
    if (!value) return fallback;

    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('[BombonaCalc] Dados locais inválidos foram ignorados.', error);
        return fallback;
    }
}

export function getSettings() {
    const saved = safeParse(localStorage.getItem(CACHE_KEYS.SETTINGS), {});
    return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(newSettings) {
    const updated = { ...getSettings(), ...newSettings };
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
}

export function getHistory() {
    const history = safeParse(localStorage.getItem(CACHE_KEYS.HISTORY), []);
    return Array.isArray(history) ? history : [];
}

export function saveToHistory(calculationItem) {
    const history = getHistory();

    history.unshift({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        ...calculationItem
    });

    const limitedHistory = history.slice(0, 30);
    localStorage.setItem(CACHE_KEYS.HISTORY, JSON.stringify(limitedHistory));
    return limitedHistory;
}

export function clearHistory() {
    localStorage.removeItem(CACHE_KEYS.HISTORY);
}
