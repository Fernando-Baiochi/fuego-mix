/* Meu perfil (perfil.html): editar nome, telefone, CPF (uma vez), nascimento e endereço. */
(function () {
    "use strict";

    if (!Fx.exigirLogin()) return;

    const u = Fx.usuario();
    const form = document.getElementById("formPerfil");
    const cpfJaInformado = !!u.cpf;

    document.getElementById("menuPerfil").innerHTML = Fx.menuPerfil("perfil");
    document.querySelector("[data-campos-endereco]").innerHTML = Fx.camposEndereco();
    document.getElementById("dataCadastro").textContent = Fx.data(u.dataCadastro);
    document.getElementById("emailSomenteLeitura").value = u.email;
    form.elements.NomeCompleto.value = u.nomeCompleto;
    form.elements.Telefone.value = u.telefone || "";
    form.elements.DataNascimento.value = u.dataNascimento || "";
    form.elements.DataNascimento.max = Fx.dataMaxima(Fx.IDADE_MINIMA);
    Fx.preencherEndereco(form, u);

    // Mesmo comportamento do PerfilController: CPF gravado vira somente leitura
    if (cpfJaInformado) {
        form.elements.Cpf.value = Fx.formatarCpf(u.cpf);
        form.elements.Cpf.readOnly = true;
        form.elements.Cpf.removeAttribute("data-mascara");
        document.getElementById("dicaCpf").textContent = "O CPF não pode ser alterado. Precisa corrigir? Fale com a gente pelo Contato.";
    }

    // Mesmas regras do PerfilViewModel (+ EnderecoViewModel)
    const regras = {
        NomeCompleto: (v) => !v ? "Informe seu nome completo."
            : v.length < 3 || v.length > 120 ? "O nome deve ter entre 3 e 120 caracteres." : "",
        Telefone: (v) => !v ? "Informe seu telefone."
            : !Fx.telefoneValido(v) ? "Informe um telefone válido com DDD. Ex.: (11) 98765-4321." : "",
        Cpf: (v) => cpfJaInformado || !v ? ""
            : !Fx.cpfValido(v) ? "Informe um CPF válido."
            : Fx.cpfEmUso(v, u.email) ? "Este CPF já está cadastrado em outra conta." : "",
        DataNascimento: (v) => Fx.erroNascimento(v),
        ...Fx.regrasEndereco()
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!Fx.validar(form, regras)) return;
        const valor = (nome) => form.elements[nome].value.trim();
        const dados = {
            nomeCompleto: valor("NomeCompleto"),
            telefone: valor("Telefone"),
            dataNascimento: valor("DataNascimento"),
            ...Fx.lerEndereco(form)
        };
        if (!cpfJaInformado && valor("Cpf")) dados.cpf = Fx.soDigitos(valor("Cpf"));
        Fx.atualizarPerfil(dados);
        Fx.avisar("sucesso", "Dados atualizados com sucesso.");
        location.reload();
    });
})();
