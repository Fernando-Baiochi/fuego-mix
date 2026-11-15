/* Criar conta (cadastro.html?returnUrl=...). Todo cadastro vira cliente. */
(function () {
    "use strict";

    const returnUrl = Fx.urlSegura(Fx.parametro("returnUrl"), null);
    if (Fx.usuario()) { location.replace(returnUrl || "index.html"); return; }

    document.querySelector("[data-logo-claro]").outerHTML = Fx.logo("claro");
    document.querySelector("[data-campos-endereco]").innerHTML = Fx.camposEndereco();
    if (returnUrl) document.getElementById("linkLogin").href = "login.html?returnUrl=" + encodeURIComponent(returnUrl);

    const form = document.getElementById("formCadastro");
    form.elements.DataNascimento.max = Fx.dataMaxima(Fx.IDADE_MINIMA);

    // Mesmas regras do CadastroViewModel (+ EnderecoViewModel) e da política de senha do Program.cs
    const regras = {
        NomeCompleto: (v) => !v ? "Informe seu nome completo."
            : v.length < 3 || v.length > 120 ? "O nome deve ter entre 3 e 120 caracteres." : "",
        Email: (v) => !v ? "Informe seu e-mail." : !Fx.emailValido(v) ? "Informe um e-mail válido." : "",
        Telefone: (v) => !v ? "Informe seu telefone."
            : !Fx.telefoneValido(v) ? "Informe um telefone válido com DDD. Ex.: (11) 98765-4321." : "",
        Cpf: (v) => !v ? "Informe seu CPF." : !Fx.cpfValido(v) ? "Informe um CPF válido." : "",
        DataNascimento: (v) => !v ? "Informe sua data de nascimento." : Fx.erroNascimento(v),
        ...Fx.regrasEndereco(),
        Senha: (v) => !v ? "Crie uma senha." : !Fx.senhaForte(v) ? Fx.SENHA_MENSAGEM : "",
        ConfirmarSenha: (v, f) => !v ? "Confirme a senha." : v !== f.elements.Senha.value.trim() ? "As senhas não conferem." : "",
        AceitoTermos: (v) => !v ? "É preciso aceitar os termos de uso para criar a conta." : ""
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!Fx.validar(form, regras)) return;

        const valor = (nome) => form.elements[nome].value.trim();
        const resultado = await Fx.cadastrar({
            nomeCompleto: valor("NomeCompleto"),
            email: valor("Email"),
            telefone: valor("Telefone"),
            cpf: valor("Cpf"),
            dataNascimento: valor("DataNascimento"),
            enderecoPartes: Fx.lerEndereco(form),
            senha: form.elements.Senha.value
        });
        if (!resultado.sucesso) {
            Fx.erroCampo(form, resultado.campo, resultado.mensagem);
            form.elements[resultado.campo]?.focus();
            return;
        }

        Fx.avisar("sucesso", `Bem-vindo(a) à FUEGO MX, ${Fx.primeiroNome(valor("NomeCompleto"))}! Sua conta foi criada.`);
        Fx.irPara(returnUrl || "cardapio.html");
    });
})();
