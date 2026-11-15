/* Página inicial (index.html): números da abertura, "o mais pedido", categorias e mais vendidos. */
(function () {
    "use strict";

    const categorias = Fx.resumoCategorias();
    const maisVendidos = Fx.maisVendidos(6);
    const pratoDaCasa = maisVendidos[0];

    document.getElementById("totalProdutos").textContent = categorias.reduce((s, c) => s + c.quantidade, 0) + " pratos";
    document.getElementById("freteGratis").textContent = Fx.moeda0(Fx.loja.freteGratisAcimaDe);

    if (pratoDaCasa) {
        const cartao = document.getElementById("pratoDaCasa");
        cartao.href = `produto.html?id=${pratoDaCasa.id}`;
        cartao.innerHTML = `
            <img src="${pratoDaCasa.imagemUrl}" alt="" width="64" height="64" />
            <span>
                <small>O mais pedido</small>
                <strong>${Fx.esc(pratoDaCasa.nome)}</strong>
                <span class="abertura__preco">${Fx.moeda(pratoDaCasa.preco)}</span>
            </span>`;
        cartao.hidden = false;
    }

    document.getElementById("listaCategorias").innerHTML = categorias.map((c) => `
        <a class="card-categoria" href="cardapio.html?categoriaId=${c.categoria.id}">
            <span class="card-categoria__imagem"><img src="${c.imagemUrl}" alt="" loading="lazy" width="400" height="300" /></span>
            <span class="card-categoria__rotulo">
                <span class="card-categoria__nome">${Fx.esc(c.categoria.nome)}</span>
                <span class="card-categoria__qtd">${c.quantidade} ${c.quantidade === 1 ? "opção" : "opções"}</span>
            </span>
        </a>`).join("");

    document.getElementById("maisVendidos").innerHTML = maisVendidos.length
        ? maisVendidos.map(Fx.cardProduto).join("")
        : '<p class="alert alert-fx alert-fx--neutro">Nenhum produto disponível no momento.</p>';
})();
