/* Confirmação do pedido (confirmacao.html?id=N). */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    const esc = Fx.esc;
    const alvo = document.getElementById("paginaConfirmacao");
    const p = Fx.pedido(Fx.parametro("id"));

    if (!p) {
        document.title = "Página não encontrada | FUEGO MX";
        alvo.outerHTML = Fx.paginaNaoEncontrada();
        return;
    }

    const s = Fx.STATUS[p.status];
    const pagamento = p.formaPagamento === "PixDemonstrativo"
        ? `<div class="aviso-pix mb-4" role="note">
               <img class="aviso-pix__qr" src="images/pix/qrcode-pix.svg" alt="QR Code para pagamento via PIX" width="200" height="200" />
               <div>
                   <h2 class="h5 mb-1">Pague com PIX</h2>
                   <p class="texto-suave">Aponte a câmera do celular para o QR Code ou abra o link de pagamento.</p>
                   <a class="btn btn-fx-primario" href="https://www.google.com/goto?url=CAESYwHrOzAVR8mJIVCAsz1xtBx2j7j3tMOHgtW1FHsE9agLm3wDEkjoXexJl8D9ysPn4loA9bfzMwo-P5Ipgc-n-CF8kz4xOtRmxSUjkD0NqgqQ0ikzr-FvdMmXbg4hr3oMDuVqZw" target="_blank" rel="noopener"><i class="bi bi-qr-code" aria-hidden="true"></i> Abrir link de pagamento</a>
               </div>
           </div>`
        : `<div class="alert alert-fx alert-fx--neutro mb-4" role="note">
               <i class="bi bi-wallet2" aria-hidden="true"></i>
               <span>Pagamento: <strong>${Fx.PAGAMENTOS[p.formaPagamento]}</strong>${p.trocoPara != null ? `, troco para ${Fx.moeda(p.trocoPara)}` : ""}.
                   O valor de <strong>${Fx.moeda(p.total)}</strong> será pago ao entregador.</span>
           </div>`;

    alvo.innerHTML = `
        <ol class="etapas justify-content-center" aria-label="Etapas da compra">
            <li class="feita">Carrinho</li>
            <li class="feita">Entrega e pagamento</li>
            <li class="atual" aria-current="step">Confirmação</li>
        </ol>

        <div class="text-center mb-4">
            <div class="confirmacao-icone"><i class="bi bi-check-lg" aria-hidden="true"></i></div>
            <h1 class="secao__titulo">Pedido nº ${p.id} recebido!</h1>
            <p class="texto-suave fs-5 mb-0">Obrigado, ${esc(Fx.primeiroNome(p.nomeCliente))}. Seu pedido foi registrado e está
                <span class="status ${s.css}">${s.nome}</span>.</p>
        </div>

        ${pagamento}

        <p class="codigo-entrega text-center mb-4">Seu código de entrega: <strong>${esc(p.codigoEntrega || "")}</strong><br />
            <small class="texto-suave">O entregador vai pedir este código quando chegar. Acompanhe ao vivo: o pedido avança a cada 10 segundos.</small></p>

        <section class="cartao mb-4" aria-labelledby="resumo-titulo">
            <h2 class="cartao__titulo" id="resumo-titulo"><i class="bi bi-receipt" aria-hidden="true"></i> Resumo</h2>
            ${Fx.itensPedido(p)}
            <p class="mt-3 mb-0 texto-suave"><i class="bi bi-geo-alt" aria-hidden="true"></i> Entrega em: <strong class="text-body">${esc(p.enderecoEntrega)}${p.complemento ? " - " + esc(p.complemento) : ""}</strong></p>
        </section>

        <div class="d-flex flex-wrap gap-2 justify-content-center">
            <a class="btn btn-fx-primario btn-lg-fx" href="pedido.html?id=${p.id}"><i class="bi bi-geo" aria-hidden="true"></i> Acompanhar pedido</a>
            <a class="btn btn-fx-contorno btn-lg-fx" href="cardapio.html">Voltar ao cardápio</a>
        </div>`;
})();
