import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/dist/index.esm.js";

const $ = (s) => document.querySelector(s);
const log = (m) => { $("#log").textContent += ($("#log").textContent ? "\n" : "") + m; };

// Chaves que ficam salvas na sala do Owlbear
const META_SITE = "ficha.site";
const META_ID   = "ficha.id";

async function boot() {
  if (OBR.isAvailable) {
    // Recupera se já existe conexão salva
    const meta = await OBR.room.getMetadata();
    $("#site").value   = meta[META_SITE] || "";
    $("#charId").value = meta[META_ID]   || "";

    // Atualiza quando outro usuário muda
    OBR.room.onMetadataChange(async () => {
      const m = await OBR.room.getMetadata();
      $("#site").value   = m[META_SITE] || "";
      $("#charId").value = m[META_ID]   || "";
    });
  }

  $("#saveConn").addEventListener("click", saveConn);
  $("#loadFicha").addEventListener("click", loadFicha);

  // Carrega automático se já tinha info salva
  if (OBR.isAvailable) {
    const m = await OBR.room.getMetadata();
    if (m[META_SITE] && m[META_ID]) {
      await loadFicha();
    }
  }
}

async function saveConn() {
  const site = ($("#site").value || "").replace(/\/+$/, "");
  const id   = ($("#charId").value || "").trim();
  if (!site || !id) return alert("Informe site e ID.");
  if (!OBR.isAvailable) return alert("Abra dentro do Owlbear.");

  await OBR.room.setMetadata({ [META_SITE]: site, [META_ID]: id });
  log("Conexão salva na sala.");
}

async function loadFicha() {
  const site = ($("#site").value || "").replace(/\/+$/, "");
  const id   = ($("#charId").value || "").trim();
  if (!site || !id) return alert("Informe site e ID.");

  const url = `${site}/wp-json/ficha/v1/characters/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ficha = await res.json();
    renderFicha(ficha);
    log(`Ficha carregada de ${url}`);
  } catch (e) {
    log(`Falha ao carregar: ${e.message}`);
    $("#fichaBox").style.display = "none";
  }
}

function renderFicha(f) {
  $("#fichaBox").style.display = "block";
  $("#fName").textContent = f?.name || "(sem nome)";
  $("#fMeta").textContent = `ID: ${f?.id || "?"} • Usuário: ${f?.user || "?"}`;

  const barsWrap = $("#bars");
  barsWrap.innerHTML = "";
  const bars = Array.isArray(f?.bars) ? f.bars : [];
  if (!bars.length) {
    barsWrap.innerHTML = `<div class="muted">Sem barras nesta ficha.</div>`;
    return;
  }
  for (const b of bars) {
    const max = Number(b.max) || 10;
    const cur = Math.max(0, Math.min(max, Number(b.current) || 0));
    const pct = max ? Math.round((cur / max) * 100) : 0;

    const row = document.createElement("div");
    row.style.margin = "10px 0";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>${b.name || "Barra"}</div>
        <div class="muted">${cur} / ${max}</div>
      </div>
      <div class="bar"><span style="width:${pct}%; background:${b.color || "#4a90e2"}"></span></div>
    `;
    barsWrap.appendChild(row);
  }
}

boot();
