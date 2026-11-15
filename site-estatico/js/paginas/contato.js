/* Contato (contato.html): valida e guarda a mensagem no navegador. */
(function () {
    "use strict";

    const form = document.getElementById("formContato");
    const u = Fx.usuario();
    if (u) {
        form.elements.Nome.value = u.nomeCompleto;
        form.elements.Email.value = u.email;
    }

    // Mesmas regras do ContatoViewModel
    const regras = {
        Nome: (v) => !v ? "Informe seu nome." : v.length < 2 || v.length > 120 ? "O nome deve ter entre 2 e 120 caracteres." : "",
        Email: (v) => !v ? "Informe seu e-mail." : !Fx.emailValido(v) ? "Informe um e-mail válido." : "",
        Assunto: (v) => !v ? "Escolha um assunto." : "",
        Mensagem: (v) => !v ? "Escreva sua mensagem." : v.length < 10 || v.length > 2000 ? "A mensagem deve ter entre 10 e 2000 caracteres." : ""
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!Fx.validar(form, regras)) return;
        const valor = (nome) => form.elements[nome].value.trim();
        Fx.registrarMensagem({ nome: valor("Nome"), email: valor("Email"), assunto: valor("Assunto"), mensagem: valor("Mensagem") });
        Fx.avisar("sucesso", "Mensagem enviada! Nossa equipe responde em até 1 dia útil.");
        form.reset(); // senão alguns navegadores repõem o texto ao recarregar
        location.reload();
    });
})();
