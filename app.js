/**
 * Core Orquestrador e Ponto de Entrada Principal (Bootstrap) - BombonaCalc Pro
 */
import { elements, updateCalculationDisplay, renderHistoryList, updateActiveBombonaCard, switchView, applyTheme, showToast } from './ui.js';
import { calculateProduction } from './calculator.js';
import { parseBrToFloat, sanitizeInput, getFormattedDateTime } from './utils.js';
import { getSettings, saveSettings, getHistory, saveToHistory, clearHistory } from './storage.js';

// Estado global em memória da sessão atual
const appState = {
    currentBombona: 'branca',
    debounceTimeout: null
};

/**
 * Inicializa a aplicação carregando preferências salvas do usuário.
 */
function init() {
    // 1. Carrega e aplica configurações persistidas
    const settings = getSettings();
    appState.currentBombona = settings.defaultBombona;
    
    elements.selectTheme.value = settings.theme;
    elements.selectDefaultBombona.value = settings.defaultBombona;
    
    applyTheme(settings.theme);
    updateActiveBombonaCard(appState.currentBombona);
    
    // 2. Renderiza o histórico gravado
    triggerHistoryRender();

    // 3. Registra os ouvintes de eventos da interface
    setupEventListeners();

    // 4. Inicializa o Service Worker do PWA
    registerServiceWorker();
}

/**
 * Registra todos os Event Listeners do ecossistema do App.
 */
function setupEventListeners() {
    // Escuta de inputs em tempo real para cálculo dinâmico (Input Mirroring / Real-time)
    elements.inputPesoBruto.addEventListener('input', (e) => {
        e.target.value = sanitizeInput(e.target.value);
        executeLiveCalculation();
    });

    elements.inputGramatura.addEventListener('input', (e) => {
        e.target.value = sanitizeInput(e.target.value);
        executeLiveCalculation();
    });

    // Eventos de Seleção de Cards de Bombona
    elements.cardBranca.addEventListener('click', () => handleBombonaChange('branca'));
    elements.cardMarrom.addEventListener('click', () => handleBombonaChange('marrom'));

    // Botões de Ação Principais
    elements.btnClear.addEventListener('click', handleClearFields);
    elements.btnCopy.addEventListener('click', handleCopyResult);
    elements.btnShare.addEventListener('click', handleShareResult);

    // Navegação (SPA Screen Switching)
    elements.btnNavSettings.addEventListener('click', () => switchView('settings'));
    elements.btnBackCalc.addEventListener('click', () => switchView('calculator'));

    // Configurações Reativas
    elements.selectTheme.addEventListener('change', (e) => {
        saveSettings({ theme: e.target.value });
        applyTheme(e.target.value);
        showToast('Tema atualizado!');
    });

    elements.selectDefaultBombona.addEventListener('change', (e) => {
        saveSettings({ defaultBombona: e.target.value });
        showToast('Bombona padrão alterada!');
    });

    elements.btnClearHistory.addEventListener('click', handleClearHistoryAction);

    // Listener para mudanças no tema do sistema operacional em tempo real
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (elements.selectTheme.value === 'system') {
            applyTheme('system');
        }
    });
}

/**
 * Executa o fluxo de cálculo em tempo real e gerencia o debounce para gravação do histórico.
 */
function executeLiveCalculation() {
    const pesoBruto = parseBrToFloat(elements.inputPesoBruto.value);
    const gramatura = parseBrToFloat(elements.inputGramatura.value);

    const calcData = calculateProduction(pesoBruto, gramatura, appState.currentBombona);
    updateCalculationDisplay(calcData);

    // Se o cálculo foi um sucesso completo, agenda a gravação no histórico (Debounce de 2 segundos)
    if (calcData.success) {
        clearTimeout(appState.debounceTimeout);
        appState.debounceTimeout = setTimeout(() => {
            const { data, hora } = getFormattedDateTime();
            
            const historyItem = {
                data,
                hora,
                pesoBruto,
                gramatura,
                tipoBombona: appState.currentBombona,
                resultado: calcData.result
            };

            saveToHistory(historyItem);
            triggerHistoryRender();
        }, 2000); // Aguarda o usuário terminar de digitar por 2s para não duplicar linhas no histórico
    }
}

/**
 * Trata a mudança do tipo de bombona ativa.
 */
function handleBombonaChange(tipo) {
    if (appState.currentBombona === tipo) return;
    appState.currentBombona = tipo;
    updateActiveBombonaCard(tipo);
    executeLiveCalculation();
}

/**
 * Limpa todos os campos da tela e redefine o display.
 */
function handleClearFields() {
    clearTimeout(appState.debounceTimeout);
    elements.inputPesoBruto.value = '';
    elements.inputGramatura.value = '';
    updateCalculationDisplay({ success: false, error: 'Aguardando dados...', result: 0 });
    showToast('Campos limpos');
}

/**
 * Copia o resultado numérico atual para a área de transferência.
 */
async function handleCopyResult() {
    const texto = elements.displayResult.textContent;
    try {
        await navigator.clipboard.writeText(texto);
        showToast('Copiado para a área de transferência!');
    } catch (err) {
        showToast('Erro ao copiar resultado.', true);
    }
}

/**
 * Compartilha o resultado formatado através da API nativa do dispositivo (Web Share API).
 */
async function handleShareResult() {
    const resultado = elements.displayResult.textContent;
    const pesoB = elements.inputPesoBruto.value;
    const gram = elements.inputGramatura.value;
    const tipo = appState.currentBombona === 'branca' ? 'Branca' : 'Marrom';

    const textoCompartilhar = `*BombonaCalc Pro - Relatório de Produção*\n` +
                               `• Tipo: Bombona ${tipo}\n` +
                               `• Peso Bruto: ${pesoB} kg\n` +
                               `• Gramatura: ${gram} g\n` +
                               `• *Quantidade Produzida: ${resultado}*`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Produção BombonaCalc Pro',
                text: textoCompartilhar
            });
        } catch (err) {
            // Ignora se o usuário apenas cancelou o compartilhamento nativo
        }
    } else {
        // Fallback caso o navegador desktop ou antigo não possua suporte à Web Share API
        try {
            await navigator.clipboard.writeText(textoCompartilhar);
            showToast('Texto formatado copiado para compartilhamento!');
        } catch (err) {
            showToast('Erro ao compartilhar.', true);
        }
    }
}

/**
 * Recarrega e renderiza a lista de histórico na UI vinculando o comportamento de clique.
 */
function triggerHistoryRender() {
    const itens = getHistory();
    renderHistoryList(itens, (itemClicado) => {
        // Callback executada ao clicar em um card do histórico: restaura o estado antigo do cálculo
        appState.currentBombona = itemClicado.tipoBombona;
        updateActiveBombonaCard(itemClicado.tipoBombona);
        
        // Formata os valores de volta para exibição nos campos
        elements.inputPesoBruto.value = itemClicado.pesoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
        elements.inputGramatura.value = Math.round(itemClicado.gramatura).toString();
        
        executeLiveCalculation();
        showToast('Cálculo restaurado!');
    });
}

/**
 * Ação disparada para apagar o histórico local.
 */
function handleClearHistoryAction() {
    if (confirm('Deseja realmente apagar todo o histórico de cálculos do dispositivo?')) {
        clearHistory();
        triggerHistoryRender();
        showToast('Histórico apagado com sucesso!', true);
    }
}

/**
 * Registra o Service Worker do PWA para suporte Offline completo.
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('BombonaCalc SW registrado com sucesso:', registration.scope);
                })
                .catch(error => {
                    console.error('Falha ao registrar Service Worker:', error);
                });
        });
    }
}

// Inicializa a aplicação assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);