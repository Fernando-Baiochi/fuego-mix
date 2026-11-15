/* Entrar (login.html?returnUrl=...). */
(function () {
    "use strict";

    const returnUrl = Fx.urlSegura(Fx.parametro("returnUrl"), null);
    if (Fx.usuario()) { location.replace(returnUrl || "index.html"); return; }

    document.querySelector("[data-logo-claro]").outerHTML = Fx.logo("claro");
    if (returnUrl) document.getElementById("linkCadastro").href = "cadastro.html?returnUrl=" + encodeURIComponent(returnUrl);

    const form = document.getElementById("formLogin");
    const regras = {
        Email: (v) => !v ? "Informe seu e-mail." : !Fx.emailValido(v) ? "Informe um e-mail válido." : "",
        Senha: (v) => !v ? "Informe sua senha." : ""
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!Fx.validar(form, regras)) return;

        const resultado = await Fx.entrar(form.elements.Email.value, form.elements.Senha.value, form.elements.Lembrar.checked);
        if (!resultado.sucesso) { Fx.erroGeral(form, resultado.mensagem); return; }

        Fx.avisar("sucesso", `Que bom te ver, ${Fx.primeiroNome(resultado.usuario.nomeCompleto)}!`);
        Fx.irPara(returnUrl || "index.html");
    });
})();
