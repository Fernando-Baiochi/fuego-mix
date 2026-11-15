/* Detalhes do pedido (pedido.html?id=N): rastreio animado ao vivo, código de entrega, itens, entrega e cancelamento. */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    const esc = Fx.esc;
    const alvo = document.getElementById("paginaPedido");
    const id = Fx.parametro("id");
    let p = Fx.pedido(id);

    if (!p) {
        document.title = "Página não encontrada | FUEGO MX";
        alvo.outerHTML = Fx.paginaNaoEncontrada();
        return;
    }

    document.title = `Pedido nº ${p.id} | FUEGO MX`;
    const endereco = esc(p.enderecoEntrega) + (p.complemento ? " - " + esc(p.complemento) : "");
    const ator = window.FxCena ? FxCena.personagemDoPedido(p.id) : { id: "", nome: "O entregador", frase: "Bom apetite!" };
    const PIX_LINK = "https://www.google.com/goto?url=CAESYwHrOzAVR8mJIVCAsz1xtBx2j7j3tMOHgtW1FHsE9agLm3wDEkjoXexJl8D9ysPn4loA9bfzMwo-P5Ipgc-n-CF8kz4xOtRmxSUjkD0NqgqQ0ikzr-FvdMmXbg4hr3oMDuVqZw";

    const TEXTOS = {
        aguardando: ["Pedido recebido!", "A cozinha já recebeu o seu pedido e vai confirmá-lo em instantes."],
        preparo: ["Em preparação", "Nossa equipe está preparando tudo na hora, do jeito que você pediu."],
        caminho: ["Saiu para entrega", `${ator.nome} está a caminho com o seu pedido.`],
        chegou: ["O entregador chegou!", `${ator.nome} está na sua porta. Informe o código de entrega para receber o pedido.`],
        entregue: ["Pedido entregue", "Bom apetite! Obrigado por pedir no FUEGO MX."]
    };

    alvo.innerHTML = `
        <nav class="trilha trilha--clara" aria-label="Você está em">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="pedidos.html">Meus pedidos</a></li>
                <li class="breadcrumb-item active" aria-current="page">Pedido nº ${p.id}</li>
            </ol>
        </nav>

        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
                <h1 class="secao__titulo mb-1">Pedido nº ${p.id}</h1>
                <span class="texto-suave">Realizado em ${Fx.dataHora(p.dataPedido)}</span>
            </div>
            <span id="seloPedido"></span>
        </div>

        <section class="cartao rastreio mb-4" id="rastreio" aria-labelledby="rastreio-titulo">
            <div class="rastreio__cena" id="rastreioCena"></div>
            <div class="rastreio__info">
                <span class="secao__rotulo">Acompanhe ao vivo</span>
                <h2 class="rastreio__titulo" id="rastreio-titulo"></h2>
                <p class="rastreio__texto" id="rastreioTexto" aria-live="polite"></p>
                <div class="rastreio__barra" role="progressbar" aria-label="Andamento da entrega" aria-valuemin="0" aria-valuemax="100"><span id="rastreioBarra"></span></div>
                <p class="rastreio__contagem" id="rastreioContagem"></p>
                <p class="codigo-entrega" id="codigoEntrega">Seu código de entrega: <strong>${esc(p.codigoEntrega)}</strong></p>
                <form class="codigo-entrega__form" id="formCodigo" novalidate hidden>
                    <label class="form-label" for="campoCodigo">Código de entrega</label>
                    <div class="d-flex gap-2">
                        <input class="form-control" id="campoCodigo" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="0000" />
                        <button type="submit" class="btn btn-fx-primario"><i class="bi bi-check2" aria-hidden="true"></i> Confirmar</button>
                    </div>
                    <p class="field-validation-error" id="erroCodigo" role="alert" hidden></p>
                </form>
            </div>
        </section>

        <div class="cartao mb-4" id="linhaTempo"></div>

        <div class="row g-4">
            <div class="col-12 col-lg-7">
                <section class="cartao h-100" aria-labelledby="itens-titulo">
                    <h2 class="cartao__titulo" id="itens-titulo"><i class="bi bi-bag" aria-hidden="true"></i> Itens</h2>
                    ${Fx.itensPedido(p)}
                </section>
            </div>
            <div class="col-12 col-lg-5 d-grid gap-4">
                <section class="cartao" aria-labelledby="entrega-titulo">
                    <h2 class="cartao__titulo" id="entrega-titulo"><i class="bi bi-geo-alt" aria-hidden="true"></i> Entrega e pagamento</h2>
                    <dl class="dados-lista">
                        <div><dt>Recebedor</dt><dd>${esc(p.nomeCliente)} · ${esc(p.telefone)}</dd></div>
                        <div><dt>Endereço</dt><dd>${endereco}</dd></div>
                        <div><dt>Pagamento</dt><dd>${Fx.PAGAMENTOS[p.formaPagamento]}${p.trocoPara != null ? ` (troco para ${Fx.moeda(p.trocoPara)})` : ""}</dd></div>
                        ${p.observacoes ? `<div><dt>Observações</dt><dd>${esc(p.observacoes)}</dd></div>` : ""}
                    </dl>
                    ${p.formaPagamento === "PixDemonstrativo" ? `
                    <div class="pix-mini">
                        <img src="images/pix/qrcode-pix.svg" alt="QR Code para pagamento via PIX" width="120" height="120" />
                        <a class="btn btn-fx-contorno btn-sm-fx" href="${PIX_LINK}" target="_blank" rel="noopener">Abrir link de pagamento</a>
                    </div>` : ""}
                </section>
                <section class="cartao" aria-labelledby="historico-titulo">
                    <h2 class="cartao__titulo" id="historico-titulo"><i class="bi bi-clock-history" aria-hidden="true"></i> Histórico</h2>
                    <ul class="historico" id="historico"></ul>
                </section>
            </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-4">
            <a class="btn btn-fx-contorno" href="pedidos.html"><i class="bi bi-arrow-left" aria-hidden="true"></i> Todos os pedidos</a>
            <button type="button" class="btn btn-fx-perigo" id="cancelarPedido" hidden><i class="bi bi-x-circle" aria-hidden="true"></i> Cancelar pedido</button>
        </div>

        <p class="small texto-suave mt-4 mb-0"><i class="bi bi-info-circle" aria-hidden="true"></i>
            Versão de demonstração: sem painel administrativo, o pedido avança sozinho a cada 10 segundos
            (em preparação, saiu para entrega e chegada do entregador). Para receber, informe o código de entrega.</p>`;

    const $ = (x) => document.getElementById(x);
    let ultimaEtapa = null, ultimoHistorico = -1, ultimoStatus = -1;

    function atualizar() {
        p = Fx.pedido(id) || p;
        const r = Fx.etapaRastreio(p);

        if (p.status !== ultimoStatus) {
            $("seloPedido").innerHTML = Fx.seloStatus(p.status, "fs-6");
            $("linhaTempo").innerHTML = Fx.linhaTempo(p.status);
            $("cancelarPedido").hidden = p.status !== 0;
            ultimoStatus = p.status;
        }
        if (p.historico.length !== ultimoHistorico) {
            $("historico").innerHTML = p.historico.map((h) => `
                <li><strong>${Fx.STATUS[h.status].nome}</strong>
                    <small>${Fx.dataHora(h.data)}${h.observacao ? " · " + esc(h.observacao) : ""}</small></li>`).join("");
            ultimoHistorico = p.historico.length;
        }

        $("rastreio").hidden = r.etapa === "cancelado";
        if (r.etapa !== ultimaEtapa && r.etapa !== "cancelado") {
            // A cena só é trocada quando a etapa muda, para a animação não reiniciar a cada segundo
            $("rastreioCena").innerHTML = window.FxCena ? FxCena.cena(r.etapa, ator.id) : "";
            $("rastreio-titulo").textContent = TEXTOS[r.etapa][0];
            $("rastreioTexto").textContent = TEXTOS[r.etapa][1];
            $("formCodigo").hidden = r.etapa !== "chegou";
            $("codigoEntrega").hidden = r.etapa === "entregue";
            if (r.etapa === "chegou" && ultimaEtapa !== null) $("campoCodigo").focus();
            ultimaEtapa = r.etapa;
        }
        const pct = Math.round(r.progresso * 100);
        $("rastreioBarra").style.width = pct + "%";
        $("rastreioBarra").parentElement.setAttribute("aria-valuenow", String(pct));
        $("rastreioContagem").textContent = r.restante ? `Próxima etapa em ${r.restante} s` : "";
        if (r.etapa === "entregue" || r.etapa === "cancelado") clearInterval(relogio);
    }

    const relogio = setInterval(atualizar, 1000);
    atualizar();

    $("formCodigo").addEventListener("submit", (e) => {
        e.preventDefault();
        const erro = $("erroCodigo");
        const resultado = Fx.confirmarEntrega(p.id, $("campoCodigo").value);
        if (!resultado.sucesso) {
            erro.textContent = resultado.mensagem;
            erro.hidden = false;
            $("campoCodigo").classList.add("input-validation-error");
            $("campoCodigo").focus();
            return;
        }
        erro.hidden = true;
        Fx.toast(resultado.mensagem, true);
        atualizar();
    });

    $("cancelarPedido").addEventListener("click", async () => {
        if (!(await Fx.confirmar(`Deseja mesmo cancelar o pedido nº ${p.id}?`))) return;
        const resultado = Fx.cancelarPedido(p.id);
        Fx.avisar(resultado.sucesso ? "sucesso" : "erro", resultado.mensagem);
        location.reload();
    });
})();
