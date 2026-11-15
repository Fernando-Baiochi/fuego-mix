/* ==========================================================================
   FUEGO MX (versão estática): dados do cardápio
   Copiados de src/FuegoMX/Data/DadosIniciais.cs e appsettings.json ("Loja").
   Para mudar um preço, foto ou descrição na versão estática, edite AQUI.
   ========================================================================== */
window.FxDados = {
    // Regras comerciais (mesmos valores da seção "Loja" do appsettings.json)
    loja: {
        taxaEntrega: 7.90,
        freteGratisAcimaDe: 80.00, // subtotal (já com desconto) a partir do qual a entrega é grátis
        quantidadeMaximaPorItem: 20,
        pedidoMinimo: 15.00
    },

    categorias: [
        { id: 1, nome: "Tacos", ordem: 1, descricao: "Tortilhas de milho recheadas, do jeito das taquerias da Cidade do México." },
        { id: 2, nome: "Burritos", ordem: 2, descricao: "Tortilha de trigo generosa, enrolada com arroz, feijão e recheio." },
        { id: 3, nome: "Quesadillas", ordem: 3, descricao: "Tortilha dourada na chapa com muito queijo derretido." },
        { id: 4, nome: "Nachos", ordem: 4, descricao: "Totopos crocantes com coberturas e molhos da casa." },
        { id: 5, nome: "Combos", ordem: 5, descricao: "Monte menos, coma mais: combinações com preço especial." },
        { id: 6, nome: "Bebidas", ordem: 6, descricao: "Para acompanhar (e apagar o fogo)." },
        { id: 7, nome: "Sobremesas", ordem: 7, descricao: "O final doce da sua experiência mexicana." }
    ],

    // picancia: 0 a 3 · vendidos: usado para "mais populares" · destaque: selo "Mais pedido"
    produtos: [
        { id: 1, nome: "Taco Clássico", categoriaId: 1, preco: 18.90, imagem: "taco-classico", picancia: 0, vendidos: 320, destaque: true,
          descricao: "Dois tacos com carne bovina desfiada, cebola roxa, coentro fresco e pico de gallo em tortilha de milho." },
        { id: 2, nome: "Taco Picante", categoriaId: 1, preco: 21.90, imagem: "taco-picante", picancia: 3, vendidos: 280, destaque: true,
          descricao: "Dois tacos de frango ao chipotle com jalapeños, cebola tostada e molho habanero da casa. Só para os corajosos." },
        { id: 3, nome: "Taco al Pastor", categoriaId: 1, preco: 22.90, imagem: "taco-pastor", picancia: 1, vendidos: 210, destaque: false,
          descricao: "Dois tacos de lombo suíno marinado em achiote, com abacaxi grelhado, cebola e coentro." },
        { id: 4, nome: "Burrito de Frango", categoriaId: 2, preco: 29.90, imagem: "burrito-frango", picancia: 1, vendidos: 260, destaque: true,
          descricao: "Tortilha de trigo recheada com frango grelhado, arroz mexicano, feijão preto, queijo e creme azedo." },
        { id: 5, nome: "Burrito de Carne", categoriaId: 2, preco: 32.90, imagem: "burrito-carne", picancia: 1, vendidos: 240, destaque: false,
          descricao: "Carne bovina desfiada ao molho ranchero, arroz, feijão, queijo cheddar e guacamole." },
        { id: 6, nome: "Burrito Vegano", categoriaId: 2, preco: 28.90, imagem: "burrito-vegano", picancia: 0, vendidos: 90, destaque: false, disponivel: false,
          descricao: "Feijão preto, legumes grelhados, arroz com coentro, milho tostado e guacamole. 100% vegetal." },
        { id: 7, nome: "Quesadilla de Queijo", categoriaId: 3, preco: 24.90, imagem: "quesadilla-queijo", picancia: 0, vendidos: 180, destaque: false,
          descricao: "Tortilha de trigo dourada na chapa com mix de queijos derretidos, servida com pico de gallo." },
        { id: 8, nome: "Quesadilla de Frango", categoriaId: 3, preco: 27.90, imagem: "quesadilla-frango", picancia: 1, vendidos: 130, destaque: false,
          descricao: "Frango desfiado, queijo, pimentão e cebola na tortilha crocante, com creme azedo à parte." },
        { id: 9, nome: "Nachos Supreme", categoriaId: 4, preco: 34.90, imagem: "nachos-supreme", picancia: 2, vendidos: 300, destaque: true,
          descricao: "Totopos crocantes cobertos com carne moída, molho de queijo, feijão, jalapeños, pico de gallo e creme azedo." },
        { id: 10, nome: "Guacamole com Nachos", categoriaId: 4, preco: 26.90, imagem: "guacamole-nachos", picancia: 0, vendidos: 190, destaque: false,
          descricao: "Guacamole preparado na hora com abacate, limão, cebola e coentro, acompanhado de totopos." },
        { id: 11, nome: "Combo Fuego", categoriaId: 5, preco: 54.90, imagem: "combo-fuego", picancia: 2, vendidos: 350, destaque: true,
          descricao: "2 Tacos Picantes + Nachos individuais + Refrigerante lata. O combo mais pedido da casa." },
        { id: 12, nome: "Combo Burrito", categoriaId: 5, preco: 44.90, imagem: "combo-burrito", picancia: 1, vendidos: 170, destaque: false,
          descricao: "Burrito de Frango + porção de Guacamole com Nachos + Agua Fresca de Jamaica." },
        { id: 13, nome: "Churros Mexicanos", categoriaId: 7, preco: 16.90, imagem: "churros", picancia: 0, vendidos: 210, destaque: true,
          descricao: "Quatro churros crocantes com açúcar e canela, acompanhados de doce de leite para mergulhar." },
        { id: 14, nome: "Flan de Cajeta", categoriaId: 7, preco: 14.90, imagem: "flan", picancia: 0, vendidos: 80, destaque: false,
          descricao: "Pudim mexicano cremoso com calda de cajeta (doce de leite de cabra caramelizado)." },
        { id: 15, nome: "Refrigerante", categoriaId: 6, preco: 6.90, imagem: "refrigerante", picancia: 0, vendidos: 400, destaque: false,
          descricao: "Lata de 350 ml bem gelada. Consulte os sabores disponíveis na entrega." },
        { id: 16, nome: "Agua Fresca de Jamaica", categoriaId: 6, preco: 9.90, imagem: "agua-jamaica", picancia: 0, vendidos: 150, destaque: false,
          descricao: "Bebida tradicional de flor de hibisco, levemente adoçada, servida gelada (500 ml)." }
    ],

    cupons: [
        { codigo: "FUEGO10", descricao: "10% de desconto em pedidos a partir de R$ 40,00", percentual: 10, valorMinimo: 40 },
        { codigo: "BEMVINDO15", descricao: "15% de desconto em pedidos a partir de R$ 70,00", percentual: 15, valorMinimo: 70 },
        { codigo: "ANDREIA", descricao: "25% de desconto em qualquer pedido", percentual: 25, valorMinimo: 0 }
    ]
};
