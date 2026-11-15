/* ==========================================================================
   FUEGO MX: assistente virtual (chatbot)
   MODO IA (principal): cada pergunta vai para o servidor C# (POST /Chat/Perguntar),
   que consulta o Claude (IA da Anthropic) com as regras da loja e o cardápio, e a
   resposta chega aos pedaços (streaming). Responde em qualquer idioma; a interface
   tem português, inglês, espanhol, árabe e chinês (seletor no topo da janela).
   MODO RESERVA: se a IA não estiver disponível (servidor desligado, sem chave da
   API ou fora do ar), o chatbot usa as respostas prontas por palavras-chave abaixo
   (só em português). Nada é perdido: a pessoa sempre recebe alguma resposta.

   O MESMO arquivo é usado nas duas versões do site:
     - C# (src/FuegoMX): o _Layout define window.FxChatConfig (links, /Chat/Dados, /Chat/Perguntar).
     - Estática (site-estatico): sem FxChatConfig, usa window.FxDados (js/dados.js) e chama
       a IA no servidor C# em http://localhost:5175 (se ele estiver rodando).
   Estilos: css/site.css, seção "18. ASSISTENTE VIRTUAL".
   ========================================================================== */
(function () {
    "use strict";

    // ------------------------------------------------------- configuração
    const estatico = !window.FxChatConfig;
    const config = window.FxChatConfig || {
        ia: "http://localhost:5175/Chat/Perguntar",
        links: {
            inicio: "index.html", cardapio: "cardapio.html", categoria: "cardapio.html?categoriaId=",
            produto: "produto.html?id=", carrinho: "carrinho.html", pedidos: "pedidos.html",
            perfil: "perfil.html", cadastro: "cadastro.html", login: "login.html",
            contato: "contato.html", sobre: "sobre.html", privacidade: "privacidade.html"
        }
    };
    const L = config.links;

    // Informações fixas da loja (as mesmas do rodapé)
    const LOJA = {
        endereco: "Rua das Pimentas, 123, Centro",
        telefone: "(11) 4000-0000",
        email: "contato@fuegomx.com.br",
        tempoEntrega: "cerca de 40 minutos",
        // 0 = domingo ... 6 = sábado. Segunda (1) fechado.
        abre: 11, fecha: 23, diasFechado: [1]
    };

    // ------------------------------------------------------------ dados
    let dados = null; // { produtos, categorias, loja, cupons }

    function carregarDados() {
        if (dados) return Promise.resolve(dados);
        if (estatico && window.FxDados) {
            const D = window.FxDados;
            const nomeCategoria = (id) => (D.categorias.find((c) => c.id === id) || {}).nome || "";
            dados = {
                categorias: D.categorias.slice().sort((a, b) => a.ordem - b.ordem),
                produtos: D.produtos.map((p) => ({
                    id: p.id, nome: p.nome, descricao: p.descricao, preco: p.preco,
                    categoriaId: p.categoriaId, categoria: nomeCategoria(p.categoriaId),
                    imagemUrl: `images/produtos/${p.imagem}.jpg`, picancia: p.picancia,
                    vendidos: p.vendidos, destaque: !!p.destaque, disponivel: p.disponivel !== false
                })),
                loja: D.loja,
                cupons: D.cupons.map((c) => ({ codigo: c.codigo, descricao: c.descricao }))
            };
            return Promise.resolve(dados);
        }
        return fetch(config.fonte, { headers: { Accept: "application/json" }, credentials: "same-origin" })
            .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
            .then((json) => (dados = json));
    }

    // ------------------------------------------------------ utilidades
    const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const R$ = (v) => moeda.format(v);
    const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

    /** minúsculas, sem acentos e sem pontuação: "Está ABERTO?" → "esta aberto" */
    function normalizar(texto) {
        return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    }
    /** "tacos" e "taco" viram a mesma palavra (plural simples) */
    const raiz = (p) => (p.length > 3 ? p.replace(/s$/, "") : p);
    const palavras = (texto) => normalizar(texto).split(" ").filter(Boolean);

    /** a frase (já normalizada) contém alguma destas palavras/expressões inteiras? */
    function tem(frase, lista) {
        const f = " " + frase + " ";
        return lista.some((x) => f.includes(" " + x + " "));
    }

    const link = (url, texto) => `<a href="${esc(url)}">${esc(texto)}</a>`;
    const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`;

    function abertoAgora() {
        const agora = new Date();
        const hora = agora.getHours() + agora.getMinutes() / 60;
        return !LOJA.diasFechado.includes(agora.getDay()) && hora >= LOJA.abre && hora < LOJA.fecha;
    }

    // ------------------------------------------------- cartões de prato
    function cartaoPrato(p, t) {
        return `<a class="chat-prato${p.disponivel ? "" : " chat-prato--off"}" href="${esc(L.produto + p.id)}">
                <img src="${esc(p.imagemUrl)}" alt="" loading="lazy" width="48" height="48" />
                <span class="chat-prato__info">
                    <strong>${esc(p.nome)}</strong>
                    <small>${esc(p.categoria)}${p.picancia > 0 ? ` · <span role="img" aria-label="${esc(t.picancia(p.picancia))}">${"🌶".repeat(p.picancia)}</span>` : ""}${p.disponivel ? "" : " · " + esc(t.indisponivel)}</small>
                </span>
                <span class="chat-prato__preco">${R$(p.preco)}</span>
            </a>`;
    }
    function cartoesProdutos(produtos, titulo) {
        const itens = produtos.slice(0, 5).map((p) => cartaoPrato(p, IDIOMAS.pt)).join("");
        const resto = produtos.length > 5 ? `<p class="chat-nota">E mais ${produtos.length - 5} no ${link(L.cardapio, "cardápio completo")}.</p>` : "";
        return (titulo ? `<p>${titulo}</p>` : "") + `<div class="chat-pratos">${itens}</div>` + resto;
    }

    const porVendas = (a, b) => (b.disponivel - a.disponivel) || (b.destaque - a.destaque) || (b.vendidos - a.vendidos);
    const ehVegano = (p) => /vegan|vegetal/.test(normalizar(p.nome + " " + p.descricao));
    const CARNES = /carne|frango|suino|lombo|bovin|pastor|moida|bacon|chorizo|linguica|presunto|peixe|camarao/;
    /** Leva carne? Também vale para combos: "2 Tacos Picantes + ..." cita um prato que leva frango. */
    function temCarne(p) {
        if (CARNES.test(normalizar(p.nome + " " + p.descricao))) return true;
        const descricao = palavras(p.descricao).map(raiz);
        return dados.produtos.some((outro) => outro.id !== p.id && CARNES.test(normalizar(outro.nome + " " + outro.descricao)) &&
            palavras(outro.nome).map(raiz).filter((x) => x.length > 2).every((x) => descricao.includes(x)));
    }
    const ehBebida = (p) => raiz(normalizar(p.categoria)) === "bebida";

    // ------------------------------------------------- respostas prontas
    // Cada assunto tem palavras-chave e uma função que monta a resposta (HTML) e as sugestões seguintes.
    const ASSUNTOS = [
        {
            id: "horario",
            chaves: ["horario", "horarios", "abre", "abrem", "aberto", "aberta", "abertos", "fecha", "fecham", "fechado", "funciona",
                "funcionamento", "que horas", "ate que horas", "segunda", "domingo", "feriado", "expediente"],
            responder: () => {
                const status = abertoAgora()
                    ? `<p class="chat-status chat-status--aberto">Estamos <strong>abertos agora</strong>. Dá tempo de pedir!</p>`
                    : `<p class="chat-status chat-status--fechado">Estamos <strong>fechados agora</strong>, mas você já pode ver o ${link(L.cardapio, "cardápio")}.</p>`;
                return {
                    html: status + lista([`<strong>Terça a domingo:</strong> das ${LOJA.abre}h às ${LOJA.fecha}h`, "<strong>Segunda:</strong> fechado"]),
                    sugestoes: ["Tempo de entrega", "Ver o cardápio"]
                };
            }
        },
        {
            id: "entrega",
            chaves: ["entrega", "entregas", "entregam", "entregar", "frete", "taxa", "delivery", "demora", "demorar", "tempo",
                "minutos", "chega", "chegar", "bairro", "regiao", "cidade", "motoboy", "entregador", "gratis"],
            responder: (d) => ({
                html: `<p>A entrega leva <strong>${LOJA.tempoEntrega}</strong> depois que o pedido é confirmado.</p>` + lista([
                    `Taxa de entrega: <strong>${R$(d.loja.taxaEntrega)}</strong>`,
                    d.loja.freteGratisAcimaDe > 0 ? `<strong>Entrega grátis</strong> em pedidos a partir de ${R$(d.loja.freteGratisAcimaDe)} (já com desconto)` : "",
                    `Pedido mínimo: ${R$(d.loja.pedidoMinimo)}`
                ].filter(Boolean)) + `<p class="chat-nota">O endereço é informado na hora de finalizar o pedido.</p>`,
                sugestoes: ["Formas de pagamento", "Tem cupom?", "Acompanhar pedido"]
            })
        },
        {
            id: "minimo",
            chaves: ["pedido minimo", "valor minimo", "minimo"],
            responder: (d) => ({
                html: `<p>O pedido mínimo é de <strong>${R$(d.loja.pedidoMinimo)}</strong> em produtos (sem contar a entrega).</p>`,
                sugestoes: ["Taxa de entrega", "Pratos mais baratos"]
            })
        },
        {
            id: "pagamento",
            chaves: ["pagamento", "pagar", "pago", "pix", "cartao", "credito", "debito", "dinheiro", "troco", "vale refeicao",
                "vr", "boleto", "forma de pagamento", "formas de pagamento", "aceita", "aceitam"],
            responder: () => ({
                html: `<p>Você escolhe a forma de pagamento ao finalizar o pedido:</p>` + lista([
                    "<strong>Dinheiro na entrega</strong>: dá para pedir troco",
                    "<strong>Cartão na entrega</strong>: crédito ou débito, na maquininha do entregador",
                    "<strong>PIX</strong>: o QR Code aparece depois do pedido (demonstrativo, é um projeto escolar)"
                ]),
                sugestoes: ["Tem cupom?", "Como fazer um pedido"]
            })
        },
        {
            id: "cupom",
            chaves: ["cupom", "cupons", "desconto", "descontos", "promocao", "promocoes", "promo", "oferta", "ofertas", "codigo", "voucher"],
            responder: (d) => ({
                html: (d.cupons.length
                    ? `<p>Cupons válidos agora (digite o código no carrinho):</p>` +
                      lista(d.cupons.map((c) => `<span class="codigo-cupom">${esc(c.codigo)}</span> ${esc(c.descricao)}`))
                    : `<p>No momento não há cupons ativos.</p>`) +
                    `<p class="chat-nota">Só vale um cupom por pedido.</p>`,
                sugestoes: ["Ver o carrinho", "Mais pedidos"]
            })
        },
        {
            id: "acompanhar",
            chaves: ["status", "acompanhar", "rastrear", "rastreio", "meu pedido", "meus pedidos", "onde esta", "cade", "atrasado",
                "atrasou", "atraso", "nao chegou", "chegou", "andamento", "historico"],
            responder: () => ({
                html: `<p>Em ${link(L.pedidos, "Meus Pedidos")} você vê cada pedido e em que etapa ele está:</p>` + lista([
                    "Aguardando confirmação", "Em preparação", "Saiu para entrega", "Entregue"
                ]) + `<p class="chat-nota">Passou de 60 minutos? Ligue para ${esc(LOJA.telefone)} que a gente verifica.</p>`,
                sugestoes: ["Cancelar pedido", "Falar com a loja"]
            })
        },
        {
            id: "cancelar",
            chaves: ["cancelar", "cancelamento", "cancela", "desistir", "desisti", "estornar", "estorno", "reembolso", "devolver"],
            responder: () => ({
                html: `<p>Enquanto o pedido estiver <strong>Aguardando confirmação</strong>, você mesmo cancela em ${link(L.pedidos, "Meus Pedidos")}: abra o pedido e use o botão "Cancelar pedido".</p>` +
                    `<p>Se ele já estiver em preparação, fale com a gente pelo telefone ${esc(LOJA.telefone)}.</p>`,
                sugestoes: ["Acompanhar pedido", "Falar com a loja"]
            })
        },
        {
            id: "comoPedir",
            chaves: ["como pedir", "como peco", "como faco", "como faz", "como fazer", "fazer pedido", "fazer um pedido", "como comprar",
                "como compro", "quero pedir", "quero comprar", "finalizar", "passo a passo"],
            responder: () => ({
                html: lista([
                    `Escolha seus pratos no ${link(L.cardapio, "cardápio")} e toque em <strong>Adicionar</strong>`,
                    `Abra o ${link(L.carrinho, "carrinho")}, ajuste as quantidades e aplique um cupom, se tiver`,
                    `Toque em <strong>Finalizar pedido</strong>, informe o endereço e a forma de pagamento`,
                    `Pronto! Acompanhe em ${link(L.pedidos, "Meus Pedidos")}`
                ]).replace("<ul>", "<ol>").replace("</ul>", "</ol>") +
                    `<p class="chat-nota">Para finalizar é preciso ter uma conta (${link(L.cadastro, "criar conta")}).</p>`,
                sugestoes: ["Ver o cardápio", "Formas de pagamento"]
            })
        },
        {
            id: "conta",
            chaves: ["criar conta", "minha conta", "uma conta", "ter conta", "fazer conta", "conta nova", "cadastro", "cadastrar", "cadastra", "registrar", "login", "logar", "entrar", "senha", "esqueci",
                "perfil", "meus dados", "alterar dados", "mudar endereco", "trocar senha", "cpf"],
            responder: (d, frase) => {
                if (tem(frase, ["senha", "esqueci", "trocar senha"])) {
                    return {
                        html: `<p>Logado, você troca a senha em ${link(L.perfil, "Meu perfil")} → <strong>Alterar senha</strong>.</p>` +
                            `<p>Esqueceu a senha? Por enquanto a recuperação é feita pela loja: fale com a gente em ${link(L.contato, "Contato")} usando o e-mail da conta.</p>`,
                        sugestoes: ["Falar com a loja"]
                    };
                }
                return {
                    html: `<p>Criar conta é rápido e gratuito: ${link(L.cadastro, "criar minha conta")}. Pedimos nome, e-mail, telefone, CPF, data de nascimento (18 anos ou mais) e uma senha. O endereço é opcional.</p>` +
                        `<p>Já tem conta? ${link(L.login, "Entrar")}. Para mudar telefone ou endereço, use ${link(L.perfil, "Meu perfil")}.</p>`,
                    sugestoes: ["Como fazer um pedido", "Meus dados estão seguros?"]
                };
            }
        },
        {
            id: "privacidade",
            chaves: ["privacidade", "seguro", "seguros", "seguranca", "lgpd", "meus dados estao", "dados pessoais", "termos"],
            responder: () => ({
                html: `<p>Seus dados são usados só para entregar seus pedidos. A senha é guardada de forma criptografada e ninguém da loja consegue vê-la.</p>` +
                    `<p>Todos os detalhes estão em ${link(L.privacidade, "Privacidade e termos")}.</p>`,
                sugestoes: ["Criar conta"]
            })
        },
        {
            id: "contato",
            chaves: ["contato", "telefone", "ligar", "whatsapp", "whats", "zap", "email", "e mail", "endereco da loja", "onde fica",
                "onde voces ficam", "localizacao", "falar com", "atendente", "humano", "pessoa", "reclamacao", "reclamar", "sugestao",
                "elogio", "falar com a loja", "retirar", "retirada", "buscar na loja"],
            responder: (d, frase) => ({
                html: (tem(frase, ["retirar", "retirada", "buscar na loja"]) ? `<p>No momento trabalhamos só com entrega (sem retirada no balcão).</p>` : "") +
                    `<p>Sou um assistente automático. Para falar com a equipe:</p>` + lista([
                        `<i class="bi bi-telephone" aria-hidden="true"></i> ${esc(LOJA.telefone)}`,
                        `<i class="bi bi-envelope" aria-hidden="true"></i> ${esc(LOJA.email)}`,
                        `<i class="bi bi-geo-alt" aria-hidden="true"></i> ${esc(LOJA.endereco)}`,
                        `<i class="bi bi-chat-left-text" aria-hidden="true"></i> Formulário em ${link(L.contato, "Contato")}`
                    ]),
                sugestoes: ["Horário de funcionamento"]
            })
        },
        {
            id: "alergia",
            chaves: ["alergia", "alergico", "alergica", "gluten", "lactose", "intolerante", "intolerancia", "ingrediente", "ingredientes",
                "amendoim", "frutos do mar", "celiaco", "diabetico", "acucar", "calorias", "nutricional"],
            responder: () => ({
                html: `<p>Os ingredientes principais estão na página de cada prato. Mas a cozinha usa os mesmos utensílios para tudo, então <strong>não garantimos ausência de traços</strong> (glúten, lactose etc.).</p>` +
                    `<p>Tem alguma alergia séria? Escreva nas <strong>observações</strong> do pedido e ligue para ${esc(LOJA.telefone)} antes de pedir.</p>`,
                sugestoes: ["Opções vegetarianas", "Pratos sem pimenta"]
            })
        },
        {
            id: "sobre",
            chaves: ["sobre voces", "sobre a loja", "sobre a fuego", "historia", "quem sao", "quem e voces", "empresa", "dono", "andreia"],
            responder: () => ({
                html: `<p>A FUEGO MX é uma cozinha mexicana de delivery, com receitas inspiradas nas taquerias da Cidade do México. Tacos, burritos e nachos preparados na hora.</p>` +
                    `<p>Conheça nossa história em ${link(L.sobre, "Sobre nós")}.</p>` +
                    `<p class="chat-nota">É um projeto escolar: a empresa é fictícia.</p>`,
                sugestoes: ["Mais pedidos", "Ver o cardápio"]
            })
        }
    ];

    // Atalhos clicáveis → frase que o assistente entende
    const SUGESTOES = {
        "Ver o cardápio": "cardápio", "Mais pedidos": "mais pedidos", "Horário de funcionamento": "horário",
        "Tempo de entrega": "entrega", "Taxa de entrega": "taxa de entrega", "Formas de pagamento": "pagamento",
        "Tem cupom?": "cupom", "Acompanhar pedido": "acompanhar pedido", "Cancelar pedido": "cancelar pedido",
        "Falar com a loja": "falar com atendente", "Como fazer um pedido": "como fazer pedido", "Criar conta": "criar conta",
        "Ver o carrinho": "__carrinho", "Pratos mais baratos": "mais barato", "Opções vegetarianas": "vegetariano",
        "Pratos sem pimenta": "sem pimenta", "Algo bem picante": "bem picante", "Meus dados estão seguros?": "meus dados estao seguros"
    };
    const SUGESTOES_INICIAIS = ["Ver o cardápio", "Mais pedidos", "Horário de funcionamento", "Tempo de entrega", "Formas de pagamento", "Tem cupom?"];

    // ------------------------------------------------ busca no cardápio
    // Junta tudo o que a pessoa pediu: categoria ("tacos"), prato ("al pastor"), e filtros
    // ("picante", "sem pimenta", "vegano", "barato", "mais pedido"). Devolve null se não for sobre comida.
    const FILTROS = {
        semPimenta: ["sem pimenta", "nao picante", "nao e picante", "nao seja picante", "suave", "nao arde", "sem ardencia", "crianca", "criancas", "fraco"],
        picante: ["picante", "picantes", "apimentado", "apimentada", "pimenta", "ardido", "ardida", "jalapeno", "habanero", "chipotle"],
        vegano: ["vegano", "vegana", "veganos", "veganas", "vegan", "vegetal"],
        vegetariano: ["vegetariano", "vegetariana", "vegetarianos", "vegetarianas", "sem carne", "veggie"],
        barato: ["barato", "barata", "baratos", "mais barato", "economico", "em conta", "menor preco", "pouco dinheiro", "custo beneficio"],
        popular: ["mais pedido", "mais pedidos", "mais vendido", "mais vendidos", "popular", "populares", "recomenda", "recomendacao",
            "recomendacoes", "recomendam", "recomendaria", "sugere", "sugerem", "sugestao de prato", "indicam", "o que e bom", "indica", "indicacao", "melhor prato", "melhores pratos", "favorito", "destaque",
            "especialidade", "carro chefe", "o que pedir", "o que eu peco", "nao sei o que pedir", "primeira vez"],
        cardapio: ["cardapio", "menu", "pratos", "opcoes", "o que tem", "o que voces tem", "comida", "comidas", "tem o que", "vendem"]
    };
    const PALAVRAS_VAZIAS = new Set(["de", "da", "do", "das", "dos", "com", "sem", "e", "o", "a", "os", "as", "um", "uma", "tem", "voces",
        "quero", "qual", "quais", "quanto", "custa", "preco", "valor", "me", "para", "pra", "no", "na", "em", "eu", "que", "mais", "muito",
        "bem", "algum", "alguma", "opcao", "opcoes", "prato", "pratos", "ai", "ver", "mostra", "mostrar", "por", "favor", "pf", "oi", "ola",
        "hoje", "agora", "aqui", "esse", "essa", "isso", "como", "e", "la", "so"]);

    function buscarComida(d, frase, buscarIngrediente) {
        const termos = palavras(frase).filter((p) => !PALAVRAS_VAZIAS.has(p)).map(raiz);
        const f = {};
        Object.keys(FILTROS).forEach((k) => { f[k] = tem(frase, FILTROS[k]); });
        if (f.semPimenta) f.picante = false;
        if (f.vegano) f.vegetariano = false;

        // Categorias citadas ("tacos", "bebida", "sobremesas", "doce")
        const sinonimos = { doce: "sobremesa", sobremesa: "sobremesa", beber: "bebida", bebe: "bebida", suco: "bebida",
            refri: "bebida", lanche: "combo" };
        const raizesCategorias = d.categorias.map((c) => raiz(normalizar(c.nome)));
        const categorias = d.categorias.filter((c, i) =>
            termos.some((t) => t === raizesCategorias[i] || raiz(sinonimos[t] || "") === raizesCategorias[i]));
        const categoriaIds = categorias.map((c) => c.id);

        // Pratos citados pelo nome. Palavras que são nome de categoria ("taco") valem pouco; as outras
        // ("pastor", "frango", "guacamole") decidem: "taco al pastor" acha só o Taco al Pastor, e
        // "burrito de frango" prefere o Burrito de Frango à Quesadilla de Frango.
        const pontos = (p) => {
            const nome = palavras(p.nome).map(raiz).filter((x) => !PALAVRAS_VAZIAS.has(x) && x.length > 2);
            const comuns = nome.filter((x) => termos.includes(x));
            const especificas = comuns.filter((x) => !raizesCategorias.includes(x));
            return especificas.length ? especificas.length * 10 + comuns.length : comuns.length >= 2 ? comuns.length : 0;
        };
        const notas = d.produtos.map((p) => ({ p, n: pontos(p) })).filter((x) => x.n > 0);
        const maior = Math.max(0, ...notas.map((x) => x.n));
        const porNome = notas.filter((x) => x.n === maior).map((x) => x.p);

        // Ingrediente na descrição ("abacaxi", "queijo") só quando a pergunta não é sobre outro assunto
        let porIngrediente = [], ingrediente = "";
        if (buscarIngrediente && !categorias.length && !porNome.length) {
            for (const t of termos.filter((x) => x.length > 3)) {
                porIngrediente = d.produtos.filter((p) => palavras(p.descricao).map(raiz).includes(t));
                if (porIngrediente.length) { ingrediente = t; break; }
            }
        }

        const algumFiltro = f.semPimenta || f.picante || f.vegano || f.vegetariano || f.barato || f.popular;
        if (!categorias.length && !porNome.length && !porIngrediente.length && !algumFiltro && !f.cardapio) return null;

        // Só "cardápio"/"menu": mostra as categorias
        if (f.cardapio && !categorias.length && !porNome.length && !porIngrediente.length && !algumFiltro) {
            return {
                html: `<p>Nosso cardápio tem ${d.produtos.length} pratos em ${d.categorias.length} categorias:</p>` +
                    `<div class="chat-categorias">${d.categorias.map((c) => link(L.categoria + c.id, c.nome)).join("")}</div>` +
                    `<p class="chat-nota">Pergunte por uma categoria ou prato, por exemplo: "tem taco picante?"</p>`,
                sugestoes: ["Mais pedidos", "Opções vegetarianas", "Pratos mais baratos"]
            };
        }

        let resultado = porNome.length ? porNome
            : porIngrediente.length ? porIngrediente
            : categorias.length ? d.produtos.filter((p) => categoriaIds.includes(p.categoriaId))
            : d.produtos.slice();
        const base = resultado.slice();

        if (f.picante) resultado = resultado.filter((p) => p.picancia >= 2);
        if (f.semPimenta) resultado = resultado.filter((p) => p.picancia === 0);
        if (f.vegano) resultado = resultado.filter(ehVegano);
        if (f.vegetariano) resultado = resultado.filter((p) => !temCarne(p));
        // Sem categoria citada, "barato", "sem carne" e "sem pimenta" falam de comida: deixa as bebidas de fora
        if (!categorias.length && !porNome.length && (f.barato || f.vegetariano || f.semPimenta)) resultado = resultado.filter((p) => !ehBebida(p));

        // "tacos picantes", "pratos sem pimenta", "burritos veganos"
        const oQue = categorias.length && !porNome.length ? categorias.map((c) => c.nome.toLowerCase()).join(" e ") : "pratos";
        const adjetivos = [f.picante ? "picantes" : "", f.semPimenta ? "sem pimenta" : "", f.vegano ? "veganos" : "",
            f.vegetariano ? "sem carne" : ""].filter(Boolean).join(" e ");
        const descricao = oQue === "pratos" && !adjetivos ? "" : (oQue + (adjetivos ? " " + adjetivos : ""));

        if (!resultado.length) {
            const alternativa = f.vegano ? d.produtos.filter((p) => !temCarne(p)) : base;
            return {
                html: `<p>Não encontrei pratos ${esc(descricao || "com isso")} no cardápio.</p>` +
                    (alternativa.length ? cartoesProdutos(alternativa.sort(porVendas), f.vegano ? "Estas opções não levam carne:" : "Talvez você goste destes:") : ""),
                sugestoes: ["Ver o cardápio", "Mais pedidos"]
            };
        }

        if (f.barato) resultado.sort((a, b) => (b.disponivel - a.disponivel) || (a.preco - b.preco));
        else if (porNome.length) resultado.sort((a, b) => a.preco - b.preco);
        else resultado.sort(porVendas);

        let titulo;
        if (porNome.length === 1 && !algumFiltro) {
            const p = resultado[0];
            titulo = `<strong>${esc(p.nome)}</strong> custa <strong>${R$(p.preco)}</strong>. ${esc(p.descricao)}` +
                (p.disponivel ? "" : ` <em>Hoje ele está indisponível.</em>`);
        } else if (f.popular && !descricao) titulo = "Os mais pedidos da casa:";
        else if (f.barato) titulo = `Os ${esc(descricao || "pratos")} mais em conta:`;
        else if (ingrediente && !descricao) titulo = `Pratos com <strong>${esc(ingrediente)}</strong>:`;
        else titulo = descricao ? `Opções de ${esc(descricao)}:` : "Encontrei estes pratos:";

        const extra = f.vegano && resultado.some((p) => !p.disponivel)
            ? `<p class="chat-nota">A opção vegana está indisponível hoje. Pergunte por "vegetariano" para ver pratos sem carne.</p>` : "";

        return {
            html: cartoesProdutos(resultado, titulo) + extra,
            sugestoes: f.picante ? ["Pratos sem pimenta", "Ver o carrinho"] : ["Tem cupom?", "Tempo de entrega", "Ver o carrinho"]
        };
    }

    // ---------------------------------------------------- "cérebro"
    function responder(texto) {
        const frase = normalizar(texto);
        const d = dados;

        if (!frase) return null;

        const saudacao = tem(frase, ["oi", "ola", "oie", "eai", "e ai", "bom dia", "boa tarde", "boa noite", "hey", "hello", "hola", "salve", "opa"]);
        const agradecimento = tem(frase, ["obrigado", "obrigada", "obg", "valeu", "vlw", "brigado", "agradeco", "gracias", "show", "perfeito", "otimo", "beleza", "blz"]);
        const despedida = tem(frase, ["tchau", "ate mais", "ate logo", "flw", "adios", "bye"]);

        // Assuntos encontrados (pode ser mais de um: "horário e taxa de entrega")
        let assuntos = ASSUNTOS.filter((a) => tem(frase, a.chaves));
        if (assuntos.some((a) => a.id === "minimo")) assuntos = assuntos.filter((a) => a.id !== "entrega" || tem(frase, ["taxa", "frete", "tempo", "demora"]));
        if (assuntos.some((a) => a.id === "cancelar")) assuntos = assuntos.filter((a) => a.id !== "acompanhar");
        if (assuntos.some((a) => a.id === "privacidade")) assuntos = assuntos.filter((a) => a.id !== "conta");

        const comida = buscarComida(d, frase, !assuntos.length);
        const partes = [];
        let sugestoes = [];

        if (saudacao && !assuntos.length && !comida) {
            return {
                html: `<p>¡Hola! 👋 Sou o assistente da FUEGO MX. Posso ajudar com o cardápio, preços, entrega, pagamento e pedidos.</p><p>O que você gostaria de saber?</p>`,
                sugestoes: SUGESTOES_INICIAIS
            };
        }

        assuntos.slice(0, 3).forEach((a) => {
            const r = a.responder(d, frase);
            partes.push(r.html);
            sugestoes = sugestoes.concat(r.sugestoes || []);
        });
        // Pergunta sobre comida junto com um assunto ("tem taco sem pimenta?" / "quanto custa o combo e a entrega?")
        if (comida && (!assuntos.length || assuntos.every((a) => a.id !== "alergia" && a.id !== "sobre"))) {
            partes.push(comida.html);
            sugestoes = comida.sugestoes.concat(sugestoes);
        }

        if (partes.length) return { html: partes.join('<hr class="chat-separador" />'), sugestoes: [...new Set(sugestoes)].slice(0, 4) };

        if (agradecimento) return { html: `<p>Por nada! Bom apetite. 🌮 Se precisar, é só chamar.</p>`, sugestoes: ["Ver o cardápio"] };
        if (despedida) return { html: `<p>¡Hasta luego! Volte sempre. 🌶</p>`, sugestoes: [] };

        return {
            html: `<p>Desculpe, não entendi. Sou um assistente automático e respondo sobre cardápio, preços, entrega, pagamento, cupons e pedidos.</p>` +
                `<p>Tente algo como <em>"tem burrito vegano?"</em> ou <em>"qual a taxa de entrega?"</em>. Se preferir, ${link(L.contato, "fale com a nossa equipe")}.</p>`,
            sugestoes: SUGESTOES_INICIAIS.slice(0, 4)
        };
    }

    // ================================================== idiomas da interface
    // Textos fixos da janela. As respostas da IA vêm no idioma em que a pessoa escrever;
    // as respostas prontas do modo reserva são só em português.
    const IDIOMAS = {
        pt: {
            nome: "Português", curto: "PT", botao: "Dúvidas?", sub: "Assistente com IA · responde na hora", subReserva: "Respostas automáticas",
            boasVindas: "<p>¡Hola! 👋 Sou o assistente virtual da <strong>FUEGO MX</strong>.</p><p>Pergunte o que quiser sobre pratos, preços, entrega, pagamento ou pedidos. Pode escrever em português, inglês, espanhol, árabe ou chinês.</p>",
            campo: "Escreva sua pergunta…", rotuloCampo: "Escreva sua pergunta", enviar: "Enviar pergunta", idioma: "Idioma do assistente",
            limpar: "Apagar a conversa e começar de novo", fechar: "Fechar o assistente", abrir: "Abrir o assistente virtual", digitando: "Digitando",
            sugestoes: ["O que vocês recomendam?", "Tem opção vegetariana?", "Vocês estão abertos agora?", "Quanto custa a entrega?", "Tem cupom de desconto?", "Como faço um pedido?"],
            indisponivel: "indisponível hoje", picancia: (n) => `picância ${n} de 3`,
            reserva: "A IA está indisponível agora. Vou usar as respostas prontas (em português).",
            ocupado: "Muitas perguntas seguidas. Espere um minutinho e tente de novo.",
            falha: "Não consegui responder agora. Tente de novo em instantes ou ligue para a loja: (11) 4000-0000.",
            paginas: { inicio: "Início", cardapio: "Cardápio", carrinho: "Carrinho", pedidos: "Meus Pedidos", perfil: "Meu perfil", cadastro: "Criar conta", login: "Entrar", contato: "Contato", sobre: "Sobre nós", privacidade: "Privacidade e termos" }
        },
        en: {
            nome: "English", curto: "EN", botao: "Questions?", sub: "AI assistant · instant answers", subReserva: "Automatic answers",
            boasVindas: "<p>¡Hola! 👋 I'm the virtual assistant of <strong>FUEGO MX</strong>.</p><p>Ask me anything about dishes, prices, delivery, payment or orders. You can write in Portuguese, English, Spanish, Arabic or Chinese.</p>",
            campo: "Type your question…", rotuloCampo: "Type your question", enviar: "Send question", idioma: "Assistant language",
            limpar: "Clear the conversation and start over", fechar: "Close the assistant", abrir: "Open the virtual assistant", digitando: "Typing",
            sugestoes: ["What do you recommend?", "Any vegetarian options?", "Are you open now?", "How much is delivery?", "Any discount codes?", "How do I place an order?"],
            indisponivel: "unavailable today", picancia: (n) => `spiciness ${n} of 3`,
            reserva: "The AI is unavailable right now. I'll reply with ready-made answers (in Portuguese only).",
            ocupado: "Too many questions in a row. Please wait a minute and try again.",
            falha: "I couldn't answer right now. Please try again shortly or call the restaurant: (11) 4000-0000.",
            paginas: { inicio: "Home", cardapio: "Menu", carrinho: "Cart", pedidos: "My orders", perfil: "My profile", cadastro: "Sign up", login: "Log in", contato: "Contact", sobre: "About us", privacidade: "Privacy & terms" }
        },
        es: {
            nome: "Español", curto: "ES", botao: "¿Dudas?", sub: "Asistente con IA · responde al instante", subReserva: "Respuestas automáticas",
            boasVindas: "<p>¡Hola! 👋 Soy el asistente virtual de <strong>FUEGO MX</strong>.</p><p>Pregúntame lo que quieras sobre platos, precios, envío, pago o pedidos. Puedes escribir en portugués, inglés, español, árabe o chino.</p>",
            campo: "Escribe tu pregunta…", rotuloCampo: "Escribe tu pregunta", enviar: "Enviar pregunta", idioma: "Idioma del asistente",
            limpar: "Borrar la conversación y empezar de nuevo", fechar: "Cerrar el asistente", abrir: "Abrir el asistente virtual", digitando: "Escribiendo",
            sugestoes: ["¿Qué me recomiendan?", "¿Tienen opciones vegetarianas?", "¿Están abiertos ahora?", "¿Cuánto cuesta el envío?", "¿Hay cupones de descuento?", "¿Cómo hago un pedido?"],
            indisponivel: "no disponible hoy", picancia: (n) => `picante ${n} de 3`,
            reserva: "La IA no está disponible ahora. Responderé con respuestas automáticas (solo en portugués).",
            ocupado: "Demasiadas preguntas seguidas. Espera un minuto e inténtalo de nuevo.",
            falha: "No pude responder ahora. Inténtalo de nuevo en unos instantes o llama al restaurante: (11) 4000-0000.",
            paginas: { inicio: "Inicio", cardapio: "Menú", carrinho: "Carrito", pedidos: "Mis pedidos", perfil: "Mi perfil", cadastro: "Crear cuenta", login: "Iniciar sesión", contato: "Contacto", sobre: "Sobre nosotros", privacidade: "Privacidad y términos" }
        },
        ar: {
            nome: "العربية", curto: "عربي", botao: "أسئلة؟", sub: "مساعد بالذكاء الاصطناعي · رد فوري", subReserva: "ردود تلقائية",
            boasVindas: "<p>¡Hola! 👋 أنا المساعد الافتراضي لمطعم <strong>FUEGO MX</strong>.</p><p>اسألني عن الأطباق والأسعار والتوصيل والدفع والطلبات. يمكنك الكتابة بالبرتغالية أو الإنجليزية أو الإسبانية أو العربية أو الصينية.</p>",
            campo: "اكتب سؤالك…", rotuloCampo: "اكتب سؤالك", enviar: "إرسال السؤال", idioma: "لغة المساعد",
            limpar: "مسح المحادثة والبدء من جديد", fechar: "إغلاق المساعد", abrir: "فتح المساعد الافتراضي", digitando: "يكتب الآن",
            sugestoes: ["بماذا تنصحونني؟", "هل لديكم خيارات نباتية؟", "هل أنتم مفتوحون الآن؟", "كم تكلفة التوصيل؟", "هل توجد قسائم خصم؟", "كيف أطلب؟"],
            indisponivel: "غير متوفر اليوم", picancia: (n) => `مستوى الحرارة ${n} من 3`,
            reserva: "الذكاء الاصطناعي غير متاح الآن. سأرد بإجابات جاهزة (بالبرتغالية فقط).",
            ocupado: "أسئلة كثيرة متتالية. انتظر دقيقة ثم حاول مرة أخرى.",
            falha: "تعذّر الرد الآن. حاول مرة أخرى بعد قليل أو اتصل بالمطعم: (11) 4000-0000.",
            paginas: { inicio: "الرئيسية", cardapio: "قائمة الطعام", carrinho: "السلة", pedidos: "طلباتي", perfil: "ملفي الشخصي", cadastro: "إنشاء حساب", login: "تسجيل الدخول", contato: "اتصل بنا", sobre: "من نحن", privacidade: "الخصوصية والشروط" }
        },
        zh: {
            nome: "中文", curto: "中文", botao: "有问题？", sub: "AI 助手 · 即时回复", subReserva: "自动回复",
            boasVindas: "<p>¡Hola! 👋 我是 <strong>FUEGO MX</strong> 的虚拟助手。</p><p>关于菜品、价格、外送、付款或订单，尽管问我。可以用葡萄牙语、英语、西班牙语、阿拉伯语或中文提问。</p>",
            campo: "输入你的问题…", rotuloCampo: "输入你的问题", enviar: "发送问题", idioma: "助手语言",
            limpar: "清空对话并重新开始", fechar: "关闭助手", abrir: "打开虚拟助手", digitando: "正在输入",
            sugestoes: ["你们推荐什么？", "有素食选项吗？", "现在营业吗？", "外送费多少？", "有优惠券吗？", "怎么下单？"],
            indisponivel: "今日售罄", picancia: (n) => `辣度 ${n}/3`,
            reserva: "AI 暂时不可用。我会用预设回答回复（仅限葡萄牙语）。",
            ocupado: "提问太频繁了，请稍等一分钟再试。",
            falha: "暂时无法回答。请稍后再试，或致电餐厅：(11) 4000-0000。",
            paginas: { inicio: "首页", cardapio: "菜单", carrinho: "购物车", pedidos: "我的订单", perfil: "个人资料", cadastro: "注册", login: "登录", contato: "联系我们", sobre: "关于我们", privacidade: "隐私与条款" }
        }
    };

    function idiomaInicial() {
        try { const salvo = localStorage.getItem("fx_chat_idioma"); if (IDIOMAS[salvo]) return salvo; } catch (e) { /* sem armazenamento */ }
        const doNavegador = (navigator.language || "pt").slice(0, 2).toLowerCase();
        return IDIOMAS[doNavegador] ? doNavegador : "pt";
    }
    let idioma = idiomaInicial();
    const T = () => IDIOMAS[idioma];

    // ------------------------------------- texto da IA → HTML seguro
    // A IA responde em texto simples com **negrito**, listas "- ", e etiquetas:
    //   [[prato:3]] numa linha sozinha → cartão do prato (foto, preço, link)   ·   [[pagina:pedidos]] → link
    // Todo o texto é escapado antes; nenhum HTML vindo da IA chega à página.
    const produtoPorId = (id) => (dados ? dados.produtos.find((p) => p.id === Number(id)) : null);

    function formatarIa(texto, t) {
        texto = texto.replace(/\[\[[^\]]*\]?$/, ""); // etiqueta que ainda está chegando
        let html = "", tipoLista = null, pratos = [];
        const fecharLista = () => { if (tipoLista) { html += `</${tipoLista}>`; tipoLista = null; } };
        const fecharPratos = () => { if (pratos.length) { html += `<div class="chat-pratos">${pratos.slice(0, 4).join("")}</div>`; pratos = []; } };
        const emLinha = (s) => esc(s)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\[\[pagina:([a-z]+)\]\]/g, (m, nome) => (L[nome] ? link(L[nome], t.paginas[nome] || nome) : ""))
            .replace(/\[\[prato:(\d+)\]\]/g, (m, id) => { const p = produtoPorId(id); return p ? `<strong>${esc(p.nome)}</strong>` : ""; })
            .replace(/\[\[[^\]]*\]\]/g, "");

        for (const bruta of texto.split(/\r?\n/)) {
            const l = bruta.trim();
            if (/^(\[\[prato:\d+\]\][\s,]*)+$/.test(l)) {
                fecharLista();
                for (const m of l.matchAll(/\[\[prato:(\d+)\]\]/g)) {
                    const p = produtoPorId(m[1]);
                    if (p) pratos.push(cartaoPrato(p, t));
                }
                continue;
            }
            fecharPratos();
            if (!l) { fecharLista(); continue; }
            const item = l.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
            if (item) {
                const tipo = /^\d/.test(l) ? "ol" : "ul";
                if (tipoLista !== tipo) { fecharLista(); html += `<${tipo}>`; tipoLista = tipo; }
                html += `<li>${emLinha(item[1])}</li>`;
                continue;
            }
            fecharLista();
            html += `<p>${emLinha(l)}</p>`;
        }
        fecharLista();
        fecharPratos();
        return html;
    }

    // ================================================== interface (janela)
    // Conversa guardada na aba (sessionStorage), para continuar ao trocar de página. Tipos de mensagem:
    //   { de: "eu", texto }                  pergunta da pessoa
    //   { de: "ia", texto, idioma }          resposta da IA (texto bruto; vira HTML ao desenhar)
    //   { de: "bot", html, sugestoes }       resposta pronta do modo reserva (português)
    //   { de: "bot", aviso: "boasVindas" | "reserva" | "ocupado" | "falha" }   texto da interface, no idioma escolhido
    const CHAVE = "fx_chat2";
    function lerHistorico() {
        try { return JSON.parse(sessionStorage.getItem(CHAVE)) || []; } catch (e) { return []; }
    }
    function salvarHistorico() {
        try { sessionStorage.setItem(CHAVE, JSON.stringify(historico.slice(-40))); } catch (e) { /* sem armazenamento */ }
    }
    let historico = lerHistorico();

    // "ia" enquanto a IA respondeu (ou ainda não sabemos); "reserva" depois que ela falhou nesta aba
    let modo = config.ia ? "ia" : "reserva";
    try { if (sessionStorage.getItem("fx_chat_modo") === "reserva") modo = "reserva"; } catch (e) { /* sem armazenamento */ }
    function definirModo(novo) {
        modo = novo;
        try { sessionStorage.setItem("fx_chat_modo", novo); } catch (e) { /* sem armazenamento */ }
        atualizarTextos();
    }

    const raizEl = document.createElement("div");
    raizEl.className = "chat";
    raizEl.innerHTML = `
        <button type="button" class="chat-botao" aria-expanded="false" aria-controls="chatJanela">
            <i class="bi bi-chat-dots-fill chat-botao__abrir" aria-hidden="true"></i>
            <i class="bi bi-x-lg chat-botao__fechar" aria-hidden="true"></i>
            <span class="chat-botao__texto"></span>
            <span class="visually-hidden chat-botao__rotulo"></span>
        </button>
        <section class="chat-janela" id="chatJanela" role="dialog" aria-labelledby="chatTitulo" hidden>
            <header class="chat-topo">
                <span class="chat-topo__avatar" aria-hidden="true"><i class="bi bi-fire"></i></span>
                <span class="chat-topo__nome">
                    <strong id="chatTitulo">Assistente FUEGO</strong>
                    <small data-chat-sub></small>
                </span>
                <select class="chat-idioma" data-chat-idioma>
                    ${Object.entries(IDIOMAS).map(([c, i]) => `<option value="${c}" lang="${c}" label="${i.curto}" title="${i.nome}">${i.curto} · ${i.nome}</option>`).join("")}
                </select>
                <button type="button" class="chat-topo__acao" data-chat-limpar>
                    <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                </button>
                <button type="button" class="chat-topo__acao" data-chat-fechar>
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
            </header>
            <div class="chat-mensagens" role="log" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
            <div class="chat-sugestoes"></div>
            <form class="chat-formulario" autocomplete="off">
                <label for="chatCampo" class="visually-hidden" data-chat-rotulo></label>
                <input id="chatCampo" class="chat-campo" type="text" maxlength="600" enterkeyhint="send" dir="auto" />
                <button type="submit" class="chat-enviar"><i class="bi bi-send-fill" aria-hidden="true"></i></button>
            </form>
        </section>`;
    document.body.appendChild(raizEl);
    document.body.classList.add("tem-chat");

    const botao = raizEl.querySelector(".chat-botao");
    const janela = raizEl.querySelector(".chat-janela");
    const areaMsgs = raizEl.querySelector(".chat-mensagens");
    const areaSug = raizEl.querySelector(".chat-sugestoes");
    const form = raizEl.querySelector(".chat-formulario");
    const campo = raizEl.querySelector(".chat-campo");
    const seletorIdioma = raizEl.querySelector("[data-chat-idioma]");
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** Coloca os textos da interface no idioma escolhido (e a direção: árabe é da direita para a esquerda). */
    function atualizarTextos() {
        const t = T();
        janela.lang = idioma;
        janela.dir = idioma === "ar" ? "rtl" : "ltr";
        seletorIdioma.value = idioma;
        seletorIdioma.setAttribute("aria-label", t.idioma);
        seletorIdioma.title = t.idioma;
        raizEl.querySelector(".chat-botao__texto").textContent = t.botao;
        raizEl.querySelector(".chat-botao__rotulo").textContent = janela.hidden ? t.abrir : t.fechar;
        raizEl.querySelector("[data-chat-sub]").textContent = modo === "ia" ? t.sub : t.subReserva;
        raizEl.querySelector("[data-chat-rotulo]").textContent = t.rotuloCampo;
        const limpar = raizEl.querySelector("[data-chat-limpar]");
        limpar.title = t.limpar; limpar.setAttribute("aria-label", t.limpar);
        raizEl.querySelector("[data-chat-fechar]").setAttribute("aria-label", t.fechar);
        raizEl.querySelector(".chat-enviar").setAttribute("aria-label", t.enviar);
        janela.setAttribute("aria-label", "Assistente FUEGO");
        campo.placeholder = t.campo;
    }

    function htmlDaMensagem(m) {
        const t = T();
        if (m.de === "ia") return formatarIa(m.texto, IDIOMAS[m.idioma] || t); // links no idioma em que a resposta foi escrita
        if (m.aviso === "boasVindas") return t.boasVindas;
        if (m.aviso) return `<p class="chat-aviso">${esc(t[m.aviso])}</p>`;
        return m.html;
    }
    function desenharMensagem(m) {
        const el = document.createElement("div");
        el.className = "chat-msg chat-msg--" + (m.de === "eu" ? "eu" : "bot");
        el.dir = "auto";
        if (m.de === "eu") el.textContent = m.texto; // texto digitado: nunca vira HTML
        else el.innerHTML = htmlDaMensagem(m);
        areaMsgs.appendChild(el);
        return el;
    }

    /** Atalhos: no modo IA, só no começo da conversa (no idioma escolhido); no modo reserva, os da última resposta pronta. */
    function sugestoesAtuais() {
        const jaPerguntou = historico.some((m) => m.de === "eu");
        if (modo === "ia") return jaPerguntou ? [] : T().sugestoes;
        const ultima = historico[historico.length - 1];
        if (!jaPerguntou) return SUGESTOES_INICIAIS;
        return ultima && ultima.de === "bot" && ultima.sugestoes ? ultima.sugestoes : [];
    }
    function desenharSugestoes() {
        areaSug.innerHTML = "";
        sugestoesAtuais().forEach((s) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "chat-sugestao";
            b.textContent = s;
            b.dir = "auto";
            b.addEventListener("click", () => {
                if (modo === "reserva" && SUGESTOES[s] === "__carrinho") { location.href = L.carrinho; return; }
                perguntar(s);
            });
            areaSug.appendChild(b);
        });
        areaSug.hidden = !areaSug.children.length;
    }

    const pertoDoFim = () => areaMsgs.scrollHeight - areaMsgs.scrollTop - areaMsgs.clientHeight < 80;
    const rolarParaFim = () => { areaMsgs.scrollTop = areaMsgs.scrollHeight; };
    const mostrarInicio = (el) => { areaMsgs.scrollTop = Math.max(0, el.offsetTop - areaMsgs.offsetTop - 8); };

    function comecarDeNovo() {
        historico = [{ de: "bot", aviso: "boasVindas" }];
        salvarHistorico();
    }

    function redesenhar() {
        areaMsgs.innerHTML = "";
        if (!historico.length) comecarDeNovo();
        historico.forEach(desenharMensagem);
        desenharSugestoes();
        rolarParaFim();
    }

    function adicionar(m) {
        historico.push(m);
        salvarHistorico();
        return desenharMensagem(m);
    }

    // ------------------------------------------------------- perguntar
    let ocupado = false;
    async function perguntar(textoDigitado) {
        const texto = textoDigitado.trim().slice(0, 600);
        if (!texto || ocupado) return;
        ocupado = true;
        adicionar({ de: "eu", texto });
        areaSug.innerHTML = ""; areaSug.hidden = true;
        rolarParaFim();
        const digitando = desenharMensagem({ de: "bot", html: `<span class="chat-digitando" role="img" aria-label="${esc(T().digitando)}"><i></i><i></i><i></i></span>` });
        rolarParaFim();

        try { await carregarDados(); } catch (e) { /* os cartões de prato só não aparecem */ }
        if (dados && dados.ia === false) modo = "reserva"; // servidor C# sem chave da API

        try {
            if (modo === "ia") {
                const r = await perguntarIa(digitando);
                if (r === "ok") return;
                if (r !== "reserva") { digitando.remove(); adicionar({ de: "bot", aviso: r }); return; }
                // IA indisponível: avisa uma vez e segue com as respostas prontas
                digitando.remove();
                definirModo("reserva");
                adicionar({ de: "bot", aviso: "reserva" });
                areaMsgs.appendChild(digitando); // "digitando..." volta para baixo do aviso
            }
            await responderComReserva(texto, digitando);
        } finally {
            ocupado = false;
            desenharSugestoes();
        }
    }

    /** Pergunta à IA no servidor e mostra a resposta enquanto ela chega. Devolve "ok", "reserva" ou o nome de um aviso. */
    async function perguntarIa(el) {
        const conversa = historico.filter((m) => m.de === "eu" || m.de === "ia").slice(-16)
            .map((m) => ({ papel: m.de === "eu" ? "user" : "assistant", texto: m.texto }));
        let resposta;
        try {
            resposta = await fetch(config.ia, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mensagens: conversa, idioma })
            });
        } catch (e) {
            return "reserva"; // servidor desligado (versão estática sem o C# rodando)
        }
        if (resposta.status === 503) return "reserva"; // servidor sem chave da API
        if (resposta.status === 429) return "ocupado";
        if (!resposta.ok || !resposta.body) return "falha";

        const m = { de: "ia", texto: "", idioma };
        const leitor = resposta.body.getReader();
        const decodificador = new TextDecoder();
        let primeiro = true;
        try {
            for (;;) {
                const { value, done } = await leitor.read();
                if (done) break;
                const seguir = pertoDoFim();
                m.texto += decodificador.decode(value, { stream: true });
                const html = formatarIa(m.texto, T());
                if (!html) continue;
                el.innerHTML = html;
                if (primeiro) { primeiro = false; mostrarInicio(el); } else if (seguir) rolarParaFim();
            }
            m.texto += decodificador.decode();
        } catch (e) {
            if (!m.texto.trim()) return "falha";
            m.texto += "\n…";
        }
        if (!m.texto.trim()) return "falha";
        historico.push(m);
        salvarHistorico();
        el.innerHTML = formatarIa(m.texto, T());
        return "ok";
    }

    /** Modo reserva: respostas prontas por palavras-chave (português). */
    async function responderComReserva(texto, el) {
        let resposta;
        try {
            resposta = responder(SUGESTOES[texto] && SUGESTOES[texto] !== "__carrinho" ? SUGESTOES[texto] : texto);
        } catch (e) {
            resposta = null;
        }
        await new Promise((ok) => setTimeout(ok, movimentoReduzido ? 150 : 450 + Math.random() * 350));
        el.remove();
        if (!resposta) { adicionar({ de: "bot", aviso: "falha" }); return; }
        const novo = adicionar({ de: "bot", html: resposta.html, sugestoes: resposta.sugestoes });
        mostrarInicio(novo);
    }

    // ------------------------------------------------- abrir e fechar
    function abrir() {
        janela.hidden = false;
        raizEl.classList.add("chat--aberto");
        botao.setAttribute("aria-expanded", "true");
        atualizarTextos();
        redesenhar();
        // com o cardápio carregado, os cartões de prato das respostas antigas aparecem
        carregarDados().then(() => {
            if (dados.ia === false && modo === "ia") { modo = "reserva"; atualizarTextos(); }
            if (!ocupado) redesenhar();
        }).catch(() => { /* tenta de novo ao perguntar */ });
        // no celular, não abre o teclado sozinho (ele cobriria as sugestões)
        if (window.matchMedia("(min-width: 576px)").matches) campo.focus();
        else areaMsgs.focus({ preventScroll: true });
    }
    function fechar(devolverFoco) {
        janela.hidden = true;
        raizEl.classList.remove("chat--aberto");
        botao.setAttribute("aria-expanded", "false");
        atualizarTextos();
        if (devolverFoco) botao.focus();
    }

    botao.addEventListener("click", () => (janela.hidden ? abrir() : fechar(true)));
    raizEl.querySelector("[data-chat-fechar]").addEventListener("click", () => fechar(true));
    raizEl.querySelector("[data-chat-limpar]").addEventListener("click", () => {
        if (ocupado) return;
        comecarDeNovo();
        redesenhar();
        campo.focus();
    });
    seletorIdioma.addEventListener("change", () => {
        idioma = IDIOMAS[seletorIdioma.value] ? seletorIdioma.value : "pt";
        try { localStorage.setItem("fx_chat_idioma", idioma); } catch (e) { /* sem armazenamento */ }
        atualizarTextos();
        if (!ocupado) redesenhar();
    });
    janela.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(true); });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const texto = campo.value;
        campo.value = "";
        perguntar(texto);
    });
    atualizarTextos();

    // No celular, o botão some enquanto a pessoa preenche um formulário da página (para não cobrir o campo)
    const celular = window.matchMedia("(max-width: 575.98px)");
    document.addEventListener("focusin", (e) => {
        const campoDaPagina = e.target.matches("input, select, textarea") && !raizEl.contains(e.target);
        raizEl.classList.toggle("chat--escondido", campoDaPagina && celular.matches);
    });
    document.addEventListener("focusout", () => raizEl.classList.remove("chat--escondido"));

    // Para testar no console (F12):
    //   FxChat.responder("tem taco picante?").then(console.log)    → resposta pronta (modo reserva)
    //   FxChat.formatar("Peça o **Taco**\n[[prato:3]]")             → HTML que a resposta da IA vira
    window.FxChat = {
        responder: (texto) => carregarDados().then(() => responder(texto)),
        formatar: (texto) => formatarIa(texto, T()),
        abrir, fechar
    };
})();
