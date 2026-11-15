/* ==========================================================================
   FUEGO MX (versão estática): "servidor de mentira" que roda no navegador
   Faz o papel dos Services do projeto C#: contas, carrinho, cupons e pedidos.
   Tudo fica salvo no localStorage do navegador (não existe banco de dados).
   Por isso cada navegador/computador tem os seus próprios usuários e pedidos.
   ========================================================================== */
(function () {
    "use strict";

    const D = window.FxDados;
    const Fx = (window.Fx = {});

    // ---------------------------------------------------- armazenamento
    // try/catch: o navegador pode bloquear o localStorage (janela anônima, etc.)
    function ler(chave, padrao, area) {
        try {
            const valor = (area || localStorage).getItem(chave);
            return valor === null ? padrao : JSON.parse(valor);
        } catch (e) { return padrao; }
    }
    function gravar(chave, valor, area) {
        try { (area || localStorage).setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
    }
    function apagar(chave, area) {
        try { (area || localStorage).removeItem(chave); } catch (e) { /* sem armazenamento */ }
    }

    // ------------------------------------------------------- formatação
    const fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const fmtMoeda0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const dois = (n) => String(n).padStart(2, "0");

    Fx.moeda = (v) => fmtMoeda.format(v);
    Fx.moeda0 = (v) => fmtMoeda0.format(v);
    Fx.data = (iso) => { const d = new Date(iso); return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`; };
    Fx.dataHora = (iso) => { const d = new Date(iso); return `${Fx.data(iso)} às ${dois(d.getHours())}:${dois(d.getMinutes())}`; };
    Fx.mesAno = (iso) => { const d = new Date(iso); return `${dois(d.getMonth() + 1)}/${d.getFullYear()}`; };
    Fx.primeiroNome = (nome) => (nome || "").trim().split(" ")[0];
    const arredondar = (v) => Math.round(v * 100) / 100;

    /** Escapa texto antes de colocar dentro de HTML (evita injeção de HTML com dados digitados pelo usuário). */
    Fx.esc = (texto) => String(texto ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

    // ------------------------------------------------------- navegação
    Fx.parametro = (nome) => new URLSearchParams(location.search).get(nome);
    Fx.paginaAtual = () => (location.pathname.split("/").pop() || "index.html") + location.search;

    /** Só aceita páginas deste site (ex.: "produto.html?id=3"), nunca um endereço externo. */
    Fx.urlSegura = (url, padrao) =>
        url && /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(url) ? url : padrao;

    Fx.irPara = (url) => { location.href = url; };

    // ------------------------------------------- avisos entre páginas
    // Equivalem ao TempData["Sucesso"] / TempData["Erro"] do C#: aparecem no topo da próxima página.
    Fx.avisar = (tipo, mensagem) => {
        const avisos = ler("fx_avisos", [], sessionStorage);
        avisos.push({ tipo, mensagem });
        gravar("fx_avisos", avisos, sessionStorage);
    };
    Fx.consumirAvisos = () => {
        const avisos = ler("fx_avisos", [], sessionStorage);
        apagar("fx_avisos", sessionStorage);
        return avisos;
    };

    // ---------------------------------------------------------- catálogo
    Fx.loja = D.loja;
    Fx.categorias = () => D.categorias.slice().sort((a, b) => a.ordem - b.ordem);
    Fx.categoria = (id) => D.categorias.find((c) => c.id === Number(id)) || null;
    Fx.produto = (id) => {
        const p = D.produtos.find((x) => x.id === Number(id));
        return p ? Fx.completarProduto(p) : null;
    };
    Fx.completarProduto = (p) => ({
        ...p,
        disponivel: p.disponivel !== false,
        imagemUrl: `images/produtos/${p.imagem}.jpg`,
        categoria: Fx.categoria(p.categoriaId)
    });
    Fx.produtos = () => D.produtos.map(Fx.completarProduto);

    const porNome = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");

    Fx.maisVendidos = (quantidade) => Fx.produtos().filter((p) => p.disponivel)
        .sort((a, b) => (b.destaque - a.destaque) || (b.vendidos - a.vendidos))
        .slice(0, quantidade);

    Fx.relacionados = (produto, quantidade) => Fx.produtos()
        .filter((p) => p.categoriaId === produto.categoriaId && p.id !== produto.id && p.disponivel)
        .sort((a, b) => b.vendidos - a.vendidos)
        .slice(0, quantidade);

    /** Para cada categoria: quantos produtos tem e a foto do produto mais vendido dela. */
    Fx.resumoCategorias = () => Fx.categorias().map((c) => {
        const itens = Fx.produtos().filter((p) => p.categoriaId === c.id).sort((a, b) => b.vendidos - a.vendidos);
        return { categoria: c, quantidade: itens.length, imagemUrl: itens[0] ? itens[0].imagemUrl : "images/produtos/placeholder.svg" };
    }).filter((r) => r.quantidade > 0);

    /** filtro: { busca, categoriaId, precoMin, precoMax, ordem } (mesmas regras do ProdutoService.cs) */
    Fx.buscarCardapio = (f) => {
        let lista = Fx.produtos();
        if (f.busca) {
            const termo = normalizar(f.busca);
            lista = lista.filter((p) => normalizar(p.nome).includes(termo) || normalizar(p.descricao).includes(termo));
        }
        if (f.categoriaId != null) lista = lista.filter((p) => p.categoriaId === f.categoriaId);
        if (f.precoMin != null) lista = lista.filter((p) => p.preco >= f.precoMin);
        if (f.precoMax != null) lista = lista.filter((p) => p.preco <= f.precoMax);

        const ordens = {
            preco_asc: (a, b) => (a.preco - b.preco) || porNome(a, b),
            preco_desc: (a, b) => (b.preco - a.preco) || porNome(a, b),
            nome_asc: porNome,
            nome_desc: (a, b) => porNome(b, a)
        };
        return lista.sort(ordens[f.ordem] || ((a, b) => (a.categoria.ordem - b.categoria.ordem) || (b.vendidos - a.vendidos)));
    };
    // Busca sem diferenciar maiúsculas e acentos ("quesadilla" acha "Quesadílla")
    function normalizar(texto) {
        return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    }

    // ------------------------------------------------------------ contas
    Fx.SENHA_MENSAGEM = "A senha deve ter no mínimo 8 caracteres, com letra maiúscula, letra minúscula e número.";
    Fx.senhaForte = (s) => s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s);
    Fx.telefoneValido = (t) => /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(t.trim());
    Fx.emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    // ----------------------- CPF, nascimento e endereço (mesmas regras do ViewModels/Validacoes.cs)
    Fx.soDigitos = (v) => String(v || "").replace(/\D/g, "");

    /** Confere os dois dígitos verificadores. Recusa sequências como 111.111.111-11. */
    Fx.cpfValido = (valor) => {
        const d = Fx.soDigitos(valor);
        if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
        const digito = (tamanho) => {
            let soma = 0;
            for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
            const resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        };
        return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
    };
    Fx.formatarCpf = (cpf) => {
        const d = Fx.soDigitos(cpf);
        return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf || "";
    };
    Fx.formatarCep = (cep) => {
        const d = Fx.soDigitos(cep);
        return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep || "";
    };

    Fx.IDADE_MINIMA = 18;
    Fx.UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
        "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

    /** Idade em anos completos. nascimento: "aaaa-mm-dd" (valor do <input type="date">). */
    Fx.idade = (nascimento, hoje = new Date()) => {
        const [a, m, d] = nascimento.split("-").map(Number);
        let idade = hoje.getFullYear() - a;
        if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
        return idade;
    };
    /** "aaaa-mm-dd" de hoje menos N anos (para o atributo max do campo de data). */
    Fx.dataMaxima = (anos) => {
        const h = new Date();
        return `${h.getFullYear() - anos}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
    };

    /** Mesma regra do [Nascimento]: data no passado, idade até 120 e mínimo de 18 anos. Vazio = "" (o obrigatório é tratado fora). */
    Fx.erroNascimento = (v) => {
        if (!v) return "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + "T00:00:00"))) return "Informe uma data de nascimento válida.";
        const idade = Fx.idade(v);
        if (new Date(v + "T00:00:00") > new Date() || idade > 120) return "Informe uma data de nascimento válida.";
        if (idade < Fx.IDADE_MINIMA) return `É preciso ter pelo menos ${Fx.IDADE_MINIMA} anos para criar a conta.`;
        return "";
    };

    const CAMPOS_ENDERECO = ["Cep", "Endereco", "Numero", "Bairro", "Cidade", "Uf", "Complemento"];
    const enderecoPreenchido = (form) => CAMPOS_ENDERECO.some((c) => form.elements[c].value.trim() !== "");

    /** Regras do EnderecoViewModel: tudo opcional, mas se começou a preencher, precisa de CEP, rua, número, bairro, cidade e UF. */
    Fx.regrasEndereco = () => {
        const obrigatorio = (mensagem) => (v, f) => !v && enderecoPreenchido(f) ? mensagem : "";
        return {
            Cep: (v, f) => obrigatorio("Informe o CEP.")(v, f) || (v && !/^\d{5}-?\d{3}$/.test(v) ? "Informe um CEP válido. Ex.: 01310-100." : ""),
            Endereco: (v, f) => obrigatorio("Informe a rua.")(v, f) || (v.length > 250 ? "A rua deve ter no máximo 250 caracteres." : ""),
            Numero: (v, f) => obrigatorio("Informe o número (ou S/N).")(v, f) || (v.length > 6 ? "Use no máximo 6 caracteres (ou S/N)." : ""),
            Bairro: (v, f) => obrigatorio("Informe o bairro.")(v, f) || (v.length > 60 ? "O bairro deve ter no máximo 60 caracteres." : ""),
            Cidade: (v, f) => obrigatorio("Informe a cidade.")(v, f) || (v.length > 60 ? "A cidade deve ter no máximo 60 caracteres." : ""),
            Uf: (v, f) => obrigatorio("Escolha a UF.")(v, f) || (v && !Fx.UFS.includes(v.toUpperCase()) ? "Escolha a UF." : ""),
            Complemento: (v) => v.length > 100 ? "O complemento deve ter no máximo 100 caracteres." : ""
        };
    };

    /** Lê os campos de endereço já limpos (CEP 00000-000, UF maiúscula), como o EnderecoViewModel.CopiarPara. */
    Fx.lerEndereco = (form) => {
        const v = (nome) => form.elements[nome].value.trim();
        return {
            cep: v("Cep") ? Fx.formatarCep(v("Cep")) : "", endereco: v("Endereco"), numero: v("Numero"),
            bairro: v("Bairro"), cidade: v("Cidade"), uf: v("Uf").toUpperCase(), complemento: v("Complemento")
        };
    };
    Fx.preencherEndereco = (form, u) => {
        const mapa = { Cep: "cep", Endereco: "endereco", Numero: "numero", Bairro: "bairro", Cidade: "cidade", Uf: "uf", Complemento: "complemento" };
        Object.entries(mapa).forEach(([campo, chave]) => { form.elements[campo].value = u[chave] || ""; });
    };

    /** "Rua X, 123 - Bairro, Cidade/UF - CEP 00000-000" (igual ao ApplicationUser.EnderecoCompleto). */
    Fx.enderecoCompleto = (u) => {
        if (!u || !u.endereco) return "";
        let linha = u.endereco.trim();
        if (u.numero) linha += ", " + u.numero;
        if (u.bairro) linha += " - " + u.bairro;
        if (u.cidade) linha += ", " + u.cidade + (u.uf ? "/" + u.uf : "");
        if (u.cep) linha += " - CEP " + u.cep;
        return linha;
    };

    /** A senha nunca é gravada: guardamos só o hash SHA-256 (salgado com o e-mail). */
    async function hashSenha(email, senha) {
        const texto = email.toLowerCase() + "|" + senha;
        if (window.crypto && crypto.subtle) {
            const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
            return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
        }
        // Navegador sem crypto.subtle (página aberta fora de http://localhost): hash simples
        let h = 5381;
        for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
        return "s" + (h >>> 0).toString(16);
    }

    const usuarios = () => ler("fx_usuarios", []);
    const salvarUsuarios = (lista) => gravar("fx_usuarios", lista);
    const buscarUsuario = (email) => usuarios().find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase()) || null;

    function emailSessao() {
        return ler("fx_sessao", null, sessionStorage) || ler("fx_sessao", null);
    }

    /** Usuário logado ou null. */
    Fx.usuario = () => {
        const email = emailSessao();
        return email ? buscarUsuario(email) : null;
    };

    function iniciarSessao(email, lembrar) {
        gravar("fx_sessao", email, lembrar ? localStorage : sessionStorage);
    }

    /** O CPF é único: não pode existir em outra conta. */
    Fx.cpfEmUso = (cpf, exceto) => usuarios().some((u) => u.cpf && u.cpf === Fx.soDigitos(cpf) && u.email !== exceto);

    Fx.cadastrar = async (dados) => {
        if (buscarUsuario(dados.email)) return { sucesso: false, campo: "Email", mensagem: "Este e-mail já está cadastrado." };
        if (Fx.cpfEmUso(dados.cpf)) return { sucesso: false, campo: "Cpf", mensagem: "Este CPF já está cadastrado em outra conta." };
        const email = dados.email.trim();
        const lista = usuarios();
        lista.push({
            email,
            nomeCompleto: dados.nomeCompleto.trim(),
            telefone: dados.telefone.trim(),
            cpf: Fx.soDigitos(dados.cpf),          // no "banco" fica só com os dígitos, como no C#
            dataNascimento: dados.dataNascimento,  // "aaaa-mm-dd"
            ...dados.enderecoPartes,               // cep, endereco (rua), numero, bairro, cidade, uf, complemento
            senhaHash: await hashSenha(email, dados.senha),
            dataCadastro: new Date().toISOString()
        });
        salvarUsuarios(lista);
        iniciarSessao(email, false);
        return { sucesso: true };
    };

    Fx.entrar = async (email, senha, lembrar) => {
        const u = buscarUsuario(email);
        // Mensagem genérica: não revelamos se o e-mail existe ou não.
        if (!u || u.senhaHash !== await hashSenha(u.email, senha)) return { sucesso: false, mensagem: "E-mail ou senha incorretos." };
        iniciarSessao(u.email, lembrar);
        return { sucesso: true, usuario: u };
    };

    Fx.sair = () => {
        apagar("fx_sessao");
        apagar("fx_sessao", sessionStorage);
        apagar("fx_cupom", sessionStorage);
    };

    Fx.atualizarPerfil = (dados) => {
        const atual = Fx.usuario();
        if (!atual) return;
        salvarUsuarios(usuarios().map((u) => (u.email === atual.email ? { ...u, ...dados } : u)));
    };

    Fx.alterarSenha = async (senhaAtual, novaSenha) => {
        const u = Fx.usuario();
        if (!u || u.senhaHash !== await hashSenha(u.email, senhaAtual)) return { sucesso: false, mensagem: "Senha incorreta." };
        Fx.atualizarPerfil({ senhaHash: await hashSenha(u.email, novaSenha) });
        return { sucesso: true };
    };

    /** Páginas que precisam de login chamam isto; quem não está logado vai para o login e volta depois. */
    Fx.exigirLogin = () => {
        if (Fx.usuario()) return true;
        location.replace("login.html?returnUrl=" + encodeURIComponent(Fx.paginaAtual()));
        return false;
    };

    // ---------------------------------------------------------- carrinho
    const chaveCarrinho = () => "fx_carrinho_" + (emailSessao() || "").toLowerCase();
    const itensCarrinho = () => ler(chaveCarrinho(), []);
    const salvarCarrinho = (itens) => gravar(chaveCarrinho(), itens);
    const MAX = D.loja.quantidadeMaximaPorItem;

    Fx.contarItens = () => itensCarrinho().reduce((soma, i) => soma + i.quantidade, 0);

    Fx.adicionar = (produtoId, quantidade) => {
        const p = Fx.produto(produtoId);
        if (!p) return { sucesso: false, mensagem: "Produto não encontrado." };
        if (!p.disponivel) return { sucesso: false, mensagem: `"${p.nome}" está indisponível no momento.` };
        if (!(quantidade >= 1 && quantidade <= MAX)) return { sucesso: false, mensagem: `Escolha uma quantidade entre 1 e ${MAX}.` };

        const itens = itensCarrinho();
        const item = itens.find((i) => i.produtoId === p.id);
        if (item) {
            if (item.quantidade + quantidade > MAX)
                return { sucesso: false, mensagem: `Limite de ${MAX} unidades por produto. Você já tem ${item.quantidade} no carrinho.` };
            item.quantidade += quantidade;
        } else {
            itens.push({ produtoId: p.id, quantidade });
        }
        salvarCarrinho(itens);
        return {
            sucesso: true,
            mensagem: quantidade === 1 ? `"${p.nome}" adicionado ao carrinho.` : `${quantidade}x "${p.nome}" adicionados ao carrinho.`
        };
    };

    Fx.alterarQuantidade = (produtoId, quantidade) => {
        if (quantidade <= 0) return Fx.remover(produtoId);
        salvarCarrinho(itensCarrinho().map((i) => (i.produtoId === produtoId ? { ...i, quantidade: Math.min(MAX, quantidade) } : i)));
    };

    Fx.remover = (produtoId) => salvarCarrinho(itensCarrinho().filter((i) => i.produtoId !== produtoId));

    function validarCupom(codigo, subtotal) {
        const cupom = D.cupons.find((c) => c.codigo === String(codigo).trim().toUpperCase());
        if (!cupom) return { erro: "Cupom inválido ou expirado." };
        if (subtotal < cupom.valorMinimo) return { erro: `O cupom ${cupom.codigo} vale para pedidos a partir de ${Fx.moeda(cupom.valorMinimo)}.` };
        return { cupom };
    }

    Fx.aplicarCupom = (codigo) => {
        if (!codigo || !codigo.trim()) return { sucesso: false, mensagem: "Digite o código do cupom." };
        const { cupom, erro } = validarCupom(codigo, Fx.carrinho().subtotal);
        if (erro) return { sucesso: false, mensagem: erro };
        gravar("fx_cupom", cupom.codigo, sessionStorage);
        return { sucesso: true, mensagem: `Cupom ${cupom.codigo} aplicado: ${cupom.descricao}.` };
    };
    Fx.removerCupom = () => apagar("fx_cupom", sessionStorage);

    /** Carrinho já calculado (mesma conta do CarrinhoService.cs): subtotal, desconto, entrega e total. */
    Fx.carrinho = () => {
        const itens = itensCarrinho().map((i) => {
            const p = Fx.produto(i.produtoId);
            return p && {
                produtoId: p.id, nome: p.nome, imagemUrl: p.imagemUrl, categoria: p.categoria.nome,
                precoUnitario: p.preco, quantidade: i.quantidade, disponivel: p.disponivel,
                subtotal: arredondar(p.preco * i.quantidade)
            };
        }).filter(Boolean);

        const c = {
            itens,
            subtotal: arredondar(itens.filter((i) => i.disponivel).reduce((s, i) => s + i.subtotal, 0)),
            desconto: 0, cupomCodigo: null, cupomDescricao: null, avisoCupom: null,
            freteGratisAcimaDe: D.loja.freteGratisAcimaDe,
            pedidoMinimo: D.loja.pedidoMinimo,
            quantidadeMaximaPorItem: MAX
        };

        const codigo = ler("fx_cupom", null, sessionStorage);
        if (codigo && c.subtotal > 0) {
            const { cupom, erro } = validarCupom(codigo, c.subtotal);
            if (cupom) {
                c.cupomCodigo = cupom.codigo;
                c.cupomDescricao = cupom.descricao;
                c.desconto = arredondar(c.subtotal * cupom.percentual / 100);
            } else {
                c.avisoCupom = erro;
            }
        }

        const comDesconto = arredondar(c.subtotal - c.desconto);
        const freteGratis = c.freteGratisAcimaDe > 0 && comDesconto >= c.freteGratisAcimaDe;
        c.taxaEntrega = c.subtotal === 0 || freteGratis ? 0 : D.loja.taxaEntrega;
        c.total = arredondar(comDesconto + c.taxaEntrega);

        c.quantidadeItens = itens.reduce((s, i) => s + i.quantidade, 0);
        c.vazio = itens.length === 0;
        c.temItemIndisponivel = itens.some((i) => !i.disponivel);
        c.atingiuPedidoMinimo = c.subtotal >= c.pedidoMinimo;
        c.faltaParaFreteGratis = c.freteGratisAcimaDe > 0 && c.taxaEntrega > 0 ? Math.max(0, arredondar(c.freteGratisAcimaDe - comDesconto)) : 0;
        c.podeFinalizar = !c.vazio && !c.temItemIndisponivel && c.atingiuPedidoMinimo;
        return c;
    };

    // ----------------------------------------------------------- pedidos
    Fx.STATUS = [
        { nome: "Aguardando confirmação", css: "status-aguardando", icone: "bi-hourglass-split" },
        { nome: "Em preparação", css: "status-preparacao", icone: "bi-fire" },
        { nome: "Saiu para entrega", css: "status-entrega", icone: "bi-scooter" },
        { nome: "Entregue", css: "status-entregue", icone: "bi-check2-circle" },
        { nome: "Cancelado", css: "status-cancelado", icone: "bi-x-circle" }
    ];
    Fx.CANCELADO = 4;
    Fx.PAGAMENTOS = {
        DinheiroNaEntrega: "Dinheiro na entrega",
        CartaoNaEntrega: "Cartão na entrega",
        PixDemonstrativo: "PIX (demonstrativo)"
    };

    // Sem painel admin na versão estática, o pedido "anda sozinho" (demonstração): segundos após o pedido
    // em que cada status começa. Aos 30s o entregador chega e o pedido só vira "Entregue" com o código de entrega.
    const SEGUNDOS_STATUS = [0, 10, 20];
    Fx.SEGUNDOS_CHEGADA = 30;
    const segundosDesde = (p) => (Date.now() - new Date(p.dataPedido).getTime()) / 1000;
    const novoCodigo = () => String(Math.floor(1000 + Math.random() * 9000));

    function avancarSimulacao(pedido) {
        let mudou = false;
        if (!pedido.codigoEntrega) { pedido.codigoEntrega = novoCodigo(); mudou = true; }
        if (pedido.status === Fx.CANCELADO || pedido.status >= 3) return mudou;
        const seg = segundosDesde(pedido);
        const base = new Date(pedido.dataPedido).getTime();
        for (let s = pedido.status + 1; s < SEGUNDOS_STATUS.length && seg >= SEGUNDOS_STATUS[s]; s++) {
            pedido.status = s;
            pedido.historico.push({ status: s, data: new Date(base + SEGUNDOS_STATUS[s] * 1000).toISOString(), observacao: "Atualização automática (simulação)." });
            mudou = true;
        }
        if (pedido.status === 2 && !pedido.chegouEm && seg >= Fx.SEGUNDOS_CHEGADA) {
            pedido.chegouEm = new Date(base + Fx.SEGUNDOS_CHEGADA * 1000).toISOString();
            pedido.historico.push({ status: 2, data: pedido.chegouEm, observacao: "O entregador chegou. Aguardando o código de entrega." });
            mudou = true;
        }
        return mudou;
    }

    Fx.entregadorChegou = (p) => p.status === 2 && !!p.chegouEm;

    /** Etapa do rastreio animado: aguardando, preparo, caminho, chegou, entregue ou cancelado. */
    Fx.etapaRastreio = (p) => {
        if (p.status === Fx.CANCELADO) return { etapa: "cancelado", restante: null, progresso: 1 };
        if (p.status >= 3) return { etapa: "entregue", restante: null, progresso: 1 };
        if (Fx.entregadorChegou(p)) return { etapa: "chegou", restante: null, progresso: 1 };
        const seg = segundosDesde(p);
        const fim = p.status + 1 < SEGUNDOS_STATUS.length ? SEGUNDOS_STATUS[p.status + 1] : Fx.SEGUNDOS_CHEGADA;
        return { etapa: ["aguardando", "preparo", "caminho"][p.status], restante: Math.max(1, Math.ceil(fim - seg)), progresso: Math.min(1, seg / Fx.SEGUNDOS_CHEGADA) };
    };

    const todosPedidos = () => ler("fx_pedidos", []);

    /** Pedidos do usuário logado, do mais recente para o mais antigo. */
    Fx.pedidos = () => {
        const u = Fx.usuario();
        if (!u) return [];
        const todos = todosPedidos();
        if (todos.map(avancarSimulacao).some(Boolean)) gravar("fx_pedidos", todos);
        return todos.filter((p) => p.email === u.email).sort((a, b) => b.id - a.id);
    };

    Fx.pedido = (id) => Fx.pedidos().find((p) => p.id === Number(id)) || null;

    Fx.criarPedido = (dados) => {
        const u = Fx.usuario();
        const c = Fx.carrinho();
        if (c.vazio) return { sucesso: false, mensagem: "Seu carrinho está vazio." };
        if (c.temItemIndisponivel) return { sucesso: false, mensagem: "Há itens indisponíveis no carrinho. Remova-os para continuar." };
        if (!c.atingiuPedidoMinimo) return { sucesso: false, mensagem: `O pedido mínimo é de ${Fx.moeda(c.pedidoMinimo)}.` };
        if (dados.formaPagamento === "DinheiroNaEntrega" && dados.trocoPara != null && dados.trocoPara < c.total)
            return { sucesso: false, campo: "TrocoPara", mensagem: `O valor para troco deve ser maior ou igual ao total (${Fx.moeda(c.total)}).` };

        const todos = todosPedidos();
        const agora = new Date().toISOString();
        const pedido = {
            id: todos.reduce((maior, p) => Math.max(maior, p.id), 1000) + 1,
            email: u.email,
            dataPedido: agora,
            status: 0,
            nomeCliente: dados.nomeCliente,
            telefone: dados.telefone,
            enderecoEntrega: dados.enderecoEntrega,
            complemento: dados.complemento,
            formaPagamento: dados.formaPagamento,
            trocoPara: dados.formaPagamento === "DinheiroNaEntrega" ? dados.trocoPara : null,
            observacoes: dados.observacoes,
            itens: c.itens.map((i) => ({ produtoId: i.produtoId, nomeProduto: i.nome, quantidade: i.quantidade, precoUnitario: i.precoUnitario, subtotal: i.subtotal })),
            subtotal: c.subtotal, desconto: c.desconto, cupomCodigo: c.cupomCodigo, taxaEntrega: c.taxaEntrega, total: c.total,
            codigoEntrega: novoCodigo(),
            historico: [{ status: 0, data: agora, observacao: "Pedido realizado pelo site." }]
        };
        todos.push(pedido);
        gravar("fx_pedidos", todos);

        // Endereço digitado no checkout vem numa linha só: fica na "rua" e as partes são limpas (igual ao PedidoService.cs)
        if (dados.salvarEndereco) Fx.atualizarPerfil({
            endereco: dados.enderecoEntrega, cep: "", numero: "", bairro: "", cidade: "", uf: "",
            complemento: dados.complemento || "", telefone: dados.telefone
        });
        salvarCarrinho([]);
        Fx.removerCupom();
        return { sucesso: true, mensagem: `Pedido nº ${pedido.id} recebido!`, id: pedido.id };
    };

    Fx.cancelarPedido = (id) => {
        const u = Fx.usuario();
        const todos = todosPedidos();
        const pedido = todos.find((p) => p.id === Number(id) && u && p.email === u.email);
        if (!pedido) return { sucesso: false, mensagem: "Pedido não encontrado." };
        avancarSimulacao(pedido);
        if (pedido.status !== 0)
            return { sucesso: false, mensagem: "Este pedido já está em preparação e não pode mais ser cancelado pelo site. Fale conosco." };
        pedido.status = Fx.CANCELADO;
        pedido.historico.push({ status: Fx.CANCELADO, data: new Date().toISOString(), observacao: "Cancelado pelo cliente." });
        gravar("fx_pedidos", todos);
        return { sucesso: true, mensagem: `Pedido nº ${pedido.id} cancelado.` };
    };

    Fx.confirmarEntrega = (id, codigo) => {
        const u = Fx.usuario();
        const todos = todosPedidos();
        const pedido = todos.find((p) => p.id === Number(id) && u && p.email === u.email);
        if (!pedido) return { sucesso: false, mensagem: "Pedido não encontrado." };
        avancarSimulacao(pedido);
        if (!Fx.entregadorChegou(pedido)) return { sucesso: false, mensagem: "O entregador ainda não chegou." };
        if (String(codigo || "").trim() !== pedido.codigoEntrega)
            return { sucesso: false, mensagem: "Código incorreto. Confira o código de entrega e tente de novo." };
        pedido.status = 3;
        pedido.historico.push({ status: 3, data: new Date().toISOString(), observacao: "Entrega confirmada com o código." });
        gravar("fx_pedidos", todos);
        return { sucesso: true, mensagem: `Pedido nº ${pedido.id} entregue. Bom apetite!` };
    };

    // ---------------------------------------------------------- contato
    Fx.registrarMensagem = (dados) => {
        const lista = ler("fx_mensagens", []);
        lista.push({ ...dados, data: new Date().toISOString() });
        gravar("fx_mensagens", lista);
    };

    // ------------------------------------------- validação de formulários
    // Substitui o jQuery Validation do ASP.NET usando as mesmas classes CSS
    // (.field-validation-error, .input-validation-error, .validation-summary-errors).
    // regras: { NomeDoCampo: (valor, form) => "mensagem de erro" ou "" }
    Fx.validar = (form, regras) => {
        let primeiroInvalido = null;
        Object.keys(regras).forEach((nome) => {
            const campo = form.elements[nome];
            const valor = campo.type === "checkbox" ? campo.checked : (campo.value ?? "");
            const erro = regras[nome](typeof valor === "string" ? valor.trim() : valor, form) || "";
            Fx.erroCampo(form, nome, erro);
            if (erro && !primeiroInvalido) primeiroInvalido = campo.length && !campo.tagName ? campo[0] : campo;
        });
        Fx.erroGeral(form, "");
        // Abre o bloco recolhido (endereço do cadastro) que tiver erro dentro, como faz o Cadastro.cshtml
        form.querySelectorAll("details").forEach((bloco) => { if (bloco.querySelector(".input-validation-error")) bloco.open = true; });
        if (primeiroInvalido) primeiroInvalido.focus();
        return !primeiroInvalido;
    };

    Fx.erroCampo = (form, nome, mensagem) => {
        const span = form.querySelector(`[data-erro-para="${nome}"]`);
        if (span) {
            span.textContent = mensagem;
            span.className = mensagem ? "field-validation-error" : "field-validation-valid";
        }
        const campo = form.elements[nome];
        if (campo && campo.classList) {
            campo.classList.toggle("input-validation-error", !!mensagem);
            campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
        }
    };

    Fx.erroGeral = (form, mensagem) => {
        const caixa = form.querySelector("[data-resumo-erros]");
        if (!caixa) return;
        caixa.textContent = mensagem;
        caixa.className = mensagem ? "validation-summary-errors" : "validation-summary-valid";
    };
})();
