// OBR já foi carregado via <script type="module"> do CDN acima
import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/dist/index.esm.js";

const $ = (s) => document.querySelector(s);
const log = (m) => { const el = $("#log"); el.textContent += (el.textContent ? "\n" : "") + m; };

async function boot() {
  // Verifica se estamos rodando dentro do Owlbear
  if (OBR.isAvailable) {
    $("#ctx").textContent = "Rodando dentro do Owlbear ✅";
  } else {
    $("#ctx").textContent =
      "Fora do Owlbear ⚠️ — abra pelo botão da extensão dentro da mesa.";
  }

  // Botões
  $("#ping").addEventListener("click", async () => {
    if (!OBR.isAvailable) return alert("Abra esta página dentro do Owlbear.");
    log("Enviando ping…");
    await OBR.notification.show("👋 Olá da minha extensão!");
    log("Ping OK.");
  });

  $("#notify").addEventListener("click", async () => {
    if (!OBR.isAvailable) return alert("Abra esta página dentro do Owlbear.");
    await OBR.notification.show("🔔 Notificação de teste (WP + Owlbear).");
  });

  $("#close").addEventListener("click", async () => {
    if (!OBR.isAvailable) return;
    // Fecha o popover da extensão
    await OBR.popover.close();
  });

  // Opcional: loga algumas infos de contexto
  if (OBR.isAvailable) {
    const room = await OBR.room.getMetadata();
    log("Contexto pronto. Metadata da sala disponível.");
  }
}

boot();
