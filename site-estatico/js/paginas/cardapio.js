/* Cardápio (cardapio.html): lê os filtros da URL, preenche o formulário e mostra os produtos. */
(function () {
    "use strict";

    const numero = (nome) => {
        const v = Fx.parametro(nome);
        return v === null || v.trim() === "" || isNaN(Number(v)) ? null : Number(v);
    };

    const f = {
        busca: (Fx.parametro("busca") || "").trim(),
        categoriaId: numero("categoriaId"),
        precoMin: numero("precoMin"),
        precoMax: numero("precoMax"),
        ordem: Fx.parametro("ordem") || ""
    };
    // Corrige faixa de preço invertida em vez de devolver lista vazia
    if (f.precoMin != null && f.precoMax != null && f.precoMin > f.precoMax) [f.precoMin, f.precoMax] = [f.precoMax, f.precoMin];

    const categorias = Fx.categorias();
    const selecionada = categorias.find((c) => c.id === f.categoriaId);
    if (!selecionada) f.categoriaId = null;
    const temFiltroPreco = f.precoMin != null || f.precoMax != null;
    const temFiltroAtivo = !!f.busca || f.categoriaId != null || temFiltroPreco;

    // ---- título
    if (selecionada) {
        document.getElementById("tituloCardapio").textContent = selecionada.nome;
        document.title = `${selecionada.nome} | FUEGO MX`;
    }

    // ---- formulário com os valores atuais
    const form = document.getElementById("formFiltros");
    if (f.categoriaId != null) {
        form.elements.categoriaId.value = f.categoriaId;
        form.elements.categoriaId.disabled = false;
    }
    form.elements.busca.value = f.busca;
    form.elements.ordem.value = f.ordem;
    if (f.precoMin != null) form.elements.precoMin.value = f.precoMin;
    if (f.precoMax != null) form.elements.precoMax.value = f.precoMax;
    if (temFiltroPreco) {
        document.getElementById("painelPreco").classList.add("show");
        document.getElementById("botaoPreco").setAttribute("aria-expanded", "true");
    }

    // Monta a URL sem campos vazios (fica cardapio.html?busca=taco em vez de ...&precoMin=&precoMax=)
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        ["categoriaId", "busca", "ordem", "precoMin", "precoMax"].forEach((n) => {
            const campo = form.elements[n];
            if (!campo.disabled && campo.value.trim() !== "") p.set(n, campo.value.trim());
        });
        const q = p.toString();
        Fx.irPara("cardapio.html" + (q ? "?" + q : ""));
    });
    // Ordenação: envia ao trocar a opção
    form.elements.ordem.addEventListener("change", () => form.requestSubmit());
    // Atalhos de faixa de preço
    form.querySelectorAll("[data-faixa-preco]").forEach((botao) => {
        botao.addEventListener("click", () => {
            const [min, max] = botao.dataset.faixaPreco.split("-");
            form.elements.precoMin.value = min;
            form.elements.precoMax.value = max;
            form.requestSubmit();
        });
    });

    // ---- chips de categoria (mantêm busca, ordem e preço)
    function urlCategoria(id) {
        const p = new URLSearchParams();
        if (id != null) p.set("categoriaId", id);
        if (f.busca) p.set("busca", f.busca);
        if (f.ordem) p.set("ordem", f.ordem);
        if (f.precoMin != null) p.set("precoMin", f.precoMin);
        if (f.precoMax != null) p.set("precoMax", f.precoMax);
        const q = p.toString();
        return "cardapio.html" + (q ? "?" + q : "");
    }
    const chip = (id, nome) => {
        const ativa = f.categoriaId === id;
        return `<a class="chip ${ativa ? "ativo" : ""}" ${ativa ? 'aria-current="page"' : ""} href="${urlCategoria(id)}">${Fx.esc(nome)}</a>`;
    };
    document.getElementById("chipsCategorias").innerHTML =
        chip(null, "Todos") + categorias.map((c) => chip(c.id, c.nome)).join("");

    // ---- resultado
    const produtos = Fx.buscarCardapio(f);
    let resumo = `<strong>${produtos.length}</strong> ${produtos.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
    if (f.busca) resumo += ` para "<strong>${Fx.esc(f.busca)}</strong>"`;
    if (temFiltroPreco) {
        resumo += " · preço " + (f.precoMin != null ? `de ${Fx.moeda0(f.precoMin)} ` : "") + (f.precoMax != null ? `até ${Fx.moeda0(f.precoMax)}` : "");
    }
    document.getElementById("resumoBusca").innerHTML = resumo;
    document.getElementById("limparFiltros").hidden = !temFiltroAtivo;

    document.getElementById("resultado").innerHTML = produtos.length === 0
        ? `<div class="estado-vazio">
               <div class="estado-vazio__icone"><i class="bi bi-search" aria-hidden="true"></i></div>
               <h2 class="estado-vazio__titulo">Nenhum prato encontrado</h2>
               <p class="estado-vazio__texto">Tente buscar por outro nome, mudar a categoria ou ampliar a faixa de preço.</p>
               <a class="btn btn-fx-primario" href="cardapio.html">Ver todo o cardápio</a>
           </div>`
        : `<div class="grade-produtos grade-produtos--4">${produtos.map(Fx.cardProduto).join("")}</div>`;
})();
