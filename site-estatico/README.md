# FUEGO MX: versão estática (Live Server)

Versão em HTML/CSS/JavaScript puro do site público, para abrir com a extensão **Live Server** do VS Code
(botão "Go Live" na barra inferior). O `.vscode/settings.json` já aponta o Live Server para esta pasta.

O projeto C# em `src/FuegoMX` continua existindo e não foi alterado.

## Diferenças em relação à versão C#
- Não há banco de dados: contas, carrinho, pedidos e mensagens ficam no **localStorage** do navegador.
  Cada navegador tem os próprios dados. Para zerar: F12 > Application > Local Storage > Clear.
- Não há painel administrativo. Por isso o status do pedido avança sozinho (2, 5 e 15 minutos após o pedido).
- Cardápio, preços e cupons ficam em `js/dados.js` (cópia de `Data/DadosIniciais.cs`).
- `css/`, `images/` e `lib/` são cópias de `src/FuegoMX/wwwroot`. Uma mudança no `site.css` (ou no `js/chatbot.js`) de lá precisa ser copiada para cá.

## Onde está cada coisa
| Arquivo | Papel (equivalente no C#) |
|---|---|
| `*.html` | Uma página cada (as Views `.cshtml`) |
| `js/layout.js` | Cabeçalho, rodapé, card de produto e outros pedaços (`_Layout.cshtml` e partials) |
| `js/loja.js` | Regras: contas, carrinho, cupom, frete, pedidos (os Services) |
| `js/paginas/*.js` | Script de cada página (os Controllers) |
| `js/site.js` | Interações: toasts, modal de confirmação, máscaras (telefone, CPF, CEP), busca de CEP, regras da senha etc. |
| `js/chatbot.js` | Assistente virtual (botão "Dúvidas?"). **Cópia idêntica** de `src/FuegoMX/wwwroot/js/chatbot.js` |

## Assistente virtual (chatbot)
Com o site C# rodando (`dotnet run` em `src/FuegoMX`, com a chave da IA configurada), o chatbot daqui usa a IA dele
(`http://localhost:5175/Chat/Perguntar`; o C# libera o Live Server (porta 5500) pelo CORS). Responde em qualquer idioma
e tem seletor de idioma (PT, EN, ES, árabe, chinês).
Sem o C# rodando, ele usa as respostas prontas por palavras-chave (só em português), lendo o cardápio de `js/dados.js`.
Para testar no console (F12): `FxChat.responder("tem taco picante?").then(console.log)`.

## Cadastro e perfil
Iguais aos do C#: CPF (validado pelos dígitos e único entre as contas deste navegador), data de nascimento
(mínimo 18 anos) e endereço em partes com busca de CEP pelo ViaCEP (precisa de internet).
O CPF informado uma vez fica somente leitura no perfil.
