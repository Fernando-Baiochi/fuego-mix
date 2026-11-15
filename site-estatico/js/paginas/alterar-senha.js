/* Alterar senha (alterar-senha.html): exige a senha atual. */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    document.getElementById("menuPerfil").innerHTML = Fx.menuPerfil("senha");

    const form = document.getElementById("formSenha");
    const regras = {
        SenhaAtual: (v) => !v ? "Informe sua senha atual." : "",
        NovaSenha: (v) => !v ? "Informe a nova senha." : !Fx.senhaForte(v) ? Fx.SENHA_MENSAGEM : "",
        ConfirmarSenha: (v, f) => !v ? "Confirme a nova senha." : v !== f.elements.NovaSenha.value.trim() ? "As senhas não conferem." : ""
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!Fx.validar(form, regras)) return;
        const resultado = await Fx.alterarSenha(form.elements.SenhaAtual.value, form.elements.NovaSenha.value);
        if (!resultado.sucesso) { Fx.erroCampo(form, "SenhaAtual", resultado.mensagem); return; }
        Fx.avisar("sucesso", "Senha alterada com sucesso.");
        Fx.irPara("perfil.html");
    });
})();
