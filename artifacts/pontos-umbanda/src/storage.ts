import { AppData, Orixa, Subcategoria, Ponto } from "./types";

const STORAGE_KEY = "pontos-umbanda-data";

const ORIXAS_PADRAO: Orixa[] = [
  { id: "exu", nome: "Exu", cor: "#dc2626", emoji: "🔥", ordem: 0, criadoEm: Date.now() },
  { id: "ogum", nome: "Ogum", cor: "#2563eb", emoji: "⚔️", ordem: 1, criadoEm: Date.now() },
  { id: "oxossi", nome: "Oxóssi", cor: "#16a34a", emoji: "🏹", ordem: 2, criadoEm: Date.now() },
  { id: "xango", nome: "Xangô", cor: "#d97706", emoji: "⚡", ordem: 3, criadoEm: Date.now() },
  { id: "iansa", nome: "Iansã", cor: "#7c3aed", emoji: "🌪️", ordem: 4, criadoEm: Date.now() },
  { id: "oxum", nome: "Oxum", cor: "#ca8a04", emoji: "💛", ordem: 5, criadoEm: Date.now() },
  { id: "yemanja", nome: "Iemanjá", cor: "#0891b2", emoji: "🌊", ordem: 6, criadoEm: Date.now() },
  { id: "oxala", nome: "Oxalá", cor: "#94a3b8", emoji: "☁️", ordem: 7, criadoEm: Date.now() },
  { id: "omulu", nome: "Omulu", cor: "#78350f", emoji: "💀", ordem: 8, criadoEm: Date.now() },
  { id: "nanaboroco", nome: "Nanã", cor: "#6d28d9", emoji: "🪷", ordem: 9, criadoEm: Date.now() },
];

const SUBCATEGORIAS_PADRAO: Subcategoria[] = [
  { id: "sub-oxossi-louvacao", orixaId: "oxossi", nome: "Louvação", ordem: 0, criadoEm: Date.now() },
  { id: "sub-oxossi-chamada", orixaId: "oxossi", nome: "Chamada", ordem: 1, criadoEm: Date.now() },
  { id: "sub-oxossi-chegada", orixaId: "oxossi", nome: "Chegada", ordem: 2, criadoEm: Date.now() },
  { id: "sub-oxossi-trabalho", orixaId: "oxossi", nome: "Caboclo - Trabalho", ordem: 3, criadoEm: Date.now() },
  { id: "sub-oxossi-curimba", orixaId: "oxossi", nome: "Caboclo - Curimba", ordem: 4, criadoEm: Date.now() },
  { id: "sub-oxossi-demanda", orixaId: "oxossi", nome: "Caboclo - Demanda", ordem: 5, criadoEm: Date.now() },
];

const PONTOS_PADRAO: Ponto[] = [
  // ===== LOUVAÇÃO =====
  {
    id: "lo-1", subcategoriaId: "sub-oxossi-louvacao", ordem: 0, favorito: false, criadoEm: Date.now(),
    titulo: "Oxossi, filho de Iemanjá...",
    letra: "Oxossi, filho de Iemanjá\nDivindade do clã de Ogum\nÉ Ibualama, ele é Ilé\nQue Oxum levou no rio\nE nasceu Logun-edé!\n\nSua natureza é da lua\nNa lua Oxóssi é Odé Odé-Odé, Odé-Odé\nRei de Keto Caboclo da mata Odé-Odé.\n\nQuinta-feira é seu ossé\nAxoxó, feijão preto, camarão e amendoim\nAzul e verde, suas cores\nCalça branca rendada\nSaia curta estampada\n\nOjá e couraça prateada\nNa mão ofá, iluquerê\nOkê okê, okê arô, okê\nA jurema é a árvore sagrada\nOkê arô, Oxóssi, okê okê\n\nNa Bahia é São Jorge\nNo Rio, São Sebastião\nOxóssi é quem manda\nNas bandas do meu coração.",
  },
  {
    id: "lo-2", subcategoriaId: "sub-oxossi-louvacao", ordem: 1, favorito: false, criadoEm: Date.now(),
    titulo: "Mas como é bonito, assistir festa nas matas...",
    letra: "Mas como é bonito, assistir festa nas matas\nOuvir o som das cascatas e o lindo canto do sabiá (do sabiá)\nQue noite linda, que bela noite de luar\nFoi no clarão da lua\nQue eu vi o seu Oxossi passar",
  },
  {
    id: "lo-3", subcategoriaId: "sub-oxossi-louvacao", ordem: 2, favorito: false, criadoEm: Date.now(),
    titulo: "A mata estava em festa ô ô ô...",
    letra: "A mata estava em festa ô ô ô\nToda coberta de flores,\nAté os passarinhos cantam, em seu louvor\nEle é nosso protetor\nÔ ô ô ô ô quanta beleza,\nÔ ô ô ô ô quanto esplendor,\nComo é bom ter a certeza\nQue o seu Oxossi é nosso protetor",
  },
  {
    id: "lo-4", subcategoriaId: "sub-oxossi-louvacao", ordem: 3, favorito: false, criadoEm: Date.now(),
    titulo: "Vermelho é a cor do sangue de meu pai...",
    letra: "Vermelho é a cor do sangue de meu pai\nE verde é a cor das matas onde mora {bis}\nVamos saravar meu pai Oxóssi em sua banda\nVamos saravar, a banda que ele mora {bis}",
  },
  {
    id: "lo-5", subcategoriaId: "sub-oxossi-louvacao", ordem: 4, favorito: false, criadoEm: Date.now(),
    titulo: "Oxossi Odé, ele é São Sebastião...",
    letra: "Oxossi Odé, ele é São Sebastião\nMas ele reina\nLá nas matas e nos campos\nEle é o dono, da lavoura de pai Tupã\n\nOre rê Ore rê ô\nOre rê Ore rê ô\nMas o senhor ore rê {bis}\n\nPara sua vida melhorar\nE nunca lhe faltar o que comer\nAcenda uma vela\nLá nas matas para Oxossi\nE peça que ele irá lhe socorrer\n\nOre rê Ore rê ô\nOre rê Ore rê ô\nMas o senhor ore rê {bis}",
  },
  {
    id: "lo-6", subcategoriaId: "sub-oxossi-louvacao", ordem: 5, favorito: false, criadoEm: Date.now(),
    titulo: "Oxossi é Rei no Céu...",
    letra: "Oxossi é Rei no Céu\nOxossi é Rei na Terra\nEle não desce do Céu sem coroa\nSem sua nansga de Guerra",
  },
  {
    id: "lo-7", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: Date.now(),
    titulo: "Foi Zambi quem criou o mundo...",
    letra: "Foi Zambi quem criou o mundo\nSó Zambi pode governar\nFoi Zambi quem criou\nAs estrelas que ilumina\nOxossi lá no Jurema",
  },
  {
    id: "lo-8", subcategoriaId: "sub-oxossi-louvacao", ordem: 7, favorito: false, criadoEm: Date.now(),
    titulo: "Eu vi chover, eu vi relampear...",
    letra: "Eu vi chover\nEu vi relampear\nMas mesmo assim o céu estava azul\n\nFavorecendo a folha da Jurema\nOxossi é reina\nDe norte a sul (2x)",
  },
  {
    id: "lo-9", subcategoriaId: "sub-oxossi-louvacao", ordem: 8, favorito: false, criadoEm: Date.now(),
    titulo: "Eu me orgulho de carregar esse Orixá...",
    letra: "Eu me orgulho\nDe carregar esse Orixá\nEle é meu pai Oxossi\nFilho de pai Oxalá\nEle é meu pai Oxossi\nQue é um grande Orixá (2x)\n\nEle caça, ele pesca\nEle é rei aqui na Umbanda\nVamos salvar pai Oxossi\nQue comanda a nossa banda\nEle é dono das matas\nQuando vem trás seu axé\nCaça para os Orixás\nE ajuda a quem tem fé\n\nEle é o rei de Keto\nFilho de Yemanjá\nEle é meu pai Oxossi\nQue eu louvo em cantar\nEle trás prosperidade\nEle trás muita fartura\nQuem confia em pai Oxossi\nNão vive na amargura",
  },
  {
    id: "lo-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 9, favorito: false, criadoEm: Date.now(),
    titulo: "Seu arranca-toco é de aruanda...",
    letra: "Seu arranca-toco é de aruanda,\nÉ de nagô zambe (2x)\nQuando ele chega na umbanda\nAuê, auê (2x)",
  },
  {
    id: "lo-11", subcategoriaId: "sub-oxossi-louvacao", ordem: 10, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo sete flechas nasceu...",
    letra: "Caboclo sete flechas nasceu\nNo jardim das oliveiras\n(Pegar o resto do ponto)",
  },
  {
    id: "lo-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 11, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo a sua mata é verde...",
    letra: "Caboclo a sua mata é verde, verde é da cor do mar\nSarava o cacique da jurema\nSarava o cacique da jurema\nSarava o cacique da jurema\nJurema (2x)",
  },

  // ===== CHAMADA =====
  {
    id: "ch-1", subcategoriaId: "sub-oxossi-chamada", ordem: 0, favorito: false, criadoEm: Date.now(),
    titulo: "São Miguel, São Miguel...",
    letra: "São Miguel, São Miguel\nSão Miguel está chamando (2x)\nDai-me forças são Miguel para chamar os caboclos da umbanda (2x)",
  },
  {
    id: "ch-2", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: Date.now(),
    titulo: "Tambor, tambor...",
    letra: "Tambor, tambor\nVai chamar quem mora longe (2x)\nSalve Oxossi o rei das matas\nOgum do Humaitá\nPai Xangô lá na pedreira\nIansã no jacutá (2x)",
  },
  {
    id: "ch-3", subcategoriaId: "sub-oxossi-chamada", ordem: 2, favorito: false, criadoEm: Date.now(),
    titulo: "Ogã chama todos os caboclos...",
    letra: "Ogã chama todos os caboclos\nChama todos caboclos no batuque do tambor (2x)\nDiga pra ela que já é hora\nDiga pra ele, que a umbanda está chamando",
  },
  {
    id: "ch-4", subcategoriaId: "sub-oxossi-chamada", ordem: 3, favorito: false, criadoEm: Date.now(),
    titulo: "Ele vem da mata, ele trouxe flecha...",
    letra: "Ele vem da mata\nEle trouxe flecha\nPra filho de fé saudar\nEle é filho de cacique\nEle é caboclo verdadeiro\nÉ caçador é flecheiro\nVem aqui pra trabalhar\n\nEle é filho de cacique\nÉ caboclo verdadeiro\nEle é seu Pena de Ouro\nQue vem saudar o seu terreiro (2x)",
  },
  {
    id: "ch-5", subcategoriaId: "sub-oxossi-chamada", ordem: 4, favorito: false, criadoEm: Date.now(),
    titulo: "Estava na beira do rio sem poder atravessar...",
    letra: "Estava na beira do rio sem poder atravessar\nChamei pelo caboclo\nCaboclo tupinambá (2x)\nTupinambá chamei\nChamei tupinambá ea (2x)",
  },
  {
    id: "ch-6", subcategoriaId: "sub-oxossi-chamada", ordem: 5, favorito: false, criadoEm: Date.now(),
    titulo: "Ainda tem caboclo debaixo da samambaia...",
    letra: "Ainda tem caboclo debaixo da samambaia (2x)\nSai, sai caboclo,\nDebaixo da samambaia (2x)",
  },
  {
    id: "ch-7", subcategoriaId: "sub-oxossi-chamada", ordem: 6, favorito: false, criadoEm: Date.now(),
    titulo: "Oxalá chamou e já mandou buscar...",
    letra: "Oxalá chamou e já mandou buscar\nTodos caboclos da jurema\nPara o seu jurema (2x)",
  },
  {
    id: "ch-8", subcategoriaId: "sub-oxossi-chamada", ordem: 7, favorito: false, criadoEm: Date.now(),
    titulo: "Pai Oxalá, é rei do mundo inteiro...",
    letra: "Pai Oxalá, é rei do mundo inteiro\nE já deu ordens pra jurema\nMandar seus capangueiros\n\nMandai, mandai\nLinda cabocla jurema\nO seu terreiro\nQue já é ordem suprema (2x)",
  },
  {
    id: "ch-9", subcategoriaId: "sub-oxossi-chamada", ordem: 8, favorito: false, criadoEm: Date.now(),
    titulo: "A sua flecha é carijó...",
    letra: "A sua flecha é carijó seu bodoque é indaiá\nTodos caboclos vem serenos como o sereno é\nOxossi é rei da macaia Oxossi é rei da guiné",
  },
  {
    id: "ch-10", subcategoriaId: "sub-oxossi-chamada", ordem: 9, favorito: false, criadoEm: Date.now(),
    titulo: "Ele atirou, ele atirou e ninguém viu...",
    letra: "Ele atirou\nEle atirou e ninguém viu\nO seu Oxossi é quem sabe\nAonde a flecha caiu (2x)",
  },

  // ===== CHEGADA =====
  {
    id: "cg-1", subcategoriaId: "sub-oxossi-chegada", ordem: 0, favorito: false, criadoEm: Date.now(),
    titulo: "Uma rosa no jardim apareceu...",
    letra: "Uma rosa no jardim apareceu\nMamãe está chamando e lá vou eu\nEle é caboclo, ele vem da sua aldeia\nSeu Ubirajara é um caboclo e não bambeia",
  },
  {
    id: "cg-2", subcategoriaId: "sub-oxossi-chegada", ordem: 1, favorito: false, criadoEm: Date.now(),
    titulo: "Ele vem da mata, ele vem girar...",
    letra: "Ele vem da mata, ele vem girar\nO caboclo laranjeira tá de ronda no gongar\nO caboclo laranjeira\nEle promete e não esquece\nEle traz laranja doce\nPara dar a quem merece",
  },
  {
    id: "cg-3", subcategoriaId: "sub-oxossi-chegada", ordem: 2, favorito: false, criadoEm: Date.now(),
    titulo: "Que cabocla é essa toda vestida de pena...",
    letra: "Que cabocla é essa\nToda vestida de pena é a cabocla jurema\nDona de seu jacutá\nRainha da mata virgem que chegou pra trabalhar",
  },
  {
    id: "cg-4", subcategoriaId: "sub-oxossi-chegada", ordem: 3, favorito: false, criadoEm: Date.now(),
    titulo: "Lua que clareia o mundo...",
    letra: "Lua que clareia o mundo\nQue clareia a terra e o mar\nClareia as matas de Oxossi\nCidade da jurema\n\nClareia os caminhos\nQue os caboclos vão passar\nPara vir na umbanda trabalhar (2x)",
  },
  {
    id: "cg-5", subcategoriaId: "sub-oxossi-chegada", ordem: 4, favorito: false, criadoEm: Date.now(),
    titulo: "Estava sentado na cadeira da jurema...",
    letra: "Estava sentado na cadeira da jurema\nPorque mandaram me chamar (2x)\nO juremi, o Jurema\nPorque mandaram me chamar (2x)",
  },
  {
    id: "cg-6", subcategoriaId: "sub-oxossi-chegada", ordem: 5, favorito: false, criadoEm: Date.now(),
    titulo: "Nas matas lá da jurema eu vi uma estrela brilhar...",
    letra: "Nas matas lá da jurema\nEu vi uma estrela brilhar (2x)\nEra uma estrela de Oxossi\nAnunciando que caboclo vai chegar (2x)",
  },
  {
    id: "cg-7", subcategoriaId: "sub-oxossi-chegada", ordem: 6, favorito: false, criadoEm: Date.now(),
    titulo: "Okê, Okê caboclo...",
    letra: "Okê, Okê caboclo\nCaboclo Sete Estrelas no gongar\nOkê, Okê caboclo\nVem de aruanda, pra seus filhos ajudar (2x)",
  },
  {
    id: "cg-8", subcategoriaId: "sub-oxossi-chegada", ordem: 7, favorito: false, criadoEm: Date.now(),
    titulo: "Que penacho é aquele...",
    letra: "Que penacho é aquele\nÉ um penacho de arara (2x)\n\nAi quando rompe a mata virgem\nQuando rompe a mata virgem\nÉ o caboclo Ubirajara (2x)",
  },
  {
    id: "cg-9", subcategoriaId: "sub-oxossi-chegada", ordem: 8, favorito: false, criadoEm: Date.now(),
    titulo: "Ubirajara quando chegou...",
    letra: "Ubirajara quando chegou\nNão atendeu caboclo nenhum (2x)\nSete mundos, sete mundos\nEle se chama Ubirajara, meu pai Oxossi é caçador de outro mundo (2x)",
  },

  // ===== CABOCLO - TRABALHO =====
  {
    id: "tr-1", subcategoriaId: "sub-oxossi-trabalho", ordem: 0, favorito: false, criadoEm: Date.now(),
    titulo: "Quanto tempo que eu não bambeio...",
    letra: "Quanto tempo que eu não bambeio\nE hoje vim pra trabalhar (2x)\nO caboclo samambaia\nVeio aqui pra trabalhar (2x)",
  },
  {
    id: "tr-2", subcategoriaId: "sub-oxossi-trabalho", ordem: 1, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo roxo da pele morena...",
    letra: "Caboclo roxo da pele morena\nEle é Oxossi é caçador lá da jurema (2x)",
  },
  {
    id: "tr-3", subcategoriaId: "sub-oxossi-trabalho", ordem: 2, favorito: false, criadoEm: Date.now(),
    titulo: "Ele jurou e tornou a jurar...",
    letra: "Ele jurou e tornou a jurar\nEm tomar os conselhos que a jurema vem lhe dar\nEle jurou e tornou a jurar\nNão deixar os perversos nessa banda entrar",
  },
  {
    id: "tr-4", subcategoriaId: "sub-oxossi-trabalho", ordem: 3, favorito: false, criadoEm: Date.now(),
    titulo: "Se a gameleira de Oxossi faz sombra...",
    letra: "Se a gameleira de Oxossi faz sombra\nMeu pai Oxalá me responda (2x)",
  },
  {
    id: "tr-5", subcategoriaId: "sub-oxossi-trabalho", ordem: 4, favorito: false, criadoEm: Date.now(),
    titulo: "Ai como é bonito, que bonito é...",
    letra: "Ai como é bonito\nQue bonito é\nO meu pai Oxossi\nNo seu are, rê (2x)",
  },
  {
    id: "tr-6", subcategoriaId: "sub-oxossi-trabalho", ordem: 5, favorito: false, criadoEm: Date.now(),
    titulo: "Na beira do rio verde...",
    letra: "Na beira do rio verde\nEu vi o caboclo na areia (2x)\nPescando peixe miúdo\nPra levar pra sua aldeia (2x)\nCaboclo pegue o anzol\nQue a noite é linda e clara\nVai pescar no rio verde\nPor ordem de mar iara (2x)",
  },
  {
    id: "tr-7", subcategoriaId: "sub-oxossi-trabalho", ordem: 6, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo não tem caminho para caminhar...",
    letra: "Caboclo não tem caminho para caminhar (2x)\nEle caminha por cima da folha, por baixo da folha por todo lugar (2x)",
  },
  {
    id: "tr-8", subcategoriaId: "sub-oxossi-trabalho", ordem: 7, favorito: false, criadoEm: Date.now(),
    titulo: "Seus caminhos estão abertos...",
    letra: "Seus caminhos estão abertos\nCaboclo pode passar\nEle vem girar, ele vem girar\nCaboclo filho de umbanda, filho Oxossi e neto de Oxalá",
  },
  {
    id: "tr-9", subcategoriaId: "sub-oxossi-trabalho", ordem: 8, favorito: false, criadoEm: Date.now(),
    titulo: "Quando a lua sair...",
    letra: "Quando a lua sair\nEle vem girar (2x)",
  },
  {
    id: "tr-10", subcategoriaId: "sub-oxossi-trabalho", ordem: 9, favorito: false, criadoEm: Date.now(),
    titulo: "Foi numa tarde serena...",
    letra: "Foi numa tarde serena\nLá nas matas da jurema que eu vi os caboclos bradar (2x)",
  },
  {
    id: "tr-11", subcategoriaId: "sub-oxossi-trabalho", ordem: 10, favorito: false, criadoEm: Date.now(),
    titulo: "Kiô, kiô, kiô que era...",
    letra: "Kiô, kiô, kiô que era\nToda mata está em festa\nSarava seu Sete Flechas\nEle é rei da floresta (2x)",
  },
  {
    id: "tr-12", subcategoriaId: "sub-oxossi-trabalho", ordem: 11, favorito: false, criadoEm: Date.now(),
    titulo: "Mandei fazer, o que banda eu fiz...",
    letra: "Mandei fazer, o que banda eu fiz\nUm capacete de penas\n\nSalve seu Iambuga\nÉ capitão das matas\nÉ cacique da Jurema (2x)",
  },
  {
    id: "tr-13", subcategoriaId: "sub-oxossi-trabalho", ordem: 12, favorito: false, criadoEm: Date.now(),
    titulo: "Me perdi meu pai eu me perdi...",
    letra: "Me perdi meu pai eu me perdi\nLá na mata do amazona eu me perdi (2x)\nProcurei seu Iambuga não achei\nVim aqui no seu terreiro e encontrei",
  },
  {
    id: "tr-14", subcategoriaId: "sub-oxossi-trabalho", ordem: 13, favorito: false, criadoEm: Date.now(),
    titulo: "Caçador na beira do caminho...",
    letra: "Caçador na beira do caminho\nNão me mate essa coral na estrada\nEla abandonou sua choupana caçador\nFoi no romper, da madrugada",
  },
  {
    id: "tr-15", subcategoriaId: "sub-oxossi-trabalho", ordem: 14, favorito: false, criadoEm: Date.now(),
    titulo: "Oxossi é caçador eu gosto de ver caçar...",
    letra: "Oxossi é caçador eu gosto de ver caçar\nDe dia ele caça na mata\nA noite ele caça no mar (2x)",
  },
  {
    id: "tr-16", subcategoriaId: "sub-oxossi-trabalho", ordem: 15, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo mora nas matas...",
    letra: "Caboclo mora nas matas, nas matas moram os orixás\nOh diga a ele para vir firmar seu ponto\nAuê, auê, auâ (2x)",
  },
  {
    id: "tr-17", subcategoriaId: "sub-oxossi-trabalho", ordem: 16, favorito: false, criadoEm: Date.now(),
    titulo: "Estrela matutina clareia a banda sem parar...",
    letra: "Estrela matutina clareia a banda sem parar (2x)\nDizem que meu pai é um caboclo\nAuê, auê, auâ (2x)",
  },
  {
    id: "tr-18", subcategoriaId: "sub-oxossi-trabalho", ordem: 17, favorito: false, criadoEm: Date.now(),
    titulo: "O nome da vila é vila nova...",
    letra: "O nome da vila é vila nova\nRê, o are re, o nome da vila é vila nova",
  },
  {
    id: "tr-19", subcategoriaId: "sub-oxossi-trabalho", ordem: 18, favorito: false, criadoEm: Date.now(),
    titulo: "No alto daquela serra...",
    letra: "No alto daquela serra\nDebaixo de um pé de angá\nEu vi seu Iambuga atirar a sua flecha e não errar\n\nZuou, zuou, a sua flecha zuou (2x)",
  },
  {
    id: "tr-20", subcategoriaId: "sub-oxossi-trabalho", ordem: 19, favorito: false, criadoEm: Date.now(),
    titulo: "Oh, cadê gira mundo o Pemba...",
    letra: "Oh, cadê gira mundo o Pemba\nOh, tá na pedreira o Pemba\nE seus cambones Pemba\nO veado no mato é corredor\nCadê meu mano caçador\nCadê o caboclo ventania\nEle é o nosso guia",
  },
  {
    id: "tr-21", subcategoriaId: "sub-oxossi-trabalho", ordem: 20, favorito: false, criadoEm: Date.now(),
    titulo: "Eu vi a cabocla iara sentada na beira do rio...",
    letra: "Eu vi a cabocla iara sentada na beira do rio\nPegando peixe meu senhor\n(escrever esse ponto)",
  },

  // ===== CABOCLO - CURIMBA =====
  {
    id: "cu-1", subcategoriaId: "sub-oxossi-curimba", ordem: 0, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo bom é amigo um do outro...",
    letra: "Caboclo bom é amigo um do outro (2x)\nCaboclo bom, ele anda atrás do outro (2x)",
  },
  {
    id: "cu-2", subcategoriaId: "sub-oxossi-curimba", ordem: 1, favorito: false, criadoEm: Date.now(),
    titulo: "Oxossi fez uma caçada...",
    letra: "Oxossi fez uma caçada\nCaçou uma juriti\nDa caça ele fez banquete\nE a pena pra dividir\n\nPena com pena\nPena pra dividir (2x)",
  },
  {
    id: "cu-3", subcategoriaId: "sub-oxossi-curimba", ordem: 2, favorito: false, criadoEm: Date.now(),
    titulo: "Caboclo pisa aqui que piso lá...",
    letra: "Caboclo pisa aqui que piso lá\nCaboclo eu gostei do seu pisar",
  },

  // ===== CABOCLO - DEMANDA =====
  {
    id: "de-1", subcategoriaId: "sub-oxossi-demanda", ordem: 0, favorito: false, criadoEm: Date.now(),
    titulo: "Se você é caboclo eu quero ver balancear...",
    letra: "Se você é caboclo eu quero ver balancear (2x)\nArreia arreia capangueiro da jurema\nOh jurema (2x)",
  },
  {
    id: "de-2", subcategoriaId: "sub-oxossi-demanda", ordem: 1, favorito: false, criadoEm: Date.now(),
    titulo: "Quando sai da mata virgem...",
    letra: "Quando sai da mata virgem\nO urro de uma onça na Bahia se criou (2x)\nE os meus manos ficaram chorando\nFicaram rezando pra seu salvador (2x)\nSua caverna estava desprezada\nA mesma caverna que a jurema se criou (2x)",
  },
  {
    id: "de-3", subcategoriaId: "sub-oxossi-demanda", ordem: 2, favorito: false, criadoEm: Date.now(),
    titulo: "Sucuri, Jibóia...",
    letra: "Sucuri, Jibóia\nQuando vem beirando o mar\nOlha como cocoriou\nA sua cobra coral (2x)",
  },
  {
    id: "de-4", subcategoriaId: "sub-oxossi-demanda", ordem: 3, favorito: false, criadoEm: Date.now(),
    titulo: "Caçador que matou meu sabiá...",
    letra: "Caçador que matou meu sabiá (2x)\nEle cantava baixinho no alto da serra\nLá em Jurema (2x)",
  },
  {
    id: "de-5", subcategoriaId: "sub-oxossi-demanda", ordem: 4, favorito: false, criadoEm: Date.now(),
    titulo: "Ah não mata que eu não entre...",
    letra: "Ah não mata que eu não entre\nAh não a pau que eu não a suba\nA não a esse passarinho\nQue meu botoque não derrube\nOh curimba\nZum, zum, zum o curimba, é de correr",
  },
  {
    id: "de-6", subcategoriaId: "sub-oxossi-demanda", ordem: 5, favorito: false, criadoEm: Date.now(),
    titulo: "Em mata que Makuku entra...",
    letra: "Em mata que Makuku entra\nYambu não pia (2x)\nEle caboclo é flecheiro é atirador\nNa mata Yambu não pia (2x)",
  },
];

export function carregarDados(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const dados: AppData = {
        orixas: ORIXAS_PADRAO,
        subcategorias: SUBCATEGORIAS_PADRAO,
        pontos: PONTOS_PADRAO,
      };
      salvarDados(dados);
      return dados;
    }
    return JSON.parse(raw) as AppData;
  } catch {
    return { orixas: ORIXAS_PADRAO, subcategorias: [], pontos: [] };
  }
}

export function salvarDados(dados: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

export function exportarDados(): void {
  const dados = carregarDados();
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pontos-umbanda-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarDados(arquivo: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string) as AppData;
        if (!dados.orixas || !dados.subcategorias || !dados.pontos) {
          throw new Error("Arquivo inválido");
        }
        salvarDados(dados);
        resolve();
      } catch {
        reject(new Error("Arquivo de backup inválido"));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(arquivo);
  });
}

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
