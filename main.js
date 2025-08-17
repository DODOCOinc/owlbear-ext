import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/dist/index.esm.js";

const $ = (s) => document.querySelector(s);
const log = (m) => { const el = $("#log"); el.textContent += (el.textContent ? "\n" : "") + m; };

function setCtx(txt){ $("#ctx").textContent = txt; }

async function boot(){
  if (!OBR.isAvailable) {
    setCtx("Fora do Owlbear ⚠️ — abra pelo botão da extensão dentro da mesa.");
  } else {
    setCtx("Rodando dentro do Owlbear ✅");
  }

  $("#ping").addEventListener("click", async ()=>{
    if (!OBR.isAvailable) return alert("Abra dentro do Owlbear.");
    await OBR.notification.show("👋 Olá da minha extensão!");
    log("Ping enviado.");
  });

  $("#notify").addEventListener("click", async ()=>{
    if (!OBR.isAvailable) return alert("Abra dentro do Owlbear.");
    await OBR.notification.show("🔔 Notificação de teste.");
  });

  $("#close").addEventListener("click", async ()=>{
    if (!OBR.isAvailable) return;
    await OBR.popover.close();
  });
}

boot();
