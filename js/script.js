const API_URL = "https://69076c63b1879c890ed9bde4.mockapi.io/agendamento";

const calendario = document.querySelector("#calendario tbody");
const mesSelect = document.querySelector("#mes-select");
const anoSelect = document.querySelector("#ano-select");

const modal = document.querySelector("#modal");
const detalhesModal = document.querySelector("#detalhes");
const detalhesInfo = document.querySelector("#detalhes-info");

const salvarBtn = document.querySelector("#salvar");
const cancelarBtn = document.querySelector("#cancelar");
const fecharDetalhes = document.querySelector("#fechar-detalhes");
const excluirBtn = document.querySelector("#excluir");

let diaSelecionado = null;
let agendamentoAtual = null;

const meses = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

// === Preenche meses e anos ===
function popularMesesEAnos() {
  const atual = new Date();
  const anoAtual = atual.getFullYear();

  meses.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    if (i === atual.getMonth()) opt.selected = true;
    mesSelect.appendChild(opt);
  });

  for (let a = anoAtual - 1; a <= anoAtual + 3; a++) {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    if (a === anoAtual) opt.selected = true;
    anoSelect.appendChild(opt);
  }
}

// === Busca todos os agendamentos ===
async function carregarAgendamentos() {
  const res = await fetch(API_URL);
  return await res.json();
}

// === Salva novo agendamento ===
async function salvarNaAPI(dados) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
}

// === Exclui agendamento ===
async function excluirDaAPI(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
}

// === Gera calendário ===
async function gerarCalendario(mes, ano) {
  calendario.innerHTML = "";
  const agendamentos = await carregarAgendamentos();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const totalDias = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();

  let dia = 1;
  let tr = document.createElement("tr");

  for (let i = 0; i < diaSemanaInicio; i++) {
    tr.appendChild(document.createElement("td"));
  }

  for (let i = diaSemanaInicio; i < 7; i++) {
    const td = criarCelula(dia, mes, ano, agendamentos);
    tr.appendChild(td);
    dia++;
  }
  calendario.appendChild(tr);

  while (dia <= totalDias) {
    tr = document.createElement("tr");
    for (let i = 0; i < 7; i++) {
      const td = dia <= totalDias ? criarCelula(dia, mes, ano, agendamentos) : document.createElement("td");
      tr.appendChild(td);
      dia++;
    }
    calendario.appendChild(tr);
  }

  while (calendario.rows.length < 6) {
    const tr = document.createElement("tr");
    for (let i = 0; i < 7; i++) tr.appendChild(document.createElement("td"));
    calendario.appendChild(tr);
  }
}

// === Cria célula ===
function criarCelula(dia, mes, ano, agendamentos) {
  const td = document.createElement("td");
  td.textContent = dia.toString().padStart(2, "0");

  const agDia = agendamentos.filter(a => parseInt(a.dia) === dia && parseInt(a.mes) === mes && parseInt(a.ano) === ano);

  agDia.forEach((ag) => {
    const span = document.createElement("span");
    span.classList.add("agendamento");
    span.textContent = `${ag.nome} ${ag.horarioInicio} às ${ag.horarioFim}`;
    span.onclick = () => mostrarDetalhes(ag);
    td.appendChild(span);
  });

  td.addEventListener("click", (e) => {
    if (e.target.classList.contains("agendamento")) return;
    abrirModal(dia, mes, ano);
  });

  return td;
}

// === Modal agendamento ===
function abrirModal(dia, mes, ano) {
  diaSelecionado = { dia, mes, ano };
  modal.style.display = "block";
}
function fecharModal() {
  modal.style.display = "none";
}

// === Modal detalhes ===
function mostrarDetalhes(ag) {
  agendamentoAtual = ag;
  detalhesInfo.innerHTML = `
    <strong>Nome:</strong> ${ag.nome}<br>
    <strong>Horário:</strong> ${ag.horarioInicio} às ${ag.horarioFim}<br>
    <strong>Cliente:</strong> ${ag.cliente}
  `;
  detalhesModal.style.display = "block";
}
fecharDetalhes.onclick = () => (detalhesModal.style.display = "none");

// === Horários ===
function popularHorarios() {
  const ini = document.getElementById("horaInicial");
  const fim = document.getElementById("horaFinal");
  for (let h = 8; h <= 18; h++) {
    ["00", "30"].forEach((min) => {
      const hora = `${h.toString().padStart(2, "0")}:${min}`;
      ini.appendChild(new Option(hora, hora));
      fim.appendChild(new Option(hora, hora));
    });
  }
}

// === Conflito ===
function temConflito(agDia, inicio, fim) {
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const ini = toMin(inicio);
  const fi = toMin(fim);

  return agDia.some((a) => {
    const ai = toMin(a.horarioInicio);
    const af = toMin(a.horarioFim);
    return !(fi <= ai || ini >= af);
  });
}

// === Salvar agendamento ===
async function salvarAgendamento() {
  const nome = document.getElementById("nome").value;
  const inicio = document.getElementById("horaInicial").value;
  const fim = document.getElementById("horaFinal").value;
  const cliente = document.getElementById("cliente").value;

  if (!nome || !inicio || !fim || !cliente) {
    alert("Preencha todos os campos!");
    return;
  }

  const todos = await carregarAgendamentos();
  const agDia = todos.filter(a =>
    a.dia == diaSelecionado.dia &&
    a.mes == diaSelecionado.mes &&
    a.ano == diaSelecionado.ano
  );

  if (temConflito(agDia, inicio, fim)) {
    alert("Horário já ocupado!");
    return;
  }

  const novo = {
    nome,
    cliente,
    horarioInicio: inicio,
    horarioFim: fim,
    dia: diaSelecionado.dia,
    mes: diaSelecionado.mes,
    ano: diaSelecionado.ano
  };

  await salvarNaAPI(novo);
  fecharModal();
  gerarCalendario(diaSelecionado.mes, diaSelecionado.ano);
}

// === Excluir ===
excluirBtn.onclick = async () => {
  if (!agendamentoAtual) return;
  await excluirDaAPI(agendamentoAtual.id);
  detalhesModal.style.display = "none";
  gerarCalendario(parseInt(mesSelect.value), parseInt(anoSelect.value));
};

// === Eventos ===
mesSelect.addEventListener("change", () =>
  gerarCalendario(parseInt(mesSelect.value), parseInt(anoSelect.value))
);
anoSelect.addEventListener("change", () =>
  gerarCalendario(parseInt(mesSelect.value), parseInt(anoSelect.value))
);
cancelarBtn.addEventListener("click", fecharModal);
salvarBtn.addEventListener("click", salvarAgendamento);

// === Inicialização ===
window.onload = () => {
  popularMesesEAnos();
  popularHorarios();
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  gerarCalendario(mesAtual, anoAtual);
};

