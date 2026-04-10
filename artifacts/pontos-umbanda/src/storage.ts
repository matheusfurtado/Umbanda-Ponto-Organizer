import { AppData, Orixa, Subcategoria, Ponto } from "./types";

const STORAGE_KEY = "pontos-umbanda-data";

const ORIXAS_PADRAO: Orixa[] = [
  { id: "exu", nome: "Exu", cor: "#dc2626", emoji: "🔥", ordem: 1, criadoEm: 1774882639699 },
  { id: "ogum", nome: "Ogum", cor: "#2563eb", emoji: "⚔️", ordem: 2, criadoEm: 1774882639699 },
  { id: "oxossi", nome: "Oxóssi", cor: "#16a34a", emoji: "🏹", ordem: 0, criadoEm: 1774882639699 },
  { id: "xango", nome: "Xangô", cor: "#d97706", emoji: "⚡", ordem: 3, criadoEm: 1774882639699 },
  { id: "iansa", nome: "Iansã", cor: "#7c3aed", emoji: "🌪️", ordem: 4, criadoEm: 1774882639699 },
  { id: "oxum", nome: "Oxum", cor: "#ca8a04", emoji: "💛", ordem: 5, criadoEm: 1774882639699 },
  { id: "yemanja", nome: "Iemanjá", cor: "#0891b2", emoji: "🌊", ordem: 6, criadoEm: 1774882639699 },
  { id: "oxala", nome: "Oxalá", cor: "#94a3b8", emoji: "☁️", ordem: 7, criadoEm: 1774882639699 },
  { id: "omulu", nome: "Omulu", cor: "#78350f", emoji: "💀", ordem: 8, criadoEm: 1774882639699 },
  { id: "nanaboroco", nome: "Nanã", cor: "#6d28d9", emoji: "🪷", ordem: 9, criadoEm: 1774882639699 },
  { id: "beijada", nome: "Beijada", cor: "#f472b6", emoji: "👶", ordem: 10, criadoEm: 1775829769157 },
];

const SUBCATEGORIAS_PADRAO: Subcategoria[] = [
  { id: "sub-oxossi-louvacao", orixaId: "oxossi", nome: "Louvação", ordem: 2, criadoEm: 1774882639699 },
  { id: "sub-oxossi-chamada", orixaId: "oxossi", nome: "Cruzado", ordem: 0, criadoEm: 1774882639699 },
  { id: "sub-oxossi-chegada", orixaId: "oxossi", nome: "Chegada", ordem: 1, criadoEm: 1774882639699 },
  { id: "sub-oxossi-trabalho", orixaId: "oxossi", nome: "Caboclo - Trabalho", ordem: 3, criadoEm: 1774882639699 },
  { id: "sub-oxossi-curimba", orixaId: "oxossi", nome: "Caboclo - Curimba", ordem: 4, criadoEm: 1774882639699 },
  { id: "sub-oxossi-demanda", orixaId: "oxossi", nome: "Caboclo - Demanda", ordem: 7, criadoEm: 1774882639699 },
  { id: "1774886896028-q58etyt", orixaId: "oxossi", nome: "Oxossi", ordem: 6, criadoEm: 1774886896028 },
  { id: "1774889196337-js9i8vt", orixaId: "oxossi", nome: "Cura", ordem: 5, criadoEm: 1774889196337 },
  { id: "sub-iansa-chegada", orixaId: "iansa", nome: "Chegada", ordem: 0, criadoEm: 1774882639699 },
  { id: "sub-iansa-louvacao", orixaId: "iansa", nome: "Louvação", ordem: 1, criadoEm: 1774882639699 },
  { id: "sub-iansa-demanda", orixaId: "iansa", nome: "Demanda", ordem: 2, criadoEm: 1774882639699 },
  { id: "sub-iansa-trabalho", orixaId: "iansa", nome: "Trabalho", ordem: 3, criadoEm: 1774882639699 },
  { id: "sub-iansa-cruzado", orixaId: "iansa", nome: "Cruzado", ordem: 4, criadoEm: 1774882639699 },
  { id: "sub-yemanja-chegada", orixaId: "yemanja", nome: "Chegada", ordem: 0, criadoEm: 1774882639699 },
  { id: "sub-yemanja-louvacao", orixaId: "yemanja", nome: "Louvação", ordem: 1, criadoEm: 1774882639699 },
  { id: "sub-yemanja-trabalho", orixaId: "yemanja", nome: "Trabalho", ordem: 2, criadoEm: 1774882639699 },
  { id: "sub-yemanja-cruzado", orixaId: "yemanja", nome: "Cruzado", ordem: 3, criadoEm: 1774882639699 },
  { id: "sub-ogum-chegada", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 1774882639699 },
  { id: "sub-ogum-louvacao", orixaId: "ogum", nome: "Louvação", ordem: 1, criadoEm: 1774882639699 },
  { id: "sub-ogum-trabalho", orixaId: "ogum", nome: "Trabalho", ordem: 2, criadoEm: 1774882639699 },
  { id: "sub-ogum-cruzado", orixaId: "ogum", nome: "Cruzado", ordem: 3, criadoEm: 1774882639699 },
  { id: "sub-oxum-chegada", orixaId: "oxum", nome: "Chegada", ordem: 0, criadoEm: 1774882639699 },
  { id: "sub-oxum-louvacao", orixaId: "oxum", nome: "Louvação", ordem: 1, criadoEm: 1774882639699 },
  { id: "sub-oxum-trabalho", orixaId: "oxum", nome: "Trabalho", ordem: 2, criadoEm: 1774882639699 },
  { id: "sub-nana-chegada", orixaId: "nanaboroco", nome: "Chegada", ordem: 0, criadoEm: 1774882639699 },
  { id: "sub-nana-louvacao", orixaId: "nanaboroco", nome: "Louvação", ordem: 1, criadoEm: 1774882639699 },
  { id: "sub-nana-trabalho", orixaId: "nanaboroco", nome: "Trabalho", ordem: 2, criadoEm: 1774882639699 },
  { id: "sub-beijada-pontos", orixaId: "beijada", nome: "Pontos", ordem: 0, criadoEm: 1775829769157 },
  { id: "sub-omulu-pontos", orixaId: "omulu", nome: "Pontos", ordem: 0, criadoEm: 1775839257000 },
];

const PONTOS_PADRAO: Ponto[] = [
  {
    id: "lo-1", subcategoriaId: "1774886896028-q58etyt", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi, filho de Iemanjá...",
    letra: "Oxossi, filho de Iemanjá\nDivindade do clã de Ogum\nÉ Ibualama, ele é Ilé\nQue Oxum levou no rio\nE nasceu Logun-edé!\n\nSua natureza é da lua\nNa lua Oxóssi é Odé Odé-Odé, Odé-Odé\nRei de Keto Caboclo da mata Odé-Odé.\n\nQuinta-feira é seu ossé\nAxoxó, feijão preto, camarão e amendoim\nAzul e verde, suas cores\nCalça branca rendada\nSaia curta estampada\n\nOjá e couraça prateada\nNa mão ofá, iluquerê\nOkê okê, okê arô, okê\nA jurema é a árvore sagrada\nOkê arô, Oxóssi, okê okê\n\nNa Bahia é São Jorge\nNo Rio, São Sebastião\nOxóssi é quem manda\nNas bandas do meu coração."
  },
  {
    id: "lo-2", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Mas como é bonito, assistir festa nas matas...",
    letra: "Mas como é bonito, assistir festa nas matas\nOuvir o som das cascatas e o lindo canto do sabiá (do sabiá)\nQue noite linda, que bela noite de luar\nFoi no clarão da lua\nQue eu vi o seu Oxossi passar\n\nA mata estava em festa ô ô ô\nToda coberta de flores,\nAté os passarinhos cantam, em seu louvor\nEle é nosso protetor\nÔ ô ô ô ô quanta beleza,\nÔ ô ô ô ô quanto esplendor,\nComo é bom ter a certeza\nQue o seu Oxossi é nosso protetor"
  },
  {
    id: "lo-4", subcategoriaId: "1774886896028-q58etyt", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Vermelho é a cor do sangue de meu pai...",
    letra: "Vermelho é a cor do sangue de meu pai\nE verde é a cor das matas onde mora {bis}\nVamos saravar meu pai Oxóssi em sua banda\nVamos saravar, a banda que ele mora {bis}"
  },
  {
    id: "lo-5", subcategoriaId: "1774886896028-q58etyt", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi Odé, ele é São Sebastião...",
    letra: "Oxossi Odé, ele é São Sebastião\nMas ele reina\nLá nas matas e nos campos\nEle é o dono, da lavoura de pai Tupã\n\nOre rê Ore rê ô\nOre rê Ore rê ô\nMas o senhor ore rê {bis}\n\nPara sua vida melhorar\nE nunca lhe faltar o que comer\nAcenda uma vela\nLá nas matas para Oxossi\nE peça que ele irá lhe socorrer\n\nOre rê Ore rê ô\nOre rê Ore rê ô\nMas o senhor ore rê {bis}"
  },
  {
    id: "lo-6", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi é Rei no Céu...",
    letra: "Oxossi é Rei no Céu\nOxossi é Rei na Terra\nEle não desce do Céu sem coroa\nSem sua nansga de Guerra"
  },
  {
    id: "lo-7", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi Zambi quem criou o mundo...",
    letra: "Foi Zambi quem criou o mundo\nSó Zambi pode governar\nFoi Zambi quem criou\nAs estrelas que ilumina\nOxossi lá no Jurema"
  },
  {
    id: "lo-8", subcategoriaId: "1774886896028-q58etyt", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi chover, eu vi relampear...",
    letra: "Eu vi chover\nEu vi relampear\nMas mesmo assim o céu estava azul\n\nFavorecendo a folha da Jurema\nOxossi é reina\nDe norte a sul (2x)"
  },
  {
    id: "lo-9", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu me orgulho de carregar esse Orixá...",
    letra: "Eu me orgulho\nDe carregar esse Orixá\nEle é meu pai Oxossi\nFilho de pai Oxalá\nEle é meu pai Oxossi\nQue é um grande Orixá (2x)\n\nEle caça, ele pesca\nEle é rei aqui na Umbanda\nVamos salvar pai Oxossi\nQue comanda a nossa banda\nEle é dono das matas\nQuando vem trás seu axé\nCaça para os Orixás\nE ajuda a quem tem fé\n\nEle é o rei de Keto\nFilho de Yemanjá\nEle é meu pai Oxossi\nQue eu louvo em cantar\nEle trás prosperidade\nEle trás muita fartura\nQuem confia em pai Oxossi\nNão vive na amargura"
  },
  {
    id: "lo-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Seu arranca-toco é de aruanda...",
    letra: "Seu arranca-toco é de aruanda,\nÉ de nagô zambe (2x)\nQuando ele chega na umbanda\nAuê, auê (2x)"
  },
  {
    id: "lo-11", subcategoriaId: "sub-oxossi-louvacao", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo sete flechas nasceu...",
    letra: "Caboclo sete flechas nasceu\nNo jardim das oliveiras\n(Pegar o resto do ponto)"
  },
  {
    id: "lo-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo a sua mata é verde...",
    letra: "Caboclo a sua mata é verde, verde é da cor do mar\nSarava o cacique da jurema\nSarava o cacique da jurema\nSarava o cacique da jurema\nJurema (2x)"
  },
  {
    id: "ch-1", subcategoriaId: "sub-oxossi-chegada", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "São Miguel, São Miguel...",
    letra: "São Miguel, São Miguel\nSão Miguel está chamando (2x)\nDai-me forças são Miguel para chamar os caboclos da umbanda (2x)"
  },
  {
    id: "ch-2", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Tambor, tambor...",
    letra: "Tambor, tambor\nVai chamar quem mora longe (2x)\nSalve Oxossi o rei das matas\nOgum do Humaitá\nPai Xangô lá na pedreira\nIansã no jacutá (2x)"
  },
  {
    id: "ch-3", subcategoriaId: "sub-oxossi-chegada", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogã chama todos os caboclos...",
    letra: "Ogã chama todos os caboclos\nChama todos caboclos no batuque do tambor (2x)\nDiga pra ela que já é hora\nDiga pra ele, que a umbanda está chamando"
  },
  {
    id: "ch-4", subcategoriaId: "sub-oxossi-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele vem da mata, ele trouxe flecha...",
    letra: "Ele vem da mata\nEle trouxe flecha\nPra filho de fé saudar\nEle é filho de cacique\nEle é caboclo verdadeiro\nÉ caçador é flecheiro\nVem aqui pra trabalhar\n\nEle é filho de cacique\nÉ caboclo verdadeiro\nEle é seu Pena de Ouro\nQue vem saudar o seu terreiro (2x)"
  },
  {
    id: "ch-5", subcategoriaId: "sub-oxossi-chegada", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava na beira do rio sem poder atravessar...",
    letra: "Estava na beira do rio sem poder atravessar\nChamei pelo caboclo\nCaboclo tupinambá (2x)\nTupinambá chamei\nChamei tupinambá ea (2x)"
  },
  {
    id: "ch-6", subcategoriaId: "sub-oxossi-chegada", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Ainda tem caboclo debaixo da samambaia...",
    letra: "Ainda tem caboclo debaixo da samambaia (2x)\nSai, sai caboclo,\nDebaixo da samambaia (2x)"
  },
  {
    id: "ch-7", subcategoriaId: "sub-oxossi-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxalá chamou e já mandou buscar...",
    letra: "Oxalá chamou e já mandou buscar\nTodos caboclos da jurema\nPara o seu jurema (2x)\n\nPai Oxalá, é rei do mundo inteiro\nE já deu ordens pra jurema\nMandar seus capangueiros\n\nMandai, mandai\nLinda cabocla jurema\nO seu terreiro\nQue já é ordem suprema (2x)"
  },
  {
    id: "ch-9", subcategoriaId: "sub-oxossi-trabalho", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "A sua flecha é carijó...",
    letra: "A sua flecha é carijó seu bodoque é indaiá\nTodos caboclos vem serenos como o sereno é\nOxossi é rei da macaia Oxossi é rei da guiné\nEle atirou\nEle atirou e ninguém viu\nO seu Oxossi é quem sabe\nAonde a flecha caiu (2x)"
  },
  {
    id: "cg-1", subcategoriaId: "sub-oxossi-chegada", ordem: 13, favorito: false, criadoEm: 1774882639699,
    titulo: "Uma rosa no jardim apareceu...",
    letra: "Uma rosa no jardim apareceu\nMamãe está chamando e lá vou eu\nEle é caboclo, ele vem da sua aldeia\nSeu Ubirajara é um caboclo e não bambeia"
  },
  {
    id: "cg-2", subcategoriaId: "sub-oxossi-chegada", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele vem da mata, ele vem girar...",
    letra: "Ele vem da mata, ele vem girar\nO caboclo laranjeira tá de ronda no gongar\nO caboclo laranjeira\nEle promete e não esquece\nEle traz laranja doce\nPara dar a quem merece\n\nEle vem na lei de umbanda\nmensageiro de oxala\nsua flecha tem mironga\nso atira pra acertar"
  },
  {
    id: "cg-3", subcategoriaId: "sub-oxossi-chegada", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "Que cabocla é essa toda vestida de pena...",
    letra: "Que cabocla é essa\nToda vestida de pena é a cabocla jurema\nDona de seu jacutá\nRainha da mata virgem que chegou pra trabalhar"
  },
  {
    id: "cg-4", subcategoriaId: "sub-oxossi-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Lua que clareia o mundo...",
    letra: "Lua que clareia o mundo\nQue clareia a terra e o mar\nClareia as matas de Oxossi\nCidade da jurema\n\nClareia os caminhos\nQue os caboclos vão passar\nPara vir na umbanda trabalhar (2x)"
  },
  {
    id: "cg-5", subcategoriaId: "sub-oxossi-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava sentado na cadeira da jurema...",
    letra: "Estava sentado na cadeira da jurema\nPorque mandaram me chamar (2x)\nO juremi, o Jurema\nPorque mandaram me chamar (2x)"
  },
  {
    id: "cg-6", subcategoriaId: "sub-oxossi-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Nas matas lá da jurema eu vi uma estrela brilhar...",
    letra: "Nas matas lá da jurema\nEu vi uma estrela brilhar (2x)\nEra uma estrela de Oxossi\nAnunciando que caboclo vai chegar (2x)\n\nOkê, Okê caboclo\nCaboclo Sete Estrelas no gongar\nOkê, Okê caboclo\nVem de aruanda, pra seus filhos ajudar (2x)"
  },
  {
    id: "cg-8", subcategoriaId: "sub-oxossi-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Que penacho é aquele...",
    letra: "Que penacho é aquele\nÉ um penacho de arara (2x)\n\nAi quando rompe a mata virgem\nQuando rompe a mata virgem\nÉ o caboclo Ubirajara (2x)"
  },
  {
    id: "cg-9", subcategoriaId: "sub-oxossi-chegada", ordem: 12, favorito: false, criadoEm: 1774882639699,
    titulo: "Ubirajara quando chegou...",
    letra: "Ubirajara quando chegou\nNão atendeu caboclo nenhum (2x)\nSete mundos, sete mundos(2x)\nEle se chama Ubirajara, meu pai Oxossi é caçador de outro mundo (2x)"
  },
  {
    id: "tr-1", subcategoriaId: "sub-oxossi-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Quanto tempo que eu não bambeio...",
    letra: "Quanto tempo que eu não bambeio\nE hoje vim pra trabalhar (2x)\nO caboclo samambaia\nVeio aqui pra trabalhar (2x)"
  },
  {
    id: "tr-2", subcategoriaId: "1774889196337-js9i8vt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo roxo da pele morena...",
    letra: "Caboclo roxo da pele morena\nEle é Oxossi é caçador lá da jurema (2x)\nEle jurou e tornou a jurar\nEm tomar os conselhos que a jurema vem lhe dar\nEle jurou e tornou a jurar\nNão deixar os perversos nessa banda entrar"
  },
  {
    id: "tr-4", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se a gameleira de Oxossi faz sombra...",
    letra: "Se a gameleira de Oxossi faz sombra\nMeu pai Oxalá me responda (2x)\nAi como é bonito\nQue bonito é\nO meu pai Oxossi\nNo seu are, rê (2x)"
  },
  {
    id: "tr-6", subcategoriaId: "sub-oxossi-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Na beira do rio verde...",
    letra: "Na beira do rio verde\nEu vi o caboclo na areia (2x)\nPescando peixe miúdo\nPra levar pra sua aldeia (2x)\nCaboclo pegue o anzol\nQue a noite é linda e clara\nVai pescar no rio verde\nPor ordem de mar iara (2x)"
  },
  {
    id: "tr-7", subcategoriaId: "sub-oxossi-trabalho", ordem: 15, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo não tem caminho para caminhar...",
    letra: "Caboclo não tem caminho para caminhar (2x)\nEle caminha por cima da folha, por baixo da folha por todo lugar (2x)\nSeus caminhos estão abertos\nCaboclo pode passar\nEle vem girar, ele vem girar\nCaboclo filho de umbanda, filho Oxossi e neto de Oxalá\n\nQuando a lua sair\nEle vem girar (2x)"
  },
  {
    id: "tr-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi numa tarde serena...",
    letra: "Foi numa tarde serena\nLá nas matas da jurema que eu vi os caboclos bradar (2x)\nKiô, kiô, kiô que era\nToda mata está em festa\nSarava seu Sete Flechas\nEle é rei da floresta (2x)"
  },
  {
    id: "tr-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Mandei fazer, o que banda eu fiz...",
    letra: "Mandei fazer, o que banda eu fiz\nUm capacete de penas\n\nSalve seu Iambuga\nÉ capitão das matas\nÉ cacique da Jurema (2x)"
  },
  {
    id: "tr-13", subcategoriaId: "sub-oxossi-trabalho", ordem: 16, favorito: false, criadoEm: 1774882639699,
    titulo: "Me perdi meu pai eu me perdi...",
    letra: "Me perdi meu pai eu me perdi\nLá na mata do amazona eu me perdi (2x)\nProcurei seu Iambuga não achei\nVim aqui no seu terreiro e encontrei"
  },
  {
    id: "tr-14", subcategoriaId: "sub-oxossi-trabalho", ordem: 18, favorito: false, criadoEm: 1774882639699,
    titulo: "Caçador na beira do caminho...",
    letra: "Caçador na beira do caminho\nNão me mate essa coral na estrada\nEla abandonou sua choupana caçador\nFoi no romper, da madrugada"
  },
  {
    id: "tr-15", subcategoriaId: "sub-oxossi-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi é caçador eu gosto de ver caçar...",
    letra: "Oxossi é caçador eu gosto de ver caçar\nDe dia ele caça na mata\nA noite ele caça no mar (2x)"
  },
  {
    id: "tr-16", subcategoriaId: "sub-oxossi-chegada", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo mora nas matas...",
    letra: "Caboclo mora nas matas, nas matas moram os orixás\nOh diga a ele para vir firmar seu ponto\nAuê, auê, auâ (2x)"
  },
  {
    id: "tr-17", subcategoriaId: "sub-oxossi-trabalho", ordem: 17, favorito: false, criadoEm: 1774882639699,
    titulo: "Estrela matutina clareia a banda sem parar...",
    letra: "Estrela matutina clareia a banda sem parar (2x)\nDizem que meu pai é um caboclo\nAuê, auê, auâ (2x)"
  },
  {
    id: "tr-18", subcategoriaId: "sub-oxossi-trabalho", ordem: 19, favorito: false, criadoEm: 1774882639699,
    titulo: "No alto daquela serra, eu avistei uma vila",
    letra: "perguntei o nome da vila para uma cabocla formosa\n\nela entao me respondeu\nO nome da vila é vila nova(2x)\n\nRê, o are re, o nome da vila é vila nova"
  },
  {
    id: "tr-19", subcategoriaId: "sub-oxossi-trabalho", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "No alto daquela serra, debaixo de um pe de anga",
    letra: "No alto daquela serra\nDebaixo de um pé de angá\nEu vi seu Iambuga atirar a sua flecha e não errar\n\nZuou, zuou, a sua flecha zuou (2x)"
  },
  {
    id: "tr-20", subcategoriaId: "sub-oxossi-trabalho", ordem: 12, favorito: false, criadoEm: 1774882639699,
    titulo: "Oh, cadê gira mundo o Pemba...",
    letra: "Oh, cadê gira mundo o Pemba\nOh, tá na pedreira o Pemba\nE seus cambones Pemba\nO veado no mato é corredor\nCadê meu mano caçador\nCadê o caboclo ventania\nEle é o nosso guia"
  },
  {
    id: "tr-21", subcategoriaId: "sub-oxossi-trabalho", ordem: 20, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi a cabocla iara sentada na beira do rio...",
    letra: "Eu vi a cabocla iara sentada na beira do rio\nPegando peixe meu senhor\n(escrever esse ponto)"
  },
  {
    id: "cu-1", subcategoriaId: "sub-oxossi-curimba", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo bom é amigo um do outro...",
    letra: "Caboclo bom é amigo um do outro (2x)\nCaboclo bom, ele anda atrás do outro (2x)"
  },
  {
    id: "cu-2", subcategoriaId: "sub-oxossi-curimba", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi fez uma caçada...",
    letra: "Oxossi fez uma caçada\nCaçou uma juriti\nDa caça ele fez banquete\nE a pena pra dividir\n\nPena com pena\nPena pra dividir (2x)"
  },
  {
    id: "cu-3", subcategoriaId: "sub-oxossi-curimba", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo pisa aqui que piso lá...",
    letra: "Caboclo pisa aqui que piso lá\nCaboclo eu gostei do seu pisar"
  },
  {
    id: "de-1", subcategoriaId: "sub-oxossi-demanda", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se você é caboclo eu quero ver balancear...",
    letra: "Se você é caboclo eu quero ver balancear (2x)\nArreia arreia capangueiro da jurema\nOh jurema (2x)"
  },
  {
    id: "de-2", subcategoriaId: "sub-oxossi-demanda", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Quando sai da mata virgem...",
    letra: "Quando sai da mata virgem\nO urro de uma onça na Bahia se criou (2x)\nE os meus manos ficaram chorando\nFicaram rezando pra seu salvador (2x)\nSua caverna estava desprezada\nA mesma caverna que a jurema se criou (2x)"
  },
  {
    id: "de-3", subcategoriaId: "sub-oxossi-demanda", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Sucuri, Jibóia...",
    letra: "Sucuri, Jibóia\nQuando vem beirando o mar\nOlha como cocoriou\nA sua cobra coral (2x)"
  },
  {
    id: "de-4", subcategoriaId: "sub-oxossi-demanda", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Caçador que matou meu sabiá...",
    letra: "Caçador que matou meu sabiá (2x)\nEle cantava baixinho no alto da serra\nLá em Jurema (2x)"
  },
  {
    id: "de-5", subcategoriaId: "sub-oxossi-demanda", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ah não mata que eu não entre...",
    letra: "Ah não mata que eu não entre\nAh não a pau que eu não a suba\nA não a esse passarinho\nQue meu botoque não derrube\nOh curimba\nZum, zum, zum o curimba, é de correr"
  },
  {
    id: "de-6", subcategoriaId: "sub-oxossi-demanda", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Em mata que Makuku entra...",
    letra: "Em mata que Makuku entra\nYambu não pia (2x)\nEle caboclo é flecheiro é atirador\nNa mata Yambu não pia (2x)"
  },
  {
    id: "1774889674435-5a8wjqy", subcategoriaId: "sub-oxossi-trabalho", ordem: 13, favorito: false, criadoEm: 1774889674435,
    titulo: "Calunga ê, calunga â",
    letra: "Calunga ê, calunga â\nchegou da calunga, pra trabalhar(2x)\n\nchegou da calunga ele é caboclo ele é flecheiro\nchegou da calunga é amarrador de feiticeiro"
  },
  {
    id: "1774889853101-hjzzj7o", subcategoriaId: "sub-oxossi-trabalho", ordem: 21, favorito: false, criadoEm: 1774889853101,
    titulo: "cabocla formosa a sua flecha ela atirou(PROCURAR)",
    letra: "saiu da calunga iemanha foi quem mandou\n\nela mandou pra ajudar os filhos seus,\njandira, jacira iracema apareceu"
  },
  {
    id: "1774889983708-ljmah2p", subcategoriaId: "sub-oxossi-trabalho", ordem: 7, favorito: false, criadoEm: 1774889983708,
    titulo: "caboclo filho da pedreira",
    letra: "caboclo filho da pedreira\nla da cachoeira, vem os seus filhos guiar\n\nfirma seu ponto caboclo\nquando na umbanda chegar\ncorumataí é o chefe do congar"
  },
  {
    id: "1774890232438-1z3yjyb", subcategoriaId: "sub-oxossi-trabalho", ordem: 3, favorito: false, criadoEm: 1774890232438,
    titulo: "la no topo do mundo",
    letra: "la no topo do mundo\nna pedreira de tupã\num aimore estava sentado\nseu penacho é encarnado\no seu brado é entoado\no que é que ele faz la\n\nla no topo do mundo\nurubatão vem a terra girar ô ô\n\nvem a terra girar ô ô (3x)\n\nQuando vai se pondo o sol\nquando vai nascendo o dia\nquem faz o mundo girar\né o urubatão da guia ô ô\n\nvem a terra girar ô ô\nvem a terra girar ô ô\nvem a terra girar ô ô"
  },
  {
    id: "1774890328431-uw5z21z", subcategoriaId: "sub-oxossi-trabalho", ordem: 14, favorito: false, criadoEm: 1774890328431,
    titulo: "Mas o seu manaca ja não da mais flor... PROCURAR",
    letra: "Mas o seu manaca ja não da mais flor...\n\nele vai mandar plantar(2x)\n\numa semente la no seu jacuta\n\nmas como é lindo a madrugada\nfilho de umbanda veio trabalhar(2x)"
  },
  {
    id: "1774890474827-z0b2gn9", subcategoriaId: "sub-oxossi-trabalho", ordem: 6, favorito: false, criadoEm: 1774890474827,
    titulo: "é caçador, é caçador, é caçador ...",
    letra: "é caçador, é caçador, é caçador  mas não é advinhador(2x)\nele é o caboclo da beira dagua\nna linha de umbanda ele vem trabalhar\nsegura o terreiro e seu jacuta"
  },
  {
    id: "1774890562289-d794u8e", subcategoriaId: "sub-oxossi-trabalho", ordem: 5, favorito: false, criadoEm: 1774890562289,
    titulo: "estava na mata caçando, no meio da mata caiapó...",
    letra: "estava na mata caçando, no meio da mata caiapó\nmas era seu ubirajara que estava caçando a cobra cipó."
  },
  {
    id: "1774890646304-dwutbir", subcategoriaId: "sub-oxossi-trabalho", ordem: 4, favorito: false, criadoEm: 1774890646304,
    titulo: "piava no alto da serra...",
    letra: "piava no alto da serra\npiava de se admirar\n\nmas era uma enorme jiboia\nque estava presa no bodoque \nde tupinamba(2x)"
  },
  {
    id: "1774890726983-0xsoegx", subcategoriaId: "sub-oxossi-trabalho", ordem: 8, favorito: false, criadoEm: 1774890726983,
    titulo: "O indio O indio O indio....",
    letra: "O indio O indio O indio\nele é o indio aonde o sol nasceu\n\nja foi cacique\nja foi pajé\n\nHoje é guerreiro da tribo dos aimoré"
  },
  {
    id: "1774891268778-xekpubu", subcategoriaId: "sub-oxossi-trabalho", ordem: 9, favorito: false, criadoEm: 1774891268778,
    titulo: "eu vi no alto da serra, cabocla dando seu brado de guerra",
    letra: "Eu vi no Alto da serra, Cabocla Jurema dando seu brado de guerra \nKiô, kiô, dentro da mata o seu brado ecoou  (2x)\n\nCom o seu arco e sua flecha e a sua lança de Indaiá, \nJurema dava o seu brado de guerra,\n anunciando que ia caçar, \nsete luas se passaram quando a Jurema voltou,\n toda a caça que ela trazia ao Cacique  entregou,\n e ele então alegre cantou em seu louvor, \n\nO o o Jurema, o o o Jurema, linda caçadora bela Cabocla de pena  (2x)"
  },
  {
    id: "1774891417238-yhn4jaj", subcategoriaId: "1774889196337-js9i8vt", ordem: 8, favorito: false, criadoEm: 1774891417238,
    titulo: "ó escutai o jurema, escutai quem ta chamando",
    letra: "ó escutai o jurema, escutai quem ta chamando\né a cabocla aimore\nela é quem avisar\n\nque são jorge ja esta de ronda\npara os perversos nao chegar\n\nchega são jorge chega\nVem Aimoré saravá\nAimoré é uma cabocla\nQue seus filhos gosta de ajudar"
  },
  {
    id: "1774891523453-a5edd4s", subcategoriaId: "sub-oxossi-trabalho", ordem: 23, favorito: false, criadoEm: 1774891523453,
    titulo: "A mata estava escura...",
    letra: "A mata estava escura\nveio um anjo e iluminou\nno meio da mata virgem\nraio de sol assuviou\n\nmas ele é o rei, ele é o rei, ele é o rei\nmas ele é o rei na umbanda ele é o rei (2x)"
  },
  {
    id: "1774891611922-phwzrmt", subcategoriaId: "1774889196337-js9i8vt", ordem: 1, favorito: false, criadoEm: 1774891611922,
    titulo: "luar luar, caboclo da lua ja chegou",
    letra: "luar luar, caboclo da lua ja chegou (2x)\n\nvai dizer a sua mae\nque seus filhos ele curou(2x)"
  },
  {
    id: "1774891673816-oj3gw6t", subcategoriaId: "1774889196337-js9i8vt", ordem: 2, favorito: false, criadoEm: 1774891673816,
    titulo: "luar luar, segue o seu andar o luar...",
    letra: "luar luar, segue o seu andar o luar (2x)\n\nSou um caboclo destemido\nmorador desse gongar\na viola me consola\npara as magoas espalhar\nno alto daquela serra\nonde canta o sabia\nonde tudo é riqueza ele é caboclo e mora la"
  },
  {
    id: "1774891705573-in06l0u", subcategoriaId: "1774889196337-js9i8vt", ordem: 3, favorito: false, criadoEm: 1774891705573,
    titulo: "girou o sol, girou a lua",
    letra: "girou o sol, girou a lua\ngirou o caboclo e a sua cura"
  },
  {
    id: "1774891774453-9pwpcpl", subcategoriaId: "1774889196337-js9i8vt", ordem: 4, favorito: false, criadoEm: 1774891774453,
    titulo: "batuque no terreiro, é tupinamba",
    letra: "batuque no terreiro, é tupinamba(2x)\né da pele vermelha, é tupinamba ô\n\nFlecha, flecha, flecha\npara o mal levar(2x)"
  },
  {
    id: "1774891824854-7daav7i", subcategoriaId: "1774889196337-js9i8vt", ordem: 5, favorito: false, criadoEm: 1774891824854,
    titulo: "Cocorico fez um galo aue...",
    letra: "Cocorico fez um galo aue\nno alto daquela serra(2x)\npara ajudar esses filhos aue\ntodos os caboclos vem a terra(2x)"
  },
  {
    id: "1774891875777-9l43z8o", subcategoriaId: "1774889196337-js9i8vt", ordem: 6, favorito: false, criadoEm: 1774891875777,
    titulo: "chamei minha cabocla de pena....",
    letra: "chamei minha cabocla de pena\nchamei la das matas pra ela trabalhar\n\npra ver a força que a jurema tem\npra ver a força que a jurema da(2x)"
  },
  {
    id: "1774892021416-o26eost", subcategoriaId: "sub-oxossi-curimba", ordem: 3, favorito: false, criadoEm: 1774892021416,
    titulo: "estrela sol e lua que clareia o jurema...",
    letra: "estrela sol e lua que clareia o jurema(2x)\n\né a curimba de todos os caboclos\ncom flecha e bodoque no reino da iara(2x)"
  },
  {
    id: "1774892057238-dyqu2pg", subcategoriaId: "sub-oxossi-curimba", ordem: 4, favorito: false, criadoEm: 1774892057238,
    titulo: "Caboclo pisa aqui que eu piso la..",
    letra: "Caboclo pisa aqui que eu piso la\ncaboclo eu gostei do seu pisar."
  },
  {
    id: "1774892108288-f83mm50", subcategoriaId: "sub-oxossi-curimba", ordem: 5, favorito: false, criadoEm: 1774892108288,
    titulo: "como é bonito a curimba dos caboclos...",
    letra: "como é bonito a curimba dos caboclos\npisa na areia de rastro pro outro(2x)\nsalve a sereia\nsalve iemanja\nsalve os caboclos da beira do mar"
  },
  {
    id: "1774892170451-870j0df", subcategoriaId: "sub-oxossi-curimba", ordem: 6, favorito: false, criadoEm: 1774892170451,
    titulo: "a jurema tem a jurema da(procurar melhor)",
    letra: "a jurema tem a jurema da\nseu sete estrelas pra trabalhar"
  },
  {
    id: "1774892412605-4j6ko1n", subcategoriaId: "1774889196337-js9i8vt", ordem: 7, favorito: false, criadoEm: 1774892412605,
    titulo: "koke koke o meus caboclos...",
    letra: "koke koke o meus caboclos\nestá em festa as matas do jurema\nkoke koke seu lirio verde, bravo guerreiro quem acabou de chegar\n\nEsse caboclo valente, veio nos abençar\ntrazendo para a umbanda\na paz divina de pai oxala\n\ndeixou em sua macaia\npataca, trouxe manaca\nessa erva é sagrada um forte remedio para lhe curar\n\nkoke koke o meus caboclos\nestá em festa as matas do jurema\nkoke koke seu lirio verde, bravo guerreiro quem acabou de chegar\n\npeço licença a ossain\noxossi, nana buruque\npara curar com essa erva  o filho enfermo de obaluar\ntendo a certeza da graça\nmeu pai em canto em seu louvor\nsarava seu lirio verde que dentro da banda nos abençoou"
  },
  {
    id: "1774892562061-jjr69rd", subcategoriaId: "sub-oxossi-trabalho", ordem: 23, favorito: false, criadoEm: 1774892562061,
    titulo: "eu vi a cabocla iara sentada na beira do rio",
    letra: "Eu vi a cabocla Iara\nSentar na beira do rio\nEu vi a cabocla Iara\nSentar na beira do rio\nPegando peixe, meu senhor\nPegando peixe, meu senhor\nPra levar pra quem pediu\nPegando peixe, meu senhor\nPegando peixe, meu senhor\nPra levar pra quem pediu\nIara cabocla linda\nVem fazer sua obrigação\nIara cabocla linda\nVem fazer sua obrigação\nNo seu terreiro, meu senhor (2x)\nEla faz sua devoção\nNo seu terreiro, meu senhor (2x)\nEla faz sua devoção"
  },
  {
    id: "1774894075512-rhwa12j", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: 1774894075512,
    titulo: "Eu vou pedir licença pra Oxossi",
    letra: "Eu vou pedir licença pra Oxossi\nPra trabalhar nas matas da Jurema (bis)\n\nBater cabeça pra Xangô, lá na pedreira\nOu levar flores pra Oxum na cachoeira"
  },
  {
    id: "1774894113048-moibu18", subcategoriaId: "sub-oxossi-chamada", ordem: 2, favorito: false, criadoEm: 1774894113048,
    titulo: "Ele é caboclo, ele nao pode negar",
    letra: "Ele é caboclo, ele não pode negar\nEle tem seu capacete\nQuem lhe deu foi Oxalá\nAuê auê, meu pai eu quero ver\nSe meu pai é Oxossi\nOu ogum de Aruê"
  },
  {
    id: "1774894202777-5un26y1", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: 1774894202777,
    titulo: "Ela vem de sua mata vem de onde a cobra pia",
    letra: "Ela vem de sua mata vem de onde a cobra pia {bis}\nSaravá seu Ubirajara, seu Sete Estrelas e a cabocla Jupira\nEla vem de sua mata vem de onde a cobra pia {bis}\nSaravá seu sete estrelas, seu Arranca-toco e a cabocla Jupira..."
  },
  {
    id: "1774894753798-5z6qman", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: 1774894753798,
    titulo: "galo cantou na serra...",
    letra: "galo cantou na serraa\nna mata estremeceu(2x)\ncaboclo seu pena verde, na cachoeira apareceu(2x)\n\nele é caboclo, flecheiro\nque mora num rochedo\nsomente cobra coral, conhece dele o segredo(2x)\n\nvem pelas margens do rio\nem linha manha serena\ncaboclo seu pena verde\nfirma seu ponto na areia"
  },
  {
    id: "1774894821785-su1h8zk", subcategoriaId: "sub-oxossi-louvacao", ordem: 8, favorito: false, criadoEm: 1774894821785,
    titulo: "eu venho das matas...",
    letra: "eu venho das matas, bem longe\nbem longe\naonde o galo, cantou \naonde a folha da jurema balanceou, balanceou"
  },
  {
    id: "ia-cg-1", subcategoriaId: "sub-iansa-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Deu um clarão no céu...",
    letra: "Deu um clarão no céu\nAs nuvens se esconderam\nMas de repente deu uma ventania\nEra a donas dos raios\nIansã que aparecia (x2)\n\nTão linda como o ouro na cor\nSua coroa é cravejada de brilhantes\nEparrêi, eparrêi Oyá\nIlumina meus caminhos\nPor onde eu passar (x2)"
  },
  {
    id: "ia-cg-2", subcategoriaId: "sub-iansa-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Olha que o Céu clareou...",
    letra: "Olha que o Céu clareou\nQuando o dia raiou\nFez o filho pensar\nA mãe do tempo mandou\nA nova era chegou\nAgora vamos cantar\nNo Humaitá Ogum Bradou\nSeu Oxossi atinou\nQue Iansã vai chegar\nO Ogã já firmou\nO atabaque afinou,\nAgora vamos cantar\n\nA Eparrêi, ela é Oyá ela é Oyá\nA Eparrêi, é Iansã é Iansã\nA Eparrêi\nQuando Iansã vai pra batalha,\nTodos cavaleiros param\nPara ver ela passar (x2)"
  },
  {
    id: "ia-cg-3", subcategoriaId: "sub-iansa-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eparrêi Oyá, Deusa dos ventos...",
    letra: "Eparrêi Oyá\nDeusa dos ventos mensageira de Oxalá (x2)\n\nSarava santa guerreira\nDona do Sol e da Lua\nMinha santa padroeira\nQue os meus caminhos marcou\nProteção pra nossa banda\nEparrêi ó Bela Oyá\nMoça rica de Aruanda\nVenha nos abençoar"
  },
  {
    id: "ia-cg-4", subcategoriaId: "sub-iansa-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Raios cruzando o céu...",
    letra: "Raios cruzando o céu\nO mar começa a se agitar\nGuerreira com a espada na mão\nGirando num lindo bailar\nIansã mostrando sua força\nImpondo o seu grande poder\nDivina rainha da umbanda\nMinha mãe eu lhe imploro\nVenha me valer"
  },
  {
    id: "ia-cg-5", subcategoriaId: "sub-iansa-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ô, ô, Ventania chegou...",
    letra: "Ô, ô\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou\nTenho a certeza que com ela eu posso contar\nCom minha fé\nO mal irei derrotar\nO terreiro toca atabaque\nEm seu louvor\nLindas canções empenhadas\nCom muito amor\n\nEpahey, epahey, epahey\nO daí me forças mamãe Iansã epahey (2x)\n\nÔ, ô\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou"
  },
  {
    id: "ia-lo-1", subcategoriaId: "sub-iansa-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Raios que cruzam o ar... (Bela Oyá)",
    letra: "Raios que cruzam o ar\nNa fúria da ventania\nVejo a força da Oyá\nE o poder que ela irradia\nEla é a rainha da lei,\nDo fogo ela é soberana,\nAo ouvir seu Eparrêi,\nMeu coração se engalana\n\nE Bela Oyá, E Bela Oyá\nEu sou filho da Matamba\nIansã eu vou louvar\nBela Oyá (x2)\n\nEla dança o aguêrê\nIansã, santa guerreira\nAtabaques e afoxé,\nZuelando a noite inteira\nVou louvar a minha mãe,\nEm forma de oração,\nE o vento que vai ventar,\nVai levar esta canção, Bela Oyá\n\nE Bela Oyá, E Bela Oyá\nEu sou filho da Matamba\nIansã eu vou louvar\nBela Oyá (x2)"
  },
  {
    id: "ia-lo-2", subcategoriaId: "sub-iansa-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Guerreira, tens o bailar de um beija flor...",
    letra: "Guerreira, tens o bailar de um beija flor\nGuerreira, o seu bailar me encantou (x2)\n\nSenhora dos ventos,\nSenhora do Balé,\nEparrêi ó bela Oyá,\nNessa Deusa eu tenho fé\nSua força vem do vento,\nA sua beleza irradia,\nÉ força da natureza,\nÉ a força que me guia\n\nGuerreira, tens o bailar de um beija flor\nGuerreira, o seu bailar me encantou (x2)\n\nEssa deusa tem um rei\nQue em seu reino governou\nDividindo fortes raios esse rei é Pai Xangô\nCom poder da ventania\nToda palha ela soprou\nNo xirê dos orixás\nOmulu ela curou"
  },
  {
    id: "ia-lo-3", subcategoriaId: "sub-iansa-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã, meu orixá estrela guia...",
    letra: "Iansã, meu orixá estrela guia\nTu és a própria ventania\nQue em meu terreiro\nHoje louvo em meu gonga\nTu és,\nA moça rica és formosa\nÉs minha mãe és linda rosa,\nNo jardim suspenso de pai Oxalá\nGuerreira,\nÉs minha força,\nÉs Minha fé,\nGuardo comigo seu axé\nUm misticismo da Bahia,\nLouvo,\nseu lindo relampear\nEparrêi Oyá\nIlumina o meu passar\nSenhora da ventania\n\nLouvo o vento\nLouvo o raio\nLouvo o relampear\nSarava santa guerreira\nSarava seu jacutá (x2)"
  },
  {
    id: "ia-lo-4", subcategoriaId: "sub-iansa-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Quando Iansã chegou, Saravou Yalorixá...",
    letra: "Quando Iansã chegou,\nSaravou Yalorixá,\nOgã Louvou sua Coroa\nEparrei Bela Oyá\nEla é moça bonita\nMoça rica ela é\nConhecida dentro do santo\nEla é Iansã do Balé\n\nOlha eu, Olha eu\nOlha eu Bela Oyá\nOlha eu, Olha eu\nEla é Iansã é o meu orixá (x2)"
  },
  {
    id: "ia-lo-5", subcategoriaId: "sub-iansa-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã é a dona do mundo...",
    letra: "Iansã é a dona do mundo\nDona do fogo, da faísca e do trovão\nEparrei Iansã na Aruanda\nSanta Barbara com a espada na mão"
  },
  {
    id: "ia-lo-6", subcategoriaId: "sub-iansa-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Sarava Iansã do cabelo loiro...",
    letra: "Sarava Iansã do cabelo loiro\nNo mar tem água, na sua pedra tem ouro\nLe, le le e\nLe, le le á\nSarava Iansã que é rainha do ar"
  },
  {
    id: "ia-lo-7", subcategoriaId: "sub-iansa-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Relampejou lá no céu, deixa clarear...",
    letra: "Relampejou lá no céu, deixa clarear\nVento soprou na palmeira, ê ah!\nSalve a deusa do fogo, Oyá!\nÉ Iansã quem chegou, deixa ela girar (2x)\n\nOh, guerreira, rainha desse jacutá\nSeu encanto me fascina, você é quem me faz sonhar\nÉ vento que sopra no meu coração\nEnergia que me faz vibrar de emoção\nÉ fogo que aquece o meu anoitecer\nÉ luz que me guia, é meu bem querer\nCom sua espada eu venço a batalha\nMinha fé em você não falha\nEparrêi, minha mãe, vem me proteger"
  },
  {
    id: "ia-lo-8", subcategoriaId: "sub-iansa-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eparrei ô, Eparrei á, força de Oyá...",
    letra: "Eparrei ô, Eparrei á, Eparrei, força de Oyá (4x)\n\nEla é mais que temporal\nMuito mais que ventania\nUma força sem igual\nUm poder que arrepia\nA bravura de mil homens\nTudo em uma só mulher\nE por nós ela guerreia\nVenha o mal de onde vier\n\nEparrei ô, Eparrei á, Eparrei, força de Oyá (4x)\n\nFilha de santa guerreira\nMeu caminho eu mesma traço\nFui criada em fogo alto\nTenho minha alma de aço\nAgradeço à Iansã\nTudo o que ela me ensinou\nA coragem de Ogum\nE a justiça de Xangô"
  },
  {
    id: "ia-de-1", subcategoriaId: "sub-iansa-demanda", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã, Cadê Ogum? Foi pro mar!...",
    letra: "Iansã, Cadê Ogum?\nFoi pro mar!\nMas Iansã, Cadê Ogum?\nFoi pro mar! (2x)\n\nIansã penteia\nOs seus cabelos macios\nQuando a luz da lua cheia\nClareia as águas dos rios\nOgum sonhava\nCom a filha de Nanã\nE pensava que as estrelas\nEram os olhos de Iansã\n\nMas Iansã, Cadê Ogum?\nFoi pro mar! (4x)\n\nNa terra dos orixás\nUm amor se dividia\nEntre um deus que era de paz\nE outro deus que combatia\nComo a luta só termina\nQuando existe um vencedor\nIansã virou rainha na coroa de xangô\n\nMas Iansã, Cadê Ogum?\nFoi pro mar!\nIansã, Cadê Ogum?\nFoi pro mar! (2x)"
  },
  {
    id: "ia-de-2", subcategoriaId: "sub-iansa-demanda", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Sonhei um sonho lindo...",
    letra: "Sonhei um sonho lindo\nSonho tão lindo\nQue me encantou\nEu me banhava\nCom as águas da Oxum\nQue desciam da pedreira\nDe pai Xangô\nTempo virava\nVentos e o trovão roncou\nEra a bela Oyá\nQue nos meus sonhos vinha para me ajudar\n\nEla bailava sem ter os pés no chão,\nCom sua espada, e seu cálice na mão\nEra Iansã me dando a sua proteção (x2)"
  },
  {
    id: "ia-tr-1", subcategoriaId: "sub-iansa-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Santa guerreira que ao meu lado caminha...",
    letra: "Santa guerreira que ao meu lado caminha\nCom sua taça de ouro e sua espada na mão\nÉs para mim toda grandeza\nVenero sua beleza\nTrago a em meu coração\nA sua saia quando roda irradia\nÉ Deusa da Ventania\nA Rainha Trovão,\nMeu pai Xangô\nIansã fez sua morada,\nEla roda sua saia\nQuando ronca a trovoada (x2)\n\nEparrêi, Eparrêi Oyá\nSarava mãe Iansã, é Rainha dos Orixás (x2)"
  },
  {
    id: "ia-tr-2", subcategoriaId: "sub-iansa-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Aê dim dim, Aê dim dá...",
    letra: "Aê dim dim\nAê dim dá\nOyá Matamba de Aruê\nOyá Matamba de Aruá"
  },
  {
    id: "ia-tr-3", subcategoriaId: "sub-iansa-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Raio de luz clarão no céu...",
    letra: "Raio de luz clarão no céu\nÉ ventania que vem lá\nA noite inteira vento vem e vai\nRodopiando a bailar\nCom a espada erguida no ar\nSurge a guerreira\nÉ Iansã\n\nVarrendo os males\nÉ Iansã\n\nOh mãe valei-me\nLevai nesses ventos os nossos tormentos\nLevai minha dor\nE quando cessar a tempestade\nE eu vislumbrar um novo amanhã\nExplode em meu peito um brado Eparrei\nOh mãe Iansã\n\nPõe no tacho azeite pra ferver que Oyá\nPõe nele o tempero desse acarajé\nQue é força e coragem pra seguir viagem\nFilhos que tem fé (2x)"
  },
  {
    id: "ia-tr-4", subcategoriaId: "sub-iansa-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "No amanhecer é que essa estrela brilha...",
    letra: "No amanhecer é\nQue essa estrela brilha\nNo amanhecer é\nQue ela me ilumina\nIansã senhora, do amanhecer\nSua espada brilha\nPra nos proteger (2x)\n\nÈ Oyá\nIansã que nos conduz\nÉ Oyá\nIansã com sua luz\nAo rodopiar faz o vento\nQue a chuva trás\nPra lavar a terra\nSemear a paz (2x)\n\nÈ Oyá\nIansã que nos conduz\nÉ Oyá\nIansã com sua luz\nÉ santa guerreira\nSe preciso for\nPra acabar com a guerra\nEspantar a dor\nÉ santa guerreira\nSe preciso for\nPra acabar com a guerra\nSemear o amor"
  },
  {
    id: "ia-cr-1", subcategoriaId: "sub-iansa-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã tem um leque que venta...",
    letra: "Iansã tem um leque que venta\nPra abanar em dia de calor\nIansã mora nas pedreiras\nEu quero vê meu Pai Xangô"
  },
  {
    id: "ia-cr-2", subcategoriaId: "sub-iansa-cruzado", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã Orixá de Umbanda...",
    letra: "Iansã Orixá de Umbanda\nRainha do nosso gongá\nSarava Iansã lá na Aruanda, Eparrei!\nEparrei Iansã venceu demanda\nIansã, saravou pra Xangô\nNo céu, trovão roncou\nE lá nas matas leão bradou\nSarava Iansã\nSarava Xangô"
  },
  {
    id: "ia-cr-3", subcategoriaId: "sub-iansa-cruzado", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eram duas ventarolas...",
    letra: "Eram duas ventarolas\nDuas ventarolas\nQue vinham beirando o mar\nUma era Iansã Eparrei!\nA outra era Iemanjá Odociaba\n\nIansã, Iansã, segura seu arerê o Iansã\nSegura seu arerê o Iansã\nO Iansã, o Iansã\nSegura seu arerê"
  },
  {
    id: "ym-cg-1", subcategoriaId: "sub-yemanja-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Uma Dúzia de rosas...",
    letra: "Uma Dúzia de rosas\nA noite é tão linda\nEu vou para o mar\nEu vou tocando e cantando\nFazer meus pedidos\nÀ deusa do mar (2x)\nMãe Iemanjá\nVenha me ajudar\nMamãe Oxum\nVenha nos saudar\nSou peregrino\nFlores na areia pra deusa do mar (2x)"
  },
  {
    id: "ym-cg-2", subcategoriaId: "sub-yemanja-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Saia do mar, linda sereia...",
    letra: "Saia do mar, linda sereia\nSaia do mar venha brincar na areia\nSaia do mar, sereia bela\nSaia do mar venha brincar com ela"
  },
  {
    id: "ym-cg-3", subcategoriaId: "sub-yemanja-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oh santa de azul...",
    letra: "Oh santa de azul\nOh santa do mar\nVem ver seus filhos\nIemanjá (2x)\nIemanjá\nSaia do mar\nE venha ver\nA sua Iaô (2x)\nOdô, odô, odô odô Odôia"
  },
  {
    id: "ym-cg-4", subcategoriaId: "sub-yemanja-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fui à beira da praia...",
    letra: "Eu fui à beira da praia\nPra ver o balanço do mar\nEu vi o seu rastro na areia\nMe lembrei da sereia\nComecei a chamar (2x)\n\nOh Janaína vem ver\nOh Janaína vem cá\nReceber suas flores\nQue venho lhe ofertar (2x)"
  },
  {
    id: "ym-lo-1", subcategoriaId: "sub-yemanja-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iemanjá, deusa das águas claras...",
    letra: "Iemanjá, deusa das águas claras\nRainha das ondas, sereia do mar\nFlores brancas na areia para lhe ofertar\nÓ mamãe sereia\nUma estrela no céu brilhou\nAs ondas na areia chegou\nLevando as flores pro mar\nO Iemanjá as ondas vieram buscar as flores que eu vou lhe ofertar (2x)\n\nO Iemanjá\nIemanjá Sobá (3x)"
  },
  {
    id: "ym-lo-2", subcategoriaId: "sub-yemanja-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Estou ouvindo o lindo toque do tambor...",
    letra: "Estou ouvindo o lindo toque do tambor\nÉ louvação à Iemanjá com muito amor (2x)\n\nOh iaô Iemanjá\nQue todo amor vem de Oxalá\nOh iaô Iemanjá\nQue toda dor leva pro mar (2x)"
  },
  {
    id: "ym-lo-3", subcategoriaId: "sub-yemanja-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Mãe d'água rainha das ondas...",
    letra: "Mãe d'água rainha das ondas sereias do mar\nMãe d'água seu canto é bonito como ver o mar (2x)\nAuê ó Iemanjá (2x)\nRainha das ondas sereia do mar (2x)\nMas como é lindo o canto de Iemanjá\nFaz até o pescador chorar\nQuem escuta a mãe d'água cantar\nVai com ela pro fundo do mar (2x)"
  },
  {
    id: "ym-lo-4", subcategoriaId: "sub-yemanja-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Brilha o sol, Canta o rouxinol...",
    letra: "Brilha o sol\nCanta o rouxinol\nEu olho o céu no infinito\nAonde o azul é bonito\nEu saravo a Oxalá\nRios, montes e cascatas\nEu olho o verde das matas\nSinto a paz que a natureza traz\n\nLaiá laiá\nE o mar com sua grandeza\nSeu poder sua beleza eu imploro à Iemanjá\n\nÓ mãe d'água rainha sereia do mar\nSegura a banda\nIlumina esse gonga (2x)"
  },
  {
    id: "ym-lo-5", subcategoriaId: "sub-yemanja-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Janaína minha deusa...",
    letra: "Janaína minha deusa\nO seu canto vem do mar\nO meu barco que navega\nLevando flores à odoiá\n\nLindo é ver o céu azul\nNo encontro com as águas do mar\nOxalá nos deu tanta beleza\nDeu Iemanjá à nos guiar (2x)\n\nO no balanço do mar vou navegar\nEu quero!\nQuero encontrar Iemanjá\nEm alto mar sei que ela está\nOferendas vou levar (2x)"
  },
  {
    id: "ym-lo-6", subcategoriaId: "sub-yemanja-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Retira a jangada do mar...",
    letra: "Retira a jangada do mar\nMãe d'água mandou avisar\nQue hoje não pode pescar\nPois hoje tem festa no mar (2x)\n\nE, e, e, e, e, e Iemanjá\nEla é ela é a rainha do mar\nTraz pente, traz espelho o, o, o, o\nPra ela se enfeitar o, o, o, o\nTraz flores, traz perfumes\nEnfeita todo o mar"
  },
  {
    id: "ym-lo-7", subcategoriaId: "sub-yemanja-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vou à praia grande...",
    letra: "Eu vou à praia grande, eu vou pro mar\nLevar botões de rosas à Iemanjá\nEu vou à praia, vou riscar ponto na areia\nVou pedir à Mãe Sereia\nTodas as forças do mar\nQue nos proteja\nCom seu manto inteiro branco\nQue nos cubra com os encantos\nQue tem as ondas do mar (REVISAR)"
  },
  {
    id: "ym-lo-8", subcategoriaId: "sub-yemanja-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu sou filha de Yabá...",
    letra: "Eu sou filha de Yabá\nYabá é minha mãe\nA rainha do tesouro\n\nOh doce Yabá no fundo do mar (3x)"
  },
  {
    id: "ym-lo-9", subcategoriaId: "sub-yemanja-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Mar, misterioso mar...",
    letra: "Mar, misterioso mar\nQue vem do horizonte\nÉ o berço das sereias\nLendário e fascinante\n\nOlha o canto da sereia\nIalaó, oquê, ialoá\nEm noite de lua cheia\nOuço a sereia cantar\nE o luar\nE o luar tão lindo\nEntão se encanta\nCom as doces melodias\nOs madrigais vão despertar\n\nEla mora no mar\nEla brinca na areia\nNo balanço das ondas\nA paz, ela semeia (2x)\nE toda noite ela bailava\nTransformando o mar em flor\nCom o seu filho na morada\nMorada, morada de amor\n\nAguntê, arabô\nCaiala e Sobá\nOloxum, Ynaê\nJanaina é Iemanjá (2x)"
  },
  {
    id: "ym-lo-10", subcategoriaId: "sub-yemanja-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Seu colar é de conchas...",
    letra: "Seu colar é de conchas\nSeu vestido se arrasta na areia\nEla tem cheiro de mar\nEla sabe cantar canto de sereia (2x)\n\nO Janaína, quando estou feliz eu choro\nO Janaína deixa eu dormir no seu colo (2x)\n\nÈ no teu colo que eu afogo a minha sede\nQuis te pescar\nMas caí na tua rede\nFeita de fios e de cabelos emaranhados\nMoro no mar e hoje sou seu namorado (2x)"
  },
  {
    id: "ym-tr-1", subcategoriaId: "sub-yemanja-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava sentado na areia...",
    letra: "Estava sentado na areia\nOuvindo as ondas do mar\nNo céu tinha muitas estrelas\nE a lua estava a brilhar\nSozinho e perdido eu estava\nSem, sem saber me encontrar\nMas de repente uma voz me falou baixinho\nTenha fé em Oxalá (2x)\n\nEra ela\nA Deusa do mar\nQue coisa mais linda\nMamãe Iemanjá\nEra ela\nA Deusa do mar\nEstendendo a suas mãos para nos abençoar (2x)"
  },
  {
    id: "ym-tr-2", subcategoriaId: "sub-yemanja-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fiz um pedido à mamãe Sereia...",
    letra: "Eu fiz um pedido à mamãe Sereia\nA Iemanjá, para nunca mais pecar (2x)\n\nFoi na areia\nFoi numa noite\nNa areia branca do mar\nOh lua branca no céu\nIluminou seu divino mar\n\nSereia\nOh rainha do mar, Sereia. (2x)\n\nFoi na areia (2x)\nFoi numa noite\nNa areia branca do mar"
  },
  {
    id: "ym-tr-3", subcategoriaId: "sub-yemanja-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "O pescador pegou seu veleiro...",
    letra: "O pescador\nPegou seu veleiro e foi\nPescar no reino de Iemanjá (2x)\n\nVeleiro voltou sozinho\nE a sereia\nSereia do mar levou\n\nOh como é belo viver no mar\nNo reino de Iemanjá (2x)"
  },
  {
    id: "ym-tr-4", subcategoriaId: "sub-yemanja-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu escrevi um pedido na areia...",
    letra: "Eu escrevi um pedido na areia\nPedindo a Zambi pra me socorrer\nEu escrevi um pedido na areia\nMas foi mãe d'água\nQuem veio me valer (2x)\n\nE foi nas ondas do mar\nQue entreguei os meus problemas\nE aprendi a confiar\nQue todo mal não dura para sempre\nQue a paz é uma semente\nQue precisa semear\n\nE no horizonte do mar tão infinito\nIemanjá me acolheu\nE me deu um mundo tão mais bonito\nEu abri meu coração\nEla me estendeu a mão\nE entreguei meu caminhar a Iemanjá (2x)"
  },
  {
    id: "ym-cr-1", subcategoriaId: "sub-yemanja-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Vamos saravar mãe Iemanjá...",
    letra: "Vamos saravar mãe Iemanjá\nVamos todos juntos jogar flores no mar\nÉ do mar, é do mar, é do mar\nÉ do mar minha mãe sereia\nÉ do mar, é do mar, é do mar\nÉ do mar, é nas águas, é nas areias\nVamos saravar mãe Iemanjá\nVamos todos juntos jogar flores no mar\nÉ do mar, é do mar, é do mar\nÉ do mar minha sereia\nPapai risca ponto nas pedras\nMamãe risca ponto na areia"
  },
  {
    id: "og-cg-1", subcategoriaId: "sub-ogum-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se meu Pai é Ogum, Ogum...",
    letra: "Se meu Pai é Ogum, Ogum\nVencedor de demanda\nVem de Aruanda\nPra saldar filhos de Umbanda (2x)\nOgum, Ogum, Ogum, Iara\nOgum, Ogum, Ogum, Iara\nSalve a coroa dele\nSalve a Sereia do Mar\nOgum, Ogum Iara\n\nOgum em seu cavalo corre\nE a sua espada reluz\nOgum em seu cavalo corre\nE a sua espada reluz\nOgum, Ogum Megê\nSua bandeira cobre os filhos de Jesus\nOgum iê!"
  },
  {
    id: "og-cg-2", subcategoriaId: "sub-ogum-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Pisa na linha de Umbanda...",
    letra: "Pisa na linha de Umbanda\nQue eu quero ver\nOgum Sete Ondas\nPisa na linha de Umbanda\nQue eu quero ver\nOgum Beira Mar\nPisa na linha de Umbanda\nQue eu quero ver\nOgum Iara, Ogum Megê\nOlha a banda aruê\nOlha pisa no reino o cangira (3x)\nTata de umbanda o cangira"
  },
  {
    id: "og-cg-3", subcategoriaId: "sub-ogum-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu tenho 7 Espadas que me defender...",
    letra: "Eu tenho 7 Espadas que me defender\nEu tenho Ogum em minha companhia (2x)\nOgum é meu Pai\nOgum é meu Guia\nEle vai baixar\nNa fé de Zambi e da Virgem Maria (2x)"
  },
  {
    id: "og-cg-4", subcategoriaId: "sub-ogum-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Que cavaleiro é aquele...",
    letra: "Que cavaleiro é aquele\nQue vem cavalgando pelo céu azul\nÉ seu Ogum Matinata\nÉ defensor\nDo Cruzeiro do Sul (2x)\n\nE, e, e\nE, e, á\nPisa na umbanda o cangira\nPisa no gongar (2x)\n\nOlha que barco bonito\nQue vem navegando a luz do luar\nÉ seu Ogum Sete Ondas\nQue vem ao encontro\nDe Ogum Beira-Mar\n\nE, e, e\nE, e, á\nPisa na umbanda o cangira\nPisa no gongar (2x)"
  },
  {
    id: "og-cg-5", subcategoriaId: "sub-ogum-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum é rei, É rei do cariri...",
    letra: "Ogum é rei\nÉ rei do cariri (2x)\n\nQue mal eu fiz a meu pai\nQue Ogum não vem aqui (2x)"
  },
  {
    id: "og-cg-6", subcategoriaId: "sub-ogum-chegada", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "É, seu Beira Mar...",
    letra: "É, seu Beira Mar\nÉ, seu Beira Mar\nÉ ordenança de São Jorge na Umbanda\nEle é Ogum\nÉ seu Beira Mar (2x)\n\nTravou batalhas pelo imenso mar azul\nOxalá lhe convocou\nPor ordem de Olorum\nPara na Terra empunhar sua bandeira\nDe um guerreiro da falange de Ogum\n\nÉ Beira Mar\n\nÉ, seu Beira Mar\nÉ, seu Beira Mar\nÉ ordenança de São Jorge na Umbanda\nEle é Ogum\nÉ seu Beira Mar (2x)\n\nHoje vira no terreiro\nRecebendo os Orixás\nEnsinando a cada irmão\nA missão que irá prestar\nÉ guardião\nDe uma casa de caridade\nQue propaga pelo mundo\nA paz, o amor e a humildade"
  },
  {
    id: "og-lo-1", subcategoriaId: "sub-ogum-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Filho de Pemba bebe água no rochedo...",
    letra: "Filho de Pemba bebe água no rochedo\nFilho de Ogum corre campo e não tem medo (2x)\nVou pedir ao criador\nQue derrame o seu amor\nAos nossos guias\nE ao nosso Babalaô"
  },
  {
    id: "og-lo-2", subcategoriaId: "sub-ogum-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Salve Ogum Megê, Ogum Rompe Mato...",
    letra: "Salve Ogum Megê\nOgum Rompe Mato\nOgum Beira Mar (2x)\nEle trabalha na areia meu Pai\nEle trabalha no mar (auê)\nEle trabalha na areia meu Pai\nEle trabalha no mar"
  },
  {
    id: "og-lo-3", subcategoriaId: "sub-ogum-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "A sua espada brilha no raiar do dia...",
    letra: "A sua espada brilha no raiar do dia\nSeu Beira Mar é filho da virgem Maria\nSeu Beira Mar, beira na areia\nSeu Beira Mar é filho da virgem Maria"
  },
  {
    id: "og-lo-4", subcategoriaId: "sub-ogum-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu não seria nada, Se não fosse Ogum...",
    letra: "Eu não seria nada\nSe não fosse Ogum\nPara abrir a minha estrada (2x)\nValente guerreiro aqui chegou\nVencedor de demanda meu protetor\nEm sua trajetória meu pai luta contra o mal\nFoi nos campos de batalha que se tornou general\n\nEu não seria nada\nSe não fosse Ogum\nPara abrir a minha estrada (2x)\n\nSalve Ogum de Ronda\nSalve seu Ogum Megê\nSaravá Beira Mar\nOgum Iara, Ogum de Lei\nSalve toda a falange\nDo glorioso guerreiro\nMeu pai vence demanda\nAqui dentro do terreiro"
  },
  {
    id: "og-lo-5", subcategoriaId: "sub-ogum-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele é cavaleiro santo...",
    letra: "Ele é cavaleiro santo\nSeu cavalo é branco\nEle é general\n\nÉ forte\nUsa armadura\nEle é valente\nLuta contra o mal\n\nA sua espada é reluzente\nPra defender a gente\nNão deixar cair\n\nEle é nosso pai Ogum\nEle é Jeci Jeci\nEle é Patacori\n\nEle é Jeci Jeci\nEle é Patacori (2x)"
  },
  {
    id: "og-lo-6", subcategoriaId: "sub-ogum-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Mandei fazer um capacete de penas...",
    letra: "Mandei fazer\nUm capacete de penas\nPara usar antes da alvorada (2x)\nVermelho e branco verde e azul\nEsse capacete tem as cores de Ogum (2x)\nDe Ogum Naruê de Ogum Matinata\nDe Ogum Naruê de Ogum Matinata\nQuando uso o capacete ouço o toque da alvorada (2x)"
  },
  {
    id: "og-lo-7", subcategoriaId: "sub-ogum-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Quem me dera Ogum, Para ser meu guia...",
    letra: "Quem me dera Ogum\nPara ser meu guia (2x)\nEle é praça de cavalaria\nÉ ordenança da virgem Maria"
  },
  {
    id: "og-lo-8", subcategoriaId: "sub-ogum-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi, eu vi seu Rompe Mato no mar...",
    letra: "Eu vi, eu vi seu Rompe Mato no mar\nEu vi, eu vi com seu Ogum Beira Mar (2x)\nSalve as crianças na praia\nSalve a sereia no mar\nSarava seu Beira Mar\nEle é chefe de gongar (2x)\nSarava, Ogum, ogum, ogum e a coroa de rei (2x)\nSeu Ogum gira na cangira de umbanda\nSeu Ogum gira na cangira de Oxalá (2x)\nSarava, sarava, sarava"
  },
  {
    id: "og-lo-9", subcategoriaId: "sub-ogum-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "A Umbanda clareou...",
    letra: "A Umbanda clareou\nA Umbanda clareou\nClareou, clareou\nEsse grande Orixá\nClareou, clareou\nSobre a luz da lua cheia\nLá do alto da pedreira\nOlhando a cachoeira\n\nQuem é o cavaleiro\nQuem é o cavaleiro\nQue veio a cavalgar\nMontado em seu cavalo branco\nCom sua espada empunhar\n\nÉ Ogum, meu pai\nOgunhê, meu pai\nCavaleiro de Oxalá\nCom sua espada suprema\nEle é o senhor dos caminhos\nEle é o rei do Humaitá!\n\nSaravá pai Ogum\nOgunhê, Ogunhê\nEle é o tata, ele é o tata\nEle é o tata no arerê\nSaravá pai Ogum\nOgunhê, Ogunhê\nEle é o tata, ele é o tata\nEle é o tata no arerê"
  },
  {
    id: "og-lo-10", subcategoriaId: "sub-ogum-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu sou filha de Naruê...",
    letra: "Eu sou filha de Naruê\nArmada com as espadas de Megê\nUngida pelas mãos de Matinata\nRegida pelas leis de Ogum de Lei\nMeu protetor é Beira Mar\nIara no caminho a me guiar\nCoragem quem me deu foi Rompe-Mato\nOgum me ensinou o que é amar\n\nOgum, meu pai, vem me valer\nNa fé de Zambi, nada vou temer\nOgum, meu pai, vem me guiar\nNa minha estrada caminhar (2x)"
  },
  {
    id: "og-tr-1", subcategoriaId: "sub-ogum-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Nesta casa de guerreiro (Ogum)...",
    letra: "Nesta casa de guerreiro (Ogum)\nVim de longe pra rezar (Ogum)\nRogo a Deus pelos doentes (Ogum)\nNa fé de Obatalá (Ogum)\nOgum salve a Casa Santa (Ogum)\nOs presentes e os ausentes (Ogum)\nSalve nossas esperanças (Ogum)\nSalve os velhos e crianças (Ogum)\nNego veio e ensinou (Ogum)\nNa cartilha de Aruanda (Ogum)\nE Ogum não esqueceu (Ogum)\nComo vencer a demanda (Ogum)\nA tristeza foi embora (Ogum)\nNa espada de um guerreiro (Ogum)\nE a luz no romper da aurora (Ogum)\nVai brilhar neste terreiro (Ogum)"
  },
  {
    id: "og-tr-2", subcategoriaId: "sub-ogum-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum já venceu...",
    letra: "Ogum já venceu\nJá venceu, já venceu\nOgum vem de Aruanda\nE quem lhe manda é Deus (2x)\nEle vem beirando o rio\nEle vem beirando o mar\nSalve Santo Antônio da Calunga\nBenedito e Beira Mar (2x)\n\nPor entre matas\nPor entre mares e terra\nEu entendi o que meu Pai quis dizer (2x)\nQue Ogum não devia beber\nQue Ogum não devia fumar\nMais a fumaça são as nuvens que passam\nE a cerveja as ondas do mar (2x)"
  },
  {
    id: "og-tr-3", subcategoriaId: "sub-ogum-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Quem Beira Rio, Beira Rio...",
    letra: "Quem Beira Rio, Beira Rio\nBeira Mar\nO que se ganha de Ogum\nSó Ogum pode tirar (2x)\n\nSeu Ogum de Ronda\nÉ quem vem girar\nE vem trazendo folhas\nPra descarregar (2x)"
  },
  {
    id: "og-tr-4", subcategoriaId: "sub-ogum-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxalá está chamando Ogum lá no Humaitá...",
    letra: "Oxalá está chamando\nOgum lá no Humaitá\nPra lhe dar uma bandeira\nE mandar ele jurar (2x)\nSe ele é capitão\nEle vai jurar!\nE se for de Angola também vai jurar\nE se for Ogum de Lei – ele vai jurar\nE se for de Nagô – também vai jurar"
  },
  {
    id: "og-tr-5", subcategoriaId: "sub-ogum-trabalho", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Na porta da Romaria...",
    letra: "Na porta da Romaria\nEu vi um cavaleiro de ronda (2x)\nTrazia um escudo no braço\nE uma lança na mão\nOgum guerreiro venceu e matou o dragão (2x)"
  },
  {
    id: "og-tr-6", subcategoriaId: "sub-ogum-trabalho", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum de Lei, Não me deixe sofrer...",
    letra: "Ogum de Lei\nNão me deixe sofrer\nTanto assim (2x)\nQuando eu morrer\nVou passar lá na Aruanda\nSarava Ogum\nSarava seu Sete Ondas"
  },
  {
    id: "og-tr-7", subcategoriaId: "sub-ogum-trabalho", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Bandeira linda de Ogum...",
    letra: "Bandeira linda de Ogum\nQue está içada lá no Humaitá (2x)\nRepresentando general de Umbanda\nPai Ogum venceu demanda lá nos campos do Humaitá (2x)"
  },
  {
    id: "og-tr-8", subcategoriaId: "sub-ogum-trabalho", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum partiu pra guerra...",
    letra: "Ogum partiu pra guerra\nOgum tocou clarim (2x)\nDo seu exército todo\nEle é comandante sim\n\nSão dois irmãos\nNa madrugada\nSeu Ogum Iara seu Ogum Matinata (2x)"
  },
  {
    id: "og-tr-9", subcategoriaId: "sub-ogum-trabalho", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "General, general, meu general...",
    letra: "General, general, meu general\nGeneral, general do mar\nGeneral, general, meu general\nGeneral capitão do mar\n\nAuê, Auê\nAuê capitão Guanabara auê (2x)"
  },
  {
    id: "og-tr-10", subcategoriaId: "sub-ogum-trabalho", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum guerreiro de umbanda...",
    letra: "Ogum guerreiro de umbanda\nSeu ponto veio firmar (2x)\nEle pede ao Sol e a Lua\nO Paranga, para clarear (2x)\nA coroa de ouro é mariwô (2x)\nOgum é tatá, é tatá\nA coroa de ouro é mariwô (2x)"
  },
  {
    id: "og-tr-11", subcategoriaId: "sub-ogum-trabalho", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum, meu guerreiro de umbanda...",
    letra: "Ogum, meu guerreiro de umbanda\nCavaleiro supremo é vencedor de demandas\nÉ sentinela de pai Oxalá\nÉ remador, de Iemanjá\n\nSenhor da lua, ilumina meus caminhos\nToma conta da minha vida\nE me livre dos perigos (2x)"
  },
  {
    id: "og-cr-1", subcategoriaId: "sub-ogum-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi assobiou...",
    letra: "Oxossi assobiou\nPra passar no Humaitá\nOxossi assobiou\nPra passar no Humaitá\nPra falar com Ogum Megê\nMensageiro de Oxalá\nPra falar com Ogum Megê\nMensageiro de Oxalá"
  },
  {
    id: "og-cr-2", subcategoriaId: "sub-ogum-cruzado", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Auê, auê, Ogum Beira Mar auê...",
    letra: "Auê, auê, Ogum Beira Mar auê\nAuê, auê, Ogum Beira Mar auê\nIansã virou o tempo\nPra Oxum não governar\nMas durante o barra-vento\nOxum se pôs a cantar\nAuê, auê, Ogum Beira Mar auê\nAuê, auê, Ogum Beira Mar auê"
  },
  {
    id: "og-cr-3", subcategoriaId: "sub-ogum-cruzado", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Iemanjá cadê Ogum...",
    letra: "Iemanjá cadê Ogum\nFoi com Oxossi ao Rio Jordão\nForam saudar São João Batista\nE batizar Cosme e Damião\n\nSeu cavalo corre\nSua espada reluz\nSua bandeira cobre\nTodos os filhos de Jesus (2x)\n\nSeu cavalo corre\nSua espada reluz\nAuê, seu Ogum Iara\nAos pés da Santa Cruz"
  },
  {
    id: "ox-cg-1", subcategoriaId: "sub-oxum-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se minha mãe é Oxum...",
    letra: "Se minha mãe é Oxum\nÉ na Umbanda e no Candomblé (2x)\n\nOra Yeyeo, Yeyeo, minha mãe\nYeyeo, minha mãe Oxumaré (2x)\n\nQuando ela vem beirando o rio\nColhendo lírios pra nos ofertar\nMamãe Oxum ora Yeyeo\nMamãe Oxum\nOrixá desça e vem nos abençoar"
  },
  {
    id: "ox-cg-2", subcategoriaId: "sub-oxum-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Sobre o clarão da lua...",
    letra: "Sobre o clarão da lua\nAs águas da cascata\nParecem de prata (2x)\n\nÉ um lindo véu\nQue vem da fonte da Oxum\nQue vem do céu (2x)\n\nYeyeo mamãe Oxum\nDona do ouro\nYeyeo Oxumaré\nÉs meu tesouro (2x)"
  },
  {
    id: "ox-cg-3", subcategoriaId: "sub-oxum-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fui ao cantuá pagar promessa...",
    letra: "Eu fui ao cantuá pagar promessa\nLevei ouro maior, um adê pra Yeyeo (2x)\nChora Yeyeo\nA minha fé é verdadeira eu peço vem abençoar (2x)\n\nOh meu Deus como é lindo\nO céu se abre e mãe Oxum vem surgindo\nUouou\nÓh meu Deus como é lindo\nO céu se abre e mãe Oxum vem surgindo"
  },
  {
    id: "ox-cg-4", subcategoriaId: "sub-oxum-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Meu Deus, Mas que luz é aquela...",
    letra: "Meu Deus, Mas que luz é aquela,\nQue vem, lá do alto das pedreiras (2x)\n\nÉ a estrela de mamãe Oxum,\nIluminando todas as cachoeiras."
  },
  {
    id: "ox-lo-1", subcategoriaId: "sub-oxum-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi mamãe Oxum na cachoeira...",
    letra: "Eu vi mamãe Oxum na cachoeira\nSentada na beira do rio (2x)\n\nColhendo lírios, lírios ê\nColhendo lírios, lírios á\nColhendo lírios pra enfeitar nosso gonga (2x)"
  },
  {
    id: "ox-lo-2", subcategoriaId: "sub-oxum-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi na beira do rio aonde Oxum chorou...",
    letra: "Foi na beira do rio aonde Oxum chorou (2x)\nChora Yeyeo, choram os filhos seus"
  },
  {
    id: "ox-lo-3", subcategoriaId: "sub-oxum-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Caminhando pela mata...",
    letra: "Caminhando pela mata\nRefletida na cascata\nVi uma flor se mirar (2x)\n\nEra de grande beleza\nPossuía tal pureza\nPerfumava todo ar\n\nFoi nesse exato momento\nQue como um sonho eu contemplo\nA Oxum a se banhar\nE só então eu percebi\nQue a linda flor que vi\nEra a deusa do Ijexá\n\nYeyeo\nYeyeo\nFoi na água da cascata\nQue a Oxum apareceu (2x)"
  },
  {
    id: "ox-lo-4", subcategoriaId: "sub-oxum-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Nuvem de poeira d'água...",
    letra: "Nuvem de poeira d'água\nQue sai da cascata da deusa Oxum (2x)\nBeleza pura, linda e cristalina\nEssa deusa menina com o perfume da flor\nEncanto doce da natureza, inspira riqueza, vaidade e amor\nÔôô\n\nNuvem de poeira d'água\nQue sai da cascata da deusa Oxum (2x)\nQuando se banha na beira do rio\nO Sol irradia energia e calor\nDona do ouro, deusa poderosa, pedra preciosa cheia de esplendor\nÔôô"
  },
  {
    id: "ox-lo-5", subcategoriaId: "sub-oxum-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxum panda, Oxum docô...",
    letra: "Oxum panda\nOxum docô\nE olha eu\nOlha Oxumaré ô (4x)\n\nE olha eu, e olha eu\nOlha Oxumaré ô (2x)"
  },
  {
    id: "ox-lo-6", subcategoriaId: "sub-oxum-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi mamãe Oxum chorando...",
    letra: "Eu vi mamãe Oxum chorando\nEntão eu perguntei porque (2x)\n\nEla me respondeu\nEstou chorando é por causa de você\nEla me respondeu\nSem os meus filhos eu não poderei viver\n\nEstou chorando é por causa de você\nSem os meus filhos eu não poderei viver (2x)"
  },
  {
    id: "ox-lo-7", subcategoriaId: "sub-oxum-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Deusa das cachoeiras e cascatas...",
    letra: "Deusa das cachoeiras e cascatas\nCompanheira de Oxóssi o dono das matas\nE também a rainha de meu pai Xangô\nEterna\nCom o seu abebê\nQuando dança é faceira\nÉs a dona do ouro óh mãe verdadeira\nSob a lua de prata\nDe joelhos eu vou implorar\nTeu manto\nÉ o meu acalanto na hora da dor\nE na minha tristeza meu pranto enxugou\nOra Yeyeo mãe Oxum\nRainha do Ijexá\nSeu canto irradia alegria traz a paz traz harmonia\nEm suas águas eu a vejo se banhar\nOxum como é lindo vê-la bailar\n\nVou pedir na cachoeira ora Yeyeo nunca me deixe sozinha\nEu sou filho seu\nNa sua mina tem ouro seu tesouro tem poder\nToda vez que eu precisar mamãe Oxum vai me valer (2x)"
  },
  {
    id: "ox-lo-8", subcategoriaId: "sub-oxum-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Fonte de luz, No meio das matas...",
    letra: "Fonte de luz\nNo meio das matas\nCascata de oração\nEm ti a minha vida começou\nYeyeo, Yeyeo, yeyeo, yeyeo\nOs meus olhos\nRefletem o seu brilho\nSeus rios\nAbraçam os seus filhos\nSeu canto\nSuaviza toda dor\nYeyeo, Yeyeo, yeyeo, yeyeo\nMamãe Oxum de todas as águas\nDas flores a mais perfumada\nInunda a minha alma com amor\nYeyeo, Yeyeo, yeyeo, yeyeo"
  },
  {
    id: "ox-lo-9", subcategoriaId: "sub-oxum-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Gorjeia a passarada...",
    letra: "Gorjeia\nA passarada num lindo céu azul\nPra saudar o reino encantado de Oxum\nOxum Yapondá\nPor que meu Deus\nQue nesse seu mundo eu não posso entrar? (Oxum)\nSó pra ver como é lindo o amanhecer\n\nNatureza sorrindo\nPrimavera florindo (2x)\n\nSe meu é de amor ôôô\nSe meu mundo é de paz\nPaz e amor\nGuardado\nGuardado, pelo manto sagrado de Yapondá (Oxum)\nQue vem lá, lá do seu mundo abençoar\n\nAcaba a guerra enfim\nTira o ódio e põe o amor (2x)\nQue o mundo possa ser\nSempre um jardim de flor (2x)\n\nLaiá, laiá, lalaiá ô, ô, ô, ô, ô, ô\nLaiá, laiá, lalaiá, ô, ô, ô, ô, ô, ô\nQue o mundo possa ser\nSempre um jardim de flor (2x)"
  },
  {
    id: "ox-lo-10", subcategoriaId: "sub-oxum-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Minha mãe é uma flor...",
    letra: "Minha mãe é uma flor\nNo jardim do senhor\nEla é uma rosa\nUma rosa em botão (2x)\n\nEla é toda beleza\nEla é toda de azul\nEla é um amor\nMas ela é Senhora da Conceição (2x)"
  },
  {
    id: "ox-tr-1", subcategoriaId: "sub-oxum-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Brilhou a estrela matutina...",
    letra: "Brilhou a estrela matutina\nRolaram pedras de Xangô\nQuem será essa menina\nQue a lua iluminou\nCanta no clarão da lua\nDança no calor do sol\nTodo ouro se ilumina\nPra saudar Oxum Menina\nPois Oxum é Mãe Maior\n\nSaravá, Oxum Menina!\nOxum é Mãe Maior\nYeyeo\nÔ,ô,ô,ô,ô,ô,ô,ô,ô,ô,ô\n\nOxum Yeyeo, Oxum yeyeo (2x)\n\nYeyeo Oxum,\nOxum Yeyeo (2x)"
  },
  {
    id: "ox-tr-2", subcategoriaId: "sub-oxum-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Se um dia eu fui feliz...",
    letra: "Se um dia eu fui feliz\nFoi Oxum, foi Oxum\nQuem quis (2x)\n\nNa beira do mar, cadê?\nÁgua doce do meu amor\nÁgua que me faz viver\nBeija o mar\n\nQuando você me tocou\nDominou meu ser (2x)\n\nLevou meu amor\nNão quis devolver (2x)\n\nManda chamar\nManda chamar yeyeo, manda chamar\nManda chamar yeyeo, manda chamar (2x)\n\nQuem ama, se encanta\nBebe o abô, como bebe o mel da cana (2x)\nDona Oxum Apará\nÉ quem anda na beira do mar\nDona Oxum Apará\nÁgua rara de se encontrar (2x)"
  },
  {
    id: "ox-tr-3", subcategoriaId: "sub-oxum-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Mamãe Oxum tem proteção de Zambi...",
    letra: "Mamãe Oxum\nTem proteção de Zambi\nOlha seus filhos\nCom olhar sereno\nEla é beleza, ela é pureza\nEla nos traz a proteção\nDe Nazareno (2x)"
  },
  {
    id: "nn-cg-1", subcategoriaId: "sub-nana-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Atraca-atraca que aí vem Nanã...",
    letra: "Atraca-atraca que aí vem Nanã\nSereia (2x)\n\nÉ Nanã, É Oxum\nÉ Oxum, É Nanã,\nÉ Sereia,\nÉ Nanã, É Oxum\nÉ Oxum É Nanã,\nÉ Sereia do mar"
  },
  {
    id: "nn-cg-2", subcategoriaId: "sub-nana-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "O mar estava bem calmo naquela manhã...",
    letra: "O mar estava bem calmo naquela manhã\nEu implorei à Oxalá\nQue me dissesse o que eu queria saber\nSobre os encantos de Nanã Buruquê\nUm Raio de Luz veio anunciar\nA chegada da Cinda mais velha, senhora Santana de Pai Oxalá (2x)\n\nA saluba vovó\nMe leva pras ondas do mar senhora Santana, Nanã Buruquê\nMe leva pras ondas do mar senhora Santana venha me valer (2x)"
  },
  {
    id: "nn-lo-1", subcategoriaId: "sub-nana-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã, Nanã, É Nanã Buruquê...",
    letra: "Nanã, Nanã\nÉ Nanã Buruquê (2x)\nA sua saia é Roxa\nA sua casa é de sapê (2x)"
  },
  {
    id: "nn-lo-2", subcategoriaId: "sub-nana-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Fui chamado de cordeiro...",
    letra: "Fui chamado de cordeiro,\nMas não sou cordeiro não\nPrefiro ficar calado\nÀ falar sem ter razão\nO meu lamento\nÉ uma singela oração\nMinha santa de fé\nMeu cantar é uma prece\nQue eu faço à Nanã ê\n\nSou de Nanã eua, eua, eua ê (2x)"
  },
  {
    id: "nn-lo-3", subcategoriaId: "sub-nana-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Deusa das águas salobras...",
    letra: "Deusa das águas salobras\nA ti sempre louvarei\nNas horas da aflição\nSei que vai me socorrer\nSe as mazelas me atingirem\nSei que há de me curar\nSe houver espinhos em meus caminhos\nSei que há me livrar\n\nÊ, ê, ê\nSaluba ê,\nA mais velhas Yabá\nMãe de Obaluaê (2x)\n\nVovó governe a minha vida\nVovó venha me valer\nÓ minha santa tão querida\nTe louvo Nanã Buruquê\n\nÊ, ê, ê\nSaluba ê,\nA mais velhas Yabá\nMãe de Obaluaê (2x)"
  },
  {
    id: "nn-lo-4", subcategoriaId: "sub-nana-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Salve Nanã, Salve senhora das águas...",
    letra: "Salve Nanã, Salve senhora das águas\nSalve Nanã, Salve senhora Santana\nSalva Nanã com sua força e bondade\nSalve Nanã Capurucaia na umbanda."
  },
  {
    id: "nn-lo-5", subcategoriaId: "sub-nana-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã É orixá de umbanda...",
    letra: "Nanã É orixá de umbanda\nNanã é mãe de nossa senhora\n\nVamos saravar Nanã, Nanã\nPois ela vai valei-me agora (2x)"
  },
  {
    id: "nn-lo-6", subcategoriaId: "sub-nana-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "É na mesa de umbanda que eu vi Nanã...",
    letra: "É na mesa de umbanda que eu vi Nanã\nEu vi Nanã (2x)\nAuê, auê\nEu vi Nanã (2x)"
  },
  {
    id: "nn-lo-7", subcategoriaId: "sub-nana-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "São flores, Nanã, são flores...",
    letra: "São flores, Nanã, são flores\nSão flores, Nanã Buruquê\nSão flores, Nanã, são flores,\nDo seu filho Obaluaê"
  },
  {
    id: "nn-tr-1", subcategoriaId: "sub-nana-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "É Nanã, É Nanã auê...",
    letra: "É Nanã, É Nanã auê,\nÉ Nanã,\nÉ Nanã Buruquê (2x)\nAo rodar da sua saia\nManda forças pra nossa banda\nOs filhos que tanto lhe pedem\nNanã corta toda mironga\nNa barra da sua saia\nCarrega filhos de Umbanda\nCom suas águas sagradas\nDescarrega a nossa banda"
  },
  {
    id: "nn-tr-2", subcategoriaId: "sub-nana-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã é Nanã buruquê...",
    letra: "Nanã é Nanã buruquê (2x)\nÉ o orixá mais velho do céu\nNanã é Nanã buruquê\nOlha seus filhos agora que eu quero ver (2x)"
  },
  {
    id: "nn-tr-3", subcategoriaId: "sub-nana-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Senhora Santana, Quando andou no mundo...",
    letra: "Senhora Santana\nQuando andou no mundo (2x)\nEla cruzou a terra\nE abençoou o mundo (2x)"
  },
  {
    id: "nn-tr-4", subcategoriaId: "sub-nana-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Me lava Nanã, me lava...",
    letra: "Me lava Nanã, me lava\nCom suas águas Nanã sagradas\nLave meus olhos para que eu possa ver\nA luz divina dos meus guias a me proteger\nLave meus ouvidos para que eu possa ouvir\nOs ensinamentos de bons caminhos a seguir\nLave minha boca para que eu possa dizer\nMensagens de amor a quem precisa receber\n\nLave Nanã o meu coração\nEncha ele de alegria e retire a aflição\nÔ Nanã Buruquê\nAs suas águas me dão forças pra vencer\nÔ Nanã Buruquê\nQuero em suas águas uma bênção receber"
  },
  {
    id: "beijada-1", subcategoriaId: "sub-beijada-pontos", ordem: 0, favorito: false, criadoEm: 1775829769157,
    titulo: "Antes de o sol nascer...",
    letra: "Antes de o sol nascer\nA lua se esconder\nMadrugada chegar (2x)\nA lua clareia a praia, ela é prateada\nE vê como clareia a beira mar\nEu vi\n\nEu vi as crianças brincando no banco de areia oh\nEram os 7 filhos de Iemanjá (2x)"
  },
  {
    id: "beijada-2", subcategoriaId: "sub-beijada-pontos", ordem: 1, favorito: false, criadoEm: 1775829769157,
    titulo: "Doun hoje é o seu dia...",
    letra: "Doun hoje é o seu dia, hoje tem alegria em todo terreiro\nDoun oh Doun\nSarava Zambi na linha de umbanda em todo terreiro (2x)"
  },
  {
    id: "beijada-3", subcategoriaId: "sub-beijada-pontos", ordem: 2, favorito: false, criadoEm: 1775829769157,
    titulo: "Mas quem é seu irmão...",
    letra: "Mas quem é seu irmão\nQuem é seu irmão\nQuem é seu irmão\nÉ Cosme Damião\nÉ Cosme Damião (2x)"
  },
  {
    id: "beijada-4", subcategoriaId: "sub-beijada-pontos", ordem: 3, favorito: false, criadoEm: 1775829769157,
    titulo: "Ele foi doutor...",
    letra: "Ele foi doutor\nEle foi doutor\nEle me curou\nNuma brincadeira que ele brincou\nEle me curou (2x)"
  },
  {
    id: "beijada-5", subcategoriaId: "sub-beijada-pontos", ordem: 4, favorito: false, criadoEm: 1775829769157,
    titulo: "Eram três crianças...",
    letra: "Eram três crianças\nEu me lembro bem\nO terreiro em festa\nEu me lembro bem\nVieram de um a um\nE era Cosme Damião e Doun (2x)"
  },
  {
    id: "beijada-6", subcategoriaId: "sub-beijada-pontos", ordem: 5, favorito: false, criadoEm: 1775829769157,
    titulo: "Eu vou chamar o meu pai...",
    letra: "Eu vou chamar o meu pai (2x)\nPra ele ver quem chegou (2x)\nE chegou para brincar (2x)\nCom as crianças também (2x)"
  },
  {
    id: "beijada-7", subcategoriaId: "sub-beijada-pontos", ordem: 6, favorito: false, criadoEm: 1775829769157,
    titulo: "Andorinha que voa no ar...",
    letra: "Andorinha que voa no ar\nChega pertinho do céu\nAvisa Papai Oxalá\nQue hoje é dia das crianças\n\nNós vamos brincar com as crianças\nCosme Damião e Doun (2x)"
  },
  {
    id: "beijada-8", subcategoriaId: "sub-beijada-pontos", ordem: 7, favorito: false, criadoEm: 1775829769157,
    titulo: "Pra que cocada branca...",
    letra: "Pra que cocada branca\nPra chorar, pra chorar (2x)\nSe não tiver guaraná\nEu vou chorar eu vou chorar (2x)"
  },
  {
    id: "beijada-9", subcategoriaId: "sub-beijada-pontos", ordem: 8, favorito: false, criadoEm: 1775829769157,
    titulo: "Papai me solta um balão...",
    letra: "Papai me solta um balão\npara todas as crianças que vem lá do céu (2x)\nTem doce mamãe, tem doce mamãe\nTem doce, lá no jardim (2x)"
  },
  {
    id: "beijada-10", subcategoriaId: "sub-beijada-pontos", ordem: 9, favorito: false, criadoEm: 1775829769157,
    titulo: "Cosme e Damião, Damião...",
    letra: "Cosme e Damião, Damião\nCadê Doum\nDoum ta passeando\nNo cavalo de Ogum"
  },
  {
    id: "beijada-11", subcategoriaId: "sub-beijada-pontos", ordem: 10, favorito: false, criadoEm: 1775829769157,
    titulo: "Ele é pequenininho...",
    letra: "Ele é pequenininho\nMora no fundo do mar\nSua madrinha é sereia\nSeu padrinho é beira mar (2x)\n\nNo fundo do mar, tem areia (2x)\nSeu padrinho é beira mar\nSua madrinha é sereia"
  },
  {
    id: "beijada-12", subcategoriaId: "sub-beijada-pontos", ordem: 11, favorito: false, criadoEm: 1775829769157,
    titulo: "Quando a lua brilha no céu...",
    letra: "Quando a lua brilha no céu\nClareia Umbanda (2x)\nClareia a Beijada\nQue vem\nLá de Aruanda (2x)"
  },
  {
    id: "beijada-13", subcategoriaId: "sub-beijada-pontos", ordem: 12, favorito: false, criadoEm: 1775829769157,
    titulo: "Tem bala de coco e peteca...",
    letra: "Tem bala de coco e peteca\nDeixa a Beijada brincar (2x)\nHoje é dia de festa\nBeijada vem sarava"
  },
  {
    id: "beijada-14", subcategoriaId: "sub-beijada-pontos", ordem: 13, favorito: false, criadoEm: 1775829769157,
    titulo: "Tem paciência, Dois Dois...",
    letra: "Tem paciência, Dois Dois\nEu to camisa azul\nE para o ano que vem\nDois Dois come caruru"
  },
  {
    id: "beijada-15", subcategoriaId: "sub-beijada-pontos", ordem: 14, favorito: false, criadoEm: 1775829769157,
    titulo: "Lá no céu tem três estrelas...",
    letra: "Lá no céu tem, três estrelas\nTodas as três em carreirinha (2x)\nUma é Cosme e Damião\nA outra é Mariazinha (2x)"
  },
  {
    id: "beijada-16", subcategoriaId: "sub-beijada-pontos", ordem: 15, favorito: false, criadoEm: 1775829769157,
    titulo: "Na Bahia tem um coco...",
    letra: "Na Bahia tem um coco\nCoco que faz a cocada (2x)\nCoco que faz o manjar\nPara dar para Beijada (2x)"
  },
  {
    id: "beijada-17", subcategoriaId: "sub-beijada-pontos", ordem: 16, favorito: false, criadoEm: 1775829769157,
    titulo: "Doum, Doum, Doum...",
    letra: "Doum, Doum, Doum, Doum, Cosme e Damião\nDoum, Doum, Doum, brinca sentado no chão (2x)"
  },
  {
    id: "beijada-18", subcategoriaId: "sub-beijada-pontos", ordem: 17, favorito: false, criadoEm: 1775829769157,
    titulo: "Fui no jardim colher as rosas...",
    letra: "Fui no jardim, colher as rosas\nA vovozinha deu-me a rosa mais formosa (2x)"
  },
  {
    id: "beijada-19", subcategoriaId: "sub-beijada-pontos", ordem: 18, favorito: false, criadoEm: 1775829769157,
    titulo: "Cosme e Damião ó Doum...",
    letra: "Cosme e Damião ó Doum\nCrispim, Crispiniano\nSão os filhos de Ogum (2x)"
  },
  {
    id: "beijada-20", subcategoriaId: "sub-beijada-pontos", ordem: 19, favorito: false, criadoEm: 1775829769157,
    titulo: "Filho de fé estava doente...",
    letra: "Filho de fé estava doente\nFilhos de fé estava chorando (2x)\nFilhos de fé viu Ibeijada\nFilhos de fé já está cantando"
  },
  {
    id: "beijada-21", subcategoriaId: "sub-beijada-pontos", ordem: 20, favorito: false, criadoEm: 1775829769157,
    titulo: "Que lindo cavalo branco...",
    letra: "Que lindo cavalo branco\nQue aquele menino vem montando\nDescendo naquela serra\nDizendo que é filho de soldado\n\nÉ Damião, é Damião\nÉ Damião no lindo cavalo de Ogum (2x)"
  },
  {
    id: "beijada-22", subcategoriaId: "sub-beijada-pontos", ordem: 21, favorito: false, criadoEm: 1775829769157,
    titulo: "Bahia é terra de dois...",
    letra: "Bahia é terra de dois\nÉ terra de dois irmãos\nGovernador da Bahia\nÉ São Cosme e São Damião (2x)"
  },
  {
    id: "omulu-1", subcategoriaId: "sub-omulu-pontos", ordem: 0, favorito: false, criadoEm: 1775839257000,
    titulo: "Meu pai Oxalá é o rei...",
    letra: "Meu pai Oxalá\nÉ o rei venha me valer (2x)\nO mestre Omulu Atoto Obaluaê (2x)\n\nAtoto Obaluaê, Atoto Baba\nAtoto Obaluaê, Atoto é Orixá (2x)"
  },
  {
    id: "omulu-2", subcategoriaId: "sub-omulu-pontos", ordem: 1, favorito: false, criadoEm: 1775839257000,
    titulo: "Oh! Como é belo este jardim...",
    letra: "Oh! Como é belo este jardim\nCom lindas flores enfeitadas em buquê (2x)\nOfertadas de todo coração\nAo mestre Obaluaê (2x)\n\nAs flores do meu velho\nAtôtô meu pai\nSão lindas e cheirosas\nAtôtô meu pai\nAs flores do meu velho\nAtôtô meu pai\nTambém são milagrosas"
  },
  {
    id: "omulu-3", subcategoriaId: "sub-omulu-pontos", ordem: 2, favorito: false, criadoEm: 1775839257000,
    titulo: "Que orixá é esse...",
    letra: "Que orixá é esse\nTodo coberto de palha (2x)\nÉ o seu Omulu meu senhor\nO rei da magia (2x)\n\nSeu Omulu\nSou o seu filho fé (2x)\nVim trazer flores brancas senhor\nPra receber seu axé (2x)"
  },
  {
    id: "omulu-4", subcategoriaId: "sub-omulu-pontos", ordem: 3, favorito: false, criadoEm: 1775839257000,
    titulo: "É Obaluaê, é Obaluaê...",
    letra: "É Obaluaê, É Obaluaê\nÉ Atotô\nÉ Obaluaê, É Obaluaê\n\nSe você está sofrendo\nNo leito ou com frio e com dor\nCom pipoca e com dendê\nMuita gente ele curou\nSe seu corpo está ferido\nE não pode mais suportar\nPeça proteção a ele\nQue ele vai lhe ajudar\n\nObaluaê\nÉ Obaluaê, É Obaluaê\nÉ Atotô\nÉ Obaluaê, É Obaluaê\n\nConhece o segredo da vida\nDo começo, meio e fim\nO meu senhor das palhas\nTenha muita dó de mim\nNa procissão das almas\nQue partem pro infinito\nEle vai mostrando a elas\nOutro mundo mais bonito!"
  },
  {
    id: "omulu-5", subcategoriaId: "sub-omulu-pontos", ordem: 4, favorito: false, criadoEm: 1775839257000,
    titulo: "Casinha branca...",
    letra: "Casinha branca, casinha branca\nQue eu mandei fazer (2x)\nPara oferecer a meu pai Omulu\nSeu atotô Obaluaê (2x)"
  },
  {
    id: "omulu-6", subcategoriaId: "sub-omulu-pontos", ordem: 5, favorito: false, criadoEm: 1775839257000,
    titulo: "Salve mamãe Oxum...",
    letra: "Salve mamãe Oxum! E salve Nanã Buroquê\nSalve Atotô Obaluaê (2x)"
  },
  {
    id: "omulu-7", subcategoriaId: "sub-omulu-pontos", ordem: 6, favorito: false, criadoEm: 1775839257000,
    titulo: "Se ver um velho no caminho...",
    letra: "Se ver um velho no caminho\nPeça a benção (2x)\nDeus lhe abençoe, Obaluaê\nDeus lhe abençoe"
  },
  {
    id: "omulu-8", subcategoriaId: "sub-omulu-pontos", ordem: 7, favorito: false, criadoEm: 1775839257000,
    titulo: "Oxalá é rei do mundo...",
    letra: "Oxalá é rei do mundo\nOxalá é meu senhor\nOmulu é o meu santo\nO meu santo protetor (2x)"
  },
  {
    id: "omulu-9", subcategoriaId: "sub-omulu-pontos", ordem: 8, favorito: false, criadoEm: 1775839257000,
    titulo: "Atoto, Atoto, Atoto...",
    letra: "Atoto\nAtoto, Atoto, Atoto o atoto Obaluaê (2x)\n\nSenhor da terra\nSenhor da renovação\nTem o poder da cura\nE da regeneração\n\nSua veste é de palha\nSua casa é de sapê\nO senhor do meu destino\nAtoto Obaluaê (2x)\n\nQuando ele dança\nFaz bailar o seu filá\nO terreiro se encanta\nOmulu meu orixá\n\nVelho Omulu\nJovem Obaluaê"
  },
  {
    id: "omulu-10", subcategoriaId: "sub-omulu-pontos", ordem: 9, favorito: false, criadoEm: 1775839257000,
    titulo: "As suas flores cobrem o chão...",
    letra: "As suas flores cobrem o chão do meu ilê\nSaravá Omulu, salve Obaluaê\nVou regar as suas flores com azeite de dendê (2x)"
  },
  {
    id: "omulu-11", subcategoriaId: "sub-omulu-pontos", ordem: 10, favorito: false, criadoEm: 1775839257000,
    titulo: "Atoto Obaluaê, salve a palha...",
    letra: "Atoto Obaluaê\nSalve a palha do senhor\nXaxará bateu na terra em seu louvor (2x)"
  },
  {
    id: "omulu-12", subcategoriaId: "sub-omulu-pontos", ordem: 11, favorito: false, criadoEm: 1775839257000,
    titulo: "Os filhos de Zambi...",
    letra: "Os filhos de Zambi\nHoje cantam zuelas\nEm seu louvor\nZuelas que contam\nA história da palha\nQue é sagrada ao senhor (Ô, ô, ô)\n\nA palha sagrada\nQue encobre a luz\nDe seu Atoto\nE os olhos dos homens\nJamais poderão\nVer a luz de Atoto\n\nAtoto Obaluaê\nAtoto Obaluaê\nAtoto meu pai é Obaluaê (2x)"
  },
  {
    id: "omulu-13", subcategoriaId: "sub-omulu-pontos", ordem: 12, favorito: false, criadoEm: 1775839257000,
    titulo: "O velho mais velho...",
    letra: "O velho mais velho\nÉ dos orixás\nA terra ganhou\nA terra rezava\nOs seus filhos cantavam\nEm seu louvor (Ô, ô, ô)\n\nA palha da costa\nQue enfeita a casa de seu Atoto\nE os seus filhos cantavam\nA zuela que um dia a terra rezou"
  },
  {
    id: "omulu-14", subcategoriaId: "sub-omulu-pontos", ordem: 13, favorito: false, criadoEm: 1775839257000,
    titulo: "Omulu é tatá na sua dança...",
    letra: "Omulu é tatá na sua dança (2x)\nCom seu amuleto e sua bengala\nEle também dança (2x)"
  },
  {
    id: "omulu-15", subcategoriaId: "sub-omulu-pontos", ordem: 14, favorito: false, criadoEm: 1775839257000,
    titulo: "Obaluaê, seu terreiro está em festa...",
    letra: "Obaluaê, seu terreiro está em festa\nEnfeitado com pipoca\nPeneira palha da costa (2x)\n\nObaluaê,\nSaudamos sua coroa\nSaudamos os seus filhos\nNa casa de Oxalá (2x)"
  },
  {
    id: "omulu-16", subcategoriaId: "sub-omulu-pontos", ordem: 15, favorito: false, criadoEm: 1775839257000,
    titulo: "Silêncio, meu senhor está na terra...",
    letra: "Silêncio\nMeu senhor está na terra\nO Sol em forma de Orixá no terreiro baixou\nBradou seu ylá que zuniu feito a morte que berra\n\nCanta povo do ayê\nSalve meu pai atotô atotô Obaluaê\n\nOgum trançou seu maryô com as palhas da costa\nQue dançam aos sabor dos caprichos dos ventos de Oyá\nOs males e dores do mundo trás ele a resposta\nSegredo escondido na força do seu xaxará\nDerramei pipocas ao chão preparei seu Olubajé\nCom preto e o branco das contas fiz meu abadá\nOgã retumbou no atabaque um canto de fé\nEu vi meu Senhor embalado e trazendo Axé\n\nÉ ele o Senhor das doenças da febre que consome\nO filho que vem encantado nas mãos de Nanã\nEu peço licença a Olorum pra dizer o seu nome\nÉ Omolu, Obaluaê meu pai Xapanã"
  },
];
= [
  {
    id: "lo-1", subcategoriaId: "1774886896028-q58etyt", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi, filho de Iemanjá...",
    letra: "Oxossi, filho de Iemanjá\nDivindade do clã de Ogum\nÉ Ibualama, ele é Ilé\nQue Oxum levou no rio\nE nasceu Logun-edé!\n\nSua natureza é da lua\nNa lua Oxóssi é Odé Odé-Odé, Odé-Odé\nRei de Keto Caboclo da mata Odé-Odé.\n\nQuinta-feira é seu ossé\nAxoxó, feijão preto, camarão e amendoim\nAzul e verde, suas cores\nCalça branca rendada\nSaia curta estampada\n\nOjá e couraça prateada\nNa mão ofá, iluquerê\nOkê okê, okê arô, okê\nA jurema é a árvore sagrada\nOkê arô, Oxóssi, okê okê\n\nNa Bahia é São Jorge\nNo Rio, São Sebastião\nOxóssi é quem manda\nNas bandas do meu coração."
  },
  {
    id: "lo-2", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Mas como é bonito, assistir festa nas matas...",
    letra: "Mas como é bonito, assistir festa nas matas\nOuvir o som das cascatas e o lindo canto do sabiá (do sabiá)\nQue noite linda, que bela noite de luar\nFoi no clarão da lua\nQue eu vi o seu Oxossi passar\n\nA mata estava em festa ô ô ô\nToda coberta de flores,\nAté os passarinhos cantam, em seu louvor\nEle é nosso protetor\nÔ ô ô ô ô quanta beleza,\nÔ ô ô ô ô quanto esplendor,\nComo é bom ter a certeza\nQue o seu Oxossi é nosso protetor"
  },
  {
    id: "lo-4", subcategoriaId: "1774886896028-q58etyt", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Vermelho é a cor do sangue de meu pai...",
    letra: "Vermelho é a cor do sangue de meu pai\nE verde é a cor das matas onde mora {bis}\nVamos saravar meu pai Oxóssi em sua banda\nVamos saravar, a banda que ele mora {bis}"
  },
  {
    id: "lo-5", subcategoriaId: "1774886896028-q58etyt", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi Odé, ele é São Sebastião...",
    letra: "Oxossi Odé, ele é São Sebastião\nMas ele reina\nLá nas matas e nos campos\nEle é o dono, da lavoura de pai Tupã\n\nOre rê Ore rê ô\nOre rê Ore rê ô\nMas o senhor ore rê {bis}\n\nPara sua vida melhorar\nE nunca lhe faltar o que comer\nAcenda uma vela\nLá nas matas para Oxossi\nE peça que ele irá lhe socorrer\n\nOre rê Ore rê ô\nOre rê Ore rê ô\nMas o senhor ore rê {bis}"
  },
  {
    id: "lo-6", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi é Rei no Céu...",
    letra: "Oxossi é Rei no Céu\nOxossi é Rei na Terra\nEle não desce do Céu sem coroa\nSem sua nansga de Guerra"
  },
  {
    id: "lo-7", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi Zambi quem criou o mundo...",
    letra: "Foi Zambi quem criou o mundo\nSó Zambi pode governar\nFoi Zambi quem criou\nAs estrelas que ilumina\nOxossi lá no Jurema"
  },
  {
    id: "lo-8", subcategoriaId: "1774886896028-q58etyt", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi chover, eu vi relampear...",
    letra: "Eu vi chover\nEu vi relampear\nMas mesmo assim o céu estava azul\n\nFavorecendo a folha da Jurema\nOxossi é reina\nDe norte a sul (2x)"
  },
  {
    id: "lo-9", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu me orgulho de carregar esse Orixá...",
    letra: "Eu me orgulho\nDe carregar esse Orixá\nEle é meu pai Oxossi\nFilho de pai Oxalá\nEle é meu pai Oxossi\nQue é um grande Orixá (2x)\n\nEle caça, ele pesca\nEle é rei aqui na Umbanda\nVamos salvar pai Oxossi\nQue comanda a nossa banda\nEle é dono das matas\nQuando vem trás seu axé\nCaça para os Orixás\nE ajuda a quem tem fé\n\nEle é o rei de Keto\nFilho de Yemanjá\nEle é meu pai Oxossi\nQue eu louvo em cantar\nEle trás prosperidade\nEle trás muita fartura\nQuem confia em pai Oxossi\nNão vive na amargura"
  },
  {
    id: "lo-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Seu arranca-toco é de aruanda...",
    letra: "Seu arranca-toco é de aruanda,\nÉ de nagô zambe (2x)\nQuando ele chega na umbanda\nAuê, auê (2x)"
  },
  {
    id: "lo-11", subcategoriaId: "sub-oxossi-louvacao", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo sete flechas nasceu...",
    letra: "Caboclo sete flechas nasceu\nNo jardim das oliveiras\n(Pegar o resto do ponto)"
  },
  {
    id: "lo-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo a sua mata é verde...",
    letra: "Caboclo a sua mata é verde, verde é da cor do mar\nSarava o cacique da jurema\nSarava o cacique da jurema\nSarava o cacique da jurema\nJurema (2x)"
  },
  {
    id: "ch-1", subcategoriaId: "sub-oxossi-chegada", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "São Miguel, São Miguel...",
    letra: "São Miguel, São Miguel\nSão Miguel está chamando (2x)\nDai-me forças são Miguel para chamar os caboclos da umbanda (2x)"
  },
  {
    id: "ch-2", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Tambor, tambor...",
    letra: "Tambor, tambor\nVai chamar quem mora longe (2x)\nSalve Oxossi o rei das matas\nOgum do Humaitá\nPai Xangô lá na pedreira\nIansã no jacutá (2x)"
  },
  {
    id: "ch-3", subcategoriaId: "sub-oxossi-chegada", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogã chama todos os caboclos...",
    letra: "Ogã chama todos os caboclos\nChama todos caboclos no batuque do tambor (2x)\nDiga pra ela que já é hora\nDiga pra ele, que a umbanda está chamando"
  },
  {
    id: "ch-4", subcategoriaId: "sub-oxossi-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele vem da mata, ele trouxe flecha...",
    letra: "Ele vem da mata\nEle trouxe flecha\nPra filho de fé saudar\nEle é filho de cacique\nEle é caboclo verdadeiro\nÉ caçador é flecheiro\nVem aqui pra trabalhar\n\nEle é filho de cacique\nÉ caboclo verdadeiro\nEle é seu Pena de Ouro\nQue vem saudar o seu terreiro (2x)"
  },
  {
    id: "ch-5", subcategoriaId: "sub-oxossi-chegada", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava na beira do rio sem poder atravessar...",
    letra: "Estava na beira do rio sem poder atravessar\nChamei pelo caboclo\nCaboclo tupinambá (2x)\nTupinambá chamei\nChamei tupinambá ea (2x)"
  },
  {
    id: "ch-6", subcategoriaId: "sub-oxossi-chegada", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Ainda tem caboclo debaixo da samambaia...",
    letra: "Ainda tem caboclo debaixo da samambaia (2x)\nSai, sai caboclo,\nDebaixo da samambaia (2x)"
  },
  {
    id: "ch-7", subcategoriaId: "sub-oxossi-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxalá chamou e já mandou buscar...",
    letra: "Oxalá chamou e já mandou buscar\nTodos caboclos da jurema\nPara o seu jurema (2x)\n\nPai Oxalá, é rei do mundo inteiro\nE já deu ordens pra jurema\nMandar seus capangueiros\n\nMandai, mandai\nLinda cabocla jurema\nO seu terreiro\nQue já é ordem suprema (2x)"
  },
  {
    id: "ch-9", subcategoriaId: "sub-oxossi-trabalho", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "A sua flecha é carijó...",
    letra: "A sua flecha é carijó seu bodoque é indaiá\nTodos caboclos vem serenos como o sereno é\nOxossi é rei da macaia Oxossi é rei da guiné\nEle atirou\nEle atirou e ninguém viu\nO seu Oxossi é quem sabe\nAonde a flecha caiu (2x)"
  },
  {
    id: "cg-1", subcategoriaId: "sub-oxossi-chegada", ordem: 13, favorito: false, criadoEm: 1774882639699,
    titulo: "Uma rosa no jardim apareceu...",
    letra: "Uma rosa no jardim apareceu\nMamãe está chamando e lá vou eu\nEle é caboclo, ele vem da sua aldeia\nSeu Ubirajara é um caboclo e não bambeia"
  },
  {
    id: "cg-2", subcategoriaId: "sub-oxossi-chegada", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele vem da mata, ele vem girar...",
    letra: "Ele vem da mata, ele vem girar\nO caboclo laranjeira tá de ronda no gongar\nO caboclo laranjeira\nEle promete e não esquece\nEle traz laranja doce\nPara dar a quem merece\n\nEle vem na lei de umbanda\nmensageiro de oxala\nsua flecha tem mironga\nso atira pra acertar"
  },
  {
    id: "cg-3", subcategoriaId: "sub-oxossi-chegada", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "Que cabocla é essa toda vestida de pena...",
    letra: "Que cabocla é essa\nToda vestida de pena é a cabocla jurema\nDona de seu jacutá\nRainha da mata virgem que chegou pra trabalhar"
  },
  {
    id: "cg-4", subcategoriaId: "sub-oxossi-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Lua que clareia o mundo...",
    letra: "Lua que clareia o mundo\nQue clareia a terra e o mar\nClareia as matas de Oxossi\nCidade da jurema\n\nClareia os caminhos\nQue os caboclos vão passar\nPara vir na umbanda trabalhar (2x)"
  },
  {
    id: "cg-5", subcategoriaId: "sub-oxossi-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava sentado na cadeira da jurema...",
    letra: "Estava sentado na cadeira da jurema\nPorque mandaram me chamar (2x)\nO juremi, o Jurema\nPorque mandaram me chamar (2x)"
  },
  {
    id: "cg-6", subcategoriaId: "sub-oxossi-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Nas matas lá da jurema eu vi uma estrela brilhar...",
    letra: "Nas matas lá da jurema\nEu vi uma estrela brilhar (2x)\nEra uma estrela de Oxossi\nAnunciando que caboclo vai chegar (2x)\n\nOkê, Okê caboclo\nCaboclo Sete Estrelas no gongar\nOkê, Okê caboclo\nVem de aruanda, pra seus filhos ajudar (2x)"
  },
  {
    id: "cg-8", subcategoriaId: "sub-oxossi-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Que penacho é aquele...",
    letra: "Que penacho é aquele\nÉ um penacho de arara (2x)\n\nAi quando rompe a mata virgem\nQuando rompe a mata virgem\nÉ o caboclo Ubirajara (2x)"
  },
  {
    id: "cg-9", subcategoriaId: "sub-oxossi-chegada", ordem: 12, favorito: false, criadoEm: 1774882639699,
    titulo: "Ubirajara quando chegou...",
    letra: "Ubirajara quando chegou\nNão atendeu caboclo nenhum (2x)\nSete mundos, sete mundos(2x)\nEle se chama Ubirajara, meu pai Oxossi é caçador de outro mundo (2x)"
  },
  {
    id: "tr-1", subcategoriaId: "sub-oxossi-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Quanto tempo que eu não bambeio...",
    letra: "Quanto tempo que eu não bambeio\nE hoje vim pra trabalhar (2x)\nO caboclo samambaia\nVeio aqui pra trabalhar (2x)"
  },
  {
    id: "tr-2", subcategoriaId: "1774889196337-js9i8vt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo roxo da pele morena...",
    letra: "Caboclo roxo da pele morena\nEle é Oxossi é caçador lá da jurema (2x)\nEle jurou e tornou a jurar\nEm tomar os conselhos que a jurema vem lhe dar\nEle jurou e tornou a jurar\nNão deixar os perversos nessa banda entrar"
  },
  {
    id: "tr-4", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se a gameleira de Oxossi faz sombra...",
    letra: "Se a gameleira de Oxossi faz sombra\nMeu pai Oxalá me responda (2x)\nAi como é bonito\nQue bonito é\nO meu pai Oxossi\nNo seu are, rê (2x)"
  },
  {
    id: "tr-6", subcategoriaId: "sub-oxossi-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Na beira do rio verde...",
    letra: "Na beira do rio verde\nEu vi o caboclo na areia (2x)\nPescando peixe miúdo\nPra levar pra sua aldeia (2x)\nCaboclo pegue o anzol\nQue a noite é linda e clara\nVai pescar no rio verde\nPor ordem de mar iara (2x)"
  },
  {
    id: "tr-7", subcategoriaId: "sub-oxossi-trabalho", ordem: 15, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo não tem caminho para caminhar...",
    letra: "Caboclo não tem caminho para caminhar (2x)\nEle caminha por cima da folha, por baixo da folha por todo lugar (2x)\nSeus caminhos estão abertos\nCaboclo pode passar\nEle vem girar, ele vem girar\nCaboclo filho de umbanda, filho Oxossi e neto de Oxalá\n\nQuando a lua sair\nEle vem girar (2x)"
  },
  {
    id: "tr-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi numa tarde serena...",
    letra: "Foi numa tarde serena\nLá nas matas da jurema que eu vi os caboclos bradar (2x)\nKiô, kiô, kiô que era\nToda mata está em festa\nSarava seu Sete Flechas\nEle é rei da floresta (2x)"
  },
  {
    id: "tr-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Mandei fazer, o que banda eu fiz...",
    letra: "Mandei fazer, o que banda eu fiz\nUm capacete de penas\n\nSalve seu Iambuga\nÉ capitão das matas\nÉ cacique da Jurema (2x)"
  },
  {
    id: "tr-13", subcategoriaId: "sub-oxossi-trabalho", ordem: 16, favorito: false, criadoEm: 1774882639699,
    titulo: "Me perdi meu pai eu me perdi...",
    letra: "Me perdi meu pai eu me perdi\nLá na mata do amazona eu me perdi (2x)\nProcurei seu Iambuga não achei\nVim aqui no seu terreiro e encontrei"
  },
  {
    id: "tr-14", subcategoriaId: "sub-oxossi-trabalho", ordem: 18, favorito: false, criadoEm: 1774882639699,
    titulo: "Caçador na beira do caminho...",
    letra: "Caçador na beira do caminho\nNão me mate essa coral na estrada\nEla abandonou sua choupana caçador\nFoi no romper, da madrugada"
  },
  {
    id: "tr-15", subcategoriaId: "sub-oxossi-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi é caçador eu gosto de ver caçar...",
    letra: "Oxossi é caçador eu gosto de ver caçar\nDe dia ele caça na mata\nA noite ele caça no mar (2x)"
  },
  {
    id: "tr-16", subcategoriaId: "sub-oxossi-chegada", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo mora nas matas...",
    letra: "Caboclo mora nas matas, nas matas moram os orixás\nOh diga a ele para vir firmar seu ponto\nAuê, auê, auâ (2x)"
  },
  {
    id: "tr-17", subcategoriaId: "sub-oxossi-trabalho", ordem: 17, favorito: false, criadoEm: 1774882639699,
    titulo: "Estrela matutina clareia a banda sem parar...",
    letra: "Estrela matutina clareia a banda sem parar (2x)\nDizem que meu pai é um caboclo\nAuê, auê, auâ (2x)"
  },
  {
    id: "tr-18", subcategoriaId: "sub-oxossi-trabalho", ordem: 19, favorito: false, criadoEm: 1774882639699,
    titulo: "No alto daquela serra, eu avistei uma vila",
    letra: "perguntei o nome da vila para uma cabocla formosa\n\nela entao me respondeu\nO nome da vila é vila nova(2x)\n\nRê, o are re, o nome da vila é vila nova"
  },
  {
    id: "tr-19", subcategoriaId: "sub-oxossi-trabalho", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "No alto daquela serra, debaixo de um pe de anga",
    letra: "No alto daquela serra\nDebaixo de um pé de angá\nEu vi seu Iambuga atirar a sua flecha e não errar\n\nZuou, zuou, a sua flecha zuou (2x)"
  },
  {
    id: "tr-20", subcategoriaId: "sub-oxossi-trabalho", ordem: 12, favorito: false, criadoEm: 1774882639699,
    titulo: "Oh, cadê gira mundo o Pemba...",
    letra: "Oh, cadê gira mundo o Pemba\nOh, tá na pedreira o Pemba\nE seus cambones Pemba\nO veado no mato é corredor\nCadê meu mano caçador\nCadê o caboclo ventania\nEle é o nosso guia"
  },
  {
    id: "tr-21", subcategoriaId: "sub-oxossi-trabalho", ordem: 20, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi a cabocla iara sentada na beira do rio...",
    letra: "Eu vi a cabocla iara sentada na beira do rio\nPegando peixe meu senhor\n(escrever esse ponto)"
  },
  {
    id: "cu-1", subcategoriaId: "sub-oxossi-curimba", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo bom é amigo um do outro...",
    letra: "Caboclo bom é amigo um do outro (2x)\nCaboclo bom, ele anda atrás do outro (2x)"
  },
  {
    id: "cu-2", subcategoriaId: "sub-oxossi-curimba", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi fez uma caçada...",
    letra: "Oxossi fez uma caçada\nCaçou uma juriti\nDa caça ele fez banquete\nE a pena pra dividir\n\nPena com pena\nPena pra dividir (2x)"
  },
  {
    id: "cu-3", subcategoriaId: "sub-oxossi-curimba", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo pisa aqui que piso lá...",
    letra: "Caboclo pisa aqui que piso lá\nCaboclo eu gostei do seu pisar"
  },
  {
    id: "de-1", subcategoriaId: "sub-oxossi-demanda", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se você é caboclo eu quero ver balancear...",
    letra: "Se você é caboclo eu quero ver balancear (2x)\nArreia arreia capangueiro da jurema\nOh jurema (2x)"
  },
  {
    id: "de-2", subcategoriaId: "sub-oxossi-demanda", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Quando sai da mata virgem...",
    letra: "Quando sai da mata virgem\nO urro de uma onça na Bahia se criou (2x)\nE os meus manos ficaram chorando\nFicaram rezando pra seu salvador (2x)\nSua caverna estava desprezada\nA mesma caverna que a jurema se criou (2x)"
  },
  {
    id: "de-3", subcategoriaId: "sub-oxossi-demanda", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Sucuri, Jibóia...",
    letra: "Sucuri, Jibóia\nQuando vem beirando o mar\nOlha como cocoriou\nA sua cobra coral (2x)"
  },
  {
    id: "de-4", subcategoriaId: "sub-oxossi-demanda", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Caçador que matou meu sabiá...",
    letra: "Caçador que matou meu sabiá (2x)\nEle cantava baixinho no alto da serra\nLá em Jurema (2x)"
  },
  {
    id: "de-5", subcategoriaId: "sub-oxossi-demanda", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ah não mata que eu não entre...",
    letra: "Ah não mata que eu não entre\nAh não a pau que eu não a suba\nA não a esse passarinho\nQue meu botoque não derrube\nOh curimba\nZum, zum, zum o curimba, é de correr"
  },
  {
    id: "de-6", subcategoriaId: "sub-oxossi-demanda", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Em mata que Makuku entra...",
    letra: "Em mata que Makuku entra\nYambu não pia (2x)\nEle caboclo é flecheiro é atirador\nNa mata Yambu não pia (2x)"
  },
  {
    id: "1774889674435-5a8wjqy", subcategoriaId: "sub-oxossi-trabalho", ordem: 13, favorito: false, criadoEm: 1774889674435,
    titulo: "Calunga ê, calunga â",
    letra: "Calunga ê, calunga â\nchegou da calunga, pra trabalhar(2x)\n\nchegou da calunga ele é caboclo ele é flecheiro\nchegou da calunga é amarrador de feiticeiro"
  },
  {
    id: "1774889853101-hjzzj7o", subcategoriaId: "sub-oxossi-trabalho", ordem: 21, favorito: false, criadoEm: 1774889853101,
    titulo: "cabocla formosa a sua flecha ela atirou(PROCURAR)",
    letra: "saiu da calunga iemanha foi quem mandou\n\nela mandou pra ajudar os filhos seus,\njandira, jacira iracema apareceu"
  },
  {
    id: "1774889983708-ljmah2p", subcategoriaId: "sub-oxossi-trabalho", ordem: 7, favorito: false, criadoEm: 1774889983708,
    titulo: "caboclo filho da pedreira",
    letra: "caboclo filho da pedreira\nla da cachoeira, vem os seus filhos guiar\n\nfirma seu ponto caboclo\nquando na umbanda chegar\ncorumataí é o chefe do congar"
  },
  {
    id: "1774890232438-1z3yjyb", subcategoriaId: "sub-oxossi-trabalho", ordem: 3, favorito: false, criadoEm: 1774890232438,
    titulo: "la no topo do mundo",
    letra: "la no topo do mundo\nna pedreira de tupã\num aimore estava sentado\nseu penacho é encarnado\no seu brado é entoado\no que é que ele faz la\n\nla no topo do mundo\nurubatão vem a terra girar ô ô\n\nvem a terra girar ô ô (3x)\n\nQuando vai se pondo o sol\nquando vai nascendo o dia\nquem faz o mundo girar\né o urubatão da guia ô ô\n\nvem a terra girar ô ô\nvem a terra girar ô ô\nvem a terra girar ô ô"
  },
  {
    id: "1774890328431-uw5z21z", subcategoriaId: "sub-oxossi-trabalho", ordem: 14, favorito: false, criadoEm: 1774890328431,
    titulo: "Mas o seu manaca ja não da mais flor... PROCURAR",
    letra: "Mas o seu manaca ja não da mais flor...\n\nele vai mandar plantar(2x)\n\numa semente la no seu jacuta\n\nmas como é lindo a madrugada\nfilho de umbanda veio trabalhar(2x)"
  },
  {
    id: "1774890474827-z0b2gn9", subcategoriaId: "sub-oxossi-trabalho", ordem: 6, favorito: false, criadoEm: 1774890474827,
    titulo: "é caçador, é caçador, é caçador ...",
    letra: "é caçador, é caçador, é caçador  mas não é advinhador(2x)\nele é o caboclo da beira dagua\nna linha de umbanda ele vem trabalhar\nsegura o terreiro e seu jacuta"
  },
  {
    id: "1774890562289-d794u8e", subcategoriaId: "sub-oxossi-trabalho", ordem: 5, favorito: false, criadoEm: 1774890562289,
    titulo: "estava na mata caçando, no meio da mata caiapó...",
    letra: "estava na mata caçando, no meio da mata caiapó\nmas era seu ubirajara que estava caçando a cobra cipó."
  },
  {
    id: "1774890646304-dwutbir", subcategoriaId: "sub-oxossi-trabalho", ordem: 4, favorito: false, criadoEm: 1774890646304,
    titulo: "piava no alto da serra...",
    letra: "piava no alto da serra\npiava de se admirar\n\nmas era uma enorme jiboia\nque estava presa no bodoque \nde tupinamba(2x)"
  },
  {
    id: "1774890726983-0xsoegx", subcategoriaId: "sub-oxossi-trabalho", ordem: 8, favorito: false, criadoEm: 1774890726983,
    titulo: "O indio O indio O indio....",
    letra: "O indio O indio O indio\nele é o indio aonde o sol nasceu\n\nja foi cacique\nja foi pajé\n\nHoje é guerreiro da tribo dos aimoré"
  },
  {
    id: "1774891268778-xekpubu", subcategoriaId: "sub-oxossi-trabalho", ordem: 9, favorito: false, criadoEm: 1774891268778,
    titulo: "eu vi no alto da serra, cabocla dando seu brado de guerra",
    letra: "Eu vi no Alto da serra, Cabocla Jurema dando seu brado de guerra \nKiô, kiô, dentro da mata o seu brado ecoou  (2x)\n\nCom o seu arco e sua flecha e a sua lança de Indaiá, \nJurema dava o seu brado de guerra,\n anunciando que ia caçar, \nsete luas se passaram quando a Jurema voltou,\n toda a caça que ela trazia ao Cacique  entregou,\n e ele então alegre cantou em seu louvor, \n\nO o o Jurema, o o o Jurema, linda caçadora bela Cabocla de pena  (2x)"
  },
  {
    id: "1774891417238-yhn4jaj", subcategoriaId: "1774889196337-js9i8vt", ordem: 8, favorito: false, criadoEm: 1774891417238,
    titulo: "ó escutai o jurema, escutai quem ta chamando",
    letra: "ó escutai o jurema, escutai quem ta chamando\né a cabocla aimore\nela é quem avisar\n\nque são jorge ja esta de ronda\npara os perversos nao chegar\n\nchega são jorge chega\nVem Aimoré saravá\nAimoré é uma cabocla\nQue seus filhos gosta de ajudar"
  },
  {
    id: "1774891523453-a5edd4s", subcategoriaId: "sub-oxossi-trabalho", ordem: 23, favorito: false, criadoEm: 1774891523453,
    titulo: "A mata estava escura...",
    letra: "A mata estava escura\nveio um anjo e iluminou\nno meio da mata virgem\nraio de sol assuviou\n\nmas ele é o rei, ele é o rei, ele é o rei\nmas ele é o rei na umbanda ele é o rei (2x)"
  },
  {
    id: "1774891611922-phwzrmt", subcategoriaId: "1774889196337-js9i8vt", ordem: 1, favorito: false, criadoEm: 1774891611922,
    titulo: "luar luar, caboclo da lua ja chegou",
    letra: "luar luar, caboclo da lua ja chegou (2x)\n\nvai dizer a sua mae\nque seus filhos ele curou(2x)"
  },
  {
    id: "1774891673816-oj3gw6t", subcategoriaId: "1774889196337-js9i8vt", ordem: 2, favorito: false, criadoEm: 1774891673816,
    titulo: "luar luar, segue o seu andar o luar...",
    letra: "luar luar, segue o seu andar o luar (2x)\n\nSou um caboclo destemido\nmorador desse gongar\na viola me consola\npara as magoas espalhar\nno alto daquela serra\nonde canta o sabia\nonde tudo é riqueza ele é caboclo e mora la"
  },
  {
    id: "1774891705573-in06l0u", subcategoriaId: "1774889196337-js9i8vt", ordem: 3, favorito: false, criadoEm: 1774891705573,
    titulo: "girou o sol, girou a lua",
    letra: "girou o sol, girou a lua\ngirou o caboclo e a sua cura"
  },
  {
    id: "1774891774453-9pwpcpl", subcategoriaId: "1774889196337-js9i8vt", ordem: 4, favorito: false, criadoEm: 1774891774453,
    titulo: "batuque no terreiro, é tupinamba",
    letra: "batuque no terreiro, é tupinamba(2x)\né da pele vermelha, é tupinamba ô\n\nFlecha, flecha, flecha\npara o mal levar(2x)"
  },
  {
    id: "1774891824854-7daav7i", subcategoriaId: "1774889196337-js9i8vt", ordem: 5, favorito: false, criadoEm: 1774891824854,
    titulo: "Cocorico fez um galo aue...",
    letra: "Cocorico fez um galo aue\nno alto daquela serra(2x)\npara ajudar esses filhos aue\ntodos os caboclos vem a terra(2x)"
  },
  {
    id: "1774891875777-9l43z8o", subcategoriaId: "1774889196337-js9i8vt", ordem: 6, favorito: false, criadoEm: 1774891875777,
    titulo: "chamei minha cabocla de pena....",
    letra: "chamei minha cabocla de pena\nchamei la das matas pra ela trabalhar\n\npra ver a força que a jurema tem\npra ver a força que a jurema da(2x)"
  },
  {
    id: "1774892021416-o26eost", subcategoriaId: "sub-oxossi-curimba", ordem: 3, favorito: false, criadoEm: 1774892021416,
    titulo: "estrela sol e lua que clareia o jurema...",
    letra: "estrela sol e lua que clareia o jurema(2x)\n\né a curimba de todos os caboclos\ncom flecha e bodoque no reino da iara(2x)"
  },
  {
    id: "1774892057238-dyqu2pg", subcategoriaId: "sub-oxossi-curimba", ordem: 4, favorito: false, criadoEm: 1774892057238,
    titulo: "Caboclo pisa aqui que eu piso la..",
    letra: "Caboclo pisa aqui que eu piso la\ncaboclo eu gostei do seu pisar."
  },
  {
    id: "1774892108288-f83mm50", subcategoriaId: "sub-oxossi-curimba", ordem: 5, favorito: false, criadoEm: 1774892108288,
    titulo: "como é bonito a curimba dos caboclos...",
    letra: "como é bonito a curimba dos caboclos\npisa na areia de rastro pro outro(2x)\nsalve a sereia\nsalve iemanja\nsalve os caboclos da beira do mar"
  },
  {
    id: "1774892170451-870j0df", subcategoriaId: "sub-oxossi-curimba", ordem: 6, favorito: false, criadoEm: 1774892170451,
    titulo: "a jurema tem a jurema da(procurar melhor)",
    letra: "a jurema tem a jurema da\nseu sete estrelas pra trabalhar"
  },
  {
    id: "1774892412605-4j6ko1n", subcategoriaId: "1774889196337-js9i8vt", ordem: 7, favorito: false, criadoEm: 1774892412605,
    titulo: "koke koke o meus caboclos...",
    letra: "koke koke o meus caboclos\nestá em festa as matas do jurema\nkoke koke seu lirio verde, bravo guerreiro quem acabou de chegar\n\nEsse caboclo valente, veio nos abençar\ntrazendo para a umbanda\na paz divina de pai oxala\n\ndeixou em sua macaia\npataca, trouxe manaca\nessa erva é sagrada um forte remedio para lhe curar\n\nkoke koke o meus caboclos\nestá em festa as matas do jurema\nkoke koke seu lirio verde, bravo guerreiro quem acabou de chegar\n\npeço licença a ossain\noxossi, nana buruque\npara curar com essa erva  o filho enfermo de obaluar\ntendo a certeza da graça\nmeu pai em canto em seu louvor\nsarava seu lirio verde que dentro da banda nos abençoou"
  },
  {
    id: "1774892562061-jjr69rd", subcategoriaId: "sub-oxossi-trabalho", ordem: 23, favorito: false, criadoEm: 1774892562061,
    titulo: "eu vi a cabocla iara sentada na beira do rio",
    letra: "Eu vi a cabocla Iara\nSentar na beira do rio\nEu vi a cabocla Iara\nSentar na beira do rio\nPegando peixe, meu senhor\nPegando peixe, meu senhor\nPra levar pra quem pediu\nPegando peixe, meu senhor\nPegando peixe, meu senhor\nPra levar pra quem pediu\nIara cabocla linda\nVem fazer sua obrigação\nIara cabocla linda\nVem fazer sua obrigação\nNo seu terreiro, meu senhor (2x)\nEla faz sua devoção\nNo seu terreiro, meu senhor (2x)\nEla faz sua devoção"
  },
  {
    id: "1774894075512-rhwa12j", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: 1774894075512,
    titulo: "Eu vou pedir licença pra Oxossi",
    letra: "Eu vou pedir licença pra Oxossi\nPra trabalhar nas matas da Jurema (bis)\n\nBater cabeça pra Xangô, lá na pedreira\nOu levar flores pra Oxum na cachoeira"
  },
  {
    id: "1774894113048-moibu18", subcategoriaId: "sub-oxossi-chamada", ordem: 2, favorito: false, criadoEm: 1774894113048,
    titulo: "Ele é caboclo, ele nao pode negar",
    letra: "Ele é caboclo, ele não pode negar\nEle tem seu capacete\nQuem lhe deu foi Oxalá\nAuê auê, meu pai eu quero ver\nSe meu pai é Oxossi\nOu ogum de Aruê"
  },
  {
    id: "1774894202777-5un26y1", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: 1774894202777,
    titulo: "Ela vem de sua mata vem de onde a cobra pia",
    letra: "Ela vem de sua mata vem de onde a cobra pia {bis}\nSaravá seu Ubirajara, seu Sete Estrelas e a cabocla Jupira\nEla vem de sua mata vem de onde a cobra pia {bis}\nSaravá seu sete estrelas, seu Arranca-toco e a cabocla Jupira..."
  },
  {
    id: "1774894753798-5z6qman", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: 1774894753798,
    titulo: "galo cantou na serra...",
    letra: "galo cantou na serraa\nna mata estremeceu(2x)\ncaboclo seu pena verde, na cachoeira apareceu(2x)\n\nele é caboclo, flecheiro\nque mora num rochedo\nsomente cobra coral, conhece dele o segredo(2x)\n\nvem pelas margens do rio\nem linha manha serena\ncaboclo seu pena verde\nfirma seu ponto na areia"
  },
  {
    id: "1774894821785-su1h8zk", subcategoriaId: "sub-oxossi-louvacao", ordem: 8, favorito: false, criadoEm: 1774894821785,
    titulo: "eu venho das matas...",
    letra: "eu venho das matas, bem longe\nbem longe\naonde o galo, cantou \naonde a folha da jurema balanceou, balanceou"
  },
  {
    id: "ia-cg-1", subcategoriaId: "sub-iansa-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Deu um clarão no céu...",
    letra: "Deu um clarão no céu\nAs nuvens se esconderam\nMas de repente deu uma ventania\nEra a donas dos raios\nIansã que aparecia (x2)\n\nTão linda como o ouro na cor\nSua coroa é cravejada de brilhantes\nEparrêi, eparrêi Oyá\nIlumina meus caminhos\nPor onde eu passar (x2)"
  },
  {
    id: "ia-cg-2", subcategoriaId: "sub-iansa-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Olha que o Céu clareou...",
    letra: "Olha que o Céu clareou\nQuando o dia raiou\nFez o filho pensar\nA mãe do tempo mandou\nA nova era chegou\nAgora vamos cantar\nNo Humaitá Ogum Bradou\nSeu Oxossi atinou\nQue Iansã vai chegar\nO Ogã já firmou\nO atabaque afinou,\nAgora vamos cantar\n\nA Eparrêi, ela é Oyá ela é Oyá\nA Eparrêi, é Iansã é Iansã\nA Eparrêi\nQuando Iansã vai pra batalha,\nTodos cavaleiros param\nPara ver ela passar (x2)"
  },
  {
    id: "ia-cg-3", subcategoriaId: "sub-iansa-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eparrêi Oyá, Deusa dos ventos...",
    letra: "Eparrêi Oyá\nDeusa dos ventos mensageira de Oxalá (x2)\n\nSarava santa guerreira\nDona do Sol e da Lua\nMinha santa padroeira\nQue os meus caminhos marcou\nProteção pra nossa banda\nEparrêi ó Bela Oyá\nMoça rica de Aruanda\nVenha nos abençoar"
  },
  {
    id: "ia-cg-4", subcategoriaId: "sub-iansa-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Raios cruzando o céu...",
    letra: "Raios cruzando o céu\nO mar começa a se agitar\nGuerreira com a espada na mão\nGirando num lindo bailar\nIansã mostrando sua força\nImpondo o seu grande poder\nDivina rainha da umbanda\nMinha mãe eu lhe imploro\nVenha me valer"
  },
  {
    id: "ia-cg-5", subcategoriaId: "sub-iansa-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ô, ô, Ventania chegou...",
    letra: "Ô, ô\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou\nTenho a certeza que com ela eu posso contar\nCom minha fé\nO mal irei derrotar\nO terreiro toca atabaque\nEm seu louvor\nLindas canções empenhadas\nCom muito amor\n\nEpahey, epahey, epahey\nO daí me forças mamãe Iansã epahey (2x)\n\nÔ, ô\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou\nÔ, ô, ô, ô, ô, ô, ô, ô, ô\nVentania chegou"
  },
  {
    id: "ia-lo-1", subcategoriaId: "sub-iansa-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Raios que cruzam o ar... (Bela Oyá)",
    letra: "Raios que cruzam o ar\nNa fúria da ventania\nVejo a força da Oyá\nE o poder que ela irradia\nEla é a rainha da lei,\nDo fogo ela é soberana,\nAo ouvir seu Eparrêi,\nMeu coração se engalana\n\nE Bela Oyá, E Bela Oyá\nEu sou filho da Matamba\nIansã eu vou louvar\nBela Oyá (x2)\n\nEla dança o aguêrê\nIansã, santa guerreira\nAtabaques e afoxé,\nZuelando a noite inteira\nVou louvar a minha mãe,\nEm forma de oração,\nE o vento que vai ventar,\nVai levar esta canção, Bela Oyá\n\nE Bela Oyá, E Bela Oyá\nEu sou filho da Matamba\nIansã eu vou louvar\nBela Oyá (x2)"
  },
  {
    id: "ia-lo-2", subcategoriaId: "sub-iansa-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Guerreira, tens o bailar de um beija flor...",
    letra: "Guerreira, tens o bailar de um beija flor\nGuerreira, o seu bailar me encantou (x2)\n\nSenhora dos ventos,\nSenhora do Balé,\nEparrêi ó bela Oyá,\nNessa Deusa eu tenho fé\nSua força vem do vento,\nA sua beleza irradia,\nÉ força da natureza,\nÉ a força que me guia\n\nGuerreira, tens o bailar de um beija flor\nGuerreira, o seu bailar me encantou (x2)\n\nEssa deusa tem um rei\nQue em seu reino governou\nDividindo fortes raios esse rei é Pai Xangô\nCom poder da ventania\nToda palha ela soprou\nNo xirê dos orixás\nOmulu ela curou"
  },
  {
    id: "ia-lo-3", subcategoriaId: "sub-iansa-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã, meu orixá estrela guia...",
    letra: "Iansã, meu orixá estrela guia\nTu és a própria ventania\nQue em meu terreiro\nHoje louvo em meu gonga\nTu és,\nA moça rica és formosa\nÉs minha mãe és linda rosa,\nNo jardim suspenso de pai Oxalá\nGuerreira,\nÉs minha força,\nÉs Minha fé,\nGuardo comigo seu axé\nUm misticismo da Bahia,\nLouvo,\nseu lindo relampear\nEparrêi Oyá\nIlumina o meu passar\nSenhora da ventania\n\nLouvo o vento\nLouvo o raio\nLouvo o relampear\nSarava santa guerreira\nSarava seu jacutá (x2)"
  },
  {
    id: "ia-lo-4", subcategoriaId: "sub-iansa-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Quando Iansã chegou, Saravou Yalorixá...",
    letra: "Quando Iansã chegou,\nSaravou Yalorixá,\nOgã Louvou sua Coroa\nEparrei Bela Oyá\nEla é moça bonita\nMoça rica ela é\nConhecida dentro do santo\nEla é Iansã do Balé\n\nOlha eu, Olha eu\nOlha eu Bela Oyá\nOlha eu, Olha eu\nEla é Iansã é o meu orixá (x2)"
  },
  {
    id: "ia-lo-5", subcategoriaId: "sub-iansa-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã é a dona do mundo...",
    letra: "Iansã é a dona do mundo\nDona do fogo, da faísca e do trovão\nEparrei Iansã na Aruanda\nSanta Barbara com a espada na mão"
  },
  {
    id: "ia-lo-6", subcategoriaId: "sub-iansa-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Sarava Iansã do cabelo loiro...",
    letra: "Sarava Iansã do cabelo loiro\nNo mar tem água, na sua pedra tem ouro\nLe, le le e\nLe, le le á\nSarava Iansã que é rainha do ar"
  },
  {
    id: "ia-lo-7", subcategoriaId: "sub-iansa-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Relampejou lá no céu, deixa clarear...",
    letra: "Relampejou lá no céu, deixa clarear\nVento soprou na palmeira, ê ah!\nSalve a deusa do fogo, Oyá!\nÉ Iansã quem chegou, deixa ela girar (2x)\n\nOh, guerreira, rainha desse jacutá\nSeu encanto me fascina, você é quem me faz sonhar\nÉ vento que sopra no meu coração\nEnergia que me faz vibrar de emoção\nÉ fogo que aquece o meu anoitecer\nÉ luz que me guia, é meu bem querer\nCom sua espada eu venço a batalha\nMinha fé em você não falha\nEparrêi, minha mãe, vem me proteger"
  },
  {
    id: "ia-lo-8", subcategoriaId: "sub-iansa-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eparrei ô, Eparrei á, força de Oyá...",
    letra: "Eparrei ô, Eparrei á, Eparrei, força de Oyá (4x)\n\nEla é mais que temporal\nMuito mais que ventania\nUma força sem igual\nUm poder que arrepia\nA bravura de mil homens\nTudo em uma só mulher\nE por nós ela guerreia\nVenha o mal de onde vier\n\nEparrei ô, Eparrei á, Eparrei, força de Oyá (4x)\n\nFilha de santa guerreira\nMeu caminho eu mesma traço\nFui criada em fogo alto\nTenho minha alma de aço\nAgradeço à Iansã\nTudo o que ela me ensinou\nA coragem de Ogum\nE a justiça de Xangô"
  },
  {
    id: "ia-de-1", subcategoriaId: "sub-iansa-demanda", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã, Cadê Ogum? Foi pro mar!...",
    letra: "Iansã, Cadê Ogum?\nFoi pro mar!\nMas Iansã, Cadê Ogum?\nFoi pro mar! (2x)\n\nIansã penteia\nOs seus cabelos macios\nQuando a luz da lua cheia\nClareia as águas dos rios\nOgum sonhava\nCom a filha de Nanã\nE pensava que as estrelas\nEram os olhos de Iansã\n\nMas Iansã, Cadê Ogum?\nFoi pro mar! (4x)\n\nNa terra dos orixás\nUm amor se dividia\nEntre um deus que era de paz\nE outro deus que combatia\nComo a luta só termina\nQuando existe um vencedor\nIansã virou rainha na coroa de xangô\n\nMas Iansã, Cadê Ogum?\nFoi pro mar!\nIansã, Cadê Ogum?\nFoi pro mar! (2x)"
  },
  {
    id: "ia-de-2", subcategoriaId: "sub-iansa-demanda", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Sonhei um sonho lindo...",
    letra: "Sonhei um sonho lindo\nSonho tão lindo\nQue me encantou\nEu me banhava\nCom as águas da Oxum\nQue desciam da pedreira\nDe pai Xangô\nTempo virava\nVentos e o trovão roncou\nEra a bela Oyá\nQue nos meus sonhos vinha para me ajudar\n\nEla bailava sem ter os pés no chão,\nCom sua espada, e seu cálice na mão\nEra Iansã me dando a sua proteção (x2)"
  },
  {
    id: "ia-tr-1", subcategoriaId: "sub-iansa-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Santa guerreira que ao meu lado caminha...",
    letra: "Santa guerreira que ao meu lado caminha\nCom sua taça de ouro e sua espada na mão\nÉs para mim toda grandeza\nVenero sua beleza\nTrago a em meu coração\nA sua saia quando roda irradia\nÉ Deusa da Ventania\nA Rainha Trovão,\nMeu pai Xangô\nIansã fez sua morada,\nEla roda sua saia\nQuando ronca a trovoada (x2)\n\nEparrêi, Eparrêi Oyá\nSarava mãe Iansã, é Rainha dos Orixás (x2)"
  },
  {
    id: "ia-tr-2", subcategoriaId: "sub-iansa-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Aê dim dim, Aê dim dá...",
    letra: "Aê dim dim\nAê dim dá\nOyá Matamba de Aruê\nOyá Matamba de Aruá"
  },
  {
    id: "ia-tr-3", subcategoriaId: "sub-iansa-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Raio de luz clarão no céu...",
    letra: "Raio de luz clarão no céu\nÉ ventania que vem lá\nA noite inteira vento vem e vai\nRodopiando a bailar\nCom a espada erguida no ar\nSurge a guerreira\nÉ Iansã\n\nVarrendo os males\nÉ Iansã\n\nOh mãe valei-me\nLevai nesses ventos os nossos tormentos\nLevai minha dor\nE quando cessar a tempestade\nE eu vislumbrar um novo amanhã\nExplode em meu peito um brado Eparrei\nOh mãe Iansã\n\nPõe no tacho azeite pra ferver que Oyá\nPõe nele o tempero desse acarajé\nQue é força e coragem pra seguir viagem\nFilhos que tem fé (2x)"
  },
  {
    id: "ia-tr-4", subcategoriaId: "sub-iansa-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "No amanhecer é que essa estrela brilha...",
    letra: "No amanhecer é\nQue essa estrela brilha\nNo amanhecer é\nQue ela me ilumina\nIansã senhora, do amanhecer\nSua espada brilha\nPra nos proteger (2x)\n\nÈ Oyá\nIansã que nos conduz\nÉ Oyá\nIansã com sua luz\nAo rodopiar faz o vento\nQue a chuva trás\nPra lavar a terra\nSemear a paz (2x)\n\nÈ Oyá\nIansã que nos conduz\nÉ Oyá\nIansã com sua luz\nÉ santa guerreira\nSe preciso for\nPra acabar com a guerra\nEspantar a dor\nÉ santa guerreira\nSe preciso for\nPra acabar com a guerra\nSemear o amor"
  },
  {
    id: "ia-cr-1", subcategoriaId: "sub-iansa-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã tem um leque que venta...",
    letra: "Iansã tem um leque que venta\nPra abanar em dia de calor\nIansã mora nas pedreiras\nEu quero vê meu Pai Xangô"
  },
  {
    id: "ia-cr-2", subcategoriaId: "sub-iansa-cruzado", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã Orixá de Umbanda...",
    letra: "Iansã Orixá de Umbanda\nRainha do nosso gongá\nSarava Iansã lá na Aruanda, Eparrei!\nEparrei Iansã venceu demanda\nIansã, saravou pra Xangô\nNo céu, trovão roncou\nE lá nas matas leão bradou\nSarava Iansã\nSarava Xangô"
  },
  {
    id: "ia-cr-3", subcategoriaId: "sub-iansa-cruzado", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eram duas ventarolas...",
    letra: "Eram duas ventarolas\nDuas ventarolas\nQue vinham beirando o mar\nUma era Iansã Eparrei!\nA outra era Iemanjá Odociaba\n\nIansã, Iansã, segura seu arerê o Iansã\nSegura seu arerê o Iansã\nO Iansã, o Iansã\nSegura seu arerê"
  },
  {
    id: "ym-cg-1", subcategoriaId: "sub-yemanja-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Uma Dúzia de rosas...",
    letra: "Uma Dúzia de rosas\nA noite é tão linda\nEu vou para o mar\nEu vou tocando e cantando\nFazer meus pedidos\nÀ deusa do mar (2x)\nMãe Iemanjá\nVenha me ajudar\nMamãe Oxum\nVenha nos saudar\nSou peregrino\nFlores na areia pra deusa do mar (2x)"
  },
  {
    id: "ym-cg-2", subcategoriaId: "sub-yemanja-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Saia do mar, linda sereia...",
    letra: "Saia do mar, linda sereia\nSaia do mar venha brincar na areia\nSaia do mar, sereia bela\nSaia do mar venha brincar com ela"
  },
  {
    id: "ym-cg-3", subcategoriaId: "sub-yemanja-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oh santa de azul...",
    letra: "Oh santa de azul\nOh santa do mar\nVem ver seus filhos\nIemanjá (2x)\nIemanjá\nSaia do mar\nE venha ver\nA sua Iaô (2x)\nOdô, odô, odô odô Odôia"
  },
  {
    id: "ym-cg-4", subcategoriaId: "sub-yemanja-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fui à beira da praia...",
    letra: "Eu fui à beira da praia\nPra ver o balanço do mar\nEu vi o seu rastro na areia\nMe lembrei da sereia\nComecei a chamar (2x)\n\nOh Janaína vem ver\nOh Janaína vem cá\nReceber suas flores\nQue venho lhe ofertar (2x)"
  },
  {
    id: "ym-lo-1", subcategoriaId: "sub-yemanja-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iemanjá, deusa das águas claras...",
    letra: "Iemanjá, deusa das águas claras\nRainha das ondas, sereia do mar\nFlores brancas na areia para lhe ofertar\nÓ mamãe sereia\nUma estrela no céu brilhou\nAs ondas na areia chegou\nLevando as flores pro mar\nO Iemanjá as ondas vieram buscar as flores que eu vou lhe ofertar (2x)\n\nO Iemanjá\nIemanjá Sobá (3x)"
  },
  {
    id: "ym-lo-2", subcategoriaId: "sub-yemanja-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Estou ouvindo o lindo toque do tambor...",
    letra: "Estou ouvindo o lindo toque do tambor\nÉ louvação à Iemanjá com muito amor (2x)\n\nOh iaô Iemanjá\nQue todo amor vem de Oxalá\nOh iaô Iemanjá\nQue toda dor leva pro mar (2x)"
  },
  {
    id: "ym-lo-3", subcategoriaId: "sub-yemanja-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Mãe d'água rainha das ondas...",
    letra: "Mãe d'água rainha das ondas sereias do mar\nMãe d'água seu canto é bonito como ver o mar (2x)\nAuê ó Iemanjá (2x)\nRainha das ondas sereia do mar (2x)\nMas como é lindo o canto de Iemanjá\nFaz até o pescador chorar\nQuem escuta a mãe d'água cantar\nVai com ela pro fundo do mar (2x)"
  },
  {
    id: "ym-lo-4", subcategoriaId: "sub-yemanja-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Brilha o sol, Canta o rouxinol...",
    letra: "Brilha o sol\nCanta o rouxinol\nEu olho o céu no infinito\nAonde o azul é bonito\nEu saravo a Oxalá\nRios, montes e cascatas\nEu olho o verde das matas\nSinto a paz que a natureza traz\n\nLaiá laiá\nE o mar com sua grandeza\nSeu poder sua beleza eu imploro à Iemanjá\n\nÓ mãe d'água rainha sereia do mar\nSegura a banda\nIlumina esse gonga (2x)"
  },
  {
    id: "ym-lo-5", subcategoriaId: "sub-yemanja-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Janaína minha deusa...",
    letra: "Janaína minha deusa\nO seu canto vem do mar\nO meu barco que navega\nLevando flores à odoiá\n\nLindo é ver o céu azul\nNo encontro com as águas do mar\nOxalá nos deu tanta beleza\nDeu Iemanjá à nos guiar (2x)\n\nO no balanço do mar vou navegar\nEu quero!\nQuero encontrar Iemanjá\nEm alto mar sei que ela está\nOferendas vou levar (2x)"
  },
  {
    id: "ym-lo-6", subcategoriaId: "sub-yemanja-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Retira a jangada do mar...",
    letra: "Retira a jangada do mar\nMãe d'água mandou avisar\nQue hoje não pode pescar\nPois hoje tem festa no mar (2x)\n\nE, e, e, e, e, e Iemanjá\nEla é ela é a rainha do mar\nTraz pente, traz espelho o, o, o, o\nPra ela se enfeitar o, o, o, o\nTraz flores, traz perfumes\nEnfeita todo o mar"
  },
  {
    id: "ym-lo-7", subcategoriaId: "sub-yemanja-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vou à praia grande...",
    letra: "Eu vou à praia grande, eu vou pro mar\nLevar botões de rosas à Iemanjá\nEu vou à praia, vou riscar ponto na areia\nVou pedir à Mãe Sereia\nTodas as forças do mar\nQue nos proteja\nCom seu manto inteiro branco\nQue nos cubra com os encantos\nQue tem as ondas do mar (REVISAR)"
  },
  {
    id: "ym-lo-8", subcategoriaId: "sub-yemanja-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu sou filha de Yabá...",
    letra: "Eu sou filha de Yabá\nYabá é minha mãe\nA rainha do tesouro\n\nOh doce Yabá no fundo do mar (3x)"
  },
  {
    id: "ym-lo-9", subcategoriaId: "sub-yemanja-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Mar, misterioso mar...",
    letra: "Mar, misterioso mar\nQue vem do horizonte\nÉ o berço das sereias\nLendário e fascinante\n\nOlha o canto da sereia\nIalaó, oquê, ialoá\nEm noite de lua cheia\nOuço a sereia cantar\nE o luar\nE o luar tão lindo\nEntão se encanta\nCom as doces melodias\nOs madrigais vão despertar\n\nEla mora no mar\nEla brinca na areia\nNo balanço das ondas\nA paz, ela semeia (2x)\nE toda noite ela bailava\nTransformando o mar em flor\nCom o seu filho na morada\nMorada, morada de amor\n\nAguntê, arabô\nCaiala e Sobá\nOloxum, Ynaê\nJanaina é Iemanjá (2x)"
  },
  {
    id: "ym-lo-10", subcategoriaId: "sub-yemanja-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Seu colar é de conchas...",
    letra: "Seu colar é de conchas\nSeu vestido se arrasta na areia\nEla tem cheiro de mar\nEla sabe cantar canto de sereia (2x)\n\nO Janaína, quando estou feliz eu choro\nO Janaína deixa eu dormir no seu colo (2x)\n\nÈ no teu colo que eu afogo a minha sede\nQuis te pescar\nMas caí na tua rede\nFeita de fios e de cabelos emaranhados\nMoro no mar e hoje sou seu namorado (2x)"
  },
  {
    id: "ym-tr-1", subcategoriaId: "sub-yemanja-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava sentado na areia...",
    letra: "Estava sentado na areia\nOuvindo as ondas do mar\nNo céu tinha muitas estrelas\nE a lua estava a brilhar\nSozinho e perdido eu estava\nSem, sem saber me encontrar\nMas de repente uma voz me falou baixinho\nTenha fé em Oxalá (2x)\n\nEra ela\nA Deusa do mar\nQue coisa mais linda\nMamãe Iemanjá\nEra ela\nA Deusa do mar\nEstendendo a suas mãos para nos abençoar (2x)"
  },
  {
    id: "ym-tr-2", subcategoriaId: "sub-yemanja-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fiz um pedido à mamãe Sereia...",
    letra: "Eu fiz um pedido à mamãe Sereia\nA Iemanjá, para nunca mais pecar (2x)\n\nFoi na areia\nFoi numa noite\nNa areia branca do mar\nOh lua branca no céu\nIluminou seu divino mar\n\nSereia\nOh rainha do mar, Sereia. (2x)\n\nFoi na areia (2x)\nFoi numa noite\nNa areia branca do mar"
  },
  {
    id: "ym-tr-3", subcategoriaId: "sub-yemanja-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "O pescador pegou seu veleiro...",
    letra: "O pescador\nPegou seu veleiro e foi\nPescar no reino de Iemanjá (2x)\n\nVeleiro voltou sozinho\nE a sereia\nSereia do mar levou\n\nOh como é belo viver no mar\nNo reino de Iemanjá (2x)"
  },
  {
    id: "ym-tr-4", subcategoriaId: "sub-yemanja-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu escrevi um pedido na areia...",
    letra: "Eu escrevi um pedido na areia\nPedindo a Zambi pra me socorrer\nEu escrevi um pedido na areia\nMas foi mãe d'água\nQuem veio me valer (2x)\n\nE foi nas ondas do mar\nQue entreguei os meus problemas\nE aprendi a confiar\nQue todo mal não dura para sempre\nQue a paz é uma semente\nQue precisa semear\n\nE no horizonte do mar tão infinito\nIemanjá me acolheu\nE me deu um mundo tão mais bonito\nEu abri meu coração\nEla me estendeu a mão\nE entreguei meu caminhar a Iemanjá (2x)"
  },
  {
    id: "ym-cr-1", subcategoriaId: "sub-yemanja-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Vamos saravar mãe Iemanjá...",
    letra: "Vamos saravar mãe Iemanjá\nVamos todos juntos jogar flores no mar\nÉ do mar, é do mar, é do mar\nÉ do mar minha mãe sereia\nÉ do mar, é do mar, é do mar\nÉ do mar, é nas águas, é nas areias\nVamos saravar mãe Iemanjá\nVamos todos juntos jogar flores no mar\nÉ do mar, é do mar, é do mar\nÉ do mar minha sereia\nPapai risca ponto nas pedras\nMamãe risca ponto na areia"
  },
  {
    id: "og-cg-1", subcategoriaId: "sub-ogum-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se meu Pai é Ogum, Ogum...",
    letra: "Se meu Pai é Ogum, Ogum\nVencedor de demanda\nVem de Aruanda\nPra saldar filhos de Umbanda (2x)\nOgum, Ogum, Ogum, Iara\nOgum, Ogum, Ogum, Iara\nSalve a coroa dele\nSalve a Sereia do Mar\nOgum, Ogum Iara\n\nOgum em seu cavalo corre\nE a sua espada reluz\nOgum em seu cavalo corre\nE a sua espada reluz\nOgum, Ogum Megê\nSua bandeira cobre os filhos de Jesus\nOgum iê!"
  },
  {
    id: "og-cg-2", subcategoriaId: "sub-ogum-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Pisa na linha de Umbanda...",
    letra: "Pisa na linha de Umbanda\nQue eu quero ver\nOgum Sete Ondas\nPisa na linha de Umbanda\nQue eu quero ver\nOgum Beira Mar\nPisa na linha de Umbanda\nQue eu quero ver\nOgum Iara, Ogum Megê\nOlha a banda aruê\nOlha pisa no reino o cangira (3x)\nTata de umbanda o cangira"
  },
  {
    id: "og-cg-3", subcategoriaId: "sub-ogum-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu tenho 7 Espadas que me defender...",
    letra: "Eu tenho 7 Espadas que me defender\nEu tenho Ogum em minha companhia (2x)\nOgum é meu Pai\nOgum é meu Guia\nEle vai baixar\nNa fé de Zambi e da Virgem Maria (2x)"
  },
  {
    id: "og-cg-4", subcategoriaId: "sub-ogum-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Que cavaleiro é aquele...",
    letra: "Que cavaleiro é aquele\nQue vem cavalgando pelo céu azul\nÉ seu Ogum Matinata\nÉ defensor\nDo Cruzeiro do Sul (2x)\n\nE, e, e\nE, e, á\nPisa na umbanda o cangira\nPisa no gongar (2x)\n\nOlha que barco bonito\nQue vem navegando a luz do luar\nÉ seu Ogum Sete Ondas\nQue vem ao encontro\nDe Ogum Beira-Mar\n\nE, e, e\nE, e, á\nPisa na umbanda o cangira\nPisa no gongar (2x)"
  },
  {
    id: "og-cg-5", subcategoriaId: "sub-ogum-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum é rei, É rei do cariri...",
    letra: "Ogum é rei\nÉ rei do cariri (2x)\n\nQue mal eu fiz a meu pai\nQue Ogum não vem aqui (2x)"
  },
  {
    id: "og-cg-6", subcategoriaId: "sub-ogum-chegada", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "É, seu Beira Mar...",
    letra: "É, seu Beira Mar\nÉ, seu Beira Mar\nÉ ordenança de São Jorge na Umbanda\nEle é Ogum\nÉ seu Beira Mar (2x)\n\nTravou batalhas pelo imenso mar azul\nOxalá lhe convocou\nPor ordem de Olorum\nPara na Terra empunhar sua bandeira\nDe um guerreiro da falange de Ogum\n\nÉ Beira Mar\n\nÉ, seu Beira Mar\nÉ, seu Beira Mar\nÉ ordenança de São Jorge na Umbanda\nEle é Ogum\nÉ seu Beira Mar (2x)\n\nHoje vira no terreiro\nRecebendo os Orixás\nEnsinando a cada irmão\nA missão que irá prestar\nÉ guardião\nDe uma casa de caridade\nQue propaga pelo mundo\nA paz, o amor e a humildade"
  },
  {
    id: "og-lo-1", subcategoriaId: "sub-ogum-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Filho de Pemba bebe água no rochedo...",
    letra: "Filho de Pemba bebe água no rochedo\nFilho de Ogum corre campo e não tem medo (2x)\nVou pedir ao criador\nQue derrame o seu amor\nAos nossos guias\nE ao nosso Babalaô"
  },
  {
    id: "og-lo-2", subcategoriaId: "sub-ogum-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Salve Ogum Megê, Ogum Rompe Mato...",
    letra: "Salve Ogum Megê\nOgum Rompe Mato\nOgum Beira Mar (2x)\nEle trabalha na areia meu Pai\nEle trabalha no mar (auê)\nEle trabalha na areia meu Pai\nEle trabalha no mar"
  },
  {
    id: "og-lo-3", subcategoriaId: "sub-ogum-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "A sua espada brilha no raiar do dia...",
    letra: "A sua espada brilha no raiar do dia\nSeu Beira Mar é filho da virgem Maria\nSeu Beira Mar, beira na areia\nSeu Beira Mar é filho da virgem Maria"
  },
  {
    id: "og-lo-4", subcategoriaId: "sub-ogum-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu não seria nada, Se não fosse Ogum...",
    letra: "Eu não seria nada\nSe não fosse Ogum\nPara abrir a minha estrada (2x)\nValente guerreiro aqui chegou\nVencedor de demanda meu protetor\nEm sua trajetória meu pai luta contra o mal\nFoi nos campos de batalha que se tornou general\n\nEu não seria nada\nSe não fosse Ogum\nPara abrir a minha estrada (2x)\n\nSalve Ogum de Ronda\nSalve seu Ogum Megê\nSaravá Beira Mar\nOgum Iara, Ogum de Lei\nSalve toda a falange\nDo glorioso guerreiro\nMeu pai vence demanda\nAqui dentro do terreiro"
  },
  {
    id: "og-lo-5", subcategoriaId: "sub-ogum-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele é cavaleiro santo...",
    letra: "Ele é cavaleiro santo\nSeu cavalo é branco\nEle é general\n\nÉ forte\nUsa armadura\nEle é valente\nLuta contra o mal\n\nA sua espada é reluzente\nPra defender a gente\nNão deixar cair\n\nEle é nosso pai Ogum\nEle é Jeci Jeci\nEle é Patacori\n\nEle é Jeci Jeci\nEle é Patacori (2x)"
  },
  {
    id: "og-lo-6", subcategoriaId: "sub-ogum-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Mandei fazer um capacete de penas...",
    letra: "Mandei fazer\nUm capacete de penas\nPara usar antes da alvorada (2x)\nVermelho e branco verde e azul\nEsse capacete tem as cores de Ogum (2x)\nDe Ogum Naruê de Ogum Matinata\nDe Ogum Naruê de Ogum Matinata\nQuando uso o capacete ouço o toque da alvorada (2x)"
  },
  {
    id: "og-lo-7", subcategoriaId: "sub-ogum-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Quem me dera Ogum, Para ser meu guia...",
    letra: "Quem me dera Ogum\nPara ser meu guia (2x)\nEle é praça de cavalaria\nÉ ordenança da virgem Maria"
  },
  {
    id: "og-lo-8", subcategoriaId: "sub-ogum-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi, eu vi seu Rompe Mato no mar...",
    letra: "Eu vi, eu vi seu Rompe Mato no mar\nEu vi, eu vi com seu Ogum Beira Mar (2x)\nSalve as crianças na praia\nSalve a sereia no mar\nSarava seu Beira Mar\nEle é chefe de gongar (2x)\nSarava, Ogum, ogum, ogum e a coroa de rei (2x)\nSeu Ogum gira na cangira de umbanda\nSeu Ogum gira na cangira de Oxalá (2x)\nSarava, sarava, sarava"
  },
  {
    id: "og-lo-9", subcategoriaId: "sub-ogum-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "A Umbanda clareou...",
    letra: "A Umbanda clareou\nA Umbanda clareou\nClareou, clareou\nEsse grande Orixá\nClareou, clareou\nSobre a luz da lua cheia\nLá do alto da pedreira\nOlhando a cachoeira\n\nQuem é o cavaleiro\nQuem é o cavaleiro\nQue veio a cavalgar\nMontado em seu cavalo branco\nCom sua espada empunhar\n\nÉ Ogum, meu pai\nOgunhê, meu pai\nCavaleiro de Oxalá\nCom sua espada suprema\nEle é o senhor dos caminhos\nEle é o rei do Humaitá!\n\nSaravá pai Ogum\nOgunhê, Ogunhê\nEle é o tata, ele é o tata\nEle é o tata no arerê\nSaravá pai Ogum\nOgunhê, Ogunhê\nEle é o tata, ele é o tata\nEle é o tata no arerê"
  },
  {
    id: "og-lo-10", subcategoriaId: "sub-ogum-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu sou filha de Naruê...",
    letra: "Eu sou filha de Naruê\nArmada com as espadas de Megê\nUngida pelas mãos de Matinata\nRegida pelas leis de Ogum de Lei\nMeu protetor é Beira Mar\nIara no caminho a me guiar\nCoragem quem me deu foi Rompe-Mato\nOgum me ensinou o que é amar\n\nOgum, meu pai, vem me valer\nNa fé de Zambi, nada vou temer\nOgum, meu pai, vem me guiar\nNa minha estrada caminhar (2x)"
  },
  {
    id: "og-tr-1", subcategoriaId: "sub-ogum-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Nesta casa de guerreiro (Ogum)...",
    letra: "Nesta casa de guerreiro (Ogum)\nVim de longe pra rezar (Ogum)\nRogo a Deus pelos doentes (Ogum)\nNa fé de Obatalá (Ogum)\nOgum salve a Casa Santa (Ogum)\nOs presentes e os ausentes (Ogum)\nSalve nossas esperanças (Ogum)\nSalve os velhos e crianças (Ogum)\nNego veio e ensinou (Ogum)\nNa cartilha de Aruanda (Ogum)\nE Ogum não esqueceu (Ogum)\nComo vencer a demanda (Ogum)\nA tristeza foi embora (Ogum)\nNa espada de um guerreiro (Ogum)\nE a luz no romper da aurora (Ogum)\nVai brilhar neste terreiro (Ogum)"
  },
  {
    id: "og-tr-2", subcategoriaId: "sub-ogum-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum já venceu...",
    letra: "Ogum já venceu\nJá venceu, já venceu\nOgum vem de Aruanda\nE quem lhe manda é Deus (2x)\nEle vem beirando o rio\nEle vem beirando o mar\nSalve Santo Antônio da Calunga\nBenedito e Beira Mar (2x)\n\nPor entre matas\nPor entre mares e terra\nEu entendi o que meu Pai quis dizer (2x)\nQue Ogum não devia beber\nQue Ogum não devia fumar\nMais a fumaça são as nuvens que passam\nE a cerveja as ondas do mar (2x)"
  },
  {
    id: "og-tr-3", subcategoriaId: "sub-ogum-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Quem Beira Rio, Beira Rio...",
    letra: "Quem Beira Rio, Beira Rio\nBeira Mar\nO que se ganha de Ogum\nSó Ogum pode tirar (2x)\n\nSeu Ogum de Ronda\nÉ quem vem girar\nE vem trazendo folhas\nPra descarregar (2x)"
  },
  {
    id: "og-tr-4", subcategoriaId: "sub-ogum-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxalá está chamando Ogum lá no Humaitá...",
    letra: "Oxalá está chamando\nOgum lá no Humaitá\nPra lhe dar uma bandeira\nE mandar ele jurar (2x)\nSe ele é capitão\nEle vai jurar!\nE se for de Angola também vai jurar\nE se for Ogum de Lei – ele vai jurar\nE se for de Nagô – também vai jurar"
  },
  {
    id: "og-tr-5", subcategoriaId: "sub-ogum-trabalho", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Na porta da Romaria...",
    letra: "Na porta da Romaria\nEu vi um cavaleiro de ronda (2x)\nTrazia um escudo no braço\nE uma lança na mão\nOgum guerreiro venceu e matou o dragão (2x)"
  },
  {
    id: "og-tr-6", subcategoriaId: "sub-ogum-trabalho", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum de Lei, Não me deixe sofrer...",
    letra: "Ogum de Lei\nNão me deixe sofrer\nTanto assim (2x)\nQuando eu morrer\nVou passar lá na Aruanda\nSarava Ogum\nSarava seu Sete Ondas"
  },
  {
    id: "og-tr-7", subcategoriaId: "sub-ogum-trabalho", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Bandeira linda de Ogum...",
    letra: "Bandeira linda de Ogum\nQue está içada lá no Humaitá (2x)\nRepresentando general de Umbanda\nPai Ogum venceu demanda lá nos campos do Humaitá (2x)"
  },
  {
    id: "og-tr-8", subcategoriaId: "sub-ogum-trabalho", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum partiu pra guerra...",
    letra: "Ogum partiu pra guerra\nOgum tocou clarim (2x)\nDo seu exército todo\nEle é comandante sim\n\nSão dois irmãos\nNa madrugada\nSeu Ogum Iara seu Ogum Matinata (2x)"
  },
  {
    id: "og-tr-9", subcategoriaId: "sub-ogum-trabalho", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "General, general, meu general...",
    letra: "General, general, meu general\nGeneral, general do mar\nGeneral, general, meu general\nGeneral capitão do mar\n\nAuê, Auê\nAuê capitão Guanabara auê (2x)"
  },
  {
    id: "og-tr-10", subcategoriaId: "sub-ogum-trabalho", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum guerreiro de umbanda...",
    letra: "Ogum guerreiro de umbanda\nSeu ponto veio firmar (2x)\nEle pede ao Sol e a Lua\nO Paranga, para clarear (2x)\nA coroa de ouro é mariwô (2x)\nOgum é tatá, é tatá\nA coroa de ouro é mariwô (2x)"
  },
  {
    id: "og-tr-11", subcategoriaId: "sub-ogum-trabalho", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum, meu guerreiro de umbanda...",
    letra: "Ogum, meu guerreiro de umbanda\nCavaleiro supremo é vencedor de demandas\nÉ sentinela de pai Oxalá\nÉ remador, de Iemanjá\n\nSenhor da lua, ilumina meus caminhos\nToma conta da minha vida\nE me livre dos perigos (2x)"
  },
  {
    id: "og-cr-1", subcategoriaId: "sub-ogum-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi assobiou...",
    letra: "Oxossi assobiou\nPra passar no Humaitá\nOxossi assobiou\nPra passar no Humaitá\nPra falar com Ogum Megê\nMensageiro de Oxalá\nPra falar com Ogum Megê\nMensageiro de Oxalá"
  },
  {
    id: "og-cr-2", subcategoriaId: "sub-ogum-cruzado", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Auê, auê, Ogum Beira Mar auê...",
    letra: "Auê, auê, Ogum Beira Mar auê\nAuê, auê, Ogum Beira Mar auê\nIansã virou o tempo\nPra Oxum não governar\nMas durante o barra-vento\nOxum se pôs a cantar\nAuê, auê, Ogum Beira Mar auê\nAuê, auê, Ogum Beira Mar auê"
  },
  {
    id: "og-cr-3", subcategoriaId: "sub-ogum-cruzado", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Iemanjá cadê Ogum...",
    letra: "Iemanjá cadê Ogum\nFoi com Oxossi ao Rio Jordão\nForam saudar São João Batista\nE batizar Cosme e Damião\n\nSeu cavalo corre\nSua espada reluz\nSua bandeira cobre\nTodos os filhos de Jesus (2x)\n\nSeu cavalo corre\nSua espada reluz\nAuê, seu Ogum Iara\nAos pés da Santa Cruz"
  },
  {
    id: "ox-cg-1", subcategoriaId: "sub-oxum-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se minha mãe é Oxum...",
    letra: "Se minha mãe é Oxum\nÉ na Umbanda e no Candomblé (2x)\n\nOra Yeyeo, Yeyeo, minha mãe\nYeyeo, minha mãe Oxumaré (2x)\n\nQuando ela vem beirando o rio\nColhendo lírios pra nos ofertar\nMamãe Oxum ora Yeyeo\nMamãe Oxum\nOrixá desça e vem nos abençoar"
  },
  {
    id: "ox-cg-2", subcategoriaId: "sub-oxum-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Sobre o clarão da lua...",
    letra: "Sobre o clarão da lua\nAs águas da cascata\nParecem de prata (2x)\n\nÉ um lindo véu\nQue vem da fonte da Oxum\nQue vem do céu (2x)\n\nYeyeo mamãe Oxum\nDona do ouro\nYeyeo Oxumaré\nÉs meu tesouro (2x)"
  },
  {
    id: "ox-cg-3", subcategoriaId: "sub-oxum-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fui ao cantuá pagar promessa...",
    letra: "Eu fui ao cantuá pagar promessa\nLevei ouro maior, um adê pra Yeyeo (2x)\nChora Yeyeo\nA minha fé é verdadeira eu peço vem abençoar (2x)\n\nOh meu Deus como é lindo\nO céu se abre e mãe Oxum vem surgindo\nUouou\nÓh meu Deus como é lindo\nO céu se abre e mãe Oxum vem surgindo"
  },
  {
    id: "ox-cg-4", subcategoriaId: "sub-oxum-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Meu Deus, Mas que luz é aquela...",
    letra: "Meu Deus, Mas que luz é aquela,\nQue vem, lá do alto das pedreiras (2x)\n\nÉ a estrela de mamãe Oxum,\nIluminando todas as cachoeiras."
  },
  {
    id: "ox-lo-1", subcategoriaId: "sub-oxum-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi mamãe Oxum na cachoeira...",
    letra: "Eu vi mamãe Oxum na cachoeira\nSentada na beira do rio (2x)\n\nColhendo lírios, lírios ê\nColhendo lírios, lírios á\nColhendo lírios pra enfeitar nosso gonga (2x)"
  },
  {
    id: "ox-lo-2", subcategoriaId: "sub-oxum-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi na beira do rio aonde Oxum chorou...",
    letra: "Foi na beira do rio aonde Oxum chorou (2x)\nChora Yeyeo, choram os filhos seus"
  },
  {
    id: "ox-lo-3", subcategoriaId: "sub-oxum-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Caminhando pela mata...",
    letra: "Caminhando pela mata\nRefletida na cascata\nVi uma flor se mirar (2x)\n\nEra de grande beleza\nPossuía tal pureza\nPerfumava todo ar\n\nFoi nesse exato momento\nQue como um sonho eu contemplo\nA Oxum a se banhar\nE só então eu percebi\nQue a linda flor que vi\nEra a deusa do Ijexá\n\nYeyeo\nYeyeo\nFoi na água da cascata\nQue a Oxum apareceu (2x)"
  },
  {
    id: "ox-lo-4", subcategoriaId: "sub-oxum-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Nuvem de poeira d'água...",
    letra: "Nuvem de poeira d'água\nQue sai da cascata da deusa Oxum (2x)\nBeleza pura, linda e cristalina\nEssa deusa menina com o perfume da flor\nEncanto doce da natureza, inspira riqueza, vaidade e amor\nÔôô\n\nNuvem de poeira d'água\nQue sai da cascata da deusa Oxum (2x)\nQuando se banha na beira do rio\nO Sol irradia energia e calor\nDona do ouro, deusa poderosa, pedra preciosa cheia de esplendor\nÔôô"
  },
  {
    id: "ox-lo-5", subcategoriaId: "sub-oxum-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxum panda, Oxum docô...",
    letra: "Oxum panda\nOxum docô\nE olha eu\nOlha Oxumaré ô (4x)\n\nE olha eu, e olha eu\nOlha Oxumaré ô (2x)"
  },
  {
    id: "ox-lo-6", subcategoriaId: "sub-oxum-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi mamãe Oxum chorando...",
    letra: "Eu vi mamãe Oxum chorando\nEntão eu perguntei porque (2x)\n\nEla me respondeu\nEstou chorando é por causa de você\nEla me respondeu\nSem os meus filhos eu não poderei viver\n\nEstou chorando é por causa de você\nSem os meus filhos eu não poderei viver (2x)"
  },
  {
    id: "ox-lo-7", subcategoriaId: "sub-oxum-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Deusa das cachoeiras e cascatas...",
    letra: "Deusa das cachoeiras e cascatas\nCompanheira de Oxóssi o dono das matas\nE também a rainha de meu pai Xangô\nEterna\nCom o seu abebê\nQuando dança é faceira\nÉs a dona do ouro óh mãe verdadeira\nSob a lua de prata\nDe joelhos eu vou implorar\nTeu manto\nÉ o meu acalanto na hora da dor\nE na minha tristeza meu pranto enxugou\nOra Yeyeo mãe Oxum\nRainha do Ijexá\nSeu canto irradia alegria traz a paz traz harmonia\nEm suas águas eu a vejo se banhar\nOxum como é lindo vê-la bailar\n\nVou pedir na cachoeira ora Yeyeo nunca me deixe sozinha\nEu sou filho seu\nNa sua mina tem ouro seu tesouro tem poder\nToda vez que eu precisar mamãe Oxum vai me valer (2x)"
  },
  {
    id: "ox-lo-8", subcategoriaId: "sub-oxum-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Fonte de luz, No meio das matas...",
    letra: "Fonte de luz\nNo meio das matas\nCascata de oração\nEm ti a minha vida começou\nYeyeo, Yeyeo, yeyeo, yeyeo\nOs meus olhos\nRefletem o seu brilho\nSeus rios\nAbraçam os seus filhos\nSeu canto\nSuaviza toda dor\nYeyeo, Yeyeo, yeyeo, yeyeo\nMamãe Oxum de todas as águas\nDas flores a mais perfumada\nInunda a minha alma com amor\nYeyeo, Yeyeo, yeyeo, yeyeo"
  },
  {
    id: "ox-lo-9", subcategoriaId: "sub-oxum-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Gorjeia a passarada...",
    letra: "Gorjeia\nA passarada num lindo céu azul\nPra saudar o reino encantado de Oxum\nOxum Yapondá\nPor que meu Deus\nQue nesse seu mundo eu não posso entrar? (Oxum)\nSó pra ver como é lindo o amanhecer\n\nNatureza sorrindo\nPrimavera florindo (2x)\n\nSe meu é de amor ôôô\nSe meu mundo é de paz\nPaz e amor\nGuardado\nGuardado, pelo manto sagrado de Yapondá (Oxum)\nQue vem lá, lá do seu mundo abençoar\n\nAcaba a guerra enfim\nTira o ódio e põe o amor (2x)\nQue o mundo possa ser\nSempre um jardim de flor (2x)\n\nLaiá, laiá, lalaiá ô, ô, ô, ô, ô, ô\nLaiá, laiá, lalaiá, ô, ô, ô, ô, ô, ô\nQue o mundo possa ser\nSempre um jardim de flor (2x)"
  },
  {
    id: "ox-lo-10", subcategoriaId: "sub-oxum-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Minha mãe é uma flor...",
    letra: "Minha mãe é uma flor\nNo jardim do senhor\nEla é uma rosa\nUma rosa em botão (2x)\n\nEla é toda beleza\nEla é toda de azul\nEla é um amor\nMas ela é Senhora da Conceição (2x)"
  },
  {
    id: "ox-tr-1", subcategoriaId: "sub-oxum-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Brilhou a estrela matutina...",
    letra: "Brilhou a estrela matutina\nRolaram pedras de Xangô\nQuem será essa menina\nQue a lua iluminou\nCanta no clarão da lua\nDança no calor do sol\nTodo ouro se ilumina\nPra saudar Oxum Menina\nPois Oxum é Mãe Maior\n\nSaravá, Oxum Menina!\nOxum é Mãe Maior\nYeyeo\nÔ,ô,ô,ô,ô,ô,ô,ô,ô,ô,ô\n\nOxum Yeyeo, Oxum yeyeo (2x)\n\nYeyeo Oxum,\nOxum Yeyeo (2x)"
  },
  {
    id: "ox-tr-2", subcategoriaId: "sub-oxum-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Se um dia eu fui feliz...",
    letra: "Se um dia eu fui feliz\nFoi Oxum, foi Oxum\nQuem quis (2x)\n\nNa beira do mar, cadê?\nÁgua doce do meu amor\nÁgua que me faz viver\nBeija o mar\n\nQuando você me tocou\nDominou meu ser (2x)\n\nLevou meu amor\nNão quis devolver (2x)\n\nManda chamar\nManda chamar yeyeo, manda chamar\nManda chamar yeyeo, manda chamar (2x)\n\nQuem ama, se encanta\nBebe o abô, como bebe o mel da cana (2x)\nDona Oxum Apará\nÉ quem anda na beira do mar\nDona Oxum Apará\nÁgua rara de se encontrar (2x)"
  },
  {
    id: "ox-tr-3", subcategoriaId: "sub-oxum-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Mamãe Oxum tem proteção de Zambi...",
    letra: "Mamãe Oxum\nTem proteção de Zambi\nOlha seus filhos\nCom olhar sereno\nEla é beleza, ela é pureza\nEla nos traz a proteção\nDe Nazareno (2x)"
  },
  {
    id: "nn-cg-1", subcategoriaId: "sub-nana-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Atraca-atraca que aí vem Nanã...",
    letra: "Atraca-atraca que aí vem Nanã\nSereia (2x)\n\nÉ Nanã, É Oxum\nÉ Oxum, É Nanã,\nÉ Sereia,\nÉ Nanã, É Oxum\nÉ Oxum É Nanã,\nÉ Sereia do mar"
  },
  {
    id: "nn-cg-2", subcategoriaId: "sub-nana-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "O mar estava bem calmo naquela manhã...",
    letra: "O mar estava bem calmo naquela manhã\nEu implorei à Oxalá\nQue me dissesse o que eu queria saber\nSobre os encantos de Nanã Buruquê\nUm Raio de Luz veio anunciar\nA chegada da Cinda mais velha, senhora Santana de Pai Oxalá (2x)\n\nA saluba vovó\nMe leva pras ondas do mar senhora Santana, Nanã Buruquê\nMe leva pras ondas do mar senhora Santana venha me valer (2x)"
  },
  {
    id: "nn-lo-1", subcategoriaId: "sub-nana-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã, Nanã, É Nanã Buruquê...",
    letra: "Nanã, Nanã\nÉ Nanã Buruquê (2x)\nA sua saia é Roxa\nA sua casa é de sapê (2x)"
  },
  {
    id: "nn-lo-2", subcategoriaId: "sub-nana-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Fui chamado de cordeiro...",
    letra: "Fui chamado de cordeiro,\nMas não sou cordeiro não\nPrefiro ficar calado\nÀ falar sem ter razão\nO meu lamento\nÉ uma singela oração\nMinha santa de fé\nMeu cantar é uma prece\nQue eu faço à Nanã ê\n\nSou de Nanã eua, eua, eua ê (2x)"
  },
  {
    id: "nn-lo-3", subcategoriaId: "sub-nana-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Deusa das águas salobras...",
    letra: "Deusa das águas salobras\nA ti sempre louvarei\nNas horas da aflição\nSei que vai me socorrer\nSe as mazelas me atingirem\nSei que há de me curar\nSe houver espinhos em meus caminhos\nSei que há me livrar\n\nÊ, ê, ê\nSaluba ê,\nA mais velhas Yabá\nMãe de Obaluaê (2x)\n\nVovó governe a minha vida\nVovó venha me valer\nÓ minha santa tão querida\nTe louvo Nanã Buruquê\n\nÊ, ê, ê\nSaluba ê,\nA mais velhas Yabá\nMãe de Obaluaê (2x)"
  },
  {
    id: "nn-lo-4", subcategoriaId: "sub-nana-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Salve Nanã, Salve senhora das águas...",
    letra: "Salve Nanã, Salve senhora das águas\nSalve Nanã, Salve senhora Santana\nSalva Nanã com sua força e bondade\nSalve Nanã Capurucaia na umbanda."
  },
  {
    id: "nn-lo-5", subcategoriaId: "sub-nana-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã É orixá de umbanda...",
    letra: "Nanã É orixá de umbanda\nNanã é mãe de nossa senhora\n\nVamos saravar Nanã, Nanã\nPois ela vai valei-me agora (2x)"
  },
  {
    id: "nn-lo-6", subcategoriaId: "sub-nana-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "É na mesa de umbanda que eu vi Nanã...",
    letra: "É na mesa de umbanda que eu vi Nanã\nEu vi Nanã (2x)\nAuê, auê\nEu vi Nanã (2x)"
  },
  {
    id: "nn-lo-7", subcategoriaId: "sub-nana-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "São flores, Nanã, são flores...",
    letra: "São flores, Nanã, são flores\nSão flores, Nanã Buruquê\nSão flores, Nanã, são flores,\nDo seu filho Obaluaê"
  },
  {
    id: "nn-tr-1", subcategoriaId: "sub-nana-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "É Nanã, É Nanã auê...",
    letra: "É Nanã, É Nanã auê,\nÉ Nanã,\nÉ Nanã Buruquê (2x)\nAo rodar da sua saia\nManda forças pra nossa banda\nOs filhos que tanto lhe pedem\nNanã corta toda mironga\nNa barra da sua saia\nCarrega filhos de Umbanda\nCom suas águas sagradas\nDescarrega a nossa banda"
  },
  {
    id: "nn-tr-2", subcategoriaId: "sub-nana-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã é Nanã buruquê...",
    letra: "Nanã é Nanã buruquê (2x)\nÉ o orixá mais velho do céu\nNanã é Nanã buruquê\nOlha seus filhos agora que eu quero ver (2x)"
  },
  {
    id: "nn-tr-3", subcategoriaId: "sub-nana-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Senhora Santana, Quando andou no mundo...",
    letra: "Senhora Santana\nQuando andou no mundo (2x)\nEla cruzou a terra\nE abençoou o mundo (2x)"
  },
  {
    id: "nn-tr-4", subcategoriaId: "sub-nana-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Me lava Nanã, me lava...",
    letra: "Me lava Nanã, me lava\nCom suas águas Nanã sagradas\nLave meus olhos para que eu possa ver\nA luz divina dos meus guias a me proteger\nLave meus ouvidos para que eu possa ouvir\nOs ensinamentos de bons caminhos a seguir\nLave minha boca para que eu possa dizer\nMensagens de amor a quem precisa receber\n\nLave Nanã o meu coração\nEncha ele de alegria e retire a aflição\nÔ Nanã Buruquê\nAs suas águas me dão forças pra vencer\nÔ Nanã Buruquê\nQuero em suas águas uma bênção receber"
  },
  {
    id: "beijada-1", subcategoriaId: "sub-beijada-pontos", ordem: 0, favorito: false, criadoEm: 1775829769157,
    titulo: "Antes de o sol nascer...",
    letra: "Antes de o sol nascer\nA lua se esconder\nMadrugada chegar (2x)\nA lua clareia a praia, ela é prateada\nE vê como clareia a beira mar\nEu vi\n\nEu vi as crianças brincando no banco de areia oh\nEram os 7 filhos de Iemanjá (2x)"
  },
  {
    id: "beijada-2", subcategoriaId: "sub-beijada-pontos", ordem: 1, favorito: false, criadoEm: 1775829769157,
    titulo: "Doun hoje é o seu dia...",
    letra: "Doun hoje é o seu dia, hoje tem alegria em todo terreiro\nDoun oh Doun\nSarava Zambi na linha de umbanda em todo terreiro (2x)"
  },
  {
    id: "beijada-3", subcategoriaId: "sub-beijada-pontos", ordem: 2, favorito: false, criadoEm: 1775829769157,
    titulo: "Mas quem é seu irmão...",
    letra: "Mas quem é seu irmão\nQuem é seu irmão\nQuem é seu irmão\nÉ Cosme Damião\nÉ Cosme Damião (2x)"
  },
  {
    id: "beijada-4", subcategoriaId: "sub-beijada-pontos", ordem: 3, favorito: false, criadoEm: 1775829769157,
    titulo: "Ele foi doutor...",
    letra: "Ele foi doutor\nEle foi doutor\nEle me curou\nNuma brincadeira que ele brincou\nEle me curou (2x)"
  },
  {
    id: "beijada-5", subcategoriaId: "sub-beijada-pontos", ordem: 4, favorito: false, criadoEm: 1775829769157,
    titulo: "Eram três crianças...",
    letra: "Eram três crianças\nEu me lembro bem\nO terreiro em festa\nEu me lembro bem\nVieram de um a um\nE era Cosme Damião e Doun (2x)"
  },
  {
    id: "beijada-6", subcategoriaId: "sub-beijada-pontos", ordem: 5, favorito: false, criadoEm: 1775829769157,
    titulo: "Eu vou chamar o meu pai...",
    letra: "Eu vou chamar o meu pai (2x)\nPra ele ver quem chegou (2x)\nE chegou para brincar (2x)\nCom as crianças também (2x)"
  },
  {
    id: "beijada-7", subcategoriaId: "sub-beijada-pontos", ordem: 6, favorito: false, criadoEm: 1775829769157,
    titulo: "Andorinha que voa no ar...",
    letra: "Andorinha que voa no ar\nChega pertinho do céu\nAvisa Papai Oxalá\nQue hoje é dia das crianças\n\nNós vamos brincar com as crianças\nCosme Damião e Doun (2x)"
  },
  {
    id: "beijada-8", subcategoriaId: "sub-beijada-pontos", ordem: 7, favorito: false, criadoEm: 1775829769157,
    titulo: "Pra que cocada branca...",
    letra: "Pra que cocada branca\nPra chorar, pra chorar (2x)\nSe não tiver guaraná\nEu vou chorar eu vou chorar (2x)"
  },
  {
    id: "beijada-9", subcategoriaId: "sub-beijada-pontos", ordem: 8, favorito: false, criadoEm: 1775829769157,
    titulo: "Papai me solta um balão...",
    letra: "Papai me solta um balão\npara todas as crianças que vem lá do céu (2x)\nTem doce mamãe, tem doce mamãe\nTem doce, lá no jardim (2x)"
  },
  {
    id: "beijada-10", subcategoriaId: "sub-beijada-pontos", ordem: 9, favorito: false, criadoEm: 1775829769157,
    titulo: "Cosme e Damião, Damião...",
    letra: "Cosme e Damião, Damião\nCadê Doum\nDoum ta passeando\nNo cavalo de Ogum"
  },
  {
    id: "beijada-11", subcategoriaId: "sub-beijada-pontos", ordem: 10, favorito: false, criadoEm: 1775829769157,
    titulo: "Ele é pequenininho...",
    letra: "Ele é pequenininho\nMora no fundo do mar\nSua madrinha é sereia\nSeu padrinho é beira mar (2x)\n\nNo fundo do mar, tem areia (2x)\nSeu padrinho é beira mar\nSua madrinha é sereia"
  },
  {
    id: "beijada-12", subcategoriaId: "sub-beijada-pontos", ordem: 11, favorito: false, criadoEm: 1775829769157,
    titulo: "Quando a lua brilha no céu...",
    letra: "Quando a lua brilha no céu\nClareia Umbanda (2x)\nClareia a Beijada\nQue vem\nLá de Aruanda (2x)"
  },
  {
    id: "beijada-13", subcategoriaId: "sub-beijada-pontos", ordem: 12, favorito: false, criadoEm: 1775829769157,
    titulo: "Tem bala de coco e peteca...",
    letra: "Tem bala de coco e peteca\nDeixa a Beijada brincar (2x)\nHoje é dia de festa\nBeijada vem sarava"
  },
  {
    id: "beijada-14", subcategoriaId: "sub-beijada-pontos", ordem: 13, favorito: false, criadoEm: 1775829769157,
    titulo: "Tem paciência, Dois Dois...",
    letra: "Tem paciência, Dois Dois\nEu to camisa azul\nE para o ano que vem\nDois Dois come caruru"
  },
  {
    id: "beijada-15", subcategoriaId: "sub-beijada-pontos", ordem: 14, favorito: false, criadoEm: 1775829769157,
    titulo: "Lá no céu tem três estrelas...",
    letra: "Lá no céu tem, três estrelas\nTodas as três em carreirinha (2x)\nUma é Cosme e Damião\nA outra é Mariazinha (2x)"
  },
  {
    id: "beijada-16", subcategoriaId: "sub-beijada-pontos", ordem: 15, favorito: false, criadoEm: 1775829769157,
    titulo: "Na Bahia tem um coco...",
    letra: "Na Bahia tem um coco\nCoco que faz a cocada (2x)\nCoco que faz o manjar\nPara dar para Beijada (2x)"
  },
  {
    id: "beijada-17", subcategoriaId: "sub-beijada-pontos", ordem: 16, favorito: false, criadoEm: 1775829769157,
    titulo: "Doum, Doum, Doum...",
    letra: "Doum, Doum, Doum, Doum, Cosme e Damião\nDoum, Doum, Doum, brinca sentado no chão (2x)"
  },
  {
    id: "beijada-18", subcategoriaId: "sub-beijada-pontos", ordem: 17, favorito: false, criadoEm: 1775829769157,
    titulo: "Fui no jardim colher as rosas...",
    letra: "Fui no jardim, colher as rosas\nA vovozinha deu-me a rosa mais formosa (2x)"
  },
  {
    id: "beijada-19", subcategoriaId: "sub-beijada-pontos", ordem: 18, favorito: false, criadoEm: 1775829769157,
    titulo: "Cosme e Damião ó Doum...",
    letra: "Cosme e Damião ó Doum\nCrispim, Crispiniano\nSão os filhos de Ogum (2x)"
  },
  {
    id: "beijada-20", subcategoriaId: "sub-beijada-pontos", ordem: 19, favorito: false, criadoEm: 1775829769157,
    titulo: "Filho de fé estava doente...",
    letra: "Filho de fé estava doente\nFilhos de fé estava chorando (2x)\nFilhos de fé viu Ibeijada\nFilhos de fé já está cantando"
  },
  {
    id: "beijada-21", subcategoriaId: "sub-beijada-pontos", ordem: 20, favorito: false, criadoEm: 1775829769157,
    titulo: "Que lindo cavalo branco...",
    letra: "Que lindo cavalo branco\nQue aquele menino vem montando\nDescendo naquela serra\nDizendo que é filho de soldado\n\nÉ Damião, é Damião\nÉ Damião no lindo cavalo de Ogum (2x)"
  },
  {
    id: "beijada-22", subcategoriaId: "sub-beijada-pontos", ordem: 21, favorito: false, criadoEm: 1775829769157,
    titulo: "Bahia é terra de dois...",
    letra: "Bahia é terra de dois\nÉ terra de dois irmãos\nGovernador da Bahia\nÉ São Cosme e São Damião (2x)"
  },
];
= [
  {
    id: "lo-1", subcategoriaId: "1774886896028-q58etyt", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi, filho de Iemanjá...",
    letra: `Oxossi, filho de Iemanjá
Divindade do clã de Ogum
É Ibualama, ele é Ilé
Que Oxum levou no rio
E nasceu Logun-edé!

Sua natureza é da lua
Na lua Oxóssi é Odé Odé-Odé, Odé-Odé
Rei de Keto Caboclo da mata Odé-Odé.

Quinta-feira é seu ossé
Axoxó, feijão preto, camarão e amendoim
Azul e verde, suas cores
Calça branca rendada
Saia curta estampada

Ojá e couraça prateada
Na mão ofá, iluquerê
Okê okê, okê arô, okê
A jurema é a árvore sagrada
Okê arô, Oxóssi, okê okê

Na Bahia é São Jorge
No Rio, São Sebastião
Oxóssi é quem manda
Nas bandas do meu coração.`,
  },
  {
    id: "lo-2", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Mas como é bonito, assistir festa nas matas...",
    letra: `Mas como é bonito, assistir festa nas matas
Ouvir o som das cascatas e o lindo canto do sabiá (do sabiá)
Que noite linda, que bela noite de luar
Foi no clarão da lua
Que eu vi o seu Oxossi passar

A mata estava em festa ô ô ô
Toda coberta de flores,
Até os passarinhos cantam, em seu louvor
Ele é nosso protetor
Ô ô ô ô ô quanta beleza,
Ô ô ô ô ô quanto esplendor,
Como é bom ter a certeza
Que o seu Oxossi é nosso protetor`,
  },
  {
    id: "lo-4", subcategoriaId: "1774886896028-q58etyt", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Vermelho é a cor do sangue de meu pai...",
    letra: `Vermelho é a cor do sangue de meu pai
E verde é a cor das matas onde mora {bis}
Vamos saravar meu pai Oxóssi em sua banda
Vamos saravar, a banda que ele mora {bis}`,
  },
  {
    id: "lo-5", subcategoriaId: "1774886896028-q58etyt", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi Odé, ele é São Sebastião...",
    letra: `Oxossi Odé, ele é São Sebastião
Mas ele reina
Lá nas matas e nos campos
Ele é o dono, da lavoura de pai Tupã

Ore rê Ore rê ô
Ore rê Ore rê ô
Mas o senhor ore rê {bis}

Para sua vida melhorar
E nunca lhe faltar o que comer
Acenda uma vela
Lá nas matas para Oxossi
E peça que ele irá lhe socorrer

Ore rê Ore rê ô
Ore rê Ore rê ô
Mas o senhor ore rê {bis}`,
  },
  {
    id: "lo-6", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi é Rei no Céu...",
    letra: `Oxossi é Rei no Céu
Oxossi é Rei na Terra
Ele não desce do Céu sem coroa
Sem sua nansga de Guerra`,
  },
  {
    id: "lo-7", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi Zambi quem criou o mundo...",
    letra: `Foi Zambi quem criou o mundo
Só Zambi pode governar
Foi Zambi quem criou
As estrelas que ilumina
Oxossi lá no Jurema`,
  },
  {
    id: "lo-8", subcategoriaId: "1774886896028-q58etyt", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi chover, eu vi relampear...",
    letra: `Eu vi chover
Eu vi relampear
Mas mesmo assim o céu estava azul

Favorecendo a folha da Jurema
Oxossi é reina
De norte a sul (2x)`,
  },
  {
    id: "lo-9", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu me orgulho de carregar esse Orixá...",
    letra: `Eu me orgulho
De carregar esse Orixá
Ele é meu pai Oxossi
Filho de pai Oxalá
Ele é meu pai Oxossi
Que é um grande Orixá (2x)

Ele caça, ele pesca
Ele é rei aqui na Umbanda
Vamos salvar pai Oxossi
Que comanda a nossa banda
Ele é dono das matas
Quando vem trás seu axé
Caça para os Orixás
E ajuda a quem tem fé

Ele é o rei de Keto
Filho de Yemanjá
Ele é meu pai Oxossi
Que eu louvo em cantar
Ele trás prosperidade
Ele trás muita fartura
Quem confia em pai Oxossi
Não vive na amargura`,
  },
  {
    id: "lo-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Seu arranca-toco é de aruanda...",
    letra: `Seu arranca-toco é de aruanda,
É de nagô zambe (2x)
Quando ele chega na umbanda
Auê, auê (2x)`,
  },
  {
    id: "lo-11", subcategoriaId: "sub-oxossi-louvacao", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo sete flechas nasceu...",
    letra: `Caboclo sete flechas nasceu
No jardim das oliveiras
(Pegar o resto do ponto)`,
  },
  {
    id: "lo-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo a sua mata é verde...",
    letra: `Caboclo a sua mata é verde, verde é da cor do mar
Sarava o cacique da jurema
Sarava o cacique da jurema
Sarava o cacique da jurema
Jurema (2x)`,
  },
  {
    id: "ch-1", subcategoriaId: "sub-oxossi-chegada", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "São Miguel, São Miguel...",
    letra: `São Miguel, São Miguel
São Miguel está chamando (2x)
Dai-me forças são Miguel para chamar os caboclos da umbanda (2x)`,
  },
  {
    id: "ch-2", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Tambor, tambor...",
    letra: `Tambor, tambor
Vai chamar quem mora longe (2x)
Salve Oxossi o rei das matas
Ogum do Humaitá
Pai Xangô lá na pedreira
Iansã no jacutá (2x)`,
  },
  {
    id: "ch-3", subcategoriaId: "sub-oxossi-chegada", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogã chama todos os caboclos...",
    letra: `Ogã chama todos os caboclos
Chama todos caboclos no batuque do tambor (2x)
Diga pra ela que já é hora
Diga pra ele, que a umbanda está chamando`,
  },
  {
    id: "ch-4", subcategoriaId: "sub-oxossi-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele vem da mata, ele trouxe flecha...",
    letra: `Ele vem da mata
Ele trouxe flecha
Pra filho de fé saudar
Ele é filho de cacique
Ele é caboclo verdadeiro
É caçador é flecheiro
Vem aqui pra trabalhar

Ele é filho de cacique
É caboclo verdadeiro
Ele é seu Pena de Ouro
Que vem saudar o seu terreiro (2x)`,
  },
  {
    id: "ch-5", subcategoriaId: "sub-oxossi-chegada", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava na beira do rio sem poder atravessar...",
    letra: `Estava na beira do rio sem poder atravessar
Chamei pelo caboclo
Caboclo tupinambá (2x)
Tupinambá chamei
Chamei tupinambá ea (2x)`,
  },
  {
    id: "ch-6", subcategoriaId: "sub-oxossi-chegada", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Ainda tem caboclo debaixo da samambaia...",
    letra: `Ainda tem caboclo debaixo da samambaia (2x)
Sai, sai caboclo,
Debaixo da samambaia (2x)`,
  },
  {
    id: "ch-7", subcategoriaId: "sub-oxossi-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxalá chamou e já mandou buscar...",
    letra: `Oxalá chamou e já mandou buscar
Todos caboclos da jurema
Para o seu jurema (2x)

Pai Oxalá, é rei do mundo inteiro
E já deu ordens pra jurema
Mandar seus capangueiros

Mandai, mandai
Linda cabocla jurema
O seu terreiro
Que já é ordem suprema (2x)`,
  },
  {
    id: "ch-9", subcategoriaId: "sub-oxossi-trabalho", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "A sua flecha é carijó...",
    letra: `A sua flecha é carijó seu bodoque é indaiá
Todos caboclos vem serenos como o sereno é
Oxossi é rei da macaia Oxossi é rei da guiné
Ele atirou
Ele atirou e ninguém viu
O seu Oxossi é quem sabe
Aonde a flecha caiu (2x)`,
  },
  {
    id: "cg-1", subcategoriaId: "sub-oxossi-chegada", ordem: 13, favorito: false, criadoEm: 1774882639699,
    titulo: "Uma rosa no jardim apareceu...",
    letra: `Uma rosa no jardim apareceu
Mamãe está chamando e lá vou eu
Ele é caboclo, ele vem da sua aldeia
Seu Ubirajara é um caboclo e não bambeia`,
  },
  {
    id: "cg-2", subcategoriaId: "sub-oxossi-chegada", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele vem da mata, ele vem girar...",
    letra: `Ele vem da mata, ele vem girar
O caboclo laranjeira tá de ronda no gongar
O caboclo laranjeira
Ele promete e não esquece
Ele traz laranja doce
Para dar a quem merece

Ele vem na lei de umbanda
mensageiro de oxala
sua flecha tem mironga
so atira pra acertar`,
  },
  {
    id: "cg-3", subcategoriaId: "sub-oxossi-chegada", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "Que cabocla é essa toda vestida de pena...",
    letra: `Que cabocla é essa
Toda vestida de pena é a cabocla jurema
Dona de seu jacutá
Rainha da mata virgem que chegou pra trabalhar`,
  },
  {
    id: "cg-4", subcategoriaId: "sub-oxossi-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Lua que clareia o mundo...",
    letra: `Lua que clareia o mundo
Que clareia a terra e o mar
Clareia as matas de Oxossi
Cidade da jurema

Clareia os caminhos
Que os caboclos vão passar
Para vir na umbanda trabalhar (2x)`,
  },
  {
    id: "cg-5", subcategoriaId: "sub-oxossi-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava sentado na cadeira da jurema...",
    letra: `Estava sentado na cadeira da jurema
Porque mandaram me chamar (2x)
O juremi, o Jurema
Porque mandaram me chamar (2x)`,
  },
  {
    id: "cg-6", subcategoriaId: "sub-oxossi-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Nas matas lá da jurema eu vi uma estrela brilhar...",
    letra: `Nas matas lá da jurema
Eu vi uma estrela brilhar (2x)
Era uma estrela de Oxossi
Anunciando que caboclo vai chegar (2x)

Okê, Okê caboclo
Caboclo Sete Estrelas no gongar
Okê, Okê caboclo
Vem de aruanda, pra seus filhos ajudar (2x)`,
  },
  {
    id: "cg-8", subcategoriaId: "sub-oxossi-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Que penacho é aquele...",
    letra: `Que penacho é aquele
É um penacho de arara (2x)

Ai quando rompe a mata virgem
Quando rompe a mata virgem
É o caboclo Ubirajara (2x)`,
  },
  {
    id: "cg-9", subcategoriaId: "sub-oxossi-chegada", ordem: 12, favorito: false, criadoEm: 1774882639699,
    titulo: "Ubirajara quando chegou...",
    letra: `Ubirajara quando chegou
Não atendeu caboclo nenhum (2x)
Sete mundos, sete mundos(2x)
Ele se chama Ubirajara, meu pai Oxossi é caçador de outro mundo (2x)`,
  },
  {
    id: "tr-1", subcategoriaId: "sub-oxossi-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Quanto tempo que eu não bambeio...",
    letra: `Quanto tempo que eu não bambeio
E hoje vim pra trabalhar (2x)
O caboclo samambaia
Veio aqui pra trabalhar (2x)`,
  },
  {
    id: "tr-2", subcategoriaId: "1774889196337-js9i8vt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo roxo da pele morena...",
    letra: `Caboclo roxo da pele morena
Ele é Oxossi é caçador lá da jurema (2x)
Ele jurou e tornou a jurar
Em tomar os conselhos que a jurema vem lhe dar
Ele jurou e tornou a jurar
Não deixar os perversos nessa banda entrar`,
  },
  {
    id: "tr-4", subcategoriaId: "1774886896028-q58etyt", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se a gameleira de Oxossi faz sombra...",
    letra: `Se a gameleira de Oxossi faz sombra
Meu pai Oxalá me responda (2x)
Ai como é bonito
Que bonito é
O meu pai Oxossi
No seu are, rê (2x)`,
  },
  {
    id: "tr-6", subcategoriaId: "sub-oxossi-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Na beira do rio verde...",
    letra: `Na beira do rio verde
Eu vi o caboclo na areia (2x)
Pescando peixe miúdo
Pra levar pra sua aldeia (2x)
Caboclo pegue o anzol
Que a noite é linda e clara
Vai pescar no rio verde
Por ordem de mar iara (2x)`,
  },
  {
    id: "tr-7", subcategoriaId: "sub-oxossi-trabalho", ordem: 15, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo não tem caminho para caminhar...",
    letra: `Caboclo não tem caminho para caminhar (2x)
Ele caminha por cima da folha, por baixo da folha por todo lugar (2x)
Seus caminhos estão abertos
Caboclo pode passar
Ele vem girar, ele vem girar
Caboclo filho de umbanda, filho Oxossi e neto de Oxalá

Quando a lua sair
Ele vem girar (2x)`,
  },
  {
    id: "tr-10", subcategoriaId: "sub-oxossi-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi numa tarde serena...",
    letra: `Foi numa tarde serena
Lá nas matas da jurema que eu vi os caboclos bradar (2x)
Kiô, kiô, kiô que era
Toda mata está em festa
Sarava seu Sete Flechas
Ele é rei da floresta (2x)`,
  },
  {
    id: "tr-12", subcategoriaId: "sub-oxossi-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Mandei fazer, o que banda eu fiz...",
    letra: `Mandei fazer, o que banda eu fiz
Um capacete de penas

Salve seu Iambuga
É capitão das matas
É cacique da Jurema (2x)`,
  },
  {
    id: "tr-13", subcategoriaId: "sub-oxossi-trabalho", ordem: 16, favorito: false, criadoEm: 1774882639699,
    titulo: "Me perdi meu pai eu me perdi...",
    letra: `Me perdi meu pai eu me perdi
Lá na mata do amazona eu me perdi (2x)
Procurei seu Iambuga não achei
Vim aqui no seu terreiro e encontrei`,
  },
  {
    id: "tr-14", subcategoriaId: "sub-oxossi-trabalho", ordem: 18, favorito: false, criadoEm: 1774882639699,
    titulo: "Caçador na beira do caminho...",
    letra: `Caçador na beira do caminho
Não me mate essa coral na estrada
Ela abandonou sua choupana caçador
Foi no romper, da madrugada`,
  },
  {
    id: "tr-15", subcategoriaId: "sub-oxossi-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi é caçador eu gosto de ver caçar...",
    letra: `Oxossi é caçador eu gosto de ver caçar
De dia ele caça na mata
A noite ele caça no mar (2x)`,
  },
  {
    id: "tr-16", subcategoriaId: "sub-oxossi-chegada", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo mora nas matas...",
    letra: `Caboclo mora nas matas, nas matas moram os orixás
Oh diga a ele para vir firmar seu ponto
Auê, auê, auâ (2x)`,
  },
  {
    id: "tr-17", subcategoriaId: "sub-oxossi-trabalho", ordem: 17, favorito: false, criadoEm: 1774882639699,
    titulo: "Estrela matutina clareia a banda sem parar...",
    letra: `Estrela matutina clareia a banda sem parar (2x)
Dizem que meu pai é um caboclo
Auê, auê, auâ (2x)`,
  },
  {
    id: "tr-18", subcategoriaId: "sub-oxossi-trabalho", ordem: 19, favorito: false, criadoEm: 1774882639699,
    titulo: "No alto daquela serra, eu avistei uma vila",
    letra: `perguntei o nome da vila para uma cabocla formosa

ela entao me respondeu
O nome da vila é vila nova(2x)

Rê, o are re, o nome da vila é vila nova`,
  },
  {
    id: "tr-19", subcategoriaId: "sub-oxossi-trabalho", ordem: 11, favorito: false, criadoEm: 1774882639699,
    titulo: "No alto daquela serra, debaixo de um pe de anga",
    letra: `No alto daquela serra
Debaixo de um pé de angá
Eu vi seu Iambuga atirar a sua flecha e não errar

Zuou, zuou, a sua flecha zuou (2x)`,
  },
  {
    id: "tr-20", subcategoriaId: "sub-oxossi-trabalho", ordem: 12, favorito: false, criadoEm: 1774882639699,
    titulo: "Oh, cadê gira mundo o Pemba...",
    letra: `Oh, cadê gira mundo o Pemba
Oh, tá na pedreira o Pemba
E seus cambones Pemba
O veado no mato é corredor
Cadê meu mano caçador
Cadê o caboclo ventania
Ele é o nosso guia`,
  },
  {
    id: "tr-21", subcategoriaId: "sub-oxossi-trabalho", ordem: 20, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi a cabocla iara sentada na beira do rio...",
    letra: `Eu vi a cabocla iara sentada na beira do rio
Pegando peixe meu senhor
(escrever esse ponto)`,
  },
  {
    id: "cu-1", subcategoriaId: "sub-oxossi-curimba", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo bom é amigo um do outro...",
    letra: `Caboclo bom é amigo um do outro (2x)
Caboclo bom, ele anda atrás do outro (2x)`,
  },
  {
    id: "cu-2", subcategoriaId: "sub-oxossi-curimba", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi fez uma caçada...",
    letra: `Oxossi fez uma caçada
Caçou uma juriti
Da caça ele fez banquete
E a pena pra dividir

Pena com pena
Pena pra dividir (2x)`,
  },
  {
    id: "cu-3", subcategoriaId: "sub-oxossi-curimba", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Caboclo pisa aqui que piso lá...",
    letra: `Caboclo pisa aqui que piso lá
Caboclo eu gostei do seu pisar`,
  },
  {
    id: "de-1", subcategoriaId: "sub-oxossi-demanda", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se você é caboclo eu quero ver balancear...",
    letra: `Se você é caboclo eu quero ver balancear (2x)
Arreia arreia capangueiro da jurema
Oh jurema (2x)`,
  },
  {
    id: "de-2", subcategoriaId: "sub-oxossi-demanda", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Quando sai da mata virgem...",
    letra: `Quando sai da mata virgem
O urro de uma onça na Bahia se criou (2x)
E os meus manos ficaram chorando
Ficaram rezando pra seu salvador (2x)
Sua caverna estava desprezada
A mesma caverna que a jurema se criou (2x)`,
  },
  {
    id: "de-3", subcategoriaId: "sub-oxossi-demanda", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Sucuri, Jibóia...",
    letra: `Sucuri, Jibóia
Quando vem beirando o mar
Olha como cocoriou
A sua cobra coral (2x)`,
  },
  {
    id: "de-4", subcategoriaId: "sub-oxossi-demanda", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Caçador que matou meu sabiá...",
    letra: `Caçador que matou meu sabiá (2x)
Ele cantava baixinho no alto da serra
Lá em Jurema (2x)`,
  },
  {
    id: "de-5", subcategoriaId: "sub-oxossi-demanda", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ah não mata que eu não entre...",
    letra: `Ah não mata que eu não entre
Ah não a pau que eu não a suba
A não a esse passarinho
Que meu botoque não derrube
Oh curimba
Zum, zum, zum o curimba, é de correr`,
  },
  {
    id: "de-6", subcategoriaId: "sub-oxossi-demanda", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Em mata que Makuku entra...",
    letra: `Em mata que Makuku entra
Yambu não pia (2x)
Ele caboclo é flecheiro é atirador
Na mata Yambu não pia (2x)`,
  },
  {
    id: "1774889674435-5a8wjqy", subcategoriaId: "sub-oxossi-trabalho", ordem: 13, favorito: false, criadoEm: 1774889674435,
    titulo: "Calunga ê, calunga â",
    letra: `Calunga ê, calunga â
chegou da calunga, pra trabalhar(2x)

chegou da calunga ele é caboclo ele é flecheiro
chegou da calunga é amarrador de feiticeiro`,
  },
  {
    id: "1774889853101-hjzzj7o", subcategoriaId: "sub-oxossi-trabalho", ordem: 21, favorito: false, criadoEm: 1774889853101,
    titulo: "cabocla formosa a sua flecha ela atirou(PROCURAR)",
    letra: `saiu da calunga iemanha foi quem mandou

ela mandou pra ajudar os filhos seus,
jandira, jacira iracema apareceu`,
  },
  {
    id: "1774889983708-ljmah2p", subcategoriaId: "sub-oxossi-trabalho", ordem: 7, favorito: false, criadoEm: 1774889983708,
    titulo: "caboclo filho da pedreira",
    letra: `caboclo filho da pedreira
la da cachoeira, vem os seus filhos guiar

firma seu ponto caboclo
quando na umbanda chegar
corumataí é o chefe do congar`,
  },
  {
    id: "1774890232438-1z3yjyb", subcategoriaId: "sub-oxossi-trabalho", ordem: 3, favorito: false, criadoEm: 1774890232438,
    titulo: "la no topo do mundo",
    letra: `la no topo do mundo
na pedreira de tupã
um aimore estava sentado
seu penacho é encarnado
o seu brado é entoado
o que é que ele faz la

la no topo do mundo
urubatão vem a terra girar ô ô

vem a terra girar ô ô (3x)

Quando vai se pondo o sol
quando vai nascendo o dia
quem faz o mundo girar
é o urubatão da guia ô ô

vem a terra girar ô ô
vem a terra girar ô ô
vem a terra girar ô ô`,
  },
  {
    id: "1774890328431-uw5z21z", subcategoriaId: "sub-oxossi-trabalho", ordem: 14, favorito: false, criadoEm: 1774890328431,
    titulo: "Mas o seu manaca ja não da mais flor... PROCURAR",
    letra: `Mas o seu manaca ja não da mais flor...

ele vai mandar plantar(2x)

uma semente la no seu jacuta

mas como é lindo a madrugada
filho de umbanda veio trabalhar(2x)`,
  },
  {
    id: "1774890474827-z0b2gn9", subcategoriaId: "sub-oxossi-trabalho", ordem: 6, favorito: false, criadoEm: 1774890474827,
    titulo: "é caçador, é caçador, é caçador ...",
    letra: `é caçador, é caçador, é caçador  mas não é advinhador(2x)
ele é o caboclo da beira dagua
na linha de umbanda ele vem trabalhar
segura o terreiro e seu jacuta`,
  },
  {
    id: "1774890562289-d794u8e", subcategoriaId: "sub-oxossi-trabalho", ordem: 5, favorito: false, criadoEm: 1774890562289,
    titulo: "estava na mata caçando, no meio da mata caiapó...",
    letra: `estava na mata caçando, no meio da mata caiapó
mas era seu ubirajara que estava caçando a cobra cipó.`,
  },
  {
    id: "1774890646304-dwutbir", subcategoriaId: "sub-oxossi-trabalho", ordem: 4, favorito: false, criadoEm: 1774890646304,
    titulo: "piava no alto da serra...",
    letra: `piava no alto da serra
piava de se admirar

mas era uma enorme jiboia
que estava presa no bodoque 
de tupinamba(2x)`,
  },
  {
    id: "1774890726983-0xsoegx", subcategoriaId: "sub-oxossi-trabalho", ordem: 8, favorito: false, criadoEm: 1774890726983,
    titulo: "O indio O indio O indio....",
    letra: `O indio O indio O indio
ele é o indio aonde o sol nasceu

ja foi cacique
ja foi pajé

Hoje é guerreiro da tribo dos aimoré`,
  },
  {
    id: "1774891268778-xekpubu", subcategoriaId: "sub-oxossi-trabalho", ordem: 9, favorito: false, criadoEm: 1774891268778,
    titulo: "eu vi no alto da serra, cabocla dando seu brado de guerra",
    letra: `Eu vi no Alto da serra, Cabocla Jurema dando seu brado de guerra 
Kiô, kiô, dentro da mata o seu brado ecoou  (2x)

Com o seu arco e sua flecha e a sua lança de Indaiá, 
Jurema dava o seu brado de guerra,
 anunciando que ia caçar, 
sete luas se passaram quando a Jurema voltou,
 toda a caça que ela trazia ao Cacique  entregou,
 e ele então alegre cantou em seu louvor, 

O o o Jurema, o o o Jurema, linda caçadora bela Cabocla de pena  (2x)`,
  },
  {
    id: "1774891417238-yhn4jaj", subcategoriaId: "1774889196337-js9i8vt", ordem: 8, favorito: false, criadoEm: 1774891417238,
    titulo: "ó escutai o jurema, escutai quem ta chamando",
    letra: `ó escutai o jurema, escutai quem ta chamando
é a cabocla aimore
ela é quem avisar

que são jorge ja esta de ronda
para os perversos nao chegar

chega são jorge chega
Vem Aimoré saravá
Aimoré é uma cabocla
Que seus filhos gosta de ajudar`,
  },
  {
    id: "1774891523453-a5edd4s", subcategoriaId: "sub-oxossi-trabalho", ordem: 23, favorito: false, criadoEm: 1774891523453,
    titulo: "A mata estava escura...",
    letra: `A mata estava escura
veio um anjo e iluminou
no meio da mata virgem
raio de sol assuviou

mas ele é o rei, ele é o rei, ele é o rei
mas ele é o rei na umbanda ele é o rei (2x)`,
  },
  {
    id: "1774891611922-phwzrmt", subcategoriaId: "1774889196337-js9i8vt", ordem: 1, favorito: false, criadoEm: 1774891611922,
    titulo: "luar luar, caboclo da lua ja chegou",
    letra: `luar luar, caboclo da lua ja chegou (2x)

vai dizer a sua mae
que seus filhos ele curou(2x)`,
  },
  {
    id: "1774891673816-oj3gw6t", subcategoriaId: "1774889196337-js9i8vt", ordem: 2, favorito: false, criadoEm: 1774891673816,
    titulo: "luar luar, segue o seu andar o luar...",
    letra: `luar luar, segue o seu andar o luar (2x)

Sou um caboclo destemido
morador desse gongar
a viola me consola
para as magoas espalhar
no alto daquela serra
onde canta o sabia
onde tudo é riqueza ele é caboclo e mora la`,
  },
  {
    id: "1774891705573-in06l0u", subcategoriaId: "1774889196337-js9i8vt", ordem: 3, favorito: false, criadoEm: 1774891705573,
    titulo: "girou o sol, girou a lua",
    letra: `girou o sol, girou a lua
girou o caboclo e a sua cura`,
  },
  {
    id: "1774891774453-9pwpcpl", subcategoriaId: "1774889196337-js9i8vt", ordem: 4, favorito: false, criadoEm: 1774891774453,
    titulo: "batuque no terreiro, é tupinamba",
    letra: `batuque no terreiro, é tupinamba(2x)
é da pele vermelha, é tupinamba ô

Flecha, flecha, flecha
para o mal levar(2x)`,
  },
  {
    id: "1774891824854-7daav7i", subcategoriaId: "1774889196337-js9i8vt", ordem: 5, favorito: false, criadoEm: 1774891824854,
    titulo: "Cocorico fez um galo aue...",
    letra: `Cocorico fez um galo aue
no alto daquela serra(2x)
para ajudar esses filhos aue
todos os caboclos vem a terra(2x)`,
  },
  {
    id: "1774891875777-9l43z8o", subcategoriaId: "1774889196337-js9i8vt", ordem: 6, favorito: false, criadoEm: 1774891875777,
    titulo: "chamei minha cabocla de pena....",
    letra: `chamei minha cabocla de pena
chamei la das matas pra ela trabalhar

pra ver a força que a jurema tem
pra ver a força que a jurema da(2x)`,
  },
  {
    id: "1774892021416-o26eost", subcategoriaId: "sub-oxossi-curimba", ordem: 3, favorito: false, criadoEm: 1774892021416,
    titulo: "estrela sol e lua que clareia o jurema...",
    letra: `estrela sol e lua que clareia o jurema(2x)

é a curimba de todos os caboclos
com flecha e bodoque no reino da iara(2x)`,
  },
  {
    id: "1774892057238-dyqu2pg", subcategoriaId: "sub-oxossi-curimba", ordem: 4, favorito: false, criadoEm: 1774892057238,
    titulo: "Caboclo pisa aqui que eu piso la..",
    letra: `Caboclo pisa aqui que eu piso la
caboclo eu gostei do seu pisar.`,
  },
  {
    id: "1774892108288-f83mm50", subcategoriaId: "sub-oxossi-curimba", ordem: 5, favorito: false, criadoEm: 1774892108288,
    titulo: "como é bonito a curimba dos caboclos...",
    letra: `como é bonito a curimba dos caboclos
pisa na areia de rastro pro outro(2x)
salve a sereia
salve iemanja
salve os caboclos da beira do mar`,
  },
  {
    id: "1774892170451-870j0df", subcategoriaId: "sub-oxossi-curimba", ordem: 6, favorito: false, criadoEm: 1774892170451,
    titulo: "a jurema tem a jurema da(procurar melhor)",
    letra: `a jurema tem a jurema da
seu sete estrelas pra trabalhar`,
  },
  {
    id: "1774892412605-4j6ko1n", subcategoriaId: "1774889196337-js9i8vt", ordem: 7, favorito: false, criadoEm: 1774892412605,
    titulo: "koke koke o meus caboclos...",
    letra: `koke koke o meus caboclos
está em festa as matas do jurema
koke koke seu lirio verde, bravo guerreiro quem acabou de chegar

Esse caboclo valente, veio nos abençar
trazendo para a umbanda
a paz divina de pai oxala

deixou em sua macaia
pataca, trouxe manaca
essa erva é sagrada um forte remedio para lhe curar

koke koke o meus caboclos
está em festa as matas do jurema
koke koke seu lirio verde, bravo guerreiro quem acabou de chegar

peço licença a ossain
oxossi, nana buruque
para curar com essa erva  o filho enfermo de obaluar
tendo a certeza da graça
meu pai em canto em seu louvor
sarava seu lirio verde que dentro da banda nos abençoou`,
  },
  {
    id: "1774892562061-jjr69rd", subcategoriaId: "sub-oxossi-trabalho", ordem: 23, favorito: false, criadoEm: 1774892562061,
    titulo: "eu vi a cabocla iara sentada na beira do rio",
    letra: `Eu vi a cabocla Iara
Sentar na beira do rio
Eu vi a cabocla Iara
Sentar na beira do rio
Pegando peixe, meu senhor
Pegando peixe, meu senhor
Pra levar pra quem pediu
Pegando peixe, meu senhor
Pegando peixe, meu senhor
Pra levar pra quem pediu
Iara cabocla linda
Vem fazer sua obrigação
Iara cabocla linda
Vem fazer sua obrigação
No seu terreiro, meu senhor (2x)
Ela faz sua devoção
No seu terreiro, meu senhor (2x)
Ela faz sua devoção`,
  },
  {
    id: "1774894075512-rhwa12j", subcategoriaId: "sub-oxossi-chamada", ordem: 1, favorito: false, criadoEm: 1774894075512,
    titulo: "Eu vou pedir licença pra Oxossi",
    letra: `Eu vou pedir licença pra Oxossi
Pra trabalhar nas matas da Jurema (bis)

Bater cabeça pra Xangô, lá na pedreira
Ou levar flores pra Oxum na cachoeira`,
  },
  {
    id: "1774894113048-moibu18", subcategoriaId: "sub-oxossi-chamada", ordem: 2, favorito: false, criadoEm: 1774894113048,
    titulo: "Ele é caboclo, ele nao pode negar",
    letra: `Ele é caboclo, ele não pode negar
Ele tem seu capacete
Quem lhe deu foi Oxalá
Auê auê, meu pai eu quero ver
Se meu pai é Oxossi
Ou ogum de Aruê`,
  },
  {
    id: "1774894202777-5un26y1", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: 1774894202777,
    titulo: "Ela vem de sua mata vem de onde a cobra pia",
    letra: `Ela vem de sua mata vem de onde a cobra pia {bis}
Saravá seu Ubirajara, seu Sete Estrelas e a cabocla Jupira
Ela vem de sua mata vem de onde a cobra pia {bis}
Saravá seu sete estrelas, seu Arranca-toco e a cabocla Jupira...`,
  },
  {
    id: "1774894753798-5z6qman", subcategoriaId: "sub-oxossi-louvacao", ordem: 6, favorito: false, criadoEm: 1774894753798,
    titulo: "galo cantou na serra...",
    letra: `galo cantou na serraa
na mata estremeceu(2x)
caboclo seu pena verde, na cachoeira apareceu(2x)

ele é caboclo, flecheiro
que mora num rochedo
somente cobra coral, conhece dele o segredo(2x)

vem pelas margens do rio
em linha manha serena
caboclo seu pena verde
firma seu ponto na areia`,
  },
  {
    id: "1774894821785-su1h8zk", subcategoriaId: "sub-oxossi-louvacao", ordem: 8, favorito: false, criadoEm: 1774894821785,
    titulo: "eu venho das matas...",
    letra: `eu venho das matas, bem longe
bem longe
aonde o galo, cantou 
aonde a folha da jurema balanceou, balanceou`,
  },
  {
    id: "ia-cg-1", subcategoriaId: "sub-iansa-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Deu um clarão no céu...",
    letra: `Deu um clarão no céu
As nuvens se esconderam
Mas de repente deu uma ventania
Era a donas dos raios
Iansã que aparecia (x2)

Tão linda como o ouro na cor
Sua coroa é cravejada de brilhantes
Eparrêi, eparrêi Oyá
Ilumina meus caminhos
Por onde eu passar (x2)`,
  },
  {
    id: "ia-cg-2", subcategoriaId: "sub-iansa-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Olha que o Céu clareou...",
    letra: `Olha que o Céu clareou
Quando o dia raiou
Fez o filho pensar
A mãe do tempo mandou
A nova era chegou
Agora vamos cantar
No Humaitá Ogum Bradou
Seu Oxossi atinou
Que Iansã vai chegar
O Ogã já firmou
O atabaque afinou,
Agora vamos cantar

A Eparrêi, ela é Oyá ela é Oyá
A Eparrêi, é Iansã é Iansã
A Eparrêi
Quando Iansã vai pra batalha,
Todos cavaleiros param
Para ver ela passar (x2)`,
  },
  {
    id: "ia-cg-3", subcategoriaId: "sub-iansa-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eparrêi Oyá, Deusa dos ventos...",
    letra: `Eparrêi Oyá
Deusa dos ventos mensageira de Oxalá (x2)

Sarava santa guerreira
Dona do Sol e da Lua
Minha santa padroeira
Que os meus caminhos marcou
Proteção pra nossa banda
Eparrêi ó Bela Oyá
Moça rica de Aruanda
Venha nos abençoar`,
  },
  {
    id: "ia-cg-4", subcategoriaId: "sub-iansa-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Raios cruzando o céu...",
    letra: `Raios cruzando o céu
O mar começa a se agitar
Guerreira com a espada na mão
Girando num lindo bailar
Iansã mostrando sua força
Impondo o seu grande poder
Divina rainha da umbanda
Minha mãe eu lhe imploro
Venha me valer`,
  },
  {
    id: "ia-cg-5", subcategoriaId: "sub-iansa-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ô, ô, Ventania chegou...",
    letra: `Ô, ô
Ô, ô, ô, ô, ô, ô, ô, ô, ô
Ventania chegou
Ô, ô, ô, ô, ô, ô, ô, ô, ô
Ventania chegou
Tenho a certeza que com ela eu posso contar
Com minha fé
O mal irei derrotar
O terreiro toca atabaque
Em seu louvor
Lindas canções empenhadas
Com muito amor

Epahey, epahey, epahey
O daí me forças mamãe Iansã epahey (2x)

Ô, ô
Ô, ô, ô, ô, ô, ô, ô, ô, ô
Ventania chegou
Ô, ô, ô, ô, ô, ô, ô, ô, ô
Ventania chegou`,
  },
  {
    id: "ia-lo-1", subcategoriaId: "sub-iansa-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Raios que cruzam o ar... (Bela Oyá)",
    letra: `Raios que cruzam o ar
Na fúria da ventania
Vejo a força da Oyá
E o poder que ela irradia
Ela é a rainha da lei,
Do fogo ela é soberana,
Ao ouvir seu Eparrêi,
Meu coração se engalana

E Bela Oyá, E Bela Oyá
Eu sou filho da Matamba
Iansã eu vou louvar
Bela Oyá (x2)

Ela dança o aguêrê
Iansã, santa guerreira
Atabaques e afoxé,
Zuelando a noite inteira
Vou louvar a minha mãe,
Em forma de oração,
E o vento que vai ventar,
Vai levar esta canção, Bela Oyá

E Bela Oyá, E Bela Oyá
Eu sou filho da Matamba
Iansã eu vou louvar
Bela Oyá (x2)`,
  },
  {
    id: "ia-lo-2", subcategoriaId: "sub-iansa-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Guerreira, tens o bailar de um beija flor...",
    letra: `Guerreira, tens o bailar de um beija flor
Guerreira, o seu bailar me encantou (x2)

Senhora dos ventos,
Senhora do Balé,
Eparrêi ó bela Oyá,
Nessa Deusa eu tenho fé
Sua força vem do vento,
A sua beleza irradia,
É força da natureza,
É a força que me guia

Guerreira, tens o bailar de um beija flor
Guerreira, o seu bailar me encantou (x2)

Essa deusa tem um rei
Que em seu reino governou
Dividindo fortes raios esse rei é Pai Xangô
Com poder da ventania
Toda palha ela soprou
No xirê dos orixás
Omulu ela curou`,
  },
  {
    id: "ia-lo-3", subcategoriaId: "sub-iansa-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã, meu orixá estrela guia...",
    letra: `Iansã, meu orixá estrela guia
Tu és a própria ventania
Que em meu terreiro
Hoje louvo em meu gonga
Tu és,
A moça rica és formosa
És minha mãe és linda rosa,
No jardim suspenso de pai Oxalá
Guerreira,
És minha força,
És Minha fé,
Guardo comigo seu axé
Um misticismo da Bahia,
Louvo,
seu lindo relampear
Eparrêi Oyá
Ilumina o meu passar
Senhora da ventania

Louvo o vento
Louvo o raio
Louvo o relampear
Sarava santa guerreira
Sarava seu jacutá (x2)`,
  },
  {
    id: "ia-lo-4", subcategoriaId: "sub-iansa-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Quando Iansã chegou, Saravou Yalorixá...",
    letra: `Quando Iansã chegou,
Saravou Yalorixá,
Ogã Louvou sua Coroa
Eparrei Bela Oyá
Ela é moça bonita
Moça rica ela é
Conhecida dentro do santo
Ela é Iansã do Balé

Olha eu, Olha eu
Olha eu Bela Oyá
Olha eu, Olha eu
Ela é Iansã é o meu orixá (x2)`,
  },
  {
    id: "ia-lo-5", subcategoriaId: "sub-iansa-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã é a dona do mundo...",
    letra: `Iansã é a dona do mundo
Dona do fogo, da faísca e do trovão
Eparrei Iansã na Aruanda
Santa Barbara com a espada na mão`,
  },
  {
    id: "ia-lo-6", subcategoriaId: "sub-iansa-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Sarava Iansã do cabelo loiro...",
    letra: `Sarava Iansã do cabelo loiro
No mar tem água, na sua pedra tem ouro
Le, le le e
Le, le le á
Sarava Iansã que é rainha do ar`,
  },
  {
    id: "ia-lo-7", subcategoriaId: "sub-iansa-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Relampejou lá no céu, deixa clarear...",
    letra: `Relampejou lá no céu, deixa clarear
Vento soprou na palmeira, ê ah!
Salve a deusa do fogo, Oyá!
É Iansã quem chegou, deixa ela girar (2x)

Oh, guerreira, rainha desse jacutá
Seu encanto me fascina, você é quem me faz sonhar
É vento que sopra no meu coração
Energia que me faz vibrar de emoção
É fogo que aquece o meu anoitecer
É luz que me guia, é meu bem querer
Com sua espada eu venço a batalha
Minha fé em você não falha
Eparrêi, minha mãe, vem me proteger`,
  },
  {
    id: "ia-lo-8", subcategoriaId: "sub-iansa-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eparrei ô, Eparrei á, força de Oyá...",
    letra: `Eparrei ô, Eparrei á, Eparrei, força de Oyá (4x)

Ela é mais que temporal
Muito mais que ventania
Uma força sem igual
Um poder que arrepia
A bravura de mil homens
Tudo em uma só mulher
E por nós ela guerreia
Venha o mal de onde vier

Eparrei ô, Eparrei á, Eparrei, força de Oyá (4x)

Filha de santa guerreira
Meu caminho eu mesma traço
Fui criada em fogo alto
Tenho minha alma de aço
Agradeço à Iansã
Tudo o que ela me ensinou
A coragem de Ogum
E a justiça de Xangô`,
  },
  {
    id: "ia-de-1", subcategoriaId: "sub-iansa-demanda", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã, Cadê Ogum? Foi pro mar!...",
    letra: `Iansã, Cadê Ogum?
Foi pro mar!
Mas Iansã, Cadê Ogum?
Foi pro mar! (2x)

Iansã penteia
Os seus cabelos macios
Quando a luz da lua cheia
Clareia as águas dos rios
Ogum sonhava
Com a filha de Nanã
E pensava que as estrelas
Eram os olhos de Iansã

Mas Iansã, Cadê Ogum?
Foi pro mar! (4x)

Na terra dos orixás
Um amor se dividia
Entre um deus que era de paz
E outro deus que combatia
Como a luta só termina
Quando existe um vencedor
Iansã virou rainha na coroa de xangô

Mas Iansã, Cadê Ogum?
Foi pro mar!
Iansã, Cadê Ogum?
Foi pro mar! (2x)`,
  },
  {
    id: "ia-de-2", subcategoriaId: "sub-iansa-demanda", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Sonhei um sonho lindo...",
    letra: `Sonhei um sonho lindo
Sonho tão lindo
Que me encantou
Eu me banhava
Com as águas da Oxum
Que desciam da pedreira
De pai Xangô
Tempo virava
Ventos e o trovão roncou
Era a bela Oyá
Que nos meus sonhos vinha para me ajudar

Ela bailava sem ter os pés no chão,
Com sua espada, e seu cálice na mão
Era Iansã me dando a sua proteção (x2)`,
  },
  {
    id: "ia-tr-1", subcategoriaId: "sub-iansa-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Santa guerreira que ao meu lado caminha...",
    letra: `Santa guerreira que ao meu lado caminha
Com sua taça de ouro e sua espada na mão
És para mim toda grandeza
Venero sua beleza
Trago a em meu coração
A sua saia quando roda irradia
É Deusa da Ventania
A Rainha Trovão,
Meu pai Xangô
Iansã fez sua morada,
Ela roda sua saia
Quando ronca a trovoada (x2)

Eparrêi, Eparrêi Oyá
Sarava mãe Iansã, é Rainha dos Orixás (x2)`,
  },
  {
    id: "ia-tr-2", subcategoriaId: "sub-iansa-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Aê dim dim, Aê dim dá...",
    letra: `Aê dim dim
Aê dim dá
Oyá Matamba de Aruê
Oyá Matamba de Aruá`,
  },
  {
    id: "ia-tr-3", subcategoriaId: "sub-iansa-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Raio de luz clarão no céu...",
    letra: `Raio de luz clarão no céu
É ventania que vem lá
A noite inteira vento vem e vai
Rodopiando a bailar
Com a espada erguida no ar
Surge a guerreira
É Iansã

Varrendo os males
É Iansã

Oh mãe valei-me
Levai nesses ventos os nossos tormentos
Levai minha dor
E quando cessar a tempestade
E eu vislumbrar um novo amanhã
Explode em meu peito um brado Eparrei
Oh mãe Iansã

Põe no tacho azeite pra ferver que Oyá
Põe nele o tempero desse acarajé
Que é força e coragem pra seguir viagem
Filhos que tem fé (2x)`,
  },
  {
    id: "ia-tr-4", subcategoriaId: "sub-iansa-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "No amanhecer é que essa estrela brilha...",
    letra: `No amanhecer é
Que essa estrela brilha
No amanhecer é
Que ela me ilumina
Iansã senhora, do amanhecer
Sua espada brilha
Pra nos proteger (2x)

È Oyá
Iansã que nos conduz
É Oyá
Iansã com sua luz
Ao rodopiar faz o vento
Que a chuva trás
Pra lavar a terra
Semear a paz (2x)

È Oyá
Iansã que nos conduz
É Oyá
Iansã com sua luz
É santa guerreira
Se preciso for
Pra acabar com a guerra
Espantar a dor
É santa guerreira
Se preciso for
Pra acabar com a guerra
Semear o amor`,
  },
  {
    id: "ia-cr-1", subcategoriaId: "sub-iansa-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã tem um leque que venta...",
    letra: `Iansã tem um leque que venta
Pra abanar em dia de calor
Iansã mora nas pedreiras
Eu quero vê meu Pai Xangô`,
  },
  {
    id: "ia-cr-2", subcategoriaId: "sub-iansa-cruzado", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Iansã Orixá de Umbanda...",
    letra: `Iansã Orixá de Umbanda
Rainha do nosso gongá
Sarava Iansã lá na Aruanda, Eparrei!
Eparrei Iansã venceu demanda
Iansã, saravou pra Xangô
No céu, trovão roncou
E lá nas matas leão bradou
Sarava Iansã
Sarava Xangô`,
  },
  {
    id: "ia-cr-3", subcategoriaId: "sub-iansa-cruzado", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eram duas ventarolas...",
    letra: `Eram duas ventarolas
Duas ventarolas
Que vinham beirando o mar
Uma era Iansã Eparrei!
A outra era Iemanjá Odociaba

Iansã, Iansã, segura seu arerê o Iansã
Segura seu arerê o Iansã
O Iansã, o Iansã
Segura seu arerê`,
  },
  {
    id: "ym-cg-1", subcategoriaId: "sub-yemanja-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Uma Dúzia de rosas...",
    letra: `Uma Dúzia de rosas
A noite é tão linda
Eu vou para o mar
Eu vou tocando e cantando
Fazer meus pedidos
À deusa do mar (2x)
Mãe Iemanjá
Venha me ajudar
Mamãe Oxum
Venha nos saudar
Sou peregrino
Flores na areia pra deusa do mar (2x)`,
  },
  {
    id: "ym-cg-2", subcategoriaId: "sub-yemanja-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Saia do mar, linda sereia...",
    letra: `Saia do mar, linda sereia
Saia do mar venha brincar na areia
Saia do mar, sereia bela
Saia do mar venha brincar com ela`,
  },
  {
    id: "ym-cg-3", subcategoriaId: "sub-yemanja-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Oh santa de azul...",
    letra: `Oh santa de azul
Oh santa do mar
Vem ver seus filhos
Iemanjá (2x)
Iemanjá
Saia do mar
E venha ver
A sua Iaô (2x)
Odô, odô, odô odô Odôia`,
  },
  {
    id: "ym-cg-4", subcategoriaId: "sub-yemanja-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fui à beira da praia...",
    letra: `Eu fui à beira da praia
Pra ver o balanço do mar
Eu vi o seu rastro na areia
Me lembrei da sereia
Comecei a chamar (2x)

Oh Janaína vem ver
Oh Janaína vem cá
Receber suas flores
Que venho lhe ofertar (2x)`,
  },
  {
    id: "ym-lo-1", subcategoriaId: "sub-yemanja-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Iemanjá, deusa das águas claras...",
    letra: `Iemanjá, deusa das águas claras
Rainha das ondas, sereia do mar
Flores brancas na areia para lhe ofertar
Ó mamãe sereia
Uma estrela no céu brilhou
As ondas na areia chegou
Levando as flores pro mar
O Iemanjá as ondas vieram buscar as flores que eu vou lhe ofertar (2x)

O Iemanjá
Iemanjá Sobá (3x)`,
  },
  {
    id: "ym-lo-2", subcategoriaId: "sub-yemanja-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Estou ouvindo o lindo toque do tambor...",
    letra: `Estou ouvindo o lindo toque do tambor
É louvação à Iemanjá com muito amor (2x)

Oh iaô Iemanjá
Que todo amor vem de Oxalá
Oh iaô Iemanjá
Que toda dor leva pro mar (2x)`,
  },
  {
    id: "ym-lo-3", subcategoriaId: "sub-yemanja-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Mãe d'água rainha das ondas...",
    letra: `Mãe d'água rainha das ondas sereias do mar
Mãe d'água seu canto é bonito como ver o mar (2x)
Auê ó Iemanjá (2x)
Rainha das ondas sereia do mar (2x)
Mas como é lindo o canto de Iemanjá
Faz até o pescador chorar
Quem escuta a mãe d'água cantar
Vai com ela pro fundo do mar (2x)`,
  },
  {
    id: "ym-lo-4", subcategoriaId: "sub-yemanja-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Brilha o sol, Canta o rouxinol...",
    letra: `Brilha o sol
Canta o rouxinol
Eu olho o céu no infinito
Aonde o azul é bonito
Eu saravo a Oxalá
Rios, montes e cascatas
Eu olho o verde das matas
Sinto a paz que a natureza traz

Laiá laiá
E o mar com sua grandeza
Seu poder sua beleza eu imploro à Iemanjá

Ó mãe d'água rainha sereia do mar
Segura a banda
Ilumina esse gonga (2x)`,
  },
  {
    id: "ym-lo-5", subcategoriaId: "sub-yemanja-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Janaína minha deusa...",
    letra: `Janaína minha deusa
O seu canto vem do mar
O meu barco que navega
Levando flores à odoiá

Lindo é ver o céu azul
No encontro com as águas do mar
Oxalá nos deu tanta beleza
Deu Iemanjá à nos guiar (2x)

O no balanço do mar vou navegar
Eu quero!
Quero encontrar Iemanjá
Em alto mar sei que ela está
Oferendas vou levar (2x)`,
  },
  {
    id: "ym-lo-6", subcategoriaId: "sub-yemanja-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Retira a jangada do mar...",
    letra: `Retira a jangada do mar
Mãe d'água mandou avisar
Que hoje não pode pescar
Pois hoje tem festa no mar (2x)

E, e, e, e, e, e Iemanjá
Ela é ela é a rainha do mar
Traz pente, traz espelho o, o, o, o
Pra ela se enfeitar o, o, o, o
Traz flores, traz perfumes
Enfeita todo o mar`,
  },
  {
    id: "ym-lo-7", subcategoriaId: "sub-yemanja-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vou à praia grande...",
    letra: `Eu vou à praia grande, eu vou pro mar
Levar botões de rosas à Iemanjá
Eu vou à praia, vou riscar ponto na areia
Vou pedir à Mãe Sereia
Todas as forças do mar
Que nos proteja
Com seu manto inteiro branco
Que nos cubra com os encantos
Que tem as ondas do mar (REVISAR)`,
  },
  {
    id: "ym-lo-8", subcategoriaId: "sub-yemanja-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu sou filha de Yabá...",
    letra: `Eu sou filha de Yabá
Yabá é minha mãe
A rainha do tesouro

Oh doce Yabá no fundo do mar (3x)`,
  },
  {
    id: "ym-lo-9", subcategoriaId: "sub-yemanja-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Mar, misterioso mar...",
    letra: `Mar, misterioso mar
Que vem do horizonte
É o berço das sereias
Lendário e fascinante

Olha o canto da sereia
Ialaó, oquê, ialoá
Em noite de lua cheia
Ouço a sereia cantar
E o luar
E o luar tão lindo
Então se encanta
Com as doces melodias
Os madrigais vão despertar

Ela mora no mar
Ela brinca na areia
No balanço das ondas
A paz, ela semeia (2x)
E toda noite ela bailava
Transformando o mar em flor
Com o seu filho na morada
Morada, morada de amor

Aguntê, arabô
Caiala e Sobá
Oloxum, Ynaê
Janaina é Iemanjá (2x)`,
  },
  {
    id: "ym-lo-10", subcategoriaId: "sub-yemanja-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Seu colar é de conchas...",
    letra: `Seu colar é de conchas
Seu vestido se arrasta na areia
Ela tem cheiro de mar
Ela sabe cantar canto de sereia (2x)

O Janaína, quando estou feliz eu choro
O Janaína deixa eu dormir no seu colo (2x)

È no teu colo que eu afogo a minha sede
Quis te pescar
Mas caí na tua rede
Feita de fios e de cabelos emaranhados
Moro no mar e hoje sou seu namorado (2x)`,
  },
  {
    id: "ym-tr-1", subcategoriaId: "sub-yemanja-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Estava sentado na areia...",
    letra: `Estava sentado na areia
Ouvindo as ondas do mar
No céu tinha muitas estrelas
E a lua estava a brilhar
Sozinho e perdido eu estava
Sem, sem saber me encontrar
Mas de repente uma voz me falou baixinho
Tenha fé em Oxalá (2x)

Era ela
A Deusa do mar
Que coisa mais linda
Mamãe Iemanjá
Era ela
A Deusa do mar
Estendendo a suas mãos para nos abençoar (2x)`,
  },
  {
    id: "ym-tr-2", subcategoriaId: "sub-yemanja-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fiz um pedido à mamãe Sereia...",
    letra: `Eu fiz um pedido à mamãe Sereia
A Iemanjá, para nunca mais pecar (2x)

Foi na areia
Foi numa noite
Na areia branca do mar
Oh lua branca no céu
Iluminou seu divino mar

Sereia
Oh rainha do mar, Sereia. (2x)

Foi na areia (2x)
Foi numa noite
Na areia branca do mar`,
  },
  {
    id: "ym-tr-3", subcategoriaId: "sub-yemanja-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "O pescador pegou seu veleiro...",
    letra: `O pescador
Pegou seu veleiro e foi
Pescar no reino de Iemanjá (2x)

Veleiro voltou sozinho
E a sereia
Sereia do mar levou

Oh como é belo viver no mar
No reino de Iemanjá (2x)`,
  },
  {
    id: "ym-tr-4", subcategoriaId: "sub-yemanja-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu escrevi um pedido na areia...",
    letra: `Eu escrevi um pedido na areia
Pedindo a Zambi pra me socorrer
Eu escrevi um pedido na areia
Mas foi mãe d'água
Quem veio me valer (2x)

E foi nas ondas do mar
Que entreguei os meus problemas
E aprendi a confiar
Que todo mal não dura para sempre
Que a paz é uma semente
Que precisa semear

E no horizonte do mar tão infinito
Iemanjá me acolheu
E me deu um mundo tão mais bonito
Eu abri meu coração
Ela me estendeu a mão
E entreguei meu caminhar a Iemanjá (2x)`,
  },
  {
    id: "ym-cr-1", subcategoriaId: "sub-yemanja-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Vamos saravar mãe Iemanjá...",
    letra: `Vamos saravar mãe Iemanjá
Vamos todos juntos jogar flores no mar
É do mar, é do mar, é do mar
É do mar minha mãe sereia
É do mar, é do mar, é do mar
É do mar, é nas águas, é nas areias
Vamos saravar mãe Iemanjá
Vamos todos juntos jogar flores no mar
É do mar, é do mar, é do mar
É do mar minha sereia
Papai risca ponto nas pedras
Mamãe risca ponto na areia`,
  },
  {
    id: "og-cg-1", subcategoriaId: "sub-ogum-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se meu Pai é Ogum, Ogum...",
    letra: `Se meu Pai é Ogum, Ogum
Vencedor de demanda
Vem de Aruanda
Pra saldar filhos de Umbanda (2x)
Ogum, Ogum, Ogum, Iara
Ogum, Ogum, Ogum, Iara
Salve a coroa dele
Salve a Sereia do Mar
Ogum, Ogum Iara

Ogum em seu cavalo corre
E a sua espada reluz
Ogum em seu cavalo corre
E a sua espada reluz
Ogum, Ogum Megê
Sua bandeira cobre os filhos de Jesus
Ogum iê!`,
  },
  {
    id: "og-cg-2", subcategoriaId: "sub-ogum-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Pisa na linha de Umbanda...",
    letra: `Pisa na linha de Umbanda
Que eu quero ver
Ogum Sete Ondas
Pisa na linha de Umbanda
Que eu quero ver
Ogum Beira Mar
Pisa na linha de Umbanda
Que eu quero ver
Ogum Iara, Ogum Megê
Olha a banda aruê
Olha pisa no reino o cangira (3x)
Tata de umbanda o cangira`,
  },
  {
    id: "og-cg-3", subcategoriaId: "sub-ogum-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu tenho 7 Espadas que me defender...",
    letra: `Eu tenho 7 Espadas que me defender
Eu tenho Ogum em minha companhia (2x)
Ogum é meu Pai
Ogum é meu Guia
Ele vai baixar
Na fé de Zambi e da Virgem Maria (2x)`,
  },
  {
    id: "og-cg-4", subcategoriaId: "sub-ogum-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Que cavaleiro é aquele...",
    letra: `Que cavaleiro é aquele
Que vem cavalgando pelo céu azul
É seu Ogum Matinata
É defensor
Do Cruzeiro do Sul (2x)

E, e, e
E, e, á
Pisa na umbanda o cangira
Pisa no gongar (2x)

Olha que barco bonito
Que vem navegando a luz do luar
É seu Ogum Sete Ondas
Que vem ao encontro
De Ogum Beira-Mar

E, e, e
E, e, á
Pisa na umbanda o cangira
Pisa no gongar (2x)`,
  },
  {
    id: "og-cg-5", subcategoriaId: "sub-ogum-chegada", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum é rei, É rei do cariri...",
    letra: `Ogum é rei
É rei do cariri (2x)

Que mal eu fiz a meu pai
Que Ogum não vem aqui (2x)`,
  },
  {
    id: "og-cg-6", subcategoriaId: "sub-ogum-chegada", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "É, seu Beira Mar...",
    letra: `É, seu Beira Mar
É, seu Beira Mar
É ordenança de São Jorge na Umbanda
Ele é Ogum
É seu Beira Mar (2x)

Travou batalhas pelo imenso mar azul
Oxalá lhe convocou
Por ordem de Olorum
Para na Terra empunhar sua bandeira
De um guerreiro da falange de Ogum

É Beira Mar

É, seu Beira Mar
É, seu Beira Mar
É ordenança de São Jorge na Umbanda
Ele é Ogum
É seu Beira Mar (2x)

Hoje vira no terreiro
Recebendo os Orixás
Ensinando a cada irmão
A missão que irá prestar
É guardião
De uma casa de caridade
Que propaga pelo mundo
A paz, o amor e a humildade`,
  },
  {
    id: "og-lo-1", subcategoriaId: "sub-ogum-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Filho de Pemba bebe água no rochedo...",
    letra: `Filho de Pemba bebe água no rochedo
Filho de Ogum corre campo e não tem medo (2x)
Vou pedir ao criador
Que derrame o seu amor
Aos nossos guias
E ao nosso Babalaô`,
  },
  {
    id: "og-lo-2", subcategoriaId: "sub-ogum-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Salve Ogum Megê, Ogum Rompe Mato...",
    letra: `Salve Ogum Megê
Ogum Rompe Mato
Ogum Beira Mar (2x)
Ele trabalha na areia meu Pai
Ele trabalha no mar (auê)
Ele trabalha na areia meu Pai
Ele trabalha no mar`,
  },
  {
    id: "og-lo-3", subcategoriaId: "sub-ogum-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "A sua espada brilha no raiar do dia...",
    letra: `A sua espada brilha no raiar do dia
Seu Beira Mar é filho da virgem Maria
Seu Beira Mar, beira na areia
Seu Beira Mar é filho da virgem Maria`,
  },
  {
    id: "og-lo-4", subcategoriaId: "sub-ogum-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu não seria nada, Se não fosse Ogum...",
    letra: `Eu não seria nada
Se não fosse Ogum
Para abrir a minha estrada (2x)
Valente guerreiro aqui chegou
Vencedor de demanda meu protetor
Em sua trajetória meu pai luta contra o mal
Foi nos campos de batalha que se tornou general

Eu não seria nada
Se não fosse Ogum
Para abrir a minha estrada (2x)

Salve Ogum de Ronda
Salve seu Ogum Megê
Saravá Beira Mar
Ogum Iara, Ogum de Lei
Salve toda a falange
Do glorioso guerreiro
Meu pai vence demanda
Aqui dentro do terreiro`,
  },
  {
    id: "og-lo-5", subcategoriaId: "sub-ogum-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Ele é cavaleiro santo...",
    letra: `Ele é cavaleiro santo
Seu cavalo é branco
Ele é general

É forte
Usa armadura
Ele é valente
Luta contra o mal

A sua espada é reluzente
Pra defender a gente
Não deixar cair

Ele é nosso pai Ogum
Ele é Jeci Jeci
Ele é Patacori

Ele é Jeci Jeci
Ele é Patacori (2x)`,
  },
  {
    id: "og-lo-6", subcategoriaId: "sub-ogum-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Mandei fazer um capacete de penas...",
    letra: `Mandei fazer
Um capacete de penas
Para usar antes da alvorada (2x)
Vermelho e branco verde e azul
Esse capacete tem as cores de Ogum (2x)
De Ogum Naruê de Ogum Matinata
De Ogum Naruê de Ogum Matinata
Quando uso o capacete ouço o toque da alvorada (2x)`,
  },
  {
    id: "og-lo-7", subcategoriaId: "sub-ogum-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Quem me dera Ogum, Para ser meu guia...",
    letra: `Quem me dera Ogum
Para ser meu guia (2x)
Ele é praça de cavalaria
É ordenança da virgem Maria`,
  },
  {
    id: "og-lo-8", subcategoriaId: "sub-ogum-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi, eu vi seu Rompe Mato no mar...",
    letra: `Eu vi, eu vi seu Rompe Mato no mar
Eu vi, eu vi com seu Ogum Beira Mar (2x)
Salve as crianças na praia
Salve a sereia no mar
Sarava seu Beira Mar
Ele é chefe de gongar (2x)
Sarava, Ogum, ogum, ogum e a coroa de rei (2x)
Seu Ogum gira na cangira de umbanda
Seu Ogum gira na cangira de Oxalá (2x)
Sarava, sarava, sarava`,
  },
  {
    id: "og-lo-9", subcategoriaId: "sub-ogum-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "A Umbanda clareou...",
    letra: `A Umbanda clareou
A Umbanda clareou
Clareou, clareou
Esse grande Orixá
Clareou, clareou
Sobre a luz da lua cheia
Lá do alto da pedreira
Olhando a cachoeira

Quem é o cavaleiro
Quem é o cavaleiro
Que veio a cavalgar
Montado em seu cavalo branco
Com sua espada empunhar

É Ogum, meu pai
Ogunhê, meu pai
Cavaleiro de Oxalá
Com sua espada suprema
Ele é o senhor dos caminhos
Ele é o rei do Humaitá!

Saravá pai Ogum
Ogunhê, Ogunhê
Ele é o tata, ele é o tata
Ele é o tata no arerê
Saravá pai Ogum
Ogunhê, Ogunhê
Ele é o tata, ele é o tata
Ele é o tata no arerê`,
  },
  {
    id: "og-lo-10", subcategoriaId: "sub-ogum-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu sou filha de Naruê...",
    letra: `Eu sou filha de Naruê
Armada com as espadas de Megê
Ungida pelas mãos de Matinata
Regida pelas leis de Ogum de Lei
Meu protetor é Beira Mar
Iara no caminho a me guiar
Coragem quem me deu foi Rompe-Mato
Ogum me ensinou o que é amar

Ogum, meu pai, vem me valer
Na fé de Zambi, nada vou temer
Ogum, meu pai, vem me guiar
Na minha estrada caminhar (2x)`,
  },
  {
    id: "og-tr-1", subcategoriaId: "sub-ogum-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Nesta casa de guerreiro (Ogum)...",
    letra: `Nesta casa de guerreiro (Ogum)
Vim de longe pra rezar (Ogum)
Rogo a Deus pelos doentes (Ogum)
Na fé de Obatalá (Ogum)
Ogum salve a Casa Santa (Ogum)
Os presentes e os ausentes (Ogum)
Salve nossas esperanças (Ogum)
Salve os velhos e crianças (Ogum)
Nego veio e ensinou (Ogum)
Na cartilha de Aruanda (Ogum)
E Ogum não esqueceu (Ogum)
Como vencer a demanda (Ogum)
A tristeza foi embora (Ogum)
Na espada de um guerreiro (Ogum)
E a luz no romper da aurora (Ogum)
Vai brilhar neste terreiro (Ogum)`,
  },
  {
    id: "og-tr-2", subcategoriaId: "sub-ogum-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum já venceu...",
    letra: `Ogum já venceu
Já venceu, já venceu
Ogum vem de Aruanda
E quem lhe manda é Deus (2x)
Ele vem beirando o rio
Ele vem beirando o mar
Salve Santo Antônio da Calunga
Benedito e Beira Mar (2x)

Por entre matas
Por entre mares e terra
Eu entendi o que meu Pai quis dizer (2x)
Que Ogum não devia beber
Que Ogum não devia fumar
Mais a fumaça são as nuvens que passam
E a cerveja as ondas do mar (2x)`,
  },
  {
    id: "og-tr-3", subcategoriaId: "sub-ogum-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Quem Beira Rio, Beira Rio...",
    letra: `Quem Beira Rio, Beira Rio
Beira Mar
O que se ganha de Ogum
Só Ogum pode tirar (2x)

Seu Ogum de Ronda
É quem vem girar
E vem trazendo folhas
Pra descarregar (2x)`,
  },
  {
    id: "og-tr-4", subcategoriaId: "sub-ogum-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxalá está chamando Ogum lá no Humaitá...",
    letra: `Oxalá está chamando
Ogum lá no Humaitá
Pra lhe dar uma bandeira
E mandar ele jurar (2x)
Se ele é capitão
Ele vai jurar!
E se for de Angola também vai jurar
E se for Ogum de Lei – ele vai jurar
E se for de Nagô – também vai jurar`,
  },
  {
    id: "og-tr-5", subcategoriaId: "sub-ogum-trabalho", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Na porta da Romaria...",
    letra: `Na porta da Romaria
Eu vi um cavaleiro de ronda (2x)
Trazia um escudo no braço
E uma lança na mão
Ogum guerreiro venceu e matou o dragão (2x)`,
  },
  {
    id: "og-tr-6", subcategoriaId: "sub-ogum-trabalho", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum de Lei, Não me deixe sofrer...",
    letra: `Ogum de Lei
Não me deixe sofrer
Tanto assim (2x)
Quando eu morrer
Vou passar lá na Aruanda
Sarava Ogum
Sarava seu Sete Ondas`,
  },
  {
    id: "og-tr-7", subcategoriaId: "sub-ogum-trabalho", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Bandeira linda de Ogum...",
    letra: `Bandeira linda de Ogum
Que está içada lá no Humaitá (2x)
Representando general de Umbanda
Pai Ogum venceu demanda lá nos campos do Humaitá (2x)`,
  },
  {
    id: "og-tr-8", subcategoriaId: "sub-ogum-trabalho", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum partiu pra guerra...",
    letra: `Ogum partiu pra guerra
Ogum tocou clarim (2x)
Do seu exército todo
Ele é comandante sim

São dois irmãos
Na madrugada
Seu Ogum Iara seu Ogum Matinata (2x)`,
  },
  {
    id: "og-tr-9", subcategoriaId: "sub-ogum-trabalho", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "General, general, meu general...",
    letra: `General, general, meu general
General, general do mar
General, general, meu general
General capitão do mar

Auê, Auê
Auê capitão Guanabara auê (2x)`,
  },
  {
    id: "og-tr-10", subcategoriaId: "sub-ogum-trabalho", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum guerreiro de umbanda...",
    letra: `Ogum guerreiro de umbanda
Seu ponto veio firmar (2x)
Ele pede ao Sol e a Lua
O Paranga, para clarear (2x)
A coroa de ouro é mariwô (2x)
Ogum é tatá, é tatá
A coroa de ouro é mariwô (2x)`,
  },
  {
    id: "og-tr-11", subcategoriaId: "sub-ogum-trabalho", ordem: 10, favorito: false, criadoEm: 1774882639699,
    titulo: "Ogum, meu guerreiro de umbanda...",
    letra: `Ogum, meu guerreiro de umbanda
Cavaleiro supremo é vencedor de demandas
É sentinela de pai Oxalá
É remador, de Iemanjá

Senhor da lua, ilumina meus caminhos
Toma conta da minha vida
E me livre dos perigos (2x)`,
  },
  {
    id: "og-cr-1", subcategoriaId: "sub-ogum-cruzado", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxossi assobiou...",
    letra: `Oxossi assobiou
Pra passar no Humaitá
Oxossi assobiou
Pra passar no Humaitá
Pra falar com Ogum Megê
Mensageiro de Oxalá
Pra falar com Ogum Megê
Mensageiro de Oxalá`,
  },
  {
    id: "og-cr-2", subcategoriaId: "sub-ogum-cruzado", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Auê, auê, Ogum Beira Mar auê...",
    letra: `Auê, auê, Ogum Beira Mar auê
Auê, auê, Ogum Beira Mar auê
Iansã virou o tempo
Pra Oxum não governar
Mas durante o barra-vento
Oxum se pôs a cantar
Auê, auê, Ogum Beira Mar auê
Auê, auê, Ogum Beira Mar auê`,
  },
  {
    id: "og-cr-3", subcategoriaId: "sub-ogum-cruzado", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Iemanjá cadê Ogum...",
    letra: `Iemanjá cadê Ogum
Foi com Oxossi ao Rio Jordão
Foram saudar São João Batista
E batizar Cosme e Damião

Seu cavalo corre
Sua espada reluz
Sua bandeira cobre
Todos os filhos de Jesus (2x)

Seu cavalo corre
Sua espada reluz
Auê, seu Ogum Iara
Aos pés da Santa Cruz`,
  },
  {
    id: "ox-cg-1", subcategoriaId: "sub-oxum-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Se minha mãe é Oxum...",
    letra: `Se minha mãe é Oxum
É na Umbanda e no Candomblé (2x)

Ora Yeyeo, Yeyeo, minha mãe
Yeyeo, minha mãe Oxumaré (2x)

Quando ela vem beirando o rio
Colhendo lírios pra nos ofertar
Mamãe Oxum ora Yeyeo
Mamãe Oxum
Orixá desça e vem nos abençoar`,
  },
  {
    id: "ox-cg-2", subcategoriaId: "sub-oxum-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Sobre o clarão da lua...",
    letra: `Sobre o clarão da lua
As águas da cascata
Parecem de prata (2x)

É um lindo véu
Que vem da fonte da Oxum
Que vem do céu (2x)

Yeyeo mamãe Oxum
Dona do ouro
Yeyeo Oxumaré
És meu tesouro (2x)`,
  },
  {
    id: "ox-cg-3", subcategoriaId: "sub-oxum-chegada", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu fui ao cantuá pagar promessa...",
    letra: `Eu fui ao cantuá pagar promessa
Levei ouro maior, um adê pra Yeyeo (2x)
Chora Yeyeo
A minha fé é verdadeira eu peço vem abençoar (2x)

Oh meu Deus como é lindo
O céu se abre e mãe Oxum vem surgindo
Uouou
Óh meu Deus como é lindo
O céu se abre e mãe Oxum vem surgindo`,
  },
  {
    id: "ox-cg-4", subcategoriaId: "sub-oxum-chegada", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Meu Deus, Mas que luz é aquela...",
    letra: `Meu Deus, Mas que luz é aquela,
Que vem, lá do alto das pedreiras (2x)

É a estrela de mamãe Oxum,
Iluminando todas as cachoeiras.`,
  },
  {
    id: "ox-lo-1", subcategoriaId: "sub-oxum-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi mamãe Oxum na cachoeira...",
    letra: `Eu vi mamãe Oxum na cachoeira
Sentada na beira do rio (2x)

Colhendo lírios, lírios ê
Colhendo lírios, lírios á
Colhendo lírios pra enfeitar nosso gonga (2x)`,
  },
  {
    id: "ox-lo-2", subcategoriaId: "sub-oxum-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Foi na beira do rio aonde Oxum chorou...",
    letra: `Foi na beira do rio aonde Oxum chorou (2x)
Chora Yeyeo, choram os filhos seus`,
  },
  {
    id: "ox-lo-3", subcategoriaId: "sub-oxum-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Caminhando pela mata...",
    letra: `Caminhando pela mata
Refletida na cascata
Vi uma flor se mirar (2x)

Era de grande beleza
Possuía tal pureza
Perfumava todo ar

Foi nesse exato momento
Que como um sonho eu contemplo
A Oxum a se banhar
E só então eu percebi
Que a linda flor que vi
Era a deusa do Ijexá

Yeyeo
Yeyeo
Foi na água da cascata
Que a Oxum apareceu (2x)`,
  },
  {
    id: "ox-lo-4", subcategoriaId: "sub-oxum-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Nuvem de poeira d'água...",
    letra: `Nuvem de poeira d'água
Que sai da cascata da deusa Oxum (2x)
Beleza pura, linda e cristalina
Essa deusa menina com o perfume da flor
Encanto doce da natureza, inspira riqueza, vaidade e amor
Ôôô

Nuvem de poeira d'água
Que sai da cascata da deusa Oxum (2x)
Quando se banha na beira do rio
O Sol irradia energia e calor
Dona do ouro, deusa poderosa, pedra preciosa cheia de esplendor
Ôôô`,
  },
  {
    id: "ox-lo-5", subcategoriaId: "sub-oxum-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Oxum panda, Oxum docô...",
    letra: `Oxum panda
Oxum docô
E olha eu
Olha Oxumaré ô (4x)

E olha eu, e olha eu
Olha Oxumaré ô (2x)`,
  },
  {
    id: "ox-lo-6", subcategoriaId: "sub-oxum-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "Eu vi mamãe Oxum chorando...",
    letra: `Eu vi mamãe Oxum chorando
Então eu perguntei porque (2x)

Ela me respondeu
Estou chorando é por causa de você
Ela me respondeu
Sem os meus filhos eu não poderei viver

Estou chorando é por causa de você
Sem os meus filhos eu não poderei viver (2x)`,
  },
  {
    id: "ox-lo-7", subcategoriaId: "sub-oxum-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "Deusa das cachoeiras e cascatas...",
    letra: `Deusa das cachoeiras e cascatas
Companheira de Oxóssi o dono das matas
E também a rainha de meu pai Xangô
Eterna
Com o seu abebê
Quando dança é faceira
És a dona do ouro óh mãe verdadeira
Sob a lua de prata
De joelhos eu vou implorar
Teu manto
É o meu acalanto na hora da dor
E na minha tristeza meu pranto enxugou
Ora Yeyeo mãe Oxum
Rainha do Ijexá
Seu canto irradia alegria traz a paz traz harmonia
Em suas águas eu a vejo se banhar
Oxum como é lindo vê-la bailar

Vou pedir na cachoeira ora Yeyeo nunca me deixe sozinha
Eu sou filho seu
Na sua mina tem ouro seu tesouro tem poder
Toda vez que eu precisar mamãe Oxum vai me valer (2x)`,
  },
  {
    id: "ox-lo-8", subcategoriaId: "sub-oxum-louvacao", ordem: 7, favorito: false, criadoEm: 1774882639699,
    titulo: "Fonte de luz, No meio das matas...",
    letra: `Fonte de luz
No meio das matas
Cascata de oração
Em ti a minha vida começou
Yeyeo, Yeyeo, yeyeo, yeyeo
Os meus olhos
Refletem o seu brilho
Seus rios
Abraçam os seus filhos
Seu canto
Suaviza toda dor
Yeyeo, Yeyeo, yeyeo, yeyeo
Mamãe Oxum de todas as águas
Das flores a mais perfumada
Inunda a minha alma com amor
Yeyeo, Yeyeo, yeyeo, yeyeo`,
  },
  {
    id: "ox-lo-9", subcategoriaId: "sub-oxum-louvacao", ordem: 8, favorito: false, criadoEm: 1774882639699,
    titulo: "Gorjeia a passarada...",
    letra: `Gorjeia
A passarada num lindo céu azul
Pra saudar o reino encantado de Oxum
Oxum Yapondá
Por que meu Deus
Que nesse seu mundo eu não posso entrar? (Oxum)
Só pra ver como é lindo o amanhecer

Natureza sorrindo
Primavera florindo (2x)

Se meu é de amor ôôô
Se meu mundo é de paz
Paz e amor
Guardado
Guardado, pelo manto sagrado de Yapondá (Oxum)
Que vem lá, lá do seu mundo abençoar

Acaba a guerra enfim
Tira o ódio e põe o amor (2x)
Que o mundo possa ser
Sempre um jardim de flor (2x)

Laiá, laiá, lalaiá ô, ô, ô, ô, ô, ô
Laiá, laiá, lalaiá, ô, ô, ô, ô, ô, ô
Que o mundo possa ser
Sempre um jardim de flor (2x)`,
  },
  {
    id: "ox-lo-10", subcategoriaId: "sub-oxum-louvacao", ordem: 9, favorito: false, criadoEm: 1774882639699,
    titulo: "Minha mãe é uma flor...",
    letra: `Minha mãe é uma flor
No jardim do senhor
Ela é uma rosa
Uma rosa em botão (2x)

Ela é toda beleza
Ela é toda de azul
Ela é um amor
Mas ela é Senhora da Conceição (2x)`,
  },
  {
    id: "ox-tr-1", subcategoriaId: "sub-oxum-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Brilhou a estrela matutina...",
    letra: `Brilhou a estrela matutina
Rolaram pedras de Xangô
Quem será essa menina
Que a lua iluminou
Canta no clarão da lua
Dança no calor do sol
Todo ouro se ilumina
Pra saudar Oxum Menina
Pois Oxum é Mãe Maior

Saravá, Oxum Menina!
Oxum é Mãe Maior
Yeyeo
Ô,ô,ô,ô,ô,ô,ô,ô,ô,ô,ô

Oxum Yeyeo, Oxum yeyeo (2x)

Yeyeo Oxum,
Oxum Yeyeo (2x)`,
  },
  {
    id: "ox-tr-2", subcategoriaId: "sub-oxum-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Se um dia eu fui feliz...",
    letra: `Se um dia eu fui feliz
Foi Oxum, foi Oxum
Quem quis (2x)

Na beira do mar, cadê?
Água doce do meu amor
Água que me faz viver
Beija o mar

Quando você me tocou
Dominou meu ser (2x)

Levou meu amor
Não quis devolver (2x)

Manda chamar
Manda chamar yeyeo, manda chamar
Manda chamar yeyeo, manda chamar (2x)

Quem ama, se encanta
Bebe o abô, como bebe o mel da cana (2x)
Dona Oxum Apará
É quem anda na beira do mar
Dona Oxum Apará
Água rara de se encontrar (2x)`,
  },
  {
    id: "ox-tr-3", subcategoriaId: "sub-oxum-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Mamãe Oxum tem proteção de Zambi...",
    letra: `Mamãe Oxum
Tem proteção de Zambi
Olha seus filhos
Com olhar sereno
Ela é beleza, ela é pureza
Ela nos traz a proteção
De Nazareno (2x)`,
  },
  {
    id: "nn-cg-1", subcategoriaId: "sub-nana-chegada", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Atraca-atraca que aí vem Nanã...",
    letra: `Atraca-atraca que aí vem Nanã
Sereia (2x)

É Nanã, É Oxum
É Oxum, É Nanã,
É Sereia,
É Nanã, É Oxum
É Oxum É Nanã,
É Sereia do mar`,
  },
  {
    id: "nn-cg-2", subcategoriaId: "sub-nana-chegada", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "O mar estava bem calmo naquela manhã...",
    letra: `O mar estava bem calmo naquela manhã
Eu implorei à Oxalá
Que me dissesse o que eu queria saber
Sobre os encantos de Nanã Buruquê
Um Raio de Luz veio anunciar
A chegada da Cinda mais velha, senhora Santana de Pai Oxalá (2x)

A saluba vovó
Me leva pras ondas do mar senhora Santana, Nanã Buruquê
Me leva pras ondas do mar senhora Santana venha me valer (2x)`,
  },
  {
    id: "nn-lo-1", subcategoriaId: "sub-nana-louvacao", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã, Nanã, É Nanã Buruquê...",
    letra: `Nanã, Nanã
É Nanã Buruquê (2x)
A sua saia é Roxa
A sua casa é de sapê (2x)`,
  },
  {
    id: "nn-lo-2", subcategoriaId: "sub-nana-louvacao", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Fui chamado de cordeiro...",
    letra: `Fui chamado de cordeiro,
Mas não sou cordeiro não
Prefiro ficar calado
À falar sem ter razão
O meu lamento
É uma singela oração
Minha santa de fé
Meu cantar é uma prece
Que eu faço à Nanã ê

Sou de Nanã eua, eua, eua ê (2x)`,
  },
  {
    id: "nn-lo-3", subcategoriaId: "sub-nana-louvacao", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Deusa das águas salobras...",
    letra: `Deusa das águas salobras
A ti sempre louvarei
Nas horas da aflição
Sei que vai me socorrer
Se as mazelas me atingirem
Sei que há de me curar
Se houver espinhos em meus caminhos
Sei que há me livrar

Ê, ê, ê
Saluba ê,
A mais velhas Yabá
Mãe de Obaluaê (2x)

Vovó governe a minha vida
Vovó venha me valer
Ó minha santa tão querida
Te louvo Nanã Buruquê

Ê, ê, ê
Saluba ê,
A mais velhas Yabá
Mãe de Obaluaê (2x)`,
  },
  {
    id: "nn-lo-4", subcategoriaId: "sub-nana-louvacao", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Salve Nanã, Salve senhora das águas...",
    letra: `Salve Nanã, Salve senhora das águas
Salve Nanã, Salve senhora Santana
Salva Nanã com sua força e bondade
Salve Nanã Capurucaia na umbanda.`,
  },
  {
    id: "nn-lo-5", subcategoriaId: "sub-nana-louvacao", ordem: 4, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã É orixá de umbanda...",
    letra: `Nanã É orixá de umbanda
Nanã é mãe de nossa senhora

Vamos saravar Nanã, Nanã
Pois ela vai valei-me agora (2x)`,
  },
  {
    id: "nn-lo-6", subcategoriaId: "sub-nana-louvacao", ordem: 5, favorito: false, criadoEm: 1774882639699,
    titulo: "É na mesa de umbanda que eu vi Nanã...",
    letra: `É na mesa de umbanda que eu vi Nanã
Eu vi Nanã (2x)
Auê, auê
Eu vi Nanã (2x)`,
  },
  {
    id: "nn-lo-7", subcategoriaId: "sub-nana-louvacao", ordem: 6, favorito: false, criadoEm: 1774882639699,
    titulo: "São flores, Nanã, são flores...",
    letra: `São flores, Nanã, são flores
São flores, Nanã Buruquê
São flores, Nanã, são flores,
Do seu filho Obaluaê`,
  },
  {
    id: "nn-tr-1", subcategoriaId: "sub-nana-trabalho", ordem: 0, favorito: false, criadoEm: 1774882639699,
    titulo: "É Nanã, É Nanã auê...",
    letra: `É Nanã, É Nanã auê,
É Nanã,
É Nanã Buruquê (2x)
Ao rodar da sua saia
Manda forças pra nossa banda
Os filhos que tanto lhe pedem
Nanã corta toda mironga
Na barra da sua saia
Carrega filhos de Umbanda
Com suas águas sagradas
Descarrega a nossa banda`,
  },
  {
    id: "nn-tr-2", subcategoriaId: "sub-nana-trabalho", ordem: 1, favorito: false, criadoEm: 1774882639699,
    titulo: "Nanã é Nanã buruquê...",
    letra: `Nanã é Nanã buruquê (2x)
É o orixá mais velho do céu
Nanã é Nanã buruquê
Olha seus filhos agora que eu quero ver (2x)`,
  },
  {
    id: "nn-tr-3", subcategoriaId: "sub-nana-trabalho", ordem: 2, favorito: false, criadoEm: 1774882639699,
    titulo: "Senhora Santana, Quando andou no mundo...",
    letra: `Senhora Santana
Quando andou no mundo (2x)
Ela cruzou a terra
E abençoou o mundo (2x)`,
  },
  {
    id: "nn-tr-4", subcategoriaId: "sub-nana-trabalho", ordem: 3, favorito: false, criadoEm: 1774882639699,
    titulo: "Me lava Nanã, me lava...",
    letra: `Me lava Nanã, me lava
Com suas águas Nanã sagradas
Lave meus olhos para que eu possa ver
A luz divina dos meus guias a me proteger
Lave meus ouvidos para que eu possa ouvir
Os ensinamentos de bons caminhos a seguir
Lave minha boca para que eu possa dizer
Mensagens de amor a quem precisa receber

Lave Nanã o meu coração
Encha ele de alegria e retire a aflição
Ô Nanã Buruquê
As suas águas me dão forças pra vencer
Ô Nanã Buruquê
Quero em suas águas uma bênção receber`,
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
