// main.js — Ficha Online (ler + editar barras no WP a partir do Owlbear)
import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/dist/index.esm.js";

const $  = (s) => document.querySelector(s);
const log = (m) => { const el = $("#log"); if (!el) return; el.textContent += (el.textContent ? "\n" : "") + m; };
const css = (el, obj) => Object.assign(el.style, obj);

// Metadados compartilhados na sala
const META_SITE = "ficha.site";
const META_ID   = "ficha.id";

let currentFicha = null;   // última ficha carregada
let currentSite  = "";     // url base do WP

async function boot(){
  // Preenche a UI a partir do room.metadata (se dentro do OBR)
  if (OBR.isAvailable) {
    await syncInputsFromRoom();
    OBR.room.onMetadataChange(syncInputsFromRoom);
  }

  $("#saveConn")?.addEventListener("click", saveConn);
  $("#loadFicha")?.addEventListener("click", loadFicha);

  // Se já tem dados, tenta auto-carregar
  const site = ($("#site")?.value || "").trim();
  const id   = ($("#charId")?.value || "").trim();
  if (site && id) loadFicha();
}

async function syncInputsFromRoom(){
  const meta = await OBR.room.getMetadata();
  if (!$("#site").value)  $("#site").value  = (meta[META_SITE] || "").replace(/\/+$/,"");
  if (!$("#charId").value)$("#charId").value= (meta[META_ID] || "");
}

async function saveConn(){
  const site = ($("#site").value || "").replace(/\/+$/,"");
  const id   = ($("#charId").value || "").trim();
  if (!site || !id) return alert("Informe site e ID.");

  if (OBR.isAvailable) {
    await OBR.room.setMetadata({ [META_SITE]: site, [META_ID]: id });
    log("Conexão salva na sala.");
    try { await OBR.notification.show("🔗 Conexão salva na sala"); } catch(_) {}
  } else {
    log("Conexão salva localmente (fora do Owlbear).");
  }
}

async function loadFicha(){
  const site = ($("#site").value || "").replace(/\/+$/,"");
  const id   = ($("#charId").value || "").trim();
  if (!site || !id) return alert("Informe site e ID.");

  const url = `${site}/wp-json/ficha/v1/characters/${encodeURIComponent(id)}`;
  try {
    currentSite = site;
    $("#fichaBox").style.display = "none";
    log(`Carregando ${url} …`);

    const res = await fetch(url, { method:"GET", mode:"cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ficha = await res.json();

    currentFicha = normalizeFicha(ficha);
    renderFicha(currentFicha);
    log("Ficha carregada.");
  } catch (e) {
    let msg = e?.message || String(e);
    if (/Failed to fetch|CORS/i.test(msg)) {
      msg += " (verifique CORS no WordPress p/ origem dodocoinc.github.io e app/owlbear.rodeo)";
    }
    log(`Falha ao carregar: ${msg}`);
    $("#fichaBox").style.display = "none";
  }
}

function normalizeFicha(f){
  const out = { ...f };
  out.bars = Array.isArray(f?.bars) ? f.bars.map(b => ({
    id:      String(b.id ?? (b.name || Date.now())),
    name:    String(b.name || "Barra"),
    max:     Number.isFinite(+b.max) ? +b.max : 10,
    current: Number.isFinite(+b.current) ? Math.max(0, Math.min(+b.current, Number.isFinite(+b.max)?+b.max:10)) : 0,
    color:   /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(b.color || "") ? b.color : "#4a90e2",
    charId:  f?.id
  })) : [];
  return out;
}

function renderFicha(f){
  // Cabeçalho
  $("#fichaBox").style.display = "block";
  $("#fName").textContent = f?.name || "(sem nome)";
  $("#fMeta").textContent = `ID: ${f?.id ?? "?"} • Usuário: ${f?.user ?? "?"}`;

  // Área das barras
  const wrap = $("#bars");
  wrap.innerHTML = "";

  // Botão adicionar barra
  const addRow = document.createElement("div");
  addRow.className = "row";
  const addBtn = document.createElement("button");
  addBtn.textContent = "➕ Adicionar Barra";
  addBtn.onclick = () => {
    const nid = String(Date.now());
    const nb = { id:nid, name:`Barra ${currentFicha.bars.length+1}`, max:10, current:10, color:"#4a90e2", charId: currentFicha.id };
    currentFicha.bars.push(nb);
    renderFicha(currentFicha);
  };
  addRow.appendChild(addBtn);
  wrap.appendChild(addRow);

  if (!f.bars.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Sem barras nesta ficha.";
    wrap.appendChild(empty);
    return;
  }

  // Render de cada barra com controles (−5 −1 +1 +5), input de valor e remover
  for (const b of f.bars) {
    const max = Number(b.max) || 10;
    const cur = Math.max(0, Math.min(max, Number(b.current) || 0));
    const pct = max ? Math.round((cur/max)*100) : 0;

    const row = document.createElement("div");
    row.style.margin = "14px 0";

    // título e valor
    const head = document.createElement("div");
    css(head, { display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px" });
    const left = document.createElement("div");
    left.textContent = b.name || "Barra";
    const right = document.createElement("div");
    right.className = "muted";
    right.textContent = `${cur} / ${max}`;
    head.appendChild(left);
    head.appendChild(right);

    // barra visual
    const barBg = document.createElement("div");
    barBg.className = "bar";
    const barFg = document.createElement("span");
    css(barFg, { width: pct+"%", background: b.color || "#4a90e2" });
    barBg.appendChild(barFg);

    // controles rápidos
    const ctrls = document.createElement("div");
    css(ctrls, { display:"flex", gap:"6px", alignItems:"center", marginTop:"6px", flexWrap:"wrap" });

    const mkBtn = (label, delta) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.onclick = () => {
        b.current = clamp((Number(b.current)||0) + delta, 0, Number(b.max)||10);
        renderFicha(currentFicha);
      };
      return btn;
    };

    const btnM5 = mkBtn("−5", -5);
    const btnM1 = mkBtn("−1", -1);
    const btnP1 = mkBtn("+1", +1);
    const btnP5 = mkBtn("+5", +5);

    // input direto do valor
    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.max = String(max);
    inp.value = String(cur);
    css(inp, { width:"84px", padding:"6px", borderRadius:"6px", border:"1px solid #2a2f4a", background:"#0f1220", color:"#fff" });
    inp.oninput = () => {
      const v = clamp(Number(inp.value)||0, 0, Number(b.max)||10);
      b.current = v;
      right.textContent = `${v} / ${b.max}`;
      barFg.style.width = (b.max ? Math.round((v/b.max)*100) : 0) + "%";
    };

    // remover
    const rm = document.createElement("button");
    rm.textContent = "🗑️";
    rm.title = "Remover barra";
    rm.onclick = () => {
      if (!confirm(`Remover “${b.name}”?`)) return;
      currentFicha.bars = currentFicha.bars.filter(x => x.id !== b.id);
      renderFicha(currentFicha);
    };

    ctrls.append(btnM5, btnM1, inp, btnP1, btnP5, rm);

    row.append(head, barBg, ctrls);
    wrap.appendChild(row);
  }

  // botão salvar todas as barras
  const saveAll = document.createElement("div");
  css(saveAll, { marginTop:"16px" });
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾 Salvar Barras no Site";
  saveBtn.onclick = () => saveBarsToServer().catch(e => log("Falha ao salvar: " + (e?.message||e)));
  saveAll.appendChild(saveBtn);
  wrap.appendChild(saveAll);
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

async function saveBarsToServer(){
  if (!currentFicha?.id) throw new Error("Ficha não carregada.");
  if (!currentSite)       throw new Error("Site não definido.");
  // Monta payload: reenvia a ficha inteira com bars atualizadas.
  const url = `${currentSite}/wp-json/ficha/v1/characters`;
  const body = {
    data: {
      ...currentFicha,
      bars: currentFicha.bars
    },
    // IMPORTANTE: a API de atualização exige o mesmo 'user' que já está salvo.
    // Usamos o user da própria ficha carregada:
    user: currentFicha.user || undefined
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body),
    mode: "cors"
  });

  if (!res.ok) {
    // O seu endpoint retorna 403 se 'user' não bater com o dono original.
    if (res.status === 403) throw new Error("Acesso negado (user diferente do dono da ficha).");
    throw new Error(`HTTP ${res.status}`);
  }
  const saved = await res.json();
  currentFicha = normalizeFicha(saved); // sincroniza
  renderFicha(currentFicha);
  log("Barras salvas no servidor.");
  try { await OBR.notification.show("✅ Barras salvas"); } catch(_) {}
}

boot();
