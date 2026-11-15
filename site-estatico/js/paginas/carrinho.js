/* Carrinho (carrinho.html): itens, quantidades, cupom e resumo. Redesenha a cada alteração. */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    const esc = Fx.esc;
    const alvo = document.getElementById("carrinho");

    function desenhar() {
        const c = Fx.carrinho();

        // Cupom deixou de valer (ex.: removeu itens e ficou abaixo do mínimo): avisa e descarta
        if (c.avisoCupom) {
            Fx.removerCupom();
            if (!c.vazio) Fx.alertaTopo("erro", "Cupom removido: " + c.avisoCupom);
            return desenhar();
        }

        if (c.vazio) {
            alvo.innerHTML = `
                <div class="estado-vazio">
                    <div class="estado-vazio__icone"><i class="bi bi-bag" aria-hidden="true"></i></div>
                    <h2 class="estado-vazio__titulo">Seu carrinho está vazio</h2>
                    <p class="estado-vazio__texto">Que tal começar por um Taco Clássico ou pelo nosso Combo Fuego?</p>
                    <a class="btn btn-fx-primario btn-lg-fx" href="cardapio.html">Explorar Cardápio</a>
                </div>`;
            return;
        }

        const progressoFrete = c.freteGratisAcimaDe > 0
            ? Math.min(100, Math.floor((c.subtotal - c.desconto) / c.freteGratisAcimaDe * 100)) : 100;

        const itens = c.itens.map((item) => `
            <article class="item-carrinho ${item.disponivel ? "" : "item-carrinho--indisponivel"}">
                <div class="item-carrinho__img"><img src="${item.imagemUrl}" alt="" /></div>
                <div class="item-carrinho__info">
                    <h2 class="item-carrinho__nome"><a href="produto.html?id=${item.produtoId}">${esc(item.nome)}</a></h2>
                    <span class="item-carrinho__meta">
                        ${item.disponivel
                            ? `<span class="d-md-none">${Fx.moeda(item.precoUnitario)} cada</span><span class="d-none d-md-inline">${esc(item.categoria)}</span>`
                            : '<span class="texto-vermelho fw-bold">Indisponível</span>'}
                    </span>
                </div>
                <div class="item-carrinho__unitario">${Fx.moeda(item.precoUnitario)}</div>

                <div class="item-carrinho__qtd">
                    ${item.disponivel ? `
                    <div class="seletor-qtd" role="group" aria-label="Quantidade de ${esc(item.nome)}">
                        <button type="button" data-alterar="${item.produtoId}" data-nova-qtd="${item.quantidade - 1}"
                                aria-label="Diminuir quantidade de ${esc(item.nome)}" ${item.quantidade <= 1 ? "disabled" : ""}>
                            <i class="bi bi-dash-lg" aria-hidden="true"></i>
                        </button>
                        <output aria-live="polite">${item.quantidade}</output>
                        <button type="button" data-alterar="${item.produtoId}" data-nova-qtd="${item.quantidade + 1}"
                                aria-label="Aumentar quantidade de ${esc(item.nome)}" ${item.quantidade >= c.quantidadeMaximaPorItem ? "disabled" : ""}>
                            <i class="bi bi-plus-lg" aria-hidden="true"></i>
                        </button>
                    </div>` : `<span class="texto-suave">${item.quantidade} un.</span>`}
                </div>

                <div class="item-carrinho__subtotal">${item.disponivel ? Fx.moeda(item.subtotal) : "—"}</div>

                <div class="item-carrinho__remover">
                    <button type="button" class="btn btn-fx-link btn-fx-icone" data-remover="${item.produtoId}" data-nome="${esc(item.nome)}"
                            aria-label="Remover ${esc(item.nome)} do carrinho" title="Remover">
                        <i class="bi bi-trash3" aria-hidden="true"></i>
                    </button>
                </div>
            </article>`).join("");

        const cupom = c.cupomCodigo
            ? `<div class="cupom-aplicado">
                   <span><i class="bi bi-ticket-perforated-fill" aria-hidden="true"></i> <strong>${esc(c.cupomCodigo)}</strong> aplicado</span>
                   <button type="button" class="btn btn-fx-link btn-sm-fx p-0" style="min-height:auto" data-remover-cupom>Remover</button>
               </div>`
            : `<form class="form-cupom" id="formCupom">
                   <label for="codigoCupom" class="visually-hidden">Cupom de desconto</label>
                   <input type="text" class="form-control" id="codigoCupom" name="codigo" placeholder="Cupom de desconto" maxlength="30" autocomplete="off" />
                   <button type="submit" class="btn btn-fx-contorno">Aplicar</button>
               </form>`;

        alvo.innerHTML = `
            <p class="texto-suave mb-4">${c.quantidadeItens} ${c.quantidadeItens === 1 ? "item" : "itens"} no carrinho. Os valores são conferidos com o cardápio a cada atualização.</p>

            <div class="layout-compra">
                <section aria-label="Itens do carrinho">
                    ${c.temItemIndisponivel ? `
                    <div class="alert alert-fx alert-fx--info mb-3" role="status">
                        <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                        <span>Alguns itens ficaram indisponíveis e não entram no total. Remova-os para finalizar o pedido.</span>
                    </div>` : ""}

                    <div class="lista-carrinho">
                        <div class="lista-carrinho__cabecalho" aria-hidden="true">
                            <span>Produto</span><span>Preço</span><span>Quantidade</span><span>Subtotal</span><span></span>
                        </div>
                        ${itens}
                    </div>

                    <a class="btn btn-fx-contorno mt-3" href="cardapio.html">
                        <i class="bi bi-arrow-left" aria-hidden="true"></i> Continuar comprando
                    </a>
                </section>

                <aside class="resumo-pedido" aria-labelledby="resumo-titulo">
                    <h2 id="resumo-titulo">Resumo do pedido</h2>

                    ${c.freteGratisAcimaDe > 0 ? `
                    <div class="progresso-frete">
                        ${c.faltaParaFreteGratis > 0
                            ? `<span>Faltam <strong>${Fx.moeda(c.faltaParaFreteGratis)}</strong> para ganhar <strong>frete grátis</strong>.</span>`
                            : '<span class="texto-verde fw-bold"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Você ganhou frete grátis!</span>'}
                        <div class="progress" role="progressbar" aria-label="Progresso para frete grátis" aria-valuenow="${progressoFrete}" aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar" style="width: ${progressoFrete}%"></div>
                        </div>
                    </div>` : ""}

                    ${cupom}

                    <ul class="linhas-valor">
                        <li><span>Subtotal dos produtos</span><span>${Fx.moeda(c.subtotal)}</span></li>
                        ${c.desconto > 0 ? `<li class="desconto"><span>Desconto (${esc(c.cupomCodigo)})</span><span>− ${Fx.moeda(c.desconto)}</span></li>` : ""}
                        <li><span>Entrega</span><span>${c.taxaEntrega === 0 ? "Grátis" : Fx.moeda(c.taxaEntrega)}</span></li>
                        <li class="total"><span>Total</span><span>${Fx.moeda(c.total)}</span></li>
                    </ul>

                    ${c.atingiuPedidoMinimo ? "" : `<p class="alert alert-fx alert-fx--info small mb-3"><i class="bi bi-info-circle-fill" aria-hidden="true"></i> <span>Pedido mínimo de ${Fx.moeda(c.pedidoMinimo)}.</span></p>`}

                    ${c.podeFinalizar
                        ? '<a class="btn btn-fx-primario btn-lg-fx" href="checkout.html">Finalizar pedido <i class="bi bi-arrow-right" aria-hidden="true"></i></a>'
                        : '<button class="btn btn-fx-primario btn-lg-fx" type="button" disabled>Finalizar pedido</button>'}
                    <p class="small texto-suave text-center mt-3 mb-0"><i class="bi bi-shield-lock" aria-hidden="true"></i> Pagamento somente na entrega.</p>
                </aside>
            </div>`;
    }

    function depoisDeAlterar() {
        desenhar();
        Fx.atualizarContador();
    }

    alvo.addEventListener("click", async (e) => {
        const alterar = e.target.closest("[data-alterar]");
        if (alterar) {
            Fx.alterarQuantidade(Number(alterar.dataset.alterar), Number(alterar.dataset.novaQtd));
            return depoisDeAlterar();
        }
        const remover = e.target.closest("[data-remover]");
        if (remover) {
            if (!(await Fx.confirmar(`Remover "${remover.dataset.nome}" do carrinho?`))) return;
            Fx.remover(Number(remover.dataset.remover));
            Fx.toast(`"${remover.dataset.nome}" removido do carrinho.`, true);
            return depoisDeAlterar();
        }
        if (e.target.closest("[data-remover-cupom]")) {
            Fx.removerCupom();
            Fx.toast("Cupom removido.", true);
            desenhar();
        }
    });

    alvo.addEventListener("submit", (e) => {
        if (e.target.id !== "formCupom") return;
        e.preventDefault();
        const resultado = Fx.aplicarCupom(e.target.elements.codigo.value);
        Fx.toast(resultado.mensagem, resultado.sucesso);
        if (resultado.sucesso) desenhar();
    });

    desenhar();
})();
