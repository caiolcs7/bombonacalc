/**
 * Renderização, estados visuais e microinterações do BombonaCalc Pro.
 */
import { CONTAINER_TYPES, getContainerConfig } from './calculator.js';
import { formatPeso, formatResultado } from './utils.js';

export const elements = {
    app: document.getElementById('app'),
    displayPanel: document.getElementById('display-panel'),
    displayResult: document.getElementById('display-result'),
    displayMessage: document.getElementById('display-message'),
    displayContainerType: document.getElementById('display-container-type'),
    inputPesoBruto: document.getElementById('input-peso-bruto'),
    inputGramatura: document.getElementById('input-gramatura'),
    calcSummary: document.getElementById('calc-summary'),

    sumPesoBruto: document.getElementById('sum-peso-bruto'),
    sumTara: document.getElementById('sum-tara'),
    sumPesoLiquido: document.getElementById('sum-peso-liquido'),
    sumGramatura: document.getElementById('sum-gramatura'),
    sumResultado: document.getElementById('sum-resultado'),

    containerCards: Array.from(document.querySelectorAll('.bombona-card')),

    btnSave: document.getElementById('btn-save'),
    btnSaveLabel: document.querySelector('#btn-save span'),
    btnCopy: document.getElementById('btn-copy'),
    btnClear: document.getElementById('btn-clear'),
    btnNavSettings: document.getElementById('btn-nav-settings'),
    btnBackCalc: document.getElementById('btn-back-calc'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    viewCalculator: document.getElementById('view-calculator'),
    viewSettings: document.getElementById('view-settings'),

    selectTheme: document.getElementById('select-theme'),
    selectDefaultBombona: document.getElementById('select-default-bombona'),
    historyList: document.getElementById('history-list'),
    toast: document.getElementById('toast')
};

let toastTimeout = null;

export function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    elements.toast.textContent = message;
    elements.toast.classList.toggle('error', isError);
    elements.toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2800);
}

export function updateCalculationDisplay(calcData) {
    const isWaiting = calcData.error === 'Aguardando dados...';

    elements.calcSummary.classList.toggle('visual-hidden', !calcData.success);
    elements.btnCopy.disabled = !calcData.success;
    elements.displayPanel.classList.toggle('has-error', !calcData.success && !isWaiting);
    elements.displayMessage.classList.toggle('error', !calcData.success && !isWaiting);

    if (!calcData.success) {
        elements.displayResult.textContent = isWaiting ? '0' : '—';
        elements.displayMessage.textContent = isWaiting
            ? 'Preencha o peso bruto e a gramatura para calcular.'
            : calcData.error;
        return;
    }

    elements.displayResult.textContent = formatResultado(calcData.result);
    elements.displayMessage.textContent = 'Cálculo pronto. Salve somente quando desejar.';

    elements.sumPesoBruto.textContent = `${formatPeso(calcData.details.pesoBruto)} kg`;
    elements.sumTara.textContent = `${formatPeso(calcData.details.tara)} kg`;
    elements.sumPesoLiquido.textContent = `${formatPeso(calcData.details.pesoLiquido)} kg`;
    elements.sumGramatura.textContent = `${Math.round(calcData.details.gramatura)} g`;
    elements.sumResultado.textContent = formatResultado(calcData.details.resultadoFinal);
}

export function updateSaveButton({ canSave, isSaved = false }) {
    elements.btnSave.disabled = !canSave;
    elements.btnSave.classList.toggle('is-saved', isSaved);
    elements.btnSaveLabel.textContent = isSaved ? 'Cálculo salvo' : 'Salvar cálculo';
}

export function renderHistoryList(historyItems, onItemClickCallback) {
    elements.historyList.innerHTML = '';

    if (historyItems.length === 0) {
        elements.historyList.innerHTML = `
            <div class="history-empty">
                <span class="history-empty-icon">✓</span>
                <strong>Nenhum cálculo salvo</strong>
                <span>Os resultados só aparecerão aqui quando você tocar em “Salvar cálculo”.</span>
            </div>
        `;
        return;
    }

    historyItems.forEach((item) => {
        const itemElement = document.createElement('button');
        const config = getContainerConfig(item.tipoBombona) ?? {
            shortLabel: 'Recipiente',
            label: 'Recipiente'
        };

        itemElement.type = 'button';
        itemElement.className = 'history-item';
        itemElement.setAttribute('aria-label', `Restaurar cálculo de ${config.label}`);
        itemElement.innerHTML = `
            <span class="history-item-left">
                <span class="history-item-meta">${item.data} às ${item.hora}</span>
                <span class="history-item-details">
                    <span class="history-item-badge badge-${item.tipoBombona}">${config.shortLabel}</span>
                    <span>PB ${formatPeso(item.pesoBruto)} kg · ${Math.round(item.gramatura)} g</span>
                </span>
            </span>
            <span class="history-item-right">
                <small>Quantidade</small>
                ${formatResultado(item.resultado)}
            </span>
        `;

        itemElement.addEventListener('click', () => onItemClickCallback(item));
        elements.historyList.appendChild(itemElement);
    });
}

export function updateActiveBombonaCard(tipoSelected) {
    elements.containerCards.forEach((card) => {
        const isActive = card.dataset.type === tipoSelected;
        card.classList.toggle('active', isActive);
        card.setAttribute('aria-pressed', String(isActive));
    });

    const config = getContainerConfig(tipoSelected);
    elements.displayContainerType.textContent = config?.label ?? 'Recipiente';
}

export function populateDefaultContainerOptions() {
    elements.selectDefaultBombona.innerHTML = '';

    Object.entries(CONTAINER_TYPES).forEach(([key, config]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${config.label} (${formatPeso(config.tara)} kg)`;
        elements.selectDefaultBombona.appendChild(option);
    });
}

export function switchView(targetView) {
    const showSettings = targetView === 'settings';
    elements.viewCalculator.classList.toggle('active', !showSettings);
    elements.viewSettings.classList.toggle('active', showSettings);

    if (showSettings) {
        elements.btnBackCalc.focus({ preventScroll: true });
    } else {
        elements.btnNavSettings.focus({ preventScroll: true });
    }
}

export function applyTheme(themeValue) {
    const resolvedTheme = themeValue === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : themeValue;

    elements.app.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
}
