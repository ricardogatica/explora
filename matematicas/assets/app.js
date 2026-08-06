const state = {
  manifest: [],
  levels: [],
  diagnostics: [],
  practice: [],
  diagnosticLevel: "nivel-3-5",
  diagnosticItems: [],
  diagnosticIndex: 0,
  diagnosticScore: 0,
  diagnosticMax: 0,
  diagnosticAnswers: [],
  dragSelection: null,
  practiceIndex: 0,
  practiceCorrect: 0,
  practiceAnswered: 0
};

const $ = selector => document.querySelector(selector);

function e(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function n(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase().replace(",", ".");
}

function md(source) {
  let html = e(source);
  html = html
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  html = tables(html);
  html = lists(html);
  return html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return "";
    if (/^<(h1|h2|h3|ul|ol|table)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
}

function tables(html) {
  const lines = html.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].includes("|") && lines[i + 1] && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])) {
      const headers = lines[i].split("|").map(x => x.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map(x => x.trim()).filter(Boolean));
        i++;
      }
      out.push("<table><thead><tr>" + headers.map(x => `<th>${x}</th>`).join("") + "</tr></thead><tbody>" + rows.map(row => "<tr>" + row.map(cell => `<td>${cell}</td>`).join("") + "</tr>").join("") + "</tbody></table>");
    } else {
      out.push(lines[i]);
      i++;
    }
  }

  return out.join("\n");
}

function lists(html) {
  const lines = html.split("\n");
  const out = [];
  let ul = false;
  let ol = false;

  for (const line of lines) {
    if (/^- /.test(line)) {
      if (!ul) {
        out.push("<ul>");
        ul = true;
      }
      out.push(`<li>${line.replace(/^- /, "")}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (!ol) {
        out.push("<ol>");
        ol = true;
      }
      out.push(`<li>${line.replace(/^\d+\. /, "")}</li>`);
    } else {
      if (ul) {
        out.push("</ul>");
        ul = false;
      }
      if (ol) {
        out.push("</ol>");
        ol = false;
      }
      out.push(line);
    }
  }

  if (ul) out.push("</ul>");
  if (ol) out.push("</ol>");
  return out.join("\n");
}

async function init() {
  const responses = await Promise.all([
    fetch("data/manifest.json"),
    fetch("data/levels.json"),
    fetch("data/diagnostics.json"),
    fetch("data/practice.json")
  ]);

  state.manifest = await responses[0].json();
  state.levels = await responses[1].json();
  state.diagnostics = await responses[2].json();
  state.practice = await responses[3].json();

  renderNav(state.manifest);
  renderLevelCards();
  renderSelect();
  bind();

  const hash = location.hash.replace("#", "");
  if (hash === "diagnostico") return showDiagnostic();
  if (hash === "practicar") return showPractice();
  loadPage(hash || "inicio");
}

function bind() {
  $("#search").addEventListener("input", ev => {
    const q = ev.target.value.toLowerCase();
    renderNav(state.manifest.filter(item => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)));
  });

  $("#homeBtn").onclick = () => loadPage("inicio");
  $("#diagnosticBtn").onclick = showDiagnostic;
  $("#practiceBtn").onclick = showPractice;
  $("#startDiagnostic").onclick = startDiagnostic;
  $("#nextDiagnostic").onclick = nextDiagnostic;
  $("#resetDiagnostic").onclick = startDiagnostic;
  $("#levelSelect").onchange = ev => {
    state.diagnosticLevel = ev.target.value;
  };
  $("#nextPractice").onclick = nextPractice;
  $("#resetPractice").onclick = resetPractice;
}

function renderNav(items) {
  const groups = {};
  for (const item of items) {
    (groups[item.category] = groups[item.category] || []).push(item);
  }

  const nav = $("#nav");
  nav.innerHTML = "";
  for (const [category, pages] of Object.entries(groups)) {
    nav.innerHTML += `<div class="nav-group-title">${e(category)}</div>`;
    for (const page of pages) {
      const button = document.createElement("button");
      button.className = "nav-link";
      button.dataset.page = page.id;
      button.textContent = page.title;
      button.onclick = () => loadPage(page.id);
      nav.appendChild(button);
    }
  }
}

function renderLevelCards() {
  $("#levelCards").innerHTML = state.levels.map(level => `<div class="level-card"><span class="badge">${e(level.age_range)}</span><h3>${e(level.title)}</h3><p class="small">${e(level.stage)}</p><p>${e(level.description)}</p><button class="btn" data-go="${e(level.id)}">Ver nivel</button></div>`).join("");
  document.querySelectorAll("[data-go]").forEach(button => {
    button.onclick = () => loadPage(button.dataset.go);
  });
}

function renderSelect() {
  $("#levelSelect").innerHTML = state.levels.map(level => `<option value="${e(level.id)}">${e(level.title)} · ${e(level.stage)}</option>`).join("");
  $("#levelSelect").value = state.diagnosticLevel;
}

async function loadPage(id) {
  const page = state.manifest.find(item => item.id === id) || state.manifest[0];
  location.hash = page.id;
  $("#browseGrid").classList.remove("hidden");
  $("#content").classList.remove("hidden");
  $("#diagnostic").classList.add("hidden");
  $("#practice").classList.add("hidden");
  $("#heroTitle").textContent = page.title;
  $("#heroDescription").textContent = page.description;
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.page === page.id));

  const response = await fetch(`pages/${page.id}.md`);
  $("#article").innerHTML = md(await response.text());
}

function showDiagnostic() {
  location.hash = "diagnostico";
  $("#browseGrid").classList.add("hidden");
  $("#content").classList.add("hidden");
  $("#practice").classList.add("hidden");
  $("#diagnostic").classList.remove("hidden");
  $("#heroTitle").textContent = "Diagnóstico por nivel";
  $("#heroDescription").textContent = "Selecciona un rango de edad y aplica una prueba breve con preguntas, observación y arrastre.";
  $("#diagnosticIntro").classList.remove("hidden");
  $("#diagnosticRun").classList.add("hidden");
  $("#diagnosticResult").classList.add("hidden");
}

function startDiagnostic() {
  state.diagnosticItems = state.diagnostics.filter(item => item.level === state.diagnosticLevel);
  state.diagnosticIndex = 0;
  state.diagnosticScore = 0;
  state.diagnosticMax = state.diagnosticItems.reduce((sum, item) => sum + (item.type === "observation" ? 2 : 1), 0);
  state.diagnosticAnswers = [];
  state.dragSelection = null;

  $("#diagnosticIntro").classList.add("hidden");
  $("#diagnosticRun").classList.remove("hidden");
  $("#diagnosticResult").classList.add("hidden");
  renderDiagnostic();
}

function renderDiagnostic() {
  const item = state.diagnosticItems[state.diagnosticIndex];
  $("#diagnosticCounter").textContent = `Pregunta ${state.diagnosticIndex + 1} de ${state.diagnosticItems.length}`;
  $("#diagnosticProgress").style.width = `${(state.diagnosticIndex / state.diagnosticItems.length) * 100}%`;
  $("#diagnosticFeedback").className = "feedback";
  $("#diagnosticFeedback").innerHTML = "";
  $("#nextDiagnostic").disabled = true;
  state.dragSelection = null;

  let html = `<p class="small">${e(item.skill)}</p><h3>${e(item.question)}</h3>`;
  if (item.hint) html += `<p class="activity-hint">${e(item.hint)}</p>`;
  if (item.type === "multiple-choice" || item.type === "observation") html += renderOptions(item);
  if (item.type === "fill") html += renderFill("diagnostic");
  if (item.type === "drag-match") html += renderDragMatch(item);
  if (item.type === "drag-order") html += renderDragOrder(item);

  $("#diagnosticBox").innerHTML = html;
  document.querySelectorAll("[data-da]").forEach(button => {
    button.onclick = () => checkDiagnostic(button.dataset.da);
  });

  const fill = $("#checkDiagnosticFill");
  if (fill) fill.onclick = () => checkDiagnostic($("#diagnosticFill").value);
  if (item.type === "drag-match") bindDragMatch(item);
  if (item.type === "drag-order") bindDragOrder(item);
}

function renderOptions(item) {
  return `<div class="options">${item.options.map(option => `<button class="option" data-da="${e(option)}">${e(option)}</button>`).join("")}</div>`;
}

function renderFill(prefix) {
  const label = prefix === "diagnostic" ? "diagnosticFill" : "practiceFill";
  const button = prefix === "diagnostic" ? "checkDiagnosticFill" : "checkPracticeFill";
  return `<input class="fill-input" id="${label}" placeholder="Escribe la respuesta"><div class="toolbar"><button class="btn primary" id="${button}">Revisar</button></div>`;
}

function renderDragMatch(item) {
  const tokens = item.items.map(token => `<button class="drag-token" draggable="true" data-token="${e(token.id)}">${e(token.label)}</button>`).join("");
  const targets = item.targets.map(target => `<div class="drop-zone" data-target="${e(target.id)}"><span>${e(target.label)}</span><div class="drop-slot">Suelta aquí</div></div>`).join("");
  return `<div class="drag-activity"><div class="drag-bank" aria-label="Elementos para arrastrar">${tokens}</div><div class="drop-grid">${targets}</div><div class="toolbar"><button class="btn primary" id="checkDragDiagnostic">Revisar</button><button class="btn" id="clearDragDiagnostic">Limpiar</button></div></div>`;
}

function renderDragOrder(item) {
  const tokens = item.items.map(token => `<button class="drag-token" draggable="true" data-token="${e(token.id)}">${e(token.label)}</button>`).join("");
  const targets = item.answer.map((_, index) => `<div class="drop-zone order-zone" data-order="${index}"><span>${index + 1}</span><div class="drop-slot">Suelta aquí</div></div>`).join("");
  return `<div class="drag-activity"><div class="drag-bank" aria-label="Elementos para ordenar">${tokens}</div><div class="drop-grid order-grid">${targets}</div><div class="toolbar"><button class="btn primary" id="checkDragDiagnostic">Revisar</button><button class="btn" id="clearDragDiagnostic">Limpiar</button></div></div>`;
}

function bindDragMatch(item) {
  bindDragShared();
  document.querySelectorAll(".drop-zone").forEach(zone => {
    zone.addEventListener("click", () => placeSelectedToken(zone));
    zone.addEventListener("dragover", allowDrop);
    zone.addEventListener("drop", ev => {
      ev.preventDefault();
      placeToken(ev.dataTransfer.getData("text/plain"), zone);
    });
  });
  $("#checkDragDiagnostic").onclick = () => checkDiagnostic(readDragMatch(item));
  $("#clearDragDiagnostic").onclick = resetDragActivity;
}

function bindDragOrder(item) {
  bindDragShared();
  document.querySelectorAll(".drop-zone").forEach(zone => {
    zone.addEventListener("click", () => placeSelectedToken(zone));
    zone.addEventListener("dragover", allowDrop);
    zone.addEventListener("drop", ev => {
      ev.preventDefault();
      placeToken(ev.dataTransfer.getData("text/plain"), zone);
    });
  });
  $("#checkDragDiagnostic").onclick = () => checkDiagnostic(readDragOrder(item));
  $("#clearDragDiagnostic").onclick = resetDragActivity;
}

function bindDragShared() {
  document.querySelectorAll(".drag-token").forEach(token => {
    token.addEventListener("dragstart", ev => {
      ev.dataTransfer.setData("text/plain", token.dataset.token);
      selectToken(token.dataset.token);
    });
    token.addEventListener("click", () => selectToken(token.dataset.token));
  });
}

function allowDrop(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.add("drop-ready");
  ev.currentTarget.addEventListener("dragleave", () => ev.currentTarget.classList.remove("drop-ready"), { once: true });
}

function selectToken(tokenId) {
  state.dragSelection = tokenId;
  document.querySelectorAll(".drag-token").forEach(token => token.classList.toggle("selected", token.dataset.token === tokenId));
}

function placeSelectedToken(zone) {
  if (state.dragSelection) placeToken(state.dragSelection, zone);
}

function placeToken(tokenId, zone) {
  const token = document.querySelector(`[data-token="${CSS.escape(tokenId)}"]`);
  if (!token || token.disabled) return;

  const oldZone = token.closest(".drop-zone");
  if (oldZone) oldZone.querySelector(".drop-slot").textContent = "Suelta aquí";

  const existing = zone.querySelector(".drag-token");
  if (existing) document.querySelector(".drag-bank").appendChild(existing);

  zone.querySelector(".drop-slot").textContent = "";
  zone.appendChild(token);
  zone.classList.remove("drop-ready");
  token.classList.remove("selected");
  state.dragSelection = null;
}

function resetDragActivity() {
  document.querySelectorAll(".drop-zone").forEach(zone => {
    const token = zone.querySelector(".drag-token");
    if (token) document.querySelector(".drag-bank").appendChild(token);
    zone.querySelector(".drop-slot").textContent = "Suelta aquí";
    zone.classList.remove("drop-ready");
  });
  state.dragSelection = null;
}

function readDragMatch(item) {
  const answer = {};
  for (const target of item.targets) {
    const token = document.querySelector(`[data-target="${CSS.escape(target.id)}"] .drag-token`);
    if (token) answer[token.dataset.token] = target.id;
  }
  return answer;
}

function readDragOrder(item) {
  return item.answer.map((_, index) => {
    const token = document.querySelector(`[data-order="${index}"] .drag-token`);
    return token ? token.dataset.token : "";
  });
}

function checkDiagnostic(value) {
  const item = state.diagnosticItems[state.diagnosticIndex];
  let points = 0;
  let ok = false;

  if (item.type === "observation") {
    points = item.score[value] || 0;
    ok = points >= 1;
  } else if (item.type === "drag-match") {
    ok = Object.entries(item.answer).every(([tokenId, targetId]) => value[tokenId] === targetId);
    points = ok ? 1 : 0;
  } else if (item.type === "drag-order") {
    ok = item.answer.every((tokenId, index) => value[index] === tokenId);
    points = ok ? 1 : 0;
  } else {
    ok = [item.answer, ...(item.accepted || [])].map(n).includes(n(value));
    points = ok ? 1 : 0;
  }

  state.diagnosticScore += points;
  state.diagnosticAnswers.push({ skill: item.skill, points });
  $("#diagnosticFeedback").className = "feedback " + (ok ? "ok" : "bad");
  $("#diagnosticFeedback").innerHTML = `<strong>${ok ? "Respuesta registrada." : "Respuesta por reforzar."}</strong><br>${e(item.feedback || "")}`;
  $("#nextDiagnostic").disabled = false;
  $("#diagnosticBox").querySelectorAll("button,input").forEach(control => {
    control.disabled = true;
  });
}

function nextDiagnostic() {
  state.diagnosticIndex++;
  if (state.diagnosticIndex >= state.diagnosticItems.length) return showResult();
  renderDiagnostic();
}

function showResult() {
  $("#diagnosticRun").classList.add("hidden");
  $("#diagnosticResult").classList.remove("hidden");
  $("#diagnosticProgress").style.width = "100%";

  const pct = Math.round((state.diagnosticScore / state.diagnosticMax) * 100);
  let text = "Conviene reforzar niveles previos.";
  if (pct >= 80) text = "Nivel probablemente consolidado.";
  else if (pct >= 60) text = "Nivel en desarrollo; requiere práctica.";
  else if (pct >= 40) text = "Hay brechas importantes que conviene reforzar.";

  const weak = [...new Set(state.diagnosticAnswers.filter(answer => answer.points === 0).map(answer => answer.skill))];
  $("#diagnosticResult").innerHTML = `<div class="result-box"><h2>Resultado diagnóstico</h2><p>Puntaje: <strong>${state.diagnosticScore}/${state.diagnosticMax}</strong> (${pct}%)</p><p><strong>Interpretación:</strong> ${text}</p><p><strong>Áreas a reforzar:</strong> ${weak.length ? weak.map(e).join(", ") : "no se detectaron brechas críticas en esta prueba breve"}.</p><p class="small">Resultado orientativo; no reemplaza evaluación pedagógica formal.</p><div class="toolbar"><button class="btn primary" onclick="startDiagnostic()">Repetir diagnóstico</button><button class="btn" onclick="showPractice()">Practicar</button></div></div>`;
}

function showPractice() {
  location.hash = "practicar";
  $("#browseGrid").classList.add("hidden");
  $("#content").classList.add("hidden");
  $("#diagnostic").classList.add("hidden");
  $("#practice").classList.remove("hidden");
  $("#heroTitle").textContent = "Práctica interactiva";
  $("#heroDescription").textContent = "Ejercicios rápidos de numeración, operaciones, geometría, álgebra y datos.";
  renderPractice();
}

function renderPractice() {
  const exercise = state.practice[state.practiceIndex];
  $("#practiceCounter").textContent = `Ejercicio ${state.practiceIndex + 1} de ${state.practice.length}`;
  $("#practiceScore").textContent = `Puntaje: ${state.practiceCorrect}/${state.practiceAnswered}`;
  $("#practiceProgress").style.width = `${(state.practiceIndex / state.practice.length) * 100}%`;
  $("#practiceFeedback").className = "feedback";
  $("#nextPractice").disabled = true;

  let html = `<p class="small">${e(exercise.category)}</p><h3>${e(exercise.question)}</h3>`;
  if (exercise.type === "multiple-choice") html += `<div class="options">${exercise.options.map(option => `<button class="option" data-pa="${e(option)}">${e(option)}</button>`).join("")}</div>`;
  if (exercise.type === "fill") html += renderFill("practice");

  $("#practiceBox").innerHTML = html;
  document.querySelectorAll("[data-pa]").forEach(button => {
    button.onclick = () => checkPractice(button.dataset.pa);
  });
  const fill = $("#checkPracticeFill");
  if (fill) fill.onclick = () => checkPractice($("#practiceFill").value);
}

function checkPractice(value) {
  const exercise = state.practice[state.practiceIndex];
  const ok = [exercise.answer, ...(exercise.accepted || [])].map(n).includes(n(value));
  state.practiceAnswered++;
  if (ok) state.practiceCorrect++;

  $("#practiceFeedback").className = "feedback " + (ok ? "ok" : "bad");
  $("#practiceFeedback").innerHTML = `<strong>${ok ? "Correcto." : "Revisa la respuesta."}</strong><br>${e(exercise.explanation)}<br>Respuesta esperada: <strong>${e(exercise.answer)}</strong>`;
  $("#practiceScore").textContent = `Puntaje: ${state.practiceCorrect}/${state.practiceAnswered}`;
  $("#nextPractice").disabled = false;
  $("#practiceBox").querySelectorAll("button,input").forEach(control => {
    control.disabled = true;
  });
}

function nextPractice() {
  state.practiceIndex++;
  if (state.practiceIndex >= state.practice.length) {
    $("#practiceProgress").style.width = "100%";
    $("#practiceBox").innerHTML = `<h3>Práctica finalizada</h3><p>Resultado: <strong>${state.practiceCorrect}/${state.practiceAnswered}</strong></p>`;
    $("#nextPractice").disabled = true;
    return;
  }
  renderPractice();
}

function resetPractice() {
  state.practiceIndex = 0;
  state.practiceCorrect = 0;
  state.practiceAnswered = 0;
  renderPractice();
}

init().catch(err => {
  $("#article").innerHTML = `<p>No se pudo cargar el proyecto. Ejecuta <code>python3 -m http.server 8080</code>.</p><pre>${e(err.message)}</pre>`;
});
