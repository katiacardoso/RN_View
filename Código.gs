// ====================================================================
// CONFIGURAÇÃO PRINCIPAL
// ====================================================================

// Substitua pelo ID da sua planilha
const SHEET_ID = "1bZda6GCZV65z2ylOKxBuiy1yvdKUM9Ok8SzzcYp79wc";
const SHEET_NAME = "Dados"; // Nome da aba com os dados

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("APP View")
    .setWidth(800);
}

function getSheetData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('ERRO: Aba "' + SHEET_NAME + '" não encontrada.');
    return { headers: [], data: [] };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  
  return { headers, data };
}

// Obtém as opções únicas para os filtros, baseado na nova planilha e colunas que você quer
function getUniqueFilterOptions() {
  const { headers, data } = getSheetData();
  if (!headers || !data || data.length === 0) return {};

  // Colunas para filtro conforme a nova planilha
  const filterColumns = ["GV", "Setor", "Cluster Primário", "Categoria", "Validada"];
  const options = {};

  filterColumns.forEach((col) => {
    const colIndex = headers.indexOf(col);
    if (colIndex > -1) {
      const values = data.map(row => row[colIndex]);
      options[col] = [...new Set(values)].filter(v => v !== "");
    } else {
      options[col] = [];
    }
  });

  return options;
}

// Filtra as tarefas segundo os filtros aplicados, e retorna a lista de tarefas (strings)
function filtrarTasks(filtros) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const dados = sheet.getDataRange().getValues();
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  const idxTarefa = cabecalho.indexOf("Tarefa");
  if (idxTarefa === -1) return [];

  const resultado = linhas.filter(linha => {
    return Object.entries(filtros).every(([coluna, valor]) => {
      const idx = cabecalho.indexOf(coluna);
      if (idx === -1 || valor === "") return true;
      return String(linha[idx]) === valor;
    });
  }).map(linha => linha[idxTarefa] || "(Sem tarefa)");

  return resultado;
}



// Retorna filtros para a tela de tarefas, já no formato esperado (arrays de strings)
function getFiltros() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return {};

  const dados = sheet.getDataRange().getValues();
  const cabecalho = dados[0];

  // ✅ Atualize com todas as colunas desejadas
  const colunasFiltro = ["Visita", "PDV", "Nome Fantasia", "GV", "Setor", "Cluster Primário", "Categoria", "Validada", "Pontos Totais"];
  const filtros = {};

  colunasFiltro.forEach(coluna => {
    const idx = cabecalho.indexOf(coluna);
    if (idx === -1) {
      filtros[coluna] = [];
      return;
    }

    const valores = dados.slice(1).map(linha => {
      let valor = linha[idx];
      if (valor instanceof Date) {
        valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy");
      }
      return String(valor);
    }).filter(v => v !== "");

    filtros[coluna] = [...new Set(valores)].sort();
  });

  return filtros;
}

function getPage(page) {
  if (page === "tarefas") {
    const filtros = getFiltros(); // função já presente no seu script
    const t = HtmlService.createTemplateFromFile("tarefas");
    t.filtros = filtros;
    return t.evaluate().getContent();
  }

  if (page === "naoCompradores") {
    const filtros = getFiltrosNaoCompradores(); // você precisa manter essa função ou ajustar conforme a aba correspondente
    const t = HtmlService.createTemplateFromFile("naoCompradores");
    t.filtros = filtros;
    return t.evaluate().getContent();
  }

  // Página padrão
  return HtmlService.createHtmlOutputFromFile("index").getContent();
}
function getFiltrosNaoCompradores() {
  const aba = SpreadsheetApp.getActive().getSheetByName("NaoCompradores");
  const dados = aba.getDataRange().getValues();
  const cabecalho = dados.shift();

  const colunasFiltro = ["Cod GV", "Cod Setor", "Cod PDV", "Nome Fantasia", "Comprador"];
  const indices = colunasFiltro.map(col => cabecalho.indexOf(col));

  const filtros = {};

  indices.forEach((idx, i) => {
    if (idx === -1) return;
    const valores = [...new Set(dados.map(linha => linha[idx]).filter(v => v !== ""))];
    filtros[colunasFiltro[i]] = valores;
  });

  return filtros;
}
function filtrarNaoCompradores(filtros) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const aba = ss.getSheetByName("NaoCompradores");
  if (!aba) return [];

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  // Converte os filtros para comparação direta
  const resultado = linhas.filter(linha => {
    return Object.entries(filtros).every(([coluna, valor]) => {
      const idx = cabecalho.indexOf(coluna);
      if (idx === -1 || valor === "") return true;
      return String(linha[idx]) === valor;
    });
  });

  // Retorna apenas os dados relevantes conforme esperado no HTML
  const colunasDesejadas = ["Operação", "Cod GV", "Cod Setor", "Cod PDV", "Nome Fantasia", "Comprador"];
  const indicesDesejados = colunasDesejadas.map(c => cabecalho.indexOf(c));

  const resultadoFormatado = resultado.map(linha => {
    const obj = {};
    indicesDesejados.forEach((idx, i) => {
      obj[colunasDesejadas[i]] = linha[idx];
    });
    return obj;
  });

  return resultadoFormatado;
}

