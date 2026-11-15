/* Meus pedidos (pedidos.html). */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    const esc = Fx.esc;
    const pedidos = Fx.pedidos();

    document.getElementById("listaPedidos").innerHTML = pedidos.length === 0
        ? `<div class="estado-vazio">
               <div class="estado-vazio__icone"><i class="bi bi-receipt" aria-hidden="true"></i></div>
               <h2 class="estado-vazio__titulo">Você ainda não fez pedidos</h2>
               <p class="estado-vazio__texto">Quando fizer seu primeiro pedido, ele aparecerá aqui com o status atualizado.</p>
               <a class="btn btn-fx-primario btn-lg-fx" href="cardapio.html">Fazer meu primeiro pedido</a>
           </div>`
        : `<div class="lista-pedidos">${pedidos.map((p) => `
            <article class="card-pedido">
                <div class="d-grid gap-2">
                    <div class="card-pedido__topo">
                        <h2 class="card-pedido__numero">Pedido nº ${p.id}</h2>
                        ${Fx.seloStatus(p.status)}
                    </div>
                    <span class="card-pedido__data"><i class="bi bi-calendar3" aria-hidden="true"></i> ${Fx.dataHora(p.dataPedido)} · ${Fx.PAGAMENTOS[p.formaPagamento]}</span>
                    <p class="card-pedido__itens">${esc(p.itens.map((i) => `${i.quantidade}× ${i.nomeProduto}`).join(", "))}</p>
                    <span class="small texto-suave"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${esc(p.enderecoEntrega)}</span>
                </div>
                <div class="card-pedido__lado">
                    <span class="preco">${Fx.moeda(p.total)}</span>
                    <a class="btn btn-fx-contorno btn-sm-fx" href="pedido.html?id=${p.id}">
                        Ver detalhes <span class="visually-hidden">do pedido ${p.id}</span> <i class="bi bi-chevron-right" aria-hidden="true"></i>
                    </a>
                </div>
            </article>`).join("")}
          </div>`;
})();
