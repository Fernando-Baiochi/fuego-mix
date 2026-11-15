/* Checkout (checkout.html): dados de entrega, pagamento e criação do pedido. */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    const esc = Fx.esc;
    const carrinho = Fx.carrinho();

    // Mesmas regras do CheckoutController.cs: sem carrinho válido, volta.
    if (!carrinho.podeFinalizar) {
        Fx.avisar("erro", carrinho.vazio ? "Seu carrinho está vazio. Escolha seus pratos no cardápio."
            : "Revise o carrinho antes de finalizar o pedido.");
        location.replace(carrinho.vazio ? "cardapio.html" : "carrinho.html");
        return;
    }

    // Preenche com os dados do perfil
    const u = Fx.usuario();
    const form = document.getElementById("formCheckout");
    form.elements.NomeCliente.value = u.nomeCompleto;
    form.elements.Telefone.value = u.telefone || "";
    form.elements.EnderecoEntrega.value = Fx.enderecoCompleto(u); // "Rua, nº - Bairro, Cidade/UF - CEP" (igual ao C#)
    form.elements.Complemento.value = u.complemento || "";
    form.elements.SalvarEnderecoNoPerfil.checked = !u.endereco;   // sem endereço no perfil, já vem marcado

    // ===== Resumo (era _ResumoItens.cshtml) =====
    document.getElementById("resumoItens").innerHTML = `
        <ul class="mini-itens">
            ${carrinho.itens.filter((i) => i.disponivel).map((i) => `
            <li>
                <img src="${i.imagemUrl}" alt="" />
                <span><strong>${esc(i.nome)}</strong><br /><span class="qtd">${i.quantidade} × ${Fx.moeda(i.precoUnitario)}</span></span>
                <span class="fw-bold">${Fx.moeda(i.subtotal)}</span>
            </li>`).join("")}
        </ul>
        <ul class="linhas-valor">
            <li><span>Subtotal</span><span>${Fx.moeda(carrinho.subtotal)}</span></li>
            ${carrinho.desconto > 0 ? `<li class="desconto"><span>Desconto (${esc(carrinho.cupomCodigo)})</span><span>− ${Fx.moeda(carrinho.desconto)}</span></li>` : ""}
            <li><span>Entrega</span><span>${carrinho.taxaEntrega === 0 ? "Grátis" : Fx.moeda(carrinho.taxaEntrega)}</span></li>
            <li class="total"><span>Total</span><span>${Fx.moeda(carrinho.total)}</span></li>
        </ul>`;

    // Regras de validação (mesmas do CheckoutViewModel)
    const regras = {
        NomeCliente: (v) => !v ? "Informe o nome de quem vai receber o pedido."
            : v.length < 3 || v.length > 120 ? "O nome deve ter entre 3 e 120 caracteres." : "",
        Telefone: (v) => !v ? "Informe um telefone para contato."
            : !Fx.telefoneValido(v) ? "Informe um telefone válido com DDD. Ex.: (11) 98765-4321." : "",
        EnderecoEntrega: (v) => !v ? "Informe o endereço de entrega."
            : v.length < 10 || v.length > 250 ? "Informe rua, número, bairro e cidade (mínimo de 10 caracteres)." : "",
        Complemento: (v) => v.length > 100 ? "O complemento deve ter no máximo 100 caracteres." : "",
        FormaPagamento: (v) => !v ? "Escolha a forma de pagamento." : "",
        TrocoPara: (v, f) => f.elements.FormaPagamento.value === "DinheiroNaEntrega" && v !== "" && (isNaN(Number(v)) || Number(v) < 0 || Number(v) > 10000) ? "Informe um valor de troco válido." : "",
        Observacoes: (v) => v.length > 500 ? "As observações devem ter no máximo 500 caracteres." : ""
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!Fx.validar(form, regras)) return;

        const valor = (nome) => form.elements[nome].value.trim();
        const troco = valor("TrocoPara");
        const resultado = Fx.criarPedido({
            nomeCliente: valor("NomeCliente"),
            telefone: valor("Telefone"),
            enderecoEntrega: valor("EnderecoEntrega"),
            complemento: valor("Complemento"),
            formaPagamento: form.elements.FormaPagamento.value,
            trocoPara: troco === "" ? null : Number(troco),
            observacoes: valor("Observacoes"),
            salvarEndereco: form.elements.SalvarEnderecoNoPerfil.checked
        });

        if (!resultado.sucesso) {
            if (resultado.campo) Fx.erroCampo(form, resultado.campo, resultado.mensagem);
            else Fx.erroGeral(form, resultado.mensagem);
            return;
        }
        Fx.avisar("sucesso", resultado.mensagem);
        Fx.irPara(`confirmacao.html?id=${resultado.id}`);
    });
})();
