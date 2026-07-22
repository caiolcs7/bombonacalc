# BombonaCalc Pro 2.0.0

## Alterações principais

- Removida a opção de compartilhamento.
- Adicionada **Caixa Vermelha**, tara de **3,000 kg**.
- Adicionado **Galão**, tara de **1,000 kg**.
- Mensagem de peso abaixo da tara alterada para: **“Valor adicionado menor que a tara, insira um valor válido.”**
- Removido o salvamento automático do histórico.
- Adicionado botão **Salvar cálculo**; o registro só é salvo por ação do usuário.
- Interface redesenhada com visual premium, melhor responsividade e acessibilidade.
- Service Worker atualizado para a versão 2.0.0 e corrigido para cachear apenas arquivos existentes.

## Estrutura

Abra o projeto por um servidor HTTP local, pois módulos ES e Service Workers não funcionam corretamente abrindo o HTML diretamente pelo sistema de arquivos.

Exemplo com Python:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.
