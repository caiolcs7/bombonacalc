/**
 * Módulo de Interface do Usuário (UI), Renderização e Microinterações do BombonaCalc Pro
 */
import { formatPeso, formatResultado } from './utils.js';

// Cache de Elementos do DOM essenciais para performance (Evita querySelector repetidos)
export const elements = {
    app: document.getElementById('app'),
    displayResult: document.getElementById('display-result'),
    inputPesoBruto: document.getElementById('input-peso-bruto'),
    inputGramatura: document.getElementById('input-gramatura'),
    calcSummary: document.getElementById('calc-summary'),
    
    // Resumo/Details
    sumPesoBruto: document.getElementById('sum-peso-bruto'),
    sumTara: document.getElementById('sum-tara'),
    sumPesoLiquido: document.getElementById('sum-peso-liquido'),
    sumGramatura: document.getElementById('sum-gramatura'),
    sumResultado: document.getElementById('sum-resultado'),
    
    // Cards de Bombona
    cardBranca: document.getElementById('card-bombona-branca'),
    cardMarrom: document.getElementById('card-bombona-marrom'),
    
    // Botões de Ação
    btnCopy: document.getElementById('btn-copy'),
    btnShare: document.getElementById('btn-share'),
    btnClear: document.getElementById('btn-clear'),
    btnNavSettings: document.getElementById('btn-nav-settings'),
    btnBackCalc: document.getElementById('btn-back-calc'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    
    // Views (SPA)
    viewCalculator: document.getElementById('view-calculator'),
    viewSettings: document.getElementById('view-settings'),
    
    // Configurações e Histórico
    selectTheme: document.getElementById('select-theme'),
    selectDefaultBombona: document.getElementById('select-default-bombona'),
    historyList: document.getElementById('history-list'),
    toast: document.getElementById('toast')
};

/**
 * Exibe um feedback visual temporário (Toast) estilo iOS.
 * @param {string} message - Mensagem a ser exibida.
 * @param {boolean} isError - Se verdadeiro, renderiza com estilo de erro.
 */
export function showToast(message, isError = false) {
    elements.toast.textContent = message;
    if (isError) {
        elements.toast.classList.add('error');
    } else {
        elements.toast.classList.remove('error');
    }
    
    elements.toast.classList.add('show');
    
    // Remove o toast após 2.5 segundos de exibição fluida
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2500);
}

/**
 * Atualiza o display principal e a seção de resumo detalhado baseado nos resultados do cálculo.
 * @param {Object} calcData - O payload retornado pelo calculador.
 */
export function updateCalculationDisplay(calcData) {
    if (!calcData.success) {
        elements.displayResult.textContent = '0';
        elements.calcSummary.classList.add('visual-hidden');
        elements.btnCopy.disabled = true;
        elements.btnShare.disabled = true;
        
        // Se houver um erro explícito de física/fábrica (e não apenas falta de dados), avisa discretamente
        if (calcData.error && calcData.error !== 'Aguardando dados...') {
            elements.displayResult.style.fontSize = '32px';
            elements.displayResult.textContent = 'Erro';
        } else {
            elements.displayResult.style.fontSize = '64px';
        }
        return;
    }

    // Restaura o tamanho padrão da fonte para o display numérico grande
    elements.displayResult.style.fontSize = '64px';
    elements.displayResult.textContent = formatResultado(calcData.result);

    // Alimenta o painel informativo detalhado
    elements.sumPesoBruto.textContent = `${formatPeso(calcData.details.pesoBruto)} kg`;
    elements.sumTara.textContent = `${formatPeso(calcData.details.tara)} kg`;
    elements.sumPesoLiquido.textContent = `${formatPeso(calcData.details.pesoLiquido)} kg`;
    elements.sumGramatura.textContent = `${Math.round(calcData.details.gramatura)} g`;
    elements.sumResultado.textContent = formatResultado(calcData.details.resultadoFinal);

    // Revela o sumário com transição suave CSS
    elements.calcSummary.classList.remove('visual-hidden');
    elements.btnCopy.disabled = false;
    elements.btnShare.disabled = false;
}

/**
 * Renderiza dinamicamente a lista de histórico de cálculos na tela.
 * @param {Array} historyItems - Array com os itens gravados no Storage.
 * @param {Function} onItemClickCallback - Callback disparada ao clicar em um registro.
 */
export function renderHistoryList(historyItems, onItemClickCallback) {
    elements.historyList.innerHTML = '';

    if (historyItems.length === 0) {
        elements.historyList.innerHTML = '<div class="history-empty">Nenhum cálculo recente</div>';
        return;
    }

    historyItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'history-item';
        itemElement.setAttribute('role', 'button');
        itemElement.setAttribute('tabindex', '0');

        itemElement.innerHTML = `
            <div class="history-item-left">
                <div class="history-item-meta">${item.data} às ${item.hora}</div>
                <div class="history-item-details">
                    <span class="history-item-badge badge-${item.tipoBombona}">
                        ${item.tipoBombona === 'branca' ? 'Branca' : 'Marrom'}
                    </span>
                    <span>PB: ${formatPeso(item.pesoBruto)}kg | G: ${Math.round(item.gramatura)}g</span>
                </div>
            </div>
            <div class="history-item-right">
                ${formatResultado(item.resultado)}
            </div>
        `;

        // Vincula evento de toque para restaurar o cálculo antigo (Comportamento Nativo)
        itemElement.addEventListener('click', () => onItemClickCallback(item));
        elements.historyList.appendChild(itemElement);
    });
}

/**
 * Altera visualmente o card de bombona selecionado.
 * @param {string} tipoSelected - 'branca' ou 'marrom'.
 */
export function updateActiveBombonaCard(tipoSelected) {
    if (tipoSelected === 'branca') {
        elements.cardBranca.classList.add('active');
        elements.cardMarrom.classList.remove('active');
    } else {
        elements.cardMarrom.classList.add('active');
        elements.cardBranca.classList.remove('active');
    }
}

/**
 * Navega entre as views do App Shell de maneira fluida (SPA Style).
 * @param {string} targetView - 'calculator' ou 'settings'.
 */
export function switchView(targetView) {
    if (targetView === 'settings') {
        elements.viewCalculator.classList.remove('active');
        setTimeout(() => {
            elements.viewSettings.classList.add('active');
        }, 150); // Delay suave para sincronia das animações CSS
    } else {
        elements.viewSettings.classList.remove('active');
        setTimeout(() => {
            elements.viewCalculator.classList.add('active');
        }, 150);
    }
}

/**
 * Gerencia a aplicação do tema CSS (Dark/Light) baseado na escolha ou no sistema operacional.
 * @param {string} themeValue - 'dark' | 'light' | 'system'
 */
export function applyTheme(themeValue) {
    if (themeValue === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        elements.app.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        elements.app.setAttribute('data-theme', themeValue);
    }
}