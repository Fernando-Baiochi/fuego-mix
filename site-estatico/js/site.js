/* ==========================================================================
   FUEGO MX (versão estática): interações da interface
   Adaptado de src/FuegoMX/wwwroot/js/site.js. Aqui não há servidor: o botão
   "Adicionar" grava direto no carrinho do navegador (ver loja.js).
   Deve ser o ÚLTIMO script da página (depois do script da própria página).
   ========================================================================== */
(function () {
    "use strict";

    // -------------------------------------------------------------- toasts
    Fx.toast = function (mensagem, sucesso, link) {
        const area = document.getElementById("areaToasts");
        if (!area || !window.bootstrap) return;

        const toast = document.createElement("div");
        toast.className = "toast toast-fx";
        toast.setAttribute("role", sucesso ? "status" : "alert");
        toast.innerHTML =
            '<div class="toast-body">' +
            '<i class="bi ' + (sucesso ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill") + '" aria-hidden="true"></i>' +
            '<span class="flex-grow-1"></span>' +
            (link ? '<a href="' + link.url + '">' + link.texto + "</a>" : "") +
            '<button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="toast" aria-label="Fechar"></button>' +
            "</div>";
        toast.querySelector("span").textContent = mensagem; // textContent evita injeção de HTML
        area.appendChild(toast);
        const instancia = new bootstrap.Toast(toast, { delay: 4000 });
        toast.addEventListener("hidden.bs.toast", () => toast.remove());
        instancia.show();
    };

    Fx.atualizarContador = function () {
        const quantidade = Fx.contarItens();
        document.querySelectorAll("[data-contador-carrinho]").forEach((el) => {
            el.textContent = quantidade;
            el.hidden = quantidade === 0;
            el.classList.remove("pulsar");
            void el.offsetWidth; // reinicia a animação
            el.classList.add("pulsar");
        });
        document.querySelectorAll("[data-contador-carrinho-texto]").forEach((el) => {
            el.textContent = quantidade + (quantidade === 1 ? " item" : " itens") + " no carrinho";
        });
    };

    // ------------------------------------------- adicionar ao carrinho
    // Botões dos cards: <button data-adicionar="ID">
    document.addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-adicionar]");
        if (!botao) return;
        const resultado = Fx.adicionar(Number(botao.dataset.adicionar), 1);
        if (resultado.sucesso) Fx.atualizarContador();
        Fx.toast(resultado.mensagem, resultado.sucesso, resultado.sucesso ? { url: "carrinho.html", texto: "Ver carrinho" } : null);
    });
    // Formulário da página do produto: <form data-form-adicionar="ID"> com campo "quantidade"
    document.addEventListener("submit", (evento) => {
        const form = evento.target;
        if (!form.matches("[data-form-adicionar]")) return;
        evento.preventDefault();
        const resultado = Fx.adicionar(Number(form.dataset.formAdicionar), Number(form.elements.quantidade.value));
        if (resultado.sucesso) Fx.atualizarContador();
        Fx.toast(resultado.mensagem, resultado.sucesso, resultado.sucesso ? { url: "carrinho.html", texto: "Ver carrinho" } : null);
    });

    // ------------------------------------------------ modo claro / escuro
    // O tema inicial já foi aplicado por um script no <head> (antes do CSS, para a página não piscar).
    // Aqui ficam o botão sol/lua e o acompanhamento do tema do sistema enquanto a pessoa não escolheu um.
    const raiz = document.documentElement;
    function aplicarTema(tema) {
        raiz.setAttribute("data-tema", tema);
        raiz.setAttribute("data-bs-theme", tema === "escuro" ? "dark" : "light");
        document.querySelectorAll("[data-alternar-tema]").forEach((botao) => {
            botao.setAttribute("aria-pressed", String(tema === "escuro"));
        });
    }
    aplicarTema(raiz.getAttribute("data-tema") === "escuro" ? "escuro" : "claro");

    document.addEventListener("click", (evento) => {
        if (!evento.target.closest("[data-alternar-tema]")) return;
        const novo = raiz.getAttribute("data-tema") === "escuro" ? "claro" : "escuro";
        raiz.classList.add("trocando-tema"); // transição suave só durante a troca (ver site.css, seção 15)
        aplicarTema(novo);
        setTimeout(() => raiz.classList.remove("trocando-tema"), 400);
        try { localStorage.setItem("fx_tema", novo); } catch (e) { /* sem armazenamento: vale só nesta página */ }
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (evento) => {
        let escolhido = null;
        try { escolhido = localStorage.getItem("fx_tema"); } catch (e) { /* sem armazenamento */ }
        if (!escolhido) aplicarTema(evento.matches ? "escuro" : "claro");
    });

    // ------------------------------------------------ modal de confirmação
    // Uso: if (await Fx.confirmar("Tem certeza?")) { ... }
    let responder = null;
    Fx.confirmar = function (mensagem) {
        const modalEl = document.getElementById("modalConfirmacao");
        if (!modalEl || !window.bootstrap) return Promise.resolve(window.confirm(mensagem));
        document.getElementById("modalConfirmacaoTexto").textContent = mensagem;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
        return new Promise((resolve) => (responder = resolve));
    };
    document.getElementById("modalConfirmacaoOk")?.addEventListener("click", () => {
        const r = responder;
        responder = null;
        bootstrap.Modal.getInstance(document.getElementById("modalConfirmacao"))?.hide();
        if (r) r(true);
    });
    document.getElementById("modalConfirmacao")?.addEventListener("hidden.bs.modal", () => {
        if (responder) { responder(false); responder = null; }
    });

    // ------------------------------------------- seletor de quantidade (+/-)
    document.querySelectorAll("[data-seletor-qtd]").forEach((seletor) => {
        const campo = seletor.querySelector("input");
        seletor.querySelectorAll("[data-qtd]").forEach((botao) => {
            botao.addEventListener("click", () => {
                const min = Number(campo.min || 1), max = Number(campo.max || 99);
                const novo = Math.min(max, Math.max(min, (Number(campo.value) || 1) + Number(botao.dataset.qtd)));
                campo.value = novo;
            });
        });
    });

    // ---------------------------- mostra campos conforme forma de pagamento
    function atualizarPagamento() {
        const escolhido = document.querySelector("[data-forma-pagamento]:checked")?.value;
        document.querySelectorAll("[data-somente-pagamento]").forEach((bloco) => {
            bloco.hidden = bloco.dataset.somentePagamento !== escolhido;
        });
    }
    document.querySelectorAll("[data-forma-pagamento]").forEach((r) => r.addEventListener("change", atualizarPagamento));
    atualizarPagamento();

    // ------------------------------------------- máscara de telefone (BR)
    document.querySelectorAll('[data-mascara="telefone"]').forEach((campo) => {
        campo.addEventListener("input", () => {
            const d = campo.value.replace(/\D/g, "").slice(0, 11);
            let v = d;
            if (d.length > 2) v = "(" + d.slice(0, 2) + ") " + d.slice(2);
            if (d.length > 6) v = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
            campo.value = v;
        });
    });

    // ------------------------------------------------ máscaras de CPF e CEP
    const mascaras = {
        cpf: (d) => d.slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2"),
        cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2")
    };
    Object.keys(mascaras).forEach((tipo) => {
        document.querySelectorAll(`[data-mascara="${tipo}"]`).forEach((campo) => {
            campo.addEventListener("input", () => { campo.value = mascaras[tipo](campo.value.replace(/\D/g, "")); });
        });
    });

    // ------------------------------------------------ busca de CEP (ViaCEP)
    // Com o CEP completo, consulta https://viacep.com.br e preenche rua, bairro, cidade e UF
    // (campos [data-endereco] do mesmo formulário). Se falhar, a pessoa preenche à mão.
    document.querySelectorAll("[data-buscar-cep]").forEach((campo) => {
        const form = campo.closest("form");
        const status = form.querySelector("[data-status-cep]");
        const parte = (nome) => form.querySelector(`[data-endereco="${nome}"]`);
        let ultimoBuscado = campo.value.replace(/\D/g, "");

        const caixa = campo.closest(".campo-cep");
        function avisar(texto, erro, buscando) {
            caixa?.classList.toggle("buscando", !!buscando);
            if (!status) return;
            status.textContent = texto;
            status.classList.toggle("text-danger", !!erro);
        }

        campo.addEventListener("input", async () => {
            const cep = campo.value.replace(/\D/g, "");
            if (cep.length !== 8 || cep === ultimoBuscado) return;
            ultimoBuscado = cep;
            avisar("Buscando endereço…", false, true);
            try {
                const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const dados = await resposta.json();
                if (!resposta.ok || dados.erro) { avisar("CEP não encontrado. Confira ou preencha o endereço à mão.", true); return; }
                const preencher = { rua: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, uf: dados.uf };
                Object.entries(preencher).forEach(([nome, valor]) => {
                    const alvo = parte(nome);
                    if (alvo && valor) { alvo.value = valor; alvo.dispatchEvent(new Event("change", { bubbles: true })); }
                });
                avisar("Endereço preenchido. Agora informe o número.");
                form.querySelector('[name="Numero"]')?.focus();
            } catch (e) {
                avisar("Não foi possível buscar o CEP agora. Preencha o endereço à mão.", true);
            }
        });
    });

    // ------------------------------------------- regras da senha (cadastro)
    // Cada <li data-regra> fica verde (.ok) quando a senha digitada cumpre a regra.
    document.querySelectorAll("[data-regras-senha]").forEach((lista) => {
        const campo = document.getElementById(lista.dataset.regrasSenha);
        if (!campo) return;
        const regras = {
            tamanho: (v) => v.length >= 8,
            maiuscula: (v) => /[A-Z]/.test(v),
            minuscula: (v) => /[a-z]/.test(v),
            numero: (v) => /\d/.test(v)
        };
        const atualizar = () => lista.querySelectorAll("[data-regra]").forEach((li) => {
            li.classList.toggle("ok", regras[li.dataset.regra]?.(campo.value) ?? false);
        });
        campo.addEventListener("input", atualizar);
        atualizar();
    });

    // --------------------------------------------- mostrar/ocultar senha
    document.querySelectorAll("[data-alternar-senha]").forEach((botao) => {
        botao.addEventListener("click", () => {
            const campo = botao.parentElement.querySelector("input");
            const mostrar = campo.type === "password";
            campo.type = mostrar ? "text" : "password";
            botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
            botao.querySelector("i").className = "bi " + (mostrar ? "bi-eye-slash" : "bi-eye");
        });
    });

    // Fecha o menu mobile ao clicar num link âncora
    document.querySelectorAll('#menuPrincipal a[href^="#"]').forEach((link) =>
        link.addEventListener("click", () => bootstrap.Collapse.getInstance("#menuPrincipal")?.hide()));

    // ------------------------------------------- revelação suave ao rolar
    // Os blocos com [data-revelar] começam invisíveis (ver site.css) e aparecem ao entrar na tela.
    const revelar = document.querySelectorAll("[data-revelar]");
    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.add("revelado");
                observador.unobserve(e.target);
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
        revelar.forEach((el) => observador.observe(el));
    } else {
        revelar.forEach((el) => el.classList.add("revelado"));
    }

    // ------------------------------------------- luz que segue o mouse no vidro
    // Só em telas com mouse; o brilho em si é desenhado pelo CSS (.luz-liquida::after, seção 13).
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        document.querySelectorAll(".botao-carrinho, .navbar-toggler, .btn-fx-contorno-claro, .chip, .card-categoria__rotulo")
            .forEach((el) => {
                el.classList.add("luz-liquida");
                el.addEventListener("pointermove", (e) => {
                    const r = el.getBoundingClientRect();
                    el.style.setProperty("--luz-x", `${e.clientX - r.left}px`);
                    el.style.setProperty("--luz-y", `${e.clientY - r.top}px`);
                });
            });
    }
})();
