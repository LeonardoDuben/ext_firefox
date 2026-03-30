# Table Cell Selector

Extensão para Firefox que adiciona seleção de células de tabelas HTML no estilo Excel.

## Instalação

1. Abra `about:debugging` na barra de endereço do Firefox
2. Clique em **"Este Firefox"**
3. Clique em **"Carregar Extensão Temporária..."**
4. Selecione o arquivo `manifest.json` desta pasta

> A extensão temporária precisa ser recarregada toda vez que o Firefox for reiniciado.

## Como usar

### Seleção com mouse

| Ação | Resultado |
|------|-----------|
| Clique em uma célula | Inicia nova seleção naquela célula |
| Arrastar | Seleciona retângulo de células |
| `Ctrl` + Arrastar | Adiciona células à seleção existente |
| Clique/Arrastar em célula **já selecionada** | Deseleciona |
| Clique fora da tabela | Limpa seleção |

### Teclado

| Atalho | Resultado |
|--------|-----------|
| `Ctrl + Shift + ↓` | Expande seleção até a última linha |
| `Ctrl + Shift + ↑` | Expande seleção até a primeira linha |
| `Ctrl + Shift + →` | Expande seleção até a última coluna |
| `Ctrl + Shift + ←` | Expande seleção até a primeira coluna |
| `Ctrl + C` | Copia células selecionadas |
| `Esc` | Limpa seleção |

### Comportamento das setas (igual ao Excel)

As setas expandem o **retângulo inteiro**, não apenas uma linha ou coluna:

1. Clique em uma célula
2. `Ctrl+Shift+↓` → seleciona toda a coluna abaixo
3. `Ctrl+Shift+→` → expande para a direita em **todas** as linhas já selecionadas

### Copiar (`Ctrl+C`)

O conteúdo é copiado em formato TSV (tab-separated values), compatível com Excel, Google Sheets e LibreOffice Calc. Células fora da seleção dentro do bounding box são copiadas como células vazias.

## Estrutura

```
ext_firefox/
├── manifest.json   — configuração da extensão (Manifest V2)
├── content.js      — lógica de seleção injetada nas páginas
├── styles.css      — estilos de destaque das células selecionadas
└── tests/
    └── table_test.html — página HTML para testar a extensão
```

## Limitações conhecidas

- Tabelas com `colspan` ou `rowspan` podem ter comportamento impreciso no índice de colunas, pois a extensão usa o índice DOM (`cellIndex`) e não a posição visual da célula.
- Não funciona em tabelas dentro de iframes com origem diferente.
