/**
 * Orquestrador principal do BombonaCalc Pro.
 */
import {
    elements,
    updateCalculationDisplay,
    updateSaveButton,
    renderHistoryList,
    updateActiveBombonaCard,
    populateDefaultContainerOptions,
    switchView,
    applyTheme,
    showToast
} from './ui.js';
import { calculateProduction, CONTAINER_TYPES } from './calculator.js';
import { parseBrToFloat, sanitizeInput, getFormattedDateTime } from './utils.js';
import { getSettings, saveSettings, getHistory, saveToHistory, clearHistory } from './storage.js';

const appState = {
    currentBombona: 'branca',
    lastCalculation: null,
    currentFingerprint: null,
    savedFingerprint: null
};

function init() {
    const settings = getSettings();
    const validDefault = CONTAINER_TYPES[settings.defaultBombona]
        ? settings.defaultBombona
        : 'branca';
    const validTheme = ['dark', 'light', 'system'].includes(settings.theme)
        ? settings.theme
        : 'dark';

    appState.currentBombona = validDefault;

    populateDefaultContainerOptions();
    elements.selectTheme.value = validTheme;
    elements.selectDefaultBombona.value = validDefault;

    applyTheme(validTheme);
    updateActiveBombonaCard(validDefault);
    updateSaveButton({ canSave: false });
    renderHistory();
    setupEventListeners();
    registerServiceWorker();
}

function setupEventListeners() {
    [elements.inputPesoBruto, elements.inputGramatura].forEach((input) => {
        input.addEventListener('input', (event) => {
            event.target.value = sanitizeInput(event.target.value);
            executeLiveCalculation();
        });
    });

    elements.containerCards.forEach((card) => {
        card.addEventListener('click', () => handleBombonaChange(card.dataset.type));
    });

    elements.btnSave.addEventListener('click', handleSaveCalculation);
    elements.btnCopy.addEventListener('click', handleCopyResult);
    elements.btnClear.addEventListener('click', handleClearFields);

    elements.btnNavSettings.addEventListener('click', () => switchView('settings'));
    elements.btnBackCalc.addEventListener('click', () => switchView('calculator'));

    elements.selectTheme.addEventListener('change', (event) => {
        saveSettings({ theme: event.target.value });
        applyTheme(event.target.value);
        showToast('Tema atualizado.');
    });

    elements.selectDefaultBombona.addEventListener('change', (event) => {
        saveSettings({ defaultBombona: event.target.value });
        showToast('Recipiente padrão atualizado.');
    });

    elements.btnClearHistory.addEventListener('click', handleClearHistoryAction);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (elements.selectTheme.value === 'system') {
            applyTheme('system');
        }
    });
}

function buildFingerprint(pesoBruto, gramatura, tipoBombona, resultado) {
    return [tipoBombona, pesoBruto, gramatura, resultado].join('|');
}

function executeLiveCalculation({ markAsSaved = false } = {}) {
    const pesoBruto = parseBrToFloat(elements.inputPesoBruto.value);
    const gramatura = parseBrToFloat(elements.inputGramatura.value);
    const calcData = calculateProduction(pesoBruto, gramatura, appState.currentBombona);

    appState.lastCalculation = calcData;
    appState.currentFingerprint = calcData.success
        ? buildFingerprint(pesoBruto, gramatura, appState.currentBombona, calcData.result)
        : null;

    if (markAsSaved && appState.currentFingerprint) {
        appState.savedFingerprint = appState.currentFingerprint;
    }

    const isSaved = Boolean(
        calcData.success && appState.currentFingerprint === appState.savedFingerprint
    );

    updateCalculationDisplay(calcData);
    updateSaveButton({
        canSave: calcData.success && !isSaved,
        isSaved
    });
}

function handleBombonaChange(tipo) {
    if (!CONTAINER_TYPES[tipo] || appState.currentBombona === tipo) return;

    appState.currentBombona = tipo;
    updateActiveBombonaCard(tipo);
    executeLiveCalculation();
}

function handleClearFields() {
    elements.inputPesoBruto.value = '';
    elements.inputGramatura.value = '';
    appState.lastCalculation = null;
    appState.currentFingerprint = null;
    appState.savedFingerprint = null;

    updateCalculationDisplay({
        success: false,
        error: 'Aguardando dados...',
        result: 0,
        details: null
    });
    updateSaveButton({ canSave: false });
    elements.inputPesoBruto.focus();
    showToast('Campos limpos.');
}

function handleSaveCalculation() {
    const calcData = appState.lastCalculation;

    if (!calcData?.success || !appState.currentFingerprint) {
        showToast('Preencha valores válidos antes de salvar.', true);
        return;
    }

    if (appState.savedFingerprint === appState.currentFingerprint) {
        showToast('Este cálculo já está salvo.');
        return;
    }

    const { data, hora } = getFormattedDateTime();
    const historyItem = {
        data,
        hora,
        pesoBruto: calcData.details.pesoBruto,
        gramatura: calcData.details.gramatura,
        tipoBombona: appState.currentBombona,
        resultado: calcData.result
    };

    saveToHistory(historyItem);
    appState.savedFingerprint = appState.currentFingerprint;
    updateSaveButton({ canSave: false, isSaved: true });
    renderHistory();
    showToast('Cálculo salvo no histórico.');
}

async function handleCopyResult() {
    if (!appState.lastCalculation?.success) return;

    const texto = elements.displayResult.textContent;

    try {
        await navigator.clipboard.writeText(texto);
        showToast('Resultado copiado.');
    } catch (error) {
        showToast('Não foi possível copiar o resultado.', true);
    }
}

function renderHistory() {
    renderHistoryList(getHistory(), (item) => {
        if (!CONTAINER_TYPES[item.tipoBombona]) {
            showToast('O recipiente deste registro não está mais disponível.', true);
            return;
        }

        appState.currentBombona = item.tipoBombona;
        updateActiveBombonaCard(item.tipoBombona);
        elements.inputPesoBruto.value = Number(item.pesoBruto).toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        });
        elements.inputGramatura.value = Math.round(item.gramatura).toString();

        executeLiveCalculation({ markAsSaved: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Cálculo restaurado.');
    });
}

function handleClearHistoryAction() {
    if (!window.confirm('Deseja apagar todo o histórico salvo neste dispositivo?')) return;

    clearHistory();
    appState.savedFingerprint = null;
    renderHistory();

    if (appState.lastCalculation?.success) {
        updateSaveButton({ canSave: true, isSaved: false });
    }

    showToast('Histórico apagado.', true);
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
            console.error('[BombonaCalc] Falha ao registrar Service Worker:', error);
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
