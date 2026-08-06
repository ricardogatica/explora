const state = {
  manifest: [],
  exercises: [],
  currentPage: "inicio",
  practiceIndex: 0,
  correct: 0,
  answered: 0
};

const $ = (selector) => document.querySelector(selector);

function normalize(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markdownToHtml(markdown) {
  let html = escapeHtml(markdown);

  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = convertTables(html);
  html = convertLists(html);
  html = convertBlockquotes(html);

  const blocks = html.split(/\n{2,}/).map(block => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (/^<(h1|h2|h3|ul|ol|table|blockquote)/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
  });

  return blocks.join("\n");
}

function convertTables(html) {
  const lines = html.split("\n");
  const output = [];
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
      output.push("<table><thead><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr></thead><tbody>" +
        rows.map(row => "<tr>" + row.map(cell => `<td>${cell}</td>`).join("") + "</tr>").join("") +
        "</tbody></table>");
    } else {
      output.push(lines[i]);
      i++;
    }
  }

  return output.join("\n");
}

function convertLists(html) {
  const lines = html.split("\n");
  const output = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    if (/^- /.test(line)) {
      if (!inUl) {
        output.push("<ul>");
        inUl = true;
      }
      output.push(`<li>${line.replace(/^- /, "")}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (!inOl) {
        output.push("<ol>");
        inOl = true;
      }
      output.push(`<li>${line.replace(/^\d+\. /, "")}</li>`);
    } else {
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        output.push("</ol>");
        inOl = false;
      }
      output.push(line);
    }
  }

  if (inUl) output.push("</ul>");
  if (inOl) output.push("</ol>");

  return output.join("\n");
}

function convertBlockquotes(html) {
  return html.replace(/^&gt; (.*)$/gm, "<blockquote>$1</blockquote>");
}

async function init() {
  const [manifestRes, exercisesRes] = await Promise.all([
    fetch("data/manifest.json"),
    fetch("data/exercises.json")
  ]);

  state.manifest = await manifestRes.json();
  state.exercises = await exercisesRes.json();

  renderNav(state.manifest);
  bindEvents();

  const fromHash = location.hash.replace("#", "");
  if (fromHash === "practicar") {
    showPractice();
  } else {
    await loadPage(fromHash || "inicio");
  }
}

function renderNav(items) {
  const groups = {};
  for (const item of items) {
    groups[item.category] = groups[item.category] || [];
    groups[item.category].push(item);
  }

  const nav = $("#nav");
  nav.innerHTML = "";

  for (const [category, pages] of Object.entries(groups)) {
    const title = document.createElement("div");
    title.className = "nav-group-title";
    title.textContent = category;
    nav.appendChild(title);

    for (const page of pages) {
      const btn = document.createElement("button");
      btn.className = "nav-link";
      btn.dataset.page = page.id;
      btn.textContent = page.title;
      btn.addEventListener("click", () => loadPage(page.id));
      nav.appendChild(btn);
    }
  }
}

function bindEvents() {
  $("#search").addEventListener("input", (event) => {
    const term = event.target.value.toLowerCase();
    const filtered = state.manifest.filter(item =>
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
    renderNav(filtered.length ? filtered : state.manifest);
  });

  $("#practiceBtn").addEventListener("click", showPractice);
  $("#homeBtn").addEventListener("click", () => loadPage("inicio"));
  $("#nextExercise").addEventListener("click", nextExercise);
  $("#resetPractice").addEventListener("click", resetPractice);
  window.addEventListener("hashchange", () => {
    const id = location.hash.replace("#", "");
    if (id && id !== state.currentPage && id !== "practicar") loadPage(id);
    if (id === "practicar") showPractice();
  });
}

async function loadPage(id) {
  const page = state.manifest.find(item => item.id === id) || state.manifest[0];
  state.currentPage = page.id;
  location.hash = page.id;

  $("#practice").classList.add("hidden");
  $("#content").classList.remove("hidden");
  $("#heroTitle").textContent = page.title;
  $("#heroDescription").textContent = page.description;

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page.id);
  });

  const res = await fetch(`pages/${page.id}.md`);
  const md = await res.text();
  $("#article").innerHTML = markdownToHtml(md);
}

function showPractice() {
  location.hash = "practicar";
  $("#content").classList.add("hidden");
  $("#practice").classList.remove("hidden");
  $("#heroTitle").textContent = "Practicar";
  $("#heroDescription").textContent = "Ejercicios interactivos de ortografía, gramática y redacción.";
  document.querySelectorAll(".nav-link").forEach(btn => btn.classList.remove("active"));
  renderExercise();
}

function renderExercise() {
  const ex = state.exercises[state.practiceIndex];
  $("#exerciseCounter").textContent = `Ejercicio ${state.practiceIndex + 1} de ${state.exercises.length}`;
  $("#score").textContent = `Puntaje: ${state.correct}/${state.answered}`;
  $("#progressBar").style.width = `${(state.practiceIndex / state.exercises.length) * 100}%`;
  $("#feedback").className = "feedback";
  $("#feedback").textContent = "";
  $("#nextExercise").disabled = true;

  const box = $("#exerciseBox");
  let html = `<p class="small">${ex.category}</p><h3>${ex.question}</h3>`;

  if (ex.type === "multiple-choice") {
    html += `<div class="options">` + ex.options.map(opt =>
      `<button class="option" data-answer="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`
    ).join("") + `</div>`;
  }

  if (ex.type === "fill") {
    html += `
      <input class="fill-input" id="fillInput" placeholder="Escribe tu respuesta aquí">
      <div class="toolbar">
        <button class="btn primary" id="checkFill">Revisar</button>
      </div>
    `;
  }

  box.innerHTML = html;

  box.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => checkAnswer(btn.dataset.answer));
  });

  const checkFill = $("#checkFill");
  if (checkFill) {
    checkFill.addEventListener("click", () => checkAnswer($("#fillInput").value));
    $("#fillInput").addEventListener("keydown", event => {
      if (event.key === "Enter") checkAnswer($("#fillInput").value);
    });
  }
}

function checkAnswer(value) {
  const ex = state.exercises[state.practiceIndex];
  const accepted = [ex.answer, ...(ex.accepted || [])].map(normalize);
  const isCorrect = accepted.includes(normalize(value));

  state.answered++;
  if (isCorrect) state.correct++;

  const feedback = $("#feedback");
  feedback.className = "feedback " + (isCorrect ? "ok" : "bad");
  feedback.innerHTML = `<strong>${isCorrect ? "Correcto." : "Revisa la respuesta."}</strong><br>${ex.explanation}<br><br><span>Respuesta esperada: <strong>${escapeHtml(ex.answer)}</strong></span>`;

  $("#score").textContent = `Puntaje: ${state.correct}/${state.answered}`;
  $("#nextExercise").disabled = false;

  $("#exerciseBox").querySelectorAll("button, input").forEach(el => {
    if (el.id !== "nextExercise") el.disabled = true;
  });
}

function nextExercise() {
  state.practiceIndex++;
  if (state.practiceIndex >= state.exercises.length) {
    $("#progressBar").style.width = "100%";
    $("#exerciseBox").innerHTML = `
      <h3>Práctica finalizada</h3>
      <p>Resultado: <strong>${state.correct}/${state.answered}</strong></p>
      <p>Repite la práctica para reforzar las reglas con mayor dificultad.</p>
    `;
    $("#feedback").className = "feedback";
    $("#nextExercise").disabled = true;
    return;
  }
  renderExercise();
}

function resetPractice() {
  state.practiceIndex = 0;
  state.correct = 0;
  state.answered = 0;
  renderExercise();
}

init().catch(error => {
  $("#article").innerHTML = `<p>No se pudo cargar el proyecto. Si abriste el archivo directamente y tu navegador bloquea la carga local de archivos JSON/MD, ejecuta un servidor local con: <code>python3 -m http.server</code>.</p><pre>${escapeHtml(error.message)}</pre>`;
});
