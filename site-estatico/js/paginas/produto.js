/* Detalhes do produto (produto.html?id=N). */
(function () {
    "use strict";

    const esc = Fx.esc;
    const alvo = document.getElementById("paginaProduto");
    const p = Fx.produto(Fx.parametro("id"));

    if (!p) {
        document.title = "Página não encontrada | FUEGO MX";
        alvo.outerHTML = Fx.paginaNaoEncontrada();
        return;
    }

    document.title = `${p.nome} | FUEGO MX`;
    const rotulosPicancia = ["Não picante", "Levemente picante", "Picante", "Muito picante"];
    const urlAqui = `produto.html?id=${p.id}`;
    const relacionados = Fx.relacionados(p, 3);

    let compra;
    if (!p.disponivel) {
        compra = `<div class="alert alert-fx alert-fx--info" role="status">
            <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
            <span>Este prato está temporariamente indisponível. Que tal conferir outras opções abaixo?</span></div>`;
    } else if (Fx.usuario()) {
        compra = `
            <form class="compra" data-form-adicionar="${p.id}">
                <div class="seletor-qtd" data-seletor-qtd>
                    <button type="button" data-qtd="-1" aria-label="Diminuir quantidade"><i class="bi bi-dash-lg" aria-hidden="true"></i></button>
                    <label for="quantidade" class="visually-hidden">Quantidade</label>
                    <input type="number" id="quantidade" name="quantidade" value="1" min="1" max="${Fx.loja.quantidadeMaximaPorItem}" inputmode="numeric" />
                    <button type="button" data-qtd="1" aria-label="Aumentar quantidade"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
                </div>
                <button type="submit" class="btn btn-fx-primario btn-lg-fx">
                    <i class="bi bi-bag-plus" aria-hidden="true"></i> Adicionar ao carrinho
                </button>
            </form>`;
    } else {
        compra = `
            <div class="compra">
                <a class="btn btn-fx-primario btn-lg-fx" href="login.html?returnUrl=${encodeURIComponent(urlAqui)}">
                    <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i> Entre para pedir
                </a>
                <a class="btn btn-fx-contorno btn-lg-fx" href="cadastro.html?returnUrl=${encodeURIComponent(urlAqui)}">Criar conta</a>
            </div>`;
    }

    alvo.innerHTML = `
        <nav class="trilha trilha--clara" aria-label="Você está em">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.html">Início</a></li>
                <li class="breadcrumb-item"><a href="cardapio.html">Cardápio</a></li>
                <li class="breadcrumb-item"><a href="cardapio.html?categoriaId=${p.categoriaId}">${esc(p.categoria.nome)}</a></li>
                <li class="breadcrumb-item active" aria-current="page">${esc(p.nome)}</li>
            </ol>
        </nav>

        <article class="detalhe-produto mt-3">
            <div class="detalhe-produto__imagem">
                <img src="${p.imagemUrl}" alt="Foto do prato ${esc(p.nome)}" width="800" height="600" />
                ${p.disponivel ? "" : '<span class="selo selo--escuro position-absolute top-0 start-0 m-3">Indisponível no momento</span>'}
            </div>

            <div>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="selo selo--claro">${esc(p.categoria.nome)}</span>
                    ${p.destaque ? '<span class="selo selo--amarelo"><i class="bi bi-star-fill" aria-hidden="true"></i> Mais pedido</span>' : ""}
                </div>
                <h1 class="detalhe-produto__nome">${esc(p.nome)}</h1>
                <span class="picancia">
                    ${[1, 2, 3].map((i) => `<i class="bi bi-fire ${i <= p.picancia ? "acesa" : ""}" aria-hidden="true"></i>`).join("")}
                    <span>${rotulosPicancia[Math.min(3, Math.max(0, p.picancia))]}</span>
                </span>
                <p class="detalhe-produto__descricao mt-3">${esc(p.descricao)}</p>
                <div class="detalhe-produto__preco">${Fx.moeda(p.preco)}</div>

                ${compra}

                <ul class="lista-info">
                    <li><i class="bi bi-clock-history" aria-hidden="true"></i> Preparado na hora, entrega em cerca de 40 minutos.</li>
                    <li><i class="bi bi-truck" aria-hidden="true"></i> Taxa de entrega de ${Fx.moeda(Fx.loja.taxaEntrega)}, grátis em pedidos acima de ${Fx.moeda(Fx.loja.freteGratisAcimaDe)}.</li>
                    <li><i class="bi bi-chat-left-text" aria-hidden="true"></i> Alguma restrição? Deixe uma observação no checkout.</li>
                </ul>
            </div>
        </article>

        ${relacionados.length ? `
        <section class="mt-5 pt-lg-4" aria-labelledby="relacionados-titulo">
            <h2 class="secao__titulo h3" id="relacionados-titulo">Combina com você</h2>
            <p class="texto-suave">Outras opções de ${esc(p.categoria.nome)}.</p>
            <div class="grade-produtos mt-3">${relacionados.map(Fx.cardProduto).join("")}</div>
        </section>` : ""}`;
})();
