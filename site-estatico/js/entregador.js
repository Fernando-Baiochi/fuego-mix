/* Cenas animadas do rastreio (pedido.html): entregadores originais inspirados na cultura mexicana,
   desenhados em SVG. As animações ficam no CSS (site.css, seção 16). */
(function () {
    "use strict";

    const C = { carvao: "#1D1A17", terracota: "#B5371F", latao: "#D6AE62", agave: "#3D6B4F", pele: "#C68B5E", osso: "#F7F1E6", vinho: "#8F2A17" };

    const personagens = [
        { id: "catrina", nome: "La Catrina", frase: "Cheguei com estilo!" },
        { id: "luchador", nome: "El Relámpago", frase: "Entrega relâmpago, ¡ándale!" },
        { id: "mariachi", nome: "Don Chuy", frase: "Chegou com serenata!" }
    ];

    // Cabeça (com chapéu ou máscara) centrada em (0, 0)
    const cabeca = {
        catrina: `<circle r="11" fill="${C.osso}" stroke="${C.carvao}"/>
            <circle cx="-4" cy="-1" r="3.3" fill="${C.carvao}"/><circle cx="4" cy="-1" r="3.3" fill="${C.carvao}"/>
            <circle cx="-4" cy="-1" r="5" fill="none" stroke="${C.terracota}" stroke-width="1.2" stroke-dasharray="2 1.5"/>
            <circle cx="4" cy="-1" r="5" fill="none" stroke="${C.terracota}" stroke-width="1.2" stroke-dasharray="2 1.5"/>
            <path d="M0 3l-1.5 2.4h3z" fill="${C.carvao}"/><path d="M-5 7.5h10M-3 6v3M-1 6v3M1 6v3M3 6v3" stroke="${C.carvao}" stroke-width=".8"/>
            <ellipse cy="-9" rx="25" ry="5" fill="${C.vinho}"/><path d="M-11-9q2-12 11-12t11 12z" fill="${C.vinho}"/>
            <circle cx="-7" cy="-14" r="3.2" fill="#E9967A"/><circle cx="-1" cy="-17" r="3" fill="${C.latao}"/><circle cx="5" cy="-14" r="3.2" fill="#F2B8C6"/>`,
        luchador: `<circle r="11" fill="${C.agave}"/>
            <path d="M1-11l-4 5h3l-2 4 5-6h-3l2-3z" fill="${C.latao}"/>
            <ellipse cx="-4.5" cy="0" rx="3.3" ry="2.4" fill="#fff" stroke="${C.latao}"/><ellipse cx="4.5" cy="0" rx="3.3" ry="2.4" fill="#fff" stroke="${C.latao}"/>
            <circle cx="-4" cy="0" r="1.1" fill="${C.carvao}"/><circle cx="5" cy="0" r="1.1" fill="${C.carvao}"/>
            <path d="M-3.5 5.5q3.5 3 7 0" fill="${C.pele}" stroke="${C.latao}"/>`,
        mariachi: `<circle r="10.5" fill="${C.pele}"/>
            <circle cx="-3.5" cy="-1" r="1.2" fill="${C.carvao}"/><circle cx="3.5" cy="-1" r="1.2" fill="${C.carvao}"/>
            <path d="M-6 4q3-2.5 6 0q3-2.5 6 0q-3 3-6 1q-3 2-6-1z" fill="${C.carvao}"/>
            <ellipse cy="-8" rx="27" ry="5.5" fill="${C.carvao}" stroke="${C.latao}" stroke-width="1.2"/>
            <path d="M-9-8q1-14 9-14t9 14z" fill="${C.carvao}" stroke="${C.latao}"/>`
    };
    // Tronco: quadril em (0, 0), ombros em y = -26
    const tronco = {
        catrina: `<path d="M-9-27q9-4 18 0l3 27h-24z" fill="${C.terracota}"/><path d="M-9-27q9 6 18 0" fill="none" stroke="${C.latao}" stroke-width="1.5"/>`,
        luchador: `<path d="M-10-26q-10 14-16 30l14-4z" fill="${C.terracota}" class="cena__capa"/>
            <path d="M-11-27q11-3 22 0l-3 27h-16z" fill="${C.pele}"/><rect x="-9" y="-5" width="18" height="5" rx="1.5" fill="${C.latao}"/>`,
        mariachi: `<path d="M-10-27q10-3 20 0l2 27h-24z" fill="${C.carvao}"/><path d="M-4-24l4 2 4-2-4-2z" fill="${C.terracota}"/>
            <circle cx="-7" cy="-15" r="1" fill="${C.latao}"/><circle cx="-7" cy="-9" r="1" fill="${C.latao}"/><circle cx="7" cy="-15" r="1" fill="${C.latao}"/><circle cx="7" cy="-9" r="1" fill="${C.latao}"/>`
    };
    const pernas = {
        catrina: `<path d="M-12 0h24l6 28h-36z" fill="${C.terracota}"/><path d="M-18 26h36" stroke="${C.latao}" stroke-width="2"/>`,
        luchador: `<rect x="-9" y="0" width="7" height="28" fill="${C.carvao}"/><rect x="2" y="0" width="7" height="28" fill="${C.carvao}"/><rect x="-10" y="20" width="21" height="9" rx="2" fill="${C.terracota}"/>`,
        mariachi: `<rect x="-9" y="0" width="7" height="28" fill="${C.carvao}"/><rect x="2" y="0" width="7" height="28" fill="${C.carvao}"/><path d="M-9 2v24M9 2v24" stroke="${C.latao}"/>`
    };
    const corBraco = { catrina: C.terracota, luchador: C.pele, mariachi: C.carvao };
    const corMao = { catrina: "#fff", luchador: C.pele, mariachi: C.pele };
    const braco = (id, x1, y1, x2, y2, classe) => `<g class="${classe || ""}"><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${corBraco[id]}" stroke-width="5.5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="3" fill="${corMao[id]}"/></g>`;
    const sacola = (x, y) => `<rect x="${x}" y="${y}" width="16" height="15" rx="2" fill="${C.latao}" stroke="${C.carvao}"/><path d="M${x + 4} ${y}q4-6 8 0" fill="none" stroke="${C.carvao}"/>`;

    // Pessoa em pé: pés em (0, 0)
    const emPe = (id, pose) => `<g transform="translate(0 -28)">
        ${pernas[id]}${tronco[id]}<g transform="translate(0 -40)">${cabeca[id]}</g>
        ${braco(id, -8, -23, -13, -4)}
        ${pose === "aceno" ? braco(id, 8, -23, 17, -44, "cena__aceno") : `${braco(id, 8, -23, 22, -16)}${sacola(20, -22)}`}</g>`;

    // Moto de entrega com piloto: chão em (0, 0), andando para a direita
    const roda = (x) => `<g transform="translate(${x} -12)"><circle r="12" fill="${C.carvao}"/><circle r="5" fill="#8B8178"/><g class="cena__raios"><path d="M-9 0H9M0-9V9" stroke="#D9CFC2" stroke-width="1.6"/></g></g>`;
    const moto = (id, comPiloto = true) => `
        <rect x="-62" y="-64" width="28" height="24" rx="3" fill="${C.latao}" stroke="${C.carvao}" stroke-width="1.5"/>
        <path d="M-48-59c3 4-2 6 1 10c-4-1-6-5-4-7c0 2 1 3 2 3c-1-2 0-4 1-6z" fill="${C.terracota}"/>
        <path d="M-50-16q-2-18 18-20h28q8 0 10 10l18 4q6 1 6 6h-80z" fill="${C.terracota}"/>
        <path d="M22-20l8-34M26-54h10" stroke="${C.carvao}" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="-42" r="3" fill="${C.latao}"/>
        ${roda(-34)}${roda(34)}
        ${comPiloto ? `<g class="cena__piloto"><g transform="translate(-8 -40)">
            <path d="M-2 0l14-2 2 16" stroke="${id === "luchador" ? C.carvao : C.terracota}" stroke-width="7" fill="none" stroke-linejoin="round"/>
            ${tronco[id]}<g transform="translate(0 -40)">${cabeca[id]}</g>
            ${braco(id, 6, -23, 34, -12)}</g></g>` : ""}`;

    // Cenário comum: céu, sol, papel picado, calçada e rua
    const cores = [C.terracota, C.latao, C.agave, "#E9967A", "#F2B8C6"];
    const bandeirinhas = Array.from({ length: 10 }, (_, i) => {
        const t = 0.05 + i * 0.1, x = 360 * t, y = 12 + 36 * t * (1 - t);
        return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path class="cena__bandeira" d="M-7 0h14v13l-3.5 3-3.5-3-3.5 3-3.5-3z" fill="${cores[i % 5]}"/></g>`;
    }).join("");
    const fundo = (extra) => `<rect class="cena__ceu" width="360" height="200"/><circle class="cena__sol" cx="305" cy="52" r="16"/>
        <path d="M0 12Q180 48 360 12" fill="none" stroke="${C.carvao}" stroke-width=".8"/>${bandeirinhas}${extra || ""}
        <rect class="cena__calcada" y="150" width="360" height="10"/><rect class="cena__rua" y="160" width="360" height="40"/>
        <path class="cena__faixa" d="M0 181H360"/>`;
    const casa = `<g><rect x="250" y="72" width="110" height="78" fill="#D9825B"/><rect x="245" y="64" width="120" height="9" fill="${C.vinho}"/>
        <path d="M282 150v-40a16 16 0 0 1 32 0v40z" fill="#6B3E26"/><circle cx="307" cy="132" r="2" fill="${C.latao}"/>
        <path d="M330 112v-18a9 9 0 0 1 18 0v18z" fill="#F4E4CF" stroke="${C.vinho}" stroke-width="2"/>
        <path d="M262 150v-22a5 5 0 0 1 10 0v22zM262 136h-5v-6M272 140h5v-6" fill="${C.agave}" stroke="${C.agave}" stroke-width="3" stroke-linejoin="round"/></g>`;
    const loja = `<g><rect x="40" y="70" width="190" height="80" fill="#F0D9BC"/><rect x="70" y="50" width="130" height="22" rx="4" fill="${C.carvao}"/>
        <text x="135" y="66" text-anchor="middle" fill="${C.latao}" font-size="13" font-weight="700" letter-spacing="2">FUEGO MX</text>
        <path d="M40 72h190v12q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0q-9.5 8-19 0z" fill="${C.terracota}"/>
        <rect x="60" y="96" width="70" height="54" fill="#6B3E26"/><rect x="146" y="96" width="66" height="36" fill="#F7E9D3" stroke="#6B3E26" stroke-width="3"/>
        <g class="cena__bilhete"><rect x="166" y="102" width="26" height="26" rx="3" fill="#fff" stroke="${C.carvao}"/><path d="M172 115l5 5 9-10" fill="none" stroke="${C.agave}" stroke-width="2.5" stroke-linecap="round"/></g></g>`;
    const cozinha = `<g><rect x="0" y="40" width="360" height="110" fill="#F7F1E6"/>
        ${Array.from({ length: 8 }, (_, i) => Array.from({ length: 4 }, (_, j) => `<rect x="${i * 45 + 8}" y="${j * 27 + 44}" width="20" height="20" rx="2" fill="none" stroke="#2E5A88" stroke-width="1.5" transform="rotate(45 ${i * 45 + 18} ${j * 27 + 54})"/>`).join("")).join("")}
        <rect x="70" y="128" width="220" height="22" fill="#6B3E26"/>
        <path class="cena__chama" d="M140 130q-6-12 4-22q-2 10 6 12q-2-8 6-14q0 12 4 24z" fill="${C.terracota}"/>
        <path class="cena__chama" d="M176 130q-6-12 4-22q-2 10 6 12q-2-8 6-14q0 12 4 24z" fill="${C.latao}"/>
        <ellipse cx="170" cy="108" rx="62" ry="9" fill="${C.carvao}"/>
        <ellipse cx="148" cy="103" rx="14" ry="4" fill="#E8C98E"/><ellipse cx="172" cy="102" rx="14" ry="4" fill="#E8C98E"/><ellipse cx="196" cy="103" rx="14" ry="4" fill="#E8C98E"/>
        <path class="cena__vapor" d="M150 92q-6-8 0-16t0-16" fill="none" stroke="#B8AFA5" stroke-width="2.5" stroke-linecap="round"/>
        <path class="cena__vapor" d="M174 92q-6-8 0-16t0-16" fill="none" stroke="#B8AFA5" stroke-width="2.5" stroke-linecap="round"/>
        <path class="cena__vapor" d="M198 92q-6-8 0-16t0-16" fill="none" stroke="#B8AFA5" stroke-width="2.5" stroke-linecap="round"/></g>`;
    const balao = (texto, x, y, w) => `<g class="cena__balao"><rect x="${x}" y="${y}" width="${w}" height="26" rx="12" fill="#fff" stroke="${C.carvao}"/>
        <path d="M${x + w - 30} ${y + 25}l12 12 2-12" fill="#fff" stroke="${C.carvao}"/>
        <text x="${x + w / 2}" y="${y + 17}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${C.carvao}">${texto}</text></g>`;
    const confetes = Array.from({ length: 16 }, (_, i) => `<rect class="cena__confete" x="${12 + i * 22}" y="-10" width="7" height="10" fill="${cores[i % 5]}" style="animation-delay:-${(i * 0.37) % 2.6}s"/>`).join("");

    const descricao = {
        aguardando: () => "A cozinha do FUEGO MX recebendo o pedido",
        preparo: () => "Tortilhas no comal, com chamas e vapor",
        caminho: (p) => `${p.nome} a caminho na moto de entrega`,
        chegou: (p) => `${p.nome} chegou na sua porta e pede o código`,
        entregue: (p) => `${p.nome} entregou o pedido e comemora`
    };

    function cena(etapa, personagemId) {
        const p = personagens.find((x) => x.id === personagemId) || personagens[0];
        const id = p.id;
        let conteudo;
        if (etapa === "aguardando") conteudo = fundo(loja);
        else if (etapa === "preparo") conteudo = fundo(cozinha);
        else if (etapa === "caminho") conteudo = fundo(`<path d="M0 150v-30h40v-20h30v50zM300 150v-40h30v-18h30v58z" fill="#E6D3B8"/>`) +
            `<g class="cena__veiculo"><g transform="translate(140 174)">${moto(id)}</g></g>`;
        else if (etapa === "chegou") conteudo = fundo(casa) +
            `<g class="cena__chegada"><g transform="translate(120 172)">${moto(id, false)}</g></g>` +
            `<g class="cena__pessoa"><g transform="translate(232 158)">${emPe(id, "aceno")}</g></g>` + balao("Toc, toc! Qual é o código?", 52, 52, 172);
        else conteudo = fundo(casa) + `<g transform="translate(120 172)">${moto(id, false)}</g>` +
            `<g class="cena__pulo"><g transform="translate(232 158)">${emPe(id, "sacola")}</g></g>` + balao(p.frase, 40, 52, 180) + confetes;
        return `<div class="cena cena--${etapa}" role="img" aria-label="${(descricao[etapa] || descricao.entregue)(p)}">
            <svg viewBox="0 0 360 200" aria-hidden="true" focusable="false">${conteudo}</svg></div>`;
    }

    window.FxCena = {
        personagens,
        personagemDoPedido: (idPedido) => personagens[Number(idPedido) % personagens.length],
        cena
    };
})();
