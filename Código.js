// ====================================================================
// CONFIGURAÇÃO PRINCIPAL - PlanilhaTeste
// ====================================================================

// SUBSTITUA PELO ID DA SUA PLANILHA
const SHEET_ID = "1bZda6GCZV65z2ylOKxBuiy1yvdKUM9Ok8SzzcYp79wc";
const SHEET_NAME = "Dados"; // Nome da aba (ajuste conforme necessário)

function doGet() {
  const filtros = getUniqueFilterOptions();
  Logger.log('Filtros gerados: ' + JSON.stringify(filtros));
  const t = HtmlService.createTemplateFromFile('Index');
  t.filtros = filtros;
  return t.evaluate().setTitle('Painel de Tarefas').setWidth(1200);
}


function getSheetData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Listar abas disponíveis
  const sheets = ss.getSheets().map(s => s.getName());
  Logger.log('Abas disponíveis: ' + sheets.join(', '));
  
  // Usar o nome exato da aba
  const sheetName = 'Dados'; // ajuste aqui se o nome for diferente
  Logger.log('Buscando dados na aba: ' + sheetName);
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('ERRO: Aba "' + sheetName + '" não encontrada.');
    return { headers: [], data: [] };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  return { headers, data };
}


function getUniqueFilterOptions() {
  const { headers, data } = getSheetData();
  if (!headers || !data || data.length === 0) return {};

  const filterColumns = ["Visita/Conclusão", "Operação", "Pdv", "Setor", "Cluster", "Validada"];
  const options = {};

  filterColumns.forEach((col) => {
    const colIndex = headers.indexOf(col);
    if (colIndex > -1) {
      const values = data.map((row) => row[colIndex]);
      options[col] = [...new Set(values)].filter((v) => v !== "");
    } else {
      options[col] = []; // evita undefined
    }
  });

  return options;
}



function TestarLeitura() {
  const { headers, data } = getSheetData();
  Logger.log("Cabeçalhos: " + headers.join(", "));
  Logger.log("Primeira linha: " + data[0].join(", "));
}


function getFilteredTasks(filters) {
  const { headers, data } = getSheetData();
  const filtered = data.filter(row => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const colIndex = headers.indexOf(key);
      return row[colIndex] == value;
    });
  });

  const taskIndex = headers.indexOf("Task");
  return filtered.map(row => row[taskIndex]);
}

function testarCabecalhoDetalhado() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Dados');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  headers.forEach((h, i) => {
    let chars = [];
    for (let c = 0; c < h.length; c++) {
      chars.push(h.charCodeAt(c));
    }
    Logger.log(`Coluna ${i + 1}: "${h}" => códigos ASCII: [${chars.join(', ')}]`);
  });
}

function testGetFilters() {
  const filtros = getUniqueFilterOptions();
  Logger.log(JSON.stringify(filtros, null, 2));
}

function getFiltros() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dados");
  if (!aba) return {};

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const filtros = {};

  const colunasFiltro = ["Setor", "Cluster", "Operação", "Validada", "Pdv", "Visita/Conclusão"];

  colunasFiltro.forEach(nomeColuna => {
    const idx = cabecalho.indexOf(nomeColuna);
    if (idx !== -1) {
      const valoresUnicos = [...new Set(dados.slice(1).map(linha => {
        let valor = linha[idx];

        // Se for data, formata para dd/mm/yyyy
        if (valor instanceof Date) {
          valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy");
        }

        // Converte para string para evitar problemas
        return String(valor);
      }).filter(v => v !== ""))];

      filtros[nomeColuna] = valoresUnicos.sort();
    }
  });

  Logger.log("Filtros gerados: " + JSON.stringify(filtros));
  return filtros;
}



function filtrarTasks(filtros) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dados");
  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  const resultado = linhas.filter(linha => {
    return Object.entries(filtros).every(([col, val]) => {
      const idx = cabecalho.indexOf(col);
      let cellVal = linha[idx];

      // Formatar datas para string no padrão dd/MM/yyyy para comparar
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        cellVal = String(cellVal);
      }

      return cellVal === val;
    });
  }).map(linha => linha[cabecalho.indexOf("Task")]);

  return resultado;
}