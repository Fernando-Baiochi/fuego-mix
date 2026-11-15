/* ==========================================================================
   FUEGO MX (versão estática): moldura do site
   Faz o papel do _Layout.cshtml: coloca cabeçalho/menu, avisos, rodapé, área de
   toasts e o modal de confirmação em todas as páginas. Também tem os "partials"
   reaproveitados (logo, card de produto, itens do pedido, linha do tempo).

   Cada página HTML só precisa de:
     <body data-pagina="cardapio">  (marca o item ativo do menu)
     <main id="conteudo"> ...conteúdo... </main>
   ========================================================================== */
(function () {
    "use strict";

    const esc = Fx.esc;

    // ===== LOGOTIPO (era _Logo.cshtml) =====
    Fx.logo = (variante) => `
        <span class="logo ${variante === "claro" ? "logo--claro" : ""}">
            <svg class="logo__chama" viewBox="0 0 32 40" aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient id="chama-grad-${variante}" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" stop-color="#D93636" />
                        <stop offset=".55" stop-color="#F28C28" />
                        <stop offset="1" stop-color="#F5C451" />
                    </linearGradient>
                </defs>
                <path fill="url(#chama-grad-${variante})" d="M16 1c2.6 7.4 11 11.6 11 23.2C27 32.4 22 39 16 39S5 32.4 5 25.6c0-5.6 3-9 5.6-12.6.7 4 2.2 6.4 4.6 7.2C14.4 13.4 13.6 7.4 16 1z" />
                <path fill="#FFF8EE" opacity=".9" d="M16.4 22c1.4 3.4 4.6 5 4.6 9.2 0 3.4-2.2 5.8-5 5.8s-5-2.2-5-5.2c0-2.6 1.6-4.2 3-5.6.4 1.6 1.2 2.6 2.4 3-.6-2.4-.8-4.6 0-7.2z" />
            </svg>
            <span class="logo__texto">FUEGO</span><span class="logo__selo">MX</span>
        </span>`;

    // ===== CARD DE PRODUTO (era _ProdutoCard.cshtml) =====
    Fx.cardProduto = (p) => {
        const urlDetalhes = `produto.html?id=${p.id}`;
        let selos = "";
        if (!p.disponivel) selos += '<span class="selo selo--escuro">Indisponível</span>';
        else if (p.destaque) selos += '<span class="selo selo--amarelo"><i class="bi bi-star-fill" aria-hidden="true"></i> Mais pedido</span>';
        if (p.picancia > 0) {
            selos += `<span class="selo selo--vermelho" title="Nível de picância: ${p.picancia} de 3">
                ${'<i class="bi bi-fire" aria-hidden="true"></i>'.repeat(p.picancia)}
                <span class="visually-hidden">Picância ${p.picancia} de 3</span></span>`;
        }

        let botao;
        if (!p.disponivel) {
            botao = `<span class="btn btn-fx-adicionar disabled" aria-disabled="true" title="Esgotado">
                <i class="bi bi-slash-circle card-produto__icone-esgotado" aria-hidden="true"></i><span class="card-produto__rotulo">Esgotado</span></span>`;
        } else if (Fx.usuario()) {
            botao = `<button type="button" class="btn btn-fx-adicionar" data-adicionar="${p.id}" aria-label="Adicionar ${esc(p.nome)} ao carrinho">
                <i class="bi bi-plus-lg" aria-hidden="true"></i><span class="card-produto__rotulo">Adicionar</span></button>`;
        } else {
            botao = `<a class="btn btn-fx-adicionar" href="login.html?returnUrl=${encodeURIComponent(urlDetalhes)}" aria-label="Entre para adicionar ${esc(p.nome)} ao carrinho">
                <i class="bi bi-plus-lg" aria-hidden="true"></i><span class="card-produto__rotulo">Adicionar</span></a>`;
        }

        return `
        <article class="card-produto ${p.disponivel ? "" : "card-produto--indisponivel"}">
            <a class="card-produto__imagem" href="${urlDetalhes}" tabindex="-1" aria-hidden="true">
                <img src="${p.imagemUrl}" alt="" loading="lazy" width="400" height="300" />
                <span class="card-produto__selos">${selos}</span>
            </a>
            <div class="card-produto__corpo">
                <span class="card-produto__categoria">${esc(p.categoria.nome)}</span>
                <h3 class="card-produto__nome"><a href="${urlDetalhes}">${esc(p.nome)}</a></h3>
                <p class="card-produto__descricao">${esc(p.descricao)}</p>
                <div class="card-produto__rodape">
                    <span class="preco">${Fx.moeda(p.preco)}</span>
                    ${botao}
                </div>
            </div>
        </article>`;
    };

    // ===== TABELA DE ITENS DO PEDIDO (era _ItensPedido.cshtml) =====
    Fx.itensPedido = (pedido) => `
        <div class="table-responsive">
            <table class="tabela-itens">
                <caption class="visually-hidden">Itens do pedido ${pedido.id}</caption>
                <thead>
                    <tr><th scope="col">Produto</th><th scope="col" class="text-center">Qtd.</th><th scope="col" class="text-end">Preço</th><th scope="col" class="text-end">Subtotal</th></tr>
                </thead>
                <tbody>
                    ${pedido.itens.map((i) => `
                    <tr>
                        <td class="fw-bold">${esc(i.nomeProduto)}</td>
                        <td class="text-center">${i.quantidade}</td>
                        <td class="text-end text-nowrap">${Fx.moeda(i.precoUnitario)}</td>
                        <td class="text-end text-nowrap fw-bold">${Fx.moeda(i.subtotal)}</td>
                    </tr>`).join("")}
                </tbody>
                <tfoot>
                    <tr><td colspan="3" class="text-end texto-suave">Subtotal</td><td class="text-end text-nowrap">${Fx.moeda(pedido.subtotal)}</td></tr>
                    ${pedido.desconto > 0 ? `<tr><td colspan="3" class="text-end texto-verde">Desconto (${esc(pedido.cupomCodigo)})</td><td class="text-end text-nowrap texto-verde">− ${Fx.moeda(pedido.desconto)}</td></tr>` : ""}
                    <tr><td colspan="3" class="text-end texto-suave">Entrega</td><td class="text-end text-nowrap">${pedido.taxaEntrega === 0 ? "Grátis" : Fx.moeda(pedido.taxaEntrega)}</td></tr>
                    <tr><td colspan="3" class="text-end fw-800 fonte-titulo fs-5">Total</td><td class="text-end text-nowrap fw-800 fonte-titulo fs-5">${Fx.moeda(pedido.total)}</td></tr>
                </tfoot>
            </table>
        </div>`;

    // ===== LINHA DO TEMPO DO PEDIDO (era _LinhaTempoPedido.cshtml) =====
    Fx.linhaTempo = (status) => {
        if (status === Fx.CANCELADO) {
            return `<div class="alert alert-fx alert-fx--erro" role="status">
                <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
                <span><strong>Pedido cancelado.</strong> Nenhum valor será cobrado.</span></div>`;
        }
        return `<ol class="linha-tempo" aria-label="Andamento do pedido">
            ${[0, 1, 2, 3].map((etapa) => {
                const classe = etapa < status || status === 3 ? "feito" : etapa === status ? "atual" : "";
                return `<li class="${classe}" ${etapa === status ? 'aria-current="step"' : ""}>
                    <span class="marcador"><i class="bi ${classe === "feito" ? "bi-check-lg" : Fx.STATUS[etapa].icone}" aria-hidden="true"></i></span>
                    ${Fx.STATUS[etapa].nome}</li>`;
            }).join("")}
        </ol>`;
    };

    // ===== MENU LATERAL DO PERFIL (era Perfil/_MenuPerfil.cshtml) =====
    Fx.menuPerfil = (ativo) => {
        const u = Fx.usuario();
        const total = Fx.pedidos().length;
        const item = (id, href, icone, texto) =>
            `<li><a class="${ativo === id ? "ativo" : ""}" href="${href}" ${ativo === id ? 'aria-current="page"' : ""}><i class="bi ${icone}" aria-hidden="true"></i> ${texto}</a></li>`;
        return `
        <aside class="cartao perfil-cartao">
            <div class="avatar-grande" aria-hidden="true">${esc(u.nomeCompleto.charAt(0))}</div>
            <h2 class="h4 mb-1">${esc(u.nomeCompleto)}</h2>
            <p class="texto-suave small mb-0">${esc(u.email)}</p>
            <div class="perfil-numeros">
                <div><strong>${total}</strong><span>${total === 1 ? "pedido" : "pedidos"}</span></div>
                <div><strong>${Fx.mesAno(u.dataCadastro)}</strong><span>cliente desde</span></div>
            </div>
            <ul class="menu-lateral">
                ${item("perfil", "perfil.html", "bi-person", "Meus dados")}
                ${item("senha", "alterar-senha.html", "bi-key", "Alterar senha")}
                ${item("pedidos", "pedidos.html", "bi-receipt", "Meus pedidos")}
                <li><button type="button" class="sair" data-sair><i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sair da conta</button></li>
            </ul>
        </aside>`;
    };

    // ===== PÁGINA NÃO ENCONTRADA (era Error.cshtml com código 404) =====
    Fx.paginaNaoEncontrada = () => `
        <section class="estado-vazio estado-erro container">
            <div class="estado-vazio__codigo" aria-hidden="true">404</div>
            <h1 class="estado-vazio__titulo">Página não encontrada</h1>
            <p class="estado-vazio__texto">O endereço que você procurou não existe ou foi removido. Que tal voltar ao cardápio?</p>
            <div class="d-flex flex-wrap gap-2 justify-content-center">
                <a class="btn btn-fx-primario" href="cardapio.html"><i class="bi bi-grid-3x3-gap" aria-hidden="true"></i> Ver cardápio</a>
                <a class="btn btn-fx-contorno" href="index.html"><i class="bi bi-house" aria-hidden="true"></i> Página inicial</a>
            </div>
        </section>`;

    Fx.seloStatus = (status, extra) => {
        const s = Fx.STATUS[status];
        return `<span class="status ${s.css} ${extra || ""}"><i class="bi ${s.icone}" aria-hidden="true"></i> ${s.nome}</span>`;
    };

    // ===== CABEÇALHO E MENU (aparece em todas as páginas) =====
    function cabecalho() {
        const pagina = document.body.dataset.pagina || "";
        const link = (id, href, texto) =>
            `<li class="nav-item"><a class="nav-link ${pagina === id ? "active" : ""}" ${pagina === id ? 'aria-current="page"' : ""} href="${href}">${texto}</a></li>`;
        const u = Fx.usuario();
        const qtd = u ? Fx.contarItens() : 0;

        const conta = u
            ? `<div class="dropdown">
                   <button class="btn btn-fx-conta dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                       <span class="avatar-mini" aria-hidden="true">${esc(Fx.primeiroNome(u.nomeCompleto).charAt(0))}</span>
                       Olá, ${esc(Fx.primeiroNome(u.nomeCompleto))}
                   </button>
                   <ul class="dropdown-menu dropdown-menu-end">
                       <li><a class="dropdown-item" href="perfil.html"><i class="bi bi-person" aria-hidden="true"></i> Meu perfil</a></li>
                       <li><a class="dropdown-item" href="pedidos.html"><i class="bi bi-receipt" aria-hidden="true"></i> Meus pedidos</a></li>
                       <li><hr class="dropdown-divider" /></li>
                       <li><button type="button" class="dropdown-item text-danger" data-sair><i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sair da conta</button></li>
                   </ul>
               </div>`
            : `<a class="btn btn-fx-link" href="login.html">Entrar</a>
               <a class="btn btn-fx-primario btn-sm-fx" href="cadastro.html">Criar conta</a>`;

        return `
        <a class="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
        <header class="cabecalho" id="topo">
            <nav class="navbar navbar-expand-lg container" aria-label="Navegação principal">
                <a class="navbar-brand" href="index.html" aria-label="FUEGO MX: página inicial">${Fx.logo("escuro")}</a>

                <div class="topo-acoes order-lg-3">
                    <button type="button" class="botao-tema" data-alternar-tema aria-pressed="false" aria-label="Modo escuro" title="Alternar modo claro / escuro">
                        <i class="bi bi-moon-stars botao-tema__lua" aria-hidden="true"></i>
                        <i class="bi bi-sun botao-tema__sol" aria-hidden="true"></i>
                    </button>
                    <a class="botao-carrinho" href="carrinho.html" aria-label="Carrinho">
                        <i class="bi bi-bag" aria-hidden="true"></i>
                        <span class="botao-carrinho__contador" data-contador-carrinho ${qtd === 0 ? "hidden" : ""}>${qtd}</span>
                        <span class="visually-hidden" data-contador-carrinho-texto>${qtd} ${qtd === 1 ? "item" : "itens"} no carrinho</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal"
                            aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir menu">
                        <i class="bi bi-list" aria-hidden="true"></i>
                    </button>
                </div>

                <div class="collapse navbar-collapse" id="menuPrincipal">
                    <ul class="navbar-nav mx-lg-auto menu-links">
                        ${link("inicio", "index.html", "Início")}
                        ${link("cardapio", "cardapio.html", "Cardápio")}
                        ${link("pedidos", "pedidos.html", "Meus Pedidos")}
                        ${link("sobre", "sobre.html", "Sobre Nós")}
                        ${link("contato", "contato.html", "Contato")}
                    </ul>
                    <div class="menu-conta">${conta}</div>
                </div>
            </nav>
        </header>`;
    }

    // ===== RODAPÉ =====
    function rodape() {
        return `
        <footer class="rodape">
            <div class="papel-picado papel-picado--topo" aria-hidden="true"></div>
            <div class="container">
                <div class="row g-4 g-lg-5">
                    <div class="col-12 col-lg-4">
                        ${Fx.logo("claro")}
                        <p class="rodape__slogan">O sabor do México chega até você.</p>
                        <p class="rodape__texto">Tacos, burritos e nachos preparados na hora, com receitas inspiradas nas taquerias da Cidade do México.</p>
                    </div>
                    <div class="col-6 col-md-4 col-lg-2">
                        <h2 class="rodape__titulo">Navegação</h2>
                        <ul class="rodape__lista">
                            <li><a href="index.html">Início</a></li>
                            <li><a href="cardapio.html">Cardápio</a></li>
                            <li><a href="pedidos.html">Meus Pedidos</a></li>
                            <li><a href="sobre.html">Sobre Nós</a></li>
                            <li><a href="contato.html">Contato</a></li>
                        </ul>
                    </div>
                    <div class="col-6 col-md-4 col-lg-3">
                        <h2 class="rodape__titulo">Horário</h2>
                        <ul class="rodape__lista rodape__lista--info">
                            <li><i class="bi bi-clock" aria-hidden="true"></i> Ter a Dom: 11h às 23h</li>
                            <li><i class="bi bi-calendar-x" aria-hidden="true"></i> Segunda: fechado</li>
                            <li><i class="bi bi-scooter" aria-hidden="true"></i> Entrega em cerca de 40 min</li>
                        </ul>
                    </div>
                    <div class="col-12 col-md-4 col-lg-3">
                        <h2 class="rodape__titulo">Contato</h2>
                        <ul class="rodape__lista rodape__lista--info">
                            <li><i class="bi bi-geo-alt" aria-hidden="true"></i> Rua das Pimentas, 123, Centro</li>
                            <li><i class="bi bi-telephone" aria-hidden="true"></i> (11) 4000-0000</li>
                            <li><i class="bi bi-envelope" aria-hidden="true"></i> contato@fuegomx.com.br</li>
                        </ul>
                    </div>
                </div>
                <div class="rodape__base">
                    <span>&copy; ${new Date().getFullYear()} FUEGO MX. Projeto escolar, empresa fictícia.</span>
                    <a href="privacidade.html">Privacidade e termos</a>
                </div>
            </div>
        </footer>

        <!-- Avisos rápidos (toast) usados pelo JavaScript -->
        <div class="toast-container position-fixed bottom-0 end-0 p-3" id="areaToasts" aria-live="polite" aria-atomic="true"></div>

        <!-- Modal genérico de confirmação (era _ModalConfirmacao.cshtml). Ver Fx.confirmar em site.js -->
        <div class="modal fade" id="modalConfirmacao" tabindex="-1" aria-labelledby="modalConfirmacaoTitulo" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content modal-fx">
                    <div class="modal-header">
                        <h2 class="modal-title h5" id="modalConfirmacaoTitulo">Confirmar ação</h2>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body" id="modalConfirmacaoTexto">Tem certeza?</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-fx-contorno" data-bs-dismiss="modal">Voltar</button>
                        <button type="button" class="btn btn-fx-primario" id="modalConfirmacaoOk">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ===== CAMPOS DE ENDEREÇO EM PARTES (era _CamposEndereco.cshtml), usados no cadastro e no perfil =====
    // Ao digitar o CEP completo, o site.js ("busca de CEP") consulta o ViaCEP e preenche rua, bairro, cidade e UF.
    Fx.camposEndereco = () => `
        <div class="col-12 col-sm-5">
            <label for="Cep" class="form-label">CEP</label>
            <div class="campo-cep">
                <input id="Cep" name="Cep" class="form-control" inputmode="numeric" maxlength="9" autocomplete="postal-code" placeholder="00000-000"
                       data-mascara="cep" data-buscar-cep aria-describedby="statusCep" />
                <span class="campo-cep__girando" aria-hidden="true"></span>
            </div>
            <span data-erro-para="Cep"></span>
        </div>
        <div class="col-12 col-sm-7 d-flex align-items-sm-end">
            <a class="link-discreto mb-sm-2" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener">
                <i class="bi bi-search" aria-hidden="true"></i> Não sei meu CEP
            </a>
        </div>
        <div class="col-12 mt-1">
            <p class="form-text mt-0 mb-0 status-cep" id="statusCep" data-status-cep aria-live="polite">Digite o CEP para preencher o endereço.</p>
        </div>
        <div class="col-12 col-sm-8">
            <label for="Endereco" class="form-label">Rua / avenida</label>
            <input id="Endereco" name="Endereco" class="form-control" autocomplete="address-line1" maxlength="250" data-endereco="rua" />
            <span data-erro-para="Endereco"></span>
        </div>
        <div class="col-12 col-sm-4">
            <label for="Numero" class="form-label">Número</label>
            <input id="Numero" name="Numero" class="form-control" autocomplete="off" maxlength="6" placeholder="123 ou S/N" />
            <span data-erro-para="Numero"></span>
        </div>
        <div class="col-12 col-sm-6">
            <label for="Bairro" class="form-label">Bairro</label>
            <input id="Bairro" name="Bairro" class="form-control" autocomplete="address-level3" maxlength="60" data-endereco="bairro" />
            <span data-erro-para="Bairro"></span>
        </div>
        <div class="col-8 col-sm-4">
            <label for="Cidade" class="form-label">Cidade</label>
            <input id="Cidade" name="Cidade" class="form-control" autocomplete="address-level2" maxlength="60" data-endereco="cidade" />
            <span data-erro-para="Cidade"></span>
        </div>
        <div class="col-4 col-sm-2">
            <label for="Uf" class="form-label">UF</label>
            <select id="Uf" name="Uf" class="form-select" autocomplete="address-level1" data-endereco="uf">
                <option value="">UF</option>
                ${Fx.UFS.map((uf) => `<option value="${uf}">${uf}</option>`).join("")}
            </select>
            <span data-erro-para="Uf"></span>
        </div>
        <div class="col-12">
            <label for="Complemento" class="form-label">Complemento (opcional)</label>
            <input id="Complemento" name="Complemento" class="form-control" autocomplete="address-line2" maxlength="100" placeholder="Apto, bloco, referência" />
            <span data-erro-para="Complemento"></span>
        </div>`;

    // ===== AVISOS NO TOPO DA PÁGINA (era _Alertas.cshtml) =====
    Fx.alertaTopo = (tipo, mensagem) => {
        const sucesso = tipo === "sucesso";
        const div = document.createElement("div");
        div.className = "container alerta-topo";
        div.innerHTML = `
            <div class="alert alert-fx ${sucesso ? "alert-fx--sucesso" : "alert-fx--erro"} alert-dismissible fade show" role="${sucesso ? "status" : "alert"}">
                <i class="bi ${sucesso ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}" aria-hidden="true"></i>
                <span>${esc(mensagem)}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar aviso"></button>
            </div>`;
        const main = document.getElementById("conteudo");
        main.insertBefore(div, main.firstChild);
    };

    const main = document.getElementById("conteudo");
    main.setAttribute("tabindex", "-1");
    main.insertAdjacentHTML("beforebegin", cabecalho());
    main.insertAdjacentHTML("afterend", rodape());
    Fx.consumirAvisos().reverse().forEach((a) => Fx.alertaTopo(a.tipo, a.mensagem));

    document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-sair]")) return;
        Fx.sair();
        Fx.avisar("sucesso", "Você saiu da sua conta. Até a próxima!");
        Fx.irPara("index.html");
    });
})();
