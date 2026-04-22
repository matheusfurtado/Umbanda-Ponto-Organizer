import { readFileSync, writeFileSync } from 'fs';

const backupPath = '/home/matheus-furtado/Downloads/pontos-umbanda-backup-2026-04-20 (1).json';
const data = JSON.parse(readFileSync(backupPath, 'utf-8'));

const now = Date.now();
let idCounter = 0;
function genId() {
  return `exu-${now}-${idCounter++}`;
}

// Create subcategorias for Exu
const subcategorias = [
  { id: 'sub-exu-trabalho', orixaId: 'exu', nome: 'Trabalho', ordem: 0, criadoEm: now },
  { id: 'sub-exu-demanda', orixaId: 'exu', nome: 'Demanda', ordem: 1, criadoEm: now },
  { id: 'sub-exu-louvacao', orixaId: 'exu', nome: 'Louvação', ordem: 2, criadoEm: now },
  { id: 'sub-exu-firmeza', orixaId: 'exu', nome: 'Firmeza', ordem: 3, criadoEm: now },
  { id: 'sub-exu-chegada', orixaId: 'exu', nome: 'Chegada', ordem: 4, criadoEm: now },
  { id: 'sub-exu-cura', orixaId: 'exu', nome: 'Cura', ordem: 5, criadoEm: now },
];

data.subcategorias.push(...subcategorias);

// Helper to create a ponto
const pontosByCategoria = {
  trabalho: [],
  demanda: [],
  louvacao: [],
  firmeza: [],
  chegada: [],
  cura: [],
};

function addPonto(categoria, titulo, letra) {
  const subMap = {
    trabalho: 'sub-exu-trabalho',
    demanda: 'sub-exu-demanda',
    louvacao: 'sub-exu-louvacao',
    firmeza: 'sub-exu-firmeza',
    chegada: 'sub-exu-chegada',
    cura: 'sub-exu-cura',
  };
  pontosByCategoria[categoria].push({
    id: genId(),
    subcategoriaId: subMap[categoria],
    titulo,
    letra,
    favorito: false,
    ordem: pontosByCategoria[categoria].length,
    criadoEm: now + idCounter,
  });
}

// ===== PAGE 1 =====
addPonto('trabalho',
  'Odara morador da encruzilhada...',
  'Odara morador da encruzilhada\nFirma seu ponto com sete facas cruzadas (2x)\nFilho de umbanda peça com fé\nQue seu Exu\nVai lhe dar o que você quer');

addPonto('demanda',
  'Oh sete, oh sete...',
  'Oh sete, oh sete\nO sete Encruzilhadas\nToma conta e presta conta\nNo romper da madrugada (2x)\n\nNinguém pode comigo\nEu posso com tudo\nLa na encruzilhada\nEle é seu exu Veludo');

addPonto('louvacao',
  'Portão de ferro...',
  'Portão de ferro\nCadeado de madeira (2x)\nNo portão do cemitério\nSalve ele\nExu Caveira');

addPonto('firmeza',
  'Deus salve as almas...',
  'Deus salve as almas\nSalve a coroa e a fé (2x)\nVamos saravar seu exu das almas\nEle é\nSete Porteiras de fé');

// ===== PAGE 2 =====
addPonto('trabalho',
  'De capa e cartola caminha na madrugada...',
  'De capa e cartola caminha na madrugada\nAndarilho da estrada sempre combatendo o mal\nSeu Tranca Rua é amigo e camarada\nDando forte gargalhada me livra de todo mal\n\nLaroiê exu é mojuba\nMelhor que Tranca Rua das Almas não há (2x)\n\nSete marafos coloquei na encruzilhada\nSete velas e charuto também levei um padê\nA meia noite chamei por seu Tranca Rua\nOuvi forte gargalhada ele veio me valer\n\nLaroiê exu é mojuba\nMelhor que Tranca Rua das Almas não há (2x)\n\nFaço um pedido no meio da encruzilhada\nA Tranca Rua das Almas antes do galo cantar\nSe o galo canta é sinal que ta na hora\nFirma gira meu ogã que Tranca Ruas chega agora\n\nLaroiê exu é mojuba\nMelhor que Tranca Rua das Almas não há (2x)');

addPonto('louvacao',
  'Deu um clarão na encruzilhada...',
  'Deu um clarão na encruzilhada\nE do clarão surgiu uma gargalhada (2x)\nNão era o Sol, não era a lua\nO que brilhava era o mestre Tranca Ruas');

// ===== PAGE 3 =====
addPonto('louvacao',
  'Ele é Capitão da encruzilhada...',
  'Ele é\nCapitão da encruzilhada\nEle é\ntambém é ordenança de Ogum\nSua divisa quem lhe deu\nFoi Olorum\nSua coroa quem lhe deu Foi Oxalá\nOi salve o céu\n\nSalve o sol e Salve a lua\nSaravá seu Tranca Ruas\nQuebrando mandinga no meio da rua (2x)');

addPonto('chegada',
  'Marabô, iê, Marabô ia...',
  'Marabô, iê, Marabô ia, (2x)\n\nCadê Marabô, cadê Marabô, cadê Marabô\nMarabô ia (2x)');

addPonto('trabalho',
  'No portão do cemitério...',
  'No portão do cemitério\nEu vi um moleque lá\nPulava de cova em cova\nCatatumba balanceou (2x)\n\nQue moleque é esse\nÉ exu Marabô (4x)');

addPonto('trabalho',
  'Seu tranca ruas me cobriu com sua capa...',
  'Seu tranca ruas me cobriu com sua capa\nQuem tem sua capa escapa\nQuem tem sua capa escapa\nA sua capa é um manto de caridade\nSua capa cobre tudo, só não cobre a falsidade');

addPonto('trabalho',
  'O sino da igrejinha...',
  'O sino da igrejinha\nFaz Belém blem blom (2x)\nDeu meia noite o galo já cantou\nSeu tranca ruas é dono da gira\nOi corre gira que Ogum mandou');

// ===== PAGE 4 =====
addPonto('firmeza',
  'Santo Antonio de batalha...',
  'Santo Antonio de batalha\nFaz de mim trabalhador (2x)\nCorre gira Santo Antonio\nSete porteiras e Marabô (2x)');

addPonto('trabalho',
  'Exu que tem duas cabeças...',
  'Exu que tem duas cabeças\nEle olha sua banda com fé (2x)\nUma é bom Jesus Nazaré\nA outra é de exu Lúcifer (2x)');

addPonto('louvacao',
  'Ê Caveira, afirma ponto na folha da bananeira...',
  'Ê Caveira\nAfirma a ponto na folha da bananeira (2x)\n\nQuando o galo canta é madrugada\nFoi Exú na encruzilhada, batizado com dendê\nRezo uma oração de tras pra frente\nqueimo fogo a chama ardente, aquece Exú ah laroiê\neu ouço a gargalhada do diabo\né Caveira o enviado, do principe lucifer,\né ele quem comanda o cemitério\ncatacumba tem mistério, seu feitiço tem axé,\n\nÊ Caveira\nAfirma seu ponto na folha da bananeira (2x)\n\nE na calunga quando ele aparece,\nCada encruza eu rezo prece pra o Exu dono da rua\nSinto a força desse momento\nE firmo meus pensamentos nos quatro cantos da rua\nE peço a ele que me proteja onde quer que eu esteja\nao longo dessa caminhada\npois eu confio em sua ajuda verdadeira\nEle é o exu Caveira, senhor da encruzilhada\n\nÊ Caveira\nfirma seu ponto na folha da bananeira (2x)');

// ===== PAGE 5 =====
addPonto('louvacao',
  'Ê puerê, ê poeira...',
  'Ê puerê, ê poeira\nÊ puerê, ê poeira\n\nOlha mosca barejeira\nsalve Exu caveira (2x)');

addPonto('louvacao',
  'Eu passei no cemitério...',
  'Eu passei no cemitério\nÀs onze horas do dia\nexu se levantou\nE a catatumba tremia (2x)\n\nDim, dim dong, o sino de La batia\nZum, zum, zum e a catatumba tremia (2x)');

addPonto('chegada',
  'Eu vi exu dando gargalhada...',
  'Eu vi exu dando gargalhada,\nCom tridente na mão e sua capa bordada (2x)\nEle é Exú Tiriri\nMorador lá da calunga,\nVem firma seu ponto aqui (2x)');

addPonto('trabalho',
  'Exú firma seu ponto aqui neste terreiro...',
  'EXÚ FIRMA SEU PONTO\nAQUI NESTE TERREIRO (2x)\nDEU MEIA NOITE NA LUA\nDEU MEIO DIA NO SOL');

addPonto('chegada',
  'Exu é de querer, querer...',
  'Exu é de querer, querer\nDa sua banda eu queria ser (2x)\nMas quando é no romper da aurora\nSarava Sete porteiras sua banda lhe chama agora (2x)');

addPonto('cura',
  'Rí quá quá quá...',
  'Rí quá quá quá\nQue linda risada\na pomba gira vai dar (2x)\n\nEu estava muito doente\nQuando a pomba gira chegou\nEla me deu uma rosa\nE com essa rosa\nEla me curou (2x)');

// ===== PAGE 6 =====
addPonto('trabalho',
  'Se tem problema a resolver...',
  'Se tem problema a resolver (ô, luar)\nE encontra dificuldade (ô, luar)\nDepois das leis do universo (ô, luar)\nExu também faz caridade (ô, luar)\n\nÔ, luar, ô, luar (ô, luar)\nEle é dono da rua (ô, luar)\nQuem cometeu as suas falhas (ô, luar)\nPeça perdão à Tranca Rua (ô, luar)');

addPonto('chegada',
  'Vinha caminhando a pé...',
  'Vinha caminhando a pé\nPara ver se encontrava\na linda Cigana de Fé\nEla parou\nE leu minha mão\nE leu minha mão\nE disse toda a verdade\n\nEu só queria saber\nOnde andava\na Pomba Gira Cigana (2x)');

addPonto('trabalho',
  'Abre a roda...',
  'Abre a roda\ndeixa pomba gira trabalhar (2x)\n\nela tem peito de aço\nela tem peito de aço\ne coração para amar (2X)');

// ===== PAGE 7 =====
addPonto('cura',
  'É, pois é, Exú dá caminho...',
  'É, POIS É\nEXÚ DÁ CAMINHO\nÉ SÓ PEDIR COM FÉ (2X)\n\nA NOITE É LINDA NO CÉU BRILHA A LUA\nFAÇO UMA ORAÇÃO AO SEU TRANCA-RUAS\nHOMEM VALENTE, MEU PROTETOR\nREI DA ENCRUZILHADA É SEU MARABÔ\nO GALO CANTA DENTRO DA CALUNGA\nSAUDANDO A MAGIA DE SETE CATACUMBAS\nSUAS PALAVRAS SÃO VERDADEIRAS\nQUEM AVISA AMIGO É, DISSE SEU CAVEIRA\n\nÉ, POIS É\nEXÚ DÁ CAMINHO\nÉ SÓ PEDIR COM FÉ (2X)\n\nAO LADO DELE SEI QUE ESTOU SEGURO\nNÃO TENHO NADA A TEMER, ELE É EXÚ VELUDO\nSE ESTOU EM PERIGO, ELE VEM AGIR\nSALVE O EXÚ MENINO, SALVE SEU TIRIRI\nMEUS INIMIGOS NÃO TIRAM MEU SOSSEGO\nTENHO O OMBRO AMIGO DO EXÚ MORCEGO\nE AS MANDINGAS QUE JOGARAM EM MIM\nQUEM CORTOU BRINCANDO FOI EXÚ MIRÍM\n\nPODE ACREDITAR\nEXÚ VAI LHE AJUDAR\nÉ SÓ PEDIR COM FÉ\nQUE A SUA VIDA VAI MUDAR [2X]');

// ===== PAGE 8 =====
addPonto('louvacao',
  'É meia noite em ponto e o galo cantou...',
  'É meia noite em ponto e o galo cantou (2x)\nCantou pra anunciar que Tiriri chegou (2x)\n\nEle vem da Calunga de capa\nCartola e tridente na mão\nEsse Exú de fé é quem nos trás Axé e nos dá proteção\nEle é Exú Odara e vem nos ajudar\nCom seu punhal ele fura, ele corta demanda\nEle salva, ele cura\nExú é mojubá\nLaroiê\n\nLaroiê Exú, Exú Amojubá\nEu perguntei a ele o que é Exú ele vem me falar (2x)\n\nExú é caminho, é energia, é vida, é determinação\nÉ cumpridor da Lei, Exú é esperto, Exú é guardião\nExú é trabalho, é alegria veloz, Exú é viver, é a magia\nÉ o encanto, é o fogo, é o sangue na veia vibrando\nExú é prazer\nlaroiê\n\nAlaruê Exú, Exú Amojubá\nTrás sua falange Exú Tiriri para trabalhar\nLaroiê Exú\nLaroiê Exú, Exú Amojubá\nTras sua falange Exú Tiriri para trabalhar.\nVem seu Tranca-Ruas, Maria Padilha e Exú Marabô\nSete Encruzilhadas, seu Zé Pilintra aqui chegou\nMaria Mulambo, Maria Farrapo e Dona Figueira\nDona Sete Saias, Pombogira menina e Rosa Vermelha\nSete Catacumbas, Exú Caveira firmam ponto aqui\nE o Exú Capa Preta anunciou a festa é do Exú Tiriri\nDeu meia noite em ponto!');

addPonto('trabalho',
  'Exú a lala ô...',
  'EXÚ A LALA Ô\nA LALA Ô É MOJUBÁ (2X)\n\nELE É EXU É DE QUERÊR QUERÊR\nELE É EXU É DE QUERÊR QUERA');

// ===== PAGE 9 =====
addPonto('trabalho',
  'Me disseram que essa casa ia cair...',
  'ME DISSERAM QUE ESSA CASA IA CAIR\nME DISSERAM QUE ESSA CASA IA CAIR\n\nMAS ESSA CASA É DE MADEIRA\nQUE NÃO DÁ CUPIM [2X]');

addPonto('cura',
  'Perambulava pelas ruas...',
  'Perambulava pelas ruas\nJá sem saber o que fazer\nProcurava na noite\nUma solução pra tanta dor\nSofrimento e solidão\nEntão eu clamei ao povo da rua\nQue me enviasse no momento alguma ajuda\nPois eu já não tinha forças pra continuar\nQuando me virei, vi uma mulher\nNa beira da estrada\nTrazia uma rosa em sua mão\nUm feitiço no olhar\nNaquela bela noite de luar\nVislumbrei sua dança com sua saia a rodar\nEu me aproximei e lhe perguntei o que ela fazia na estrada\nEla respondeu: Moço, sou rainha, vim lhe ajudar, sou Maria Padilha!\n\nSalve Maria Padilha!\nQuando precisei, oh pombogira, você veio me ajudar\nTu deste outro rumo a minha vida\nHoje eu venho te louvar!\n\nSalve Maria Padilha, Salve Maria Padilha, Salve Maria Padilha,\nSalve Maria Padilha\nQuando precisei, oh pombogira, você veio me ajudar\nTu deste outro rumo a minha vida\nHoje eu venho te louvar!');

addPonto('demanda',
  'Bem que eu lhe avisei...',
  'BEM QUE EU LHE AVISEI\nPRA VOCÊ NÃO JOGAR\nESSA CARTADA COMIGO [2X]\nVOCÊ JOGOU COM VALETE\nE EU JOGUEI COM A DAMA\n\nOLHA VOCE MEU AMIGO,\nPOMBO-GIRA CIGANA É POMBO-GIRA DE FAMA [2X]');

// ===== PAGE 10 =====
addPonto('louvacao',
  'Lá na encruza, existe um homem valente...',
  'LÁ NA ENCRUZA\nEXISTE UM HOMEM VALENTE\nCOM SUA CAPA E CARTOLA\nCOM SEU PUNHAL e tridente\nCOM SUA CAPA E CARTOLA\nCOM SEU PUNHAL E tridente\n\nÉ MADRUGADA…\n\nÉ MADRUGADA\nE ELE ESTÁ DO MEU LADO [2X]\nPOR ISSO EU LHE PEÇO, TRANCA-RUA\nSEJA O MEU ADVOGADO [2X]');

addPonto('louvacao',
  'Ele se chama Tranca Rua...',
  'ELE SE CHAMA TRANCA RUA\n\nQUE NASCEU NO MATO-GROSSO\nSE CRIOU COM NAZARÉ\n\nELE É FILHO DE UM XAVANTE\nÉ NETO DE UM NAVEGANTE\nÉ TRANCA-RUA DE EMBARÉ\n\nÉ DE EMBARÉ, É DE EMBARÉ\n\nÉ DE EMBARÉ, É DE EMBARÉ\n\nSEU TRANCA-RUA DE EMBARÉ [2X]');

addPonto('louvacao',
  'Foi em uma estrada velha...',
  'FOI EM UMA ESTRADA VELHA\nNA SUBIDA DE UMA SERRA\nNUMA NOITE DE LUAR\nDE LUAR DE LUAR\n\nPOMBO-GIRA DA FIGUEIRA\nMOÇA BELA E FACEIRA\nDAVA O SEU GARGALHAR\n\nELA É MOJUBÁ\nELA É MOJUBÁ\nELA É MOJUBÁ\nELA É MOJUBÁ');

// ===== PAGE 11 =====
addPonto('louvacao',
  'Deu meia-noite, a lua se escondeu...',
  'DEU MEIA-NOITE\nA LUA SE ESCONDEU\nLÁ NA ENCRUZILHADA, DANDO A SUA GARGALHADA\nMARIA PADILHA APARECEU [2X]\n\nLAROIÊ, LAROIÊ, LAROIÊ\nÉ MOJUBÁ, É MOJUBÁ, É MOJUBÁ\nELA É ODARA, QUEM TEM FÉ NA MARIA PADILHA\nÉ SÓ PEDIR QUE ELA VAI DAR [2X]');

addPonto('firmeza',
  'Seu Tranca Rua, dá uma volta lá fora...',
  'SEU TRANCA RUA\n\nDÁ UMA VOLTA LÁ FORA [2X]\n\nQUEM FOR BOM, BOTA PRA DENTRO\nE QUEM NÃO FOR DEIXA LÁ FORA [2X]');

addPonto('trabalho',
  'Eu juro que vou matar essa andorinha...',
  'EU JURO QUE VOU MATAR\nESSA ANDORINHA\nEU JURO QUE VOU AMAR\nESSA MULHER [2X]\n\nESSA MULHER\nESTA FAZENDO MORADA NA MINHA CALUNGA\nEU JURO QUE VOU AMAR ESSA MULHER [2X]');

addPonto('louvacao',
  'Foi nas almas que eu conheci Exu...',
  'FOI NAS ALMAS,\n\nFOI NAS ALMAS QUE EU CONHECI EXU (2X)\n\nFOI NAS ALMAS QUE EU CONHECI SETE PORTEIRAS\n\nFOI NAS ALMAS QUE CONHECI EXU (2X)');

// ===== PAGE 12 =====
addPonto('demanda',
  'Olha pisa no toco...',
  'Olha pisa no toco\nPisa no galho\nO galho quebra e exu não cai o ganga\n\nExu, olha pisa num toco de um galho só (2x)');

addPonto('trabalho',
  'Quando passar naquela encruza...',
  'QUANDO PASSAR NAQUELA ENCRUZA\nNÃO SE ESQUEÇA DE OLHAR PRA TRÁS [2X]\n\nOLHA QUE LÁ, TEM MORADOR\nEXU VELUDO É QUEM MORA LÁ');

addPonto('trabalho',
  'Ela gira no ar...',
  'Ela gira no ar\nEla gira na praça\nEla gira na rua (ê,ê,ê)\nEla canta ela dança\nEla vive sorrindo em noite de lua (ê,ê)\nEla é sincera\nEla é de verdade\nMas cuidado amigo que ela não gosta de falsidade');

addPonto('chegada',
  'Ele tem olho de fogo...',
  'Ele tem olho de fogo\nSua capa de doutor\nNo mar ele vive ao longe\nE na beira ele é pescador (2x)\n\nPescador ele não é\nPorque vive de maré\nSe seu barco já virou\nExu Maré aqui chegou (2x)');

// ===== PAGE 13 =====
addPonto('demanda',
  'O mar roncou e a terra tremeu...',
  'O mar roncou\nE a terra tremeu (2x)\nMaior que exu Maré na terra\nÈ Deus, É Deus (2x)');

addPonto('chegada',
  'Exu veludo quando vem...',
  'Exu veludo quando vem (Lálaiá,\nEle faz a sua magia\nLálaiá\nPara saudar todos os seus filhos\nLálaiá\nE retirar feitiçaria (2x)\n\nPisa na umbanda exu Veludo eu quero ver\nPisa na umbanda exu Veludo pra valer (2x)');

addPonto('chegada',
  'Exu, quando eu passei naquela estrada...',
  'Exu, quando eu passei naquela estrada\nEu ouvi uma gargalhada eu parei pra ver quem é (2x)\n\nE aquele homem, de capa preta me falou\nBoa noite eu me chamo Marabô\nSe precisar, sabe onde eu estou\nSe quiser ser protegido eu serei seu protetor\n\nSeu Marabô, seu Marabô\nEsse exu, ele muito me ajudou\nSeu Marabô, seu Marabô\nVenha na umbanda, vem mostrar o seu valor');

// ===== PAGE 14 =====
addPonto('trabalho',
  'Bará tu me acompanha...',
  'Bará tu me acompanha\nBará tu és um nagô (2x)\nBará tu me acompanha\nBara, Bara naue nago');

addPonto('trabalho',
  'Eu tenho um guerreiro na porta do ilê plantado...',
  'Eu tenho um guerreiro na porta do ilê plantado (2x)\nEle é Bará, ele é Bará, ele é quem corta demanda\nExu corgeua (2x)');

addPonto('chegada',
  'Olha meu amigo que por ele não da nada...',
  'Olha meu amigo que por ele não da nada (2x)\nEle é exu Bará\nEle trabalha com espada (2x)\nVem na fé de Oxalá\nVem na fé de Omulu (2x)\nEle é exu Bará\nEle é exu Bará (2x)');

// ===== PAGE 15 =====
addPonto('chegada',
  'Quando o sol aqui não mais brilhar...',
  'QUANDO O SOL AQUI NÃO MAIS BRILHAR\nQUANDO A LUA SEU CLARÃO REFLETIR\nÉ SINAL QUE ESTÁ NA HORA\nÉ ELE QUE CHEGA AGORA JÁ DEU MEIA-NOITE\nTRANCA-RUA QUE CHEGA AQUI [2X]\n\nJUROU AMAR ALGUÉM NA ENCRUZILHADA\nJUROU FAZER O BEM DE MADRUGADA\nHOJE COM FÉ\nCOMPANHEIRO E AMIGO LEAL\nQUE QUEBRA FEITIÇO E TAMBÉM DESFAZ O MAL\n\nE TODA VEZ QUE NA RUA EU CAMINHAR\nE OUVIR AO LONGE SUA VOZ A ECOAR\nTENHO CERTEZA QUE AGORA NÃO ANDO SOZINHO\nSEU TRANCA-RUA É DONO DO MEU CAMINHO [2X]');

addPonto('chegada',
  'Seu gangar não me engana...',
  'Seu gangar não me engana, Seu gangar me falou\nSe essa é cigana, Atoto quem mandou (2x)\n\nNa beira da praia ela desce\nCom sua corrente de fé\nNa beira da praia ela sobe\nTrazendo a oxum da maré\nSanto Antonio entrou na dança\nDança de Omoloko\nDeu a Mao a uma criança\nEla é filha de Xangô\nO pandeiro tem magia\nA cigana leu a fé\nA 7 nuvens é um guia\nDo anel de são Miguel');

// ===== PAGE 16 =====
addPonto('trabalho',
  'Sete é protetora é mensageira do amor...',
  'Sete é protetora é mensageira do amor (2x)\n\nEstá no alto\nA sete está no alto\nE la do alto\nEla olha por nós\nLevante os braços\nFirme seu pensamento\nNeste momento\nEla vai lhe ajudar\n\nA sete reina sobre a terra\nA sete reina sobre o mar\nSete diz que aqui na terra\nO seu poema é amar\n\nA sete trabalha\nA sete não falha\nEu agradeço a minha amiga sete (2x)');

addPonto('chegada',
  'Umbanda sua rainha chegou...',
  'Umbanda sua rainha chegou\nUmbanda mais uma estrela brilhou (2x)\n\nSalve, salve dona sete nuvens\nQue veio da encruzilhada\nPara saudar nossa gira\nSalve seu ponteiro de aço\nSalve a sua tesoura que corta todo embaraço');

// ===== PAGE 17 =====
addPonto('louvacao',
  'Seu Sete, meu amigo de alma...',
  'Seu Sete\nMeu amigo de alma\nSeu Sete, meu irmão quimbandeiro\n\nGira, todo mundo gira\nSete porteiras é\nMensageiro de Oxalá (2x)');

addPonto('firmeza',
  'Quem é que chegou no reino...',
  'Quem é que chegou no reino\nQuem é (2x)\nEle é Sete Porteira das almas\nEle é (2x)');

addPonto('firmeza',
  'Corre ronda correu...',
  'Corre ronda correu\nSete porteira é mojuba (2x)');

addPonto('firmeza',
  'Agora sim a nossa está firmada...',
  'Agora sim a nossa está firmada (2x)\nCom uma pemba na calunga\nE a outra na encruzilhada (2x)');

// ===== PAGE 18 =====
addPonto('louvacao',
  'Oh dizem que a Padilha é uma rosa...',
  'Oh dizem que a Padilha é uma rosa\nQue a Padilha é uma rosa\nQue nasceu na beira de um caminho\nOh dizem que a Padilha é uma rosa\nQue a Padilha é uma rosa\nQue abre os meus caminhos (2x)\n\nPombogire, pombo gira, sem a força da Padilha não se pode trabalhar\nSete faca encravadas\nEm cima daquela mesa, sarava seu arranca toco e a pomba gira altesa');

addPonto('louvacao',
  'O que caminho tão escuro...',
  'O que caminho tão escuro\nQue vem saindo aquela linda moça\nCom seu vestido de xita\nQuebrando osso por osso (2x)\nMas ela é Maria Padilha\nRainha de tanto alvoroço');

// ===== PAGE 19 =====
addPonto('louvacao',
  'É maloqueira é da lixeira...',
  'É maloqueira é da lixeira\nÉ da pá virada (2x)\nEla Maria Mulambo e não me deve nada (2x)\nÉ do luxo ao lixo, É do trapo ao pó\nEla é Maria Mulambo, Ela é farrapo só\nQuem não lhe conhece vai lhe conhecer\nEla é Maria Mulambo com muito prazer (2x)\n\nEla nasceu no lixo na boca da lixeira\nEla nasceu no lixo na boca da lixeira\nEla é Maria Mulambo\nEla não é de brincadeira (2x)');

addPonto('louvacao',
  'Padilha soberana das almas...',
  'Padilha soberana das almas\nRainha da encruzilhada\nÉ mulher de muito axé\nSuprema é a mulher de negro\nA rainha do terreiro\nSeu feitiço tem axé\n\nMas ela é\nEla é, ela é\nA rainha da encruza\nÉ mulher de muito axé (2x)');

// ===== PAGE 20 =====
addPonto('louvacao',
  'Rosa vermelha, rosa vermelha sagrada...',
  'Rosa vermelha,\nRosa vermelha sagrada\nRosa vermelha, a pomba gira\nRainha das sete encruzilhadas\nQuando ela vem\nEla bebe e da risada (2x)\n\nEla é a pomba gira rainha das sete encruzilhadas (2x)');

addPonto('louvacao',
  'E calungueiro, quem manda na calunga...',
  'E calungueiro, quem manda na calunga é calungueiro (2x)\nQuem manda na calunga é calungueiro\nJoão Caveira é feiticeiro (2x)');

addPonto('firmeza',
  'Exu, tu é tatá de Umbanda...',
  'Exu, tu é tatá de Umbanda\nA sua força é quem vai nos socorrer\nExu, vencedor de demandas\nCorre, corre, corre gira e de proteção pra nossa banda (2x)\n\nDeu uma ventania, levantou poeira\nQuem comanda gira\nÉ Exu Sete Porteiras (2x)');

// ===== PAGE 21 =====
addPonto('demanda',
  'Quem viu, não devia ver...',
  'Quem viu, não devia ver\nQuem tem não merece ter (2x)\nDa onde eu vim, pra onde eu vou\nAonde eu moro e quem eu sou\nQuem é você, pomba gira\nQuem somos nós (2x)');

addPonto('louvacao',
  'No meio da mata virgem...',
  'No meio da mata virgem\nEla fez sua morada\nEla é dama da noite\nRainha da madrugada (2x)\n\nLe, Le, Le, Le\nDama da noite não pode faltar\nLe, Le, Le, La\nSe ela faltar eu mesmo vou buscar (2x)\n\nSacudindo a sua saia para todo mal levar (2x)');

// ===== PAGE 22 =====
addPonto('demanda',
  'Exu Caveira é homem...',
  'Exu Caveira é homem\nPromete pra não faltar\nQuatorze carros de lenha\nPra cozinhar um gambá (2x)\n\nA lenha já se queimou\nE o gambá não cozinhou (2x)\n\nDizem que o céu é perto\nNas nuvens não chegar\nOs anjos do céu tão rindo\nDo tombo que ele vai levar (2x)');

addPonto('trabalho',
  'Salve Exu, salve o rei da encruzilhada...',
  'Salve Exu, salve o rei da encruzilhada\nToma conta e presta conta\nNo romper da madruga (2x)\n\nPombo gire\nPombo gira\nSem a força de exu,\nNão se pode trabalhar (2x)\n\nSete faca encravadas em cima daquela mesa\nSarava seu Arranca Toco e a pomba gira Altesa');

// ===== PAGE 23 =====
addPonto('cura',
  'Exu no terreiro é rei...',
  'Exu no terreiro é rei, Na encruza ele é doutor (2x)\nSeu Exu faz a mironga\nSeu exu é curador (2x)');

addPonto('trabalho',
  'Exu afirma seu ponto aqui neste terreiro...',
  'Exu afirma seu ponto aqui neste terreiro\nDeu meia noite na lua\nDeu meio dia no sol (2x)');

addPonto('louvacao',
  'De dia quem manda é sol...',
  'De dia quem manda é sol\nA noite quem manda é a lua (2x)\nNa praia exu Maré\nNa rua seu Tranca Ruas (2x)\nÉ, é, é Exu Maré é de fé (2x)');

addPonto('demanda',
  'Vou fazer figa para quem de mim falar...',
  'Vou fazer figa para quem de mim falar\nZum, zum, zum Gira - Mundo vamos girar\nO meu pai falou que um dia\nNa língua de candomblé\nA língua que fala muito\nA gente pisa com o pé\nEnquanto o sujeito dorme\nO meu pai ta na curimba\nZum, zum, zum Gira – Mundo\nVou botar uma pedra em cima');

// ===== PAGE 24 =====
addPonto('louvacao',
  'Da onde eu vim, atravessei sete pedreiras...',
  'Da onde eu vim\nAtravessei sete pedreiras\nTambém passei por cachoeiras\nAonde mora Yeyeo\nE nas campinas\nAonde a lua é prateada\nEla é cigana de alvorada\nÉ Sayonara eu sou mais (2x)');

addPonto('trabalho',
  'Exu bebe marafa meu povo...',
  'Exu bebe marafa meu povo\nPra tomar conta do que tem (2x)\nTomar conta do que tem (2x)\nExu bebe marafo pra tomar conta do que tem');

addPonto('chegada',
  'Ele vem na umbanda ele vem na Quimbanda...',
  'Ele vem na umbanda ele vem na Quimbanda\nSete catatumba\nEle vem La no Keto e vem no Candomblé (2x)\nLaroye exu, laroye exu\nExu é mojuba');

addPonto('trabalho',
  'Leve na encruzilhada cigarro, marafo e vela...',
  'Leve na encruzilhada cigarro, marafo e vela\nFaça seu pedido moço\nPensando nela (2x)\nSe você merecer, ela vai lhe atender (2x)');

// ===== PAGE 25 =====
addPonto('cura',
  'Ciganinha, ciganinha...',
  'Ciganinha, ciganinha\nDa sandália de pau (2x)\nAonde a cigana passa\nEla faz o bem e carrega o mau');

addPonto('trabalho',
  'Quem nesse mundo nunca ouviu dizer...',
  'Quem nesse mundo nunca ouviu dizer\nE nesse mundo nunca ouviu falar (2x)\nDe uma cigana que mora naquela estrada\nEla fez sua morada sobre o clarão do luar (2x)\ncigana da estrada\nmoça poderosa\nMe de proteção e axé ciganinha formosa (2x)');

addPonto('louvacao',
  'Ganhei uma barraca velha...',
  'Ganhei uma barraca velha\nFoi a Cigana quem me deu (2x)\nO que é meu é da Cigana (ciganinha)\nO que é dela não é meu (2x)\nA cigana mujere, mujere, mujere (2x)');

addPonto('chegada',
  'Que bando é esse...',
  'Que bando é esse,\nÉ um bando de cigano (2x)\nÉ caravana, é caravana, é caravana de cigano');

addPonto('trabalho',
  'Amigo, joguem flores e perfumes...',
  'Amigo, joguem flores e perfumes, Joguem flores e perfumes\nQue a cigana está em festa (2x)\nCastanhola, violinos e pandeiros\nO sonho de um amor verdadeiro (2x)\nÔ, ô, ô, ô, ô, ô, ô, ô povo cigano\nÔ, ô, ô, ô, ô, ô, ô, ô povo da estrada\n\nAlupande, pande povo cigano\nAlupande, povo da estrada (2x)');

// ===== PAGE 26 =====
addPonto('demanda',
  'Quando exu se casou...',
  'Quando exu se casou\nUm grande banquete ele deu\nTinha escama de peixe o ganga\nZum, zum, zum\nQuem tem olho ruim\nNão olha pra eu (2x)');

addPonto('chegada',
  'Ela vem que vem mau...',
  'Ela vem que vem mau\nVem quebrando madeira\nVem quebrando pau');

addPonto('trabalho',
  'Boa noite banda...',
  'Boa noite banda\nComo vai, como passou (2x)\n\nVai muito bem banda\nVai muito bem banda (2x)');

addPonto('trabalho',
  'Primeiro ela me deu boa noite...',
  'Primeiro ela me deu boa noite\nBoa noite banda\nQuando ela chega ela vai La\nLa, laia, Laia (2x)\nEla se veste de cartola\nLa, laia, laia\nE tocava castanhola\n\nComo ela chorou, como ela chorou\nAquele noite e dia\nQue meu amor lhe entregou (2x)');

addPonto('trabalho',
  'Girou, girou, girou exu Giramundo...',
  'Girou, girou, girou exu Giramundo\nGirou, girou pomba gira que vence demanda\nRainha da encruza sarava umbanda\nÊ, ê, ê\nSarava umbanda(3x)');

// ===== PAGE 27 =====
addPonto('firmeza',
  'Corre, corre encruzilhada...',
  'Corre, corre encruzilhada\nSete porteiras quem mandou (2x)\nFoi na porteira da calunga só\nNa gira de Marabô (2x)');

addPonto('louvacao',
  'O meu amor é tão grande por ti, oh cigana...',
  'O meu amor é tão grande por ti\nOh, cigana\nA minha vida é a sua também\nO seu olhar me facina (2x)\n\nOh cigana tu é meu bem querer\nMeu bem querer\nAs estrelas do céu são seu olhar\nSeu olhar\nVem a lua e te cobre o cigana\nAonde você está');

addPonto('chegada',
  'Do buraco de onde vim...',
  'Do buraco de onde vim\nAs mulheres me odeiam\nDo buraco onde eu vim\nOs homens me desejam\nFoi menina\nJá foi moça\nHoje ela é mulher\nEla é Maria Farrapo\nÉ dona de cabaré\n\nEla vem girando, girando, girando, girando, girando\nEla vem girando, girando, girando, girando, girando\nVem dando gargalhada é Maria Farrapo quem está chegando (2x)');

addPonto('louvacao',
  'O morro de santa tereza está de luto...',
  'O morro de santa tereza está de luto\nMataram Zé pelintra, na porta de um cabaré\nPor causa de uma mulher\nEle chorava, ele chorava, ele chorava\nPor uma mulher que não lhe amava');

// ===== PAGE 28 =====
addPonto('louvacao',
  'Quando ela era menina...',
  'Quando ela era menina\nFoi jogada na porta\nDe um cabaré\nVolta pra casa menina,\nAqui não entra criança\nAqui so entra mulher (2x)\n\nViva aleluia, viva aleluia\nEla deixou de ser criança\nAgora é\nMulher da rua (2x)');

addPonto('louvacao',
  'Seu olhar é sereno...',
  'Seu olhar é sereno\nSeu olhar me fascina (2x)\n\nEla vem girando na linha das almas\nMaria Padilha (2x)\n\nQuando eu toco o tambor\nEu toco essa gira pra ela(2x)\n\nEla vem girando na linha das almas\nMaria Padilha (2x)');

addPonto('louvacao',
  'Ô, marinheiro marinheiro...',
  'Ô, marinheiro marinheiro - marinheiro só\nÔ, quem te ensinou a nadar - marinheiro só\nOu foi o tombo do navio - marinheiro só\nOu foi o balanço do mar - marinheiro só (2x)\n\nLá vem, lá vem - marinheiro só\nComo ele vem faceiro - marinheiro só\nTodo de branco - marinheiro só\nCom o seu bonezinho - marinheiro só (2x)');

addPonto('trabalho',
  'Auê, meu santo Antônio...',
  'Auê, meu santo Antônio\nVenha me ajudar a trabalhar\nAue todo exu ta trabalhando\nToda demanda eles vão levar\nPra encruzilhada');

// ===== PAGE 29 =====
addPonto('louvacao',
  'Você ta vendo aquela casa pequenina...',
  'Você ta vendo aquela casa pequenina?????\nLa no alto da colina\nque ele mandou fazer\nÉ a igreja do martírio\nNa porta do sofrimento\nAonde mora Zé Pelintra');

addPonto('louvacao',
  'O Zé, quando for lá pra lagoa...',
  'O Zé, quando for La pra lagoa\nToma cuidado com o balançar da canoa\n\nO Zé, faça tudo que quiser\nSó não maltrate o coração desta mulher (2x)');

addPonto('trabalho',
  'Que pompa gira formosa...',
  'Que pompa gira formosa\nQue pomba gira assanhada\nFirma seu ponto na gira\nE também na encruzilhada');

addPonto('trabalho',
  'Ela é bonita, protetora das mulheres...',
  'Ela é bonita, protetora das mulheres\nTrabalhou no cais\nNo pesado sim senhor\nEu pedi uma flor\nEla me deu um jardim\nJogou fagulhas de luz\nNos meus caminhos\n\nAté agora, esqueci de perguntar\nNa estrada da vida moça\nComo eu posso lhe chamar (2x)\n\nMoça qual é o seu nome,\nNa beira do mar sou Maria Homem (2x)');

addPonto('trabalho',
  'O lua é de madrugada...',
  'O lua é de madrugada\nMe diga aonde anda 7 Encruzilhadas\n\nEle está, no meio da rua\nEle é quimbandeiro\nDe sua morada (2x)');

// ===== PAGE 30 =====
addPonto('cura',
  'O moça, com todos seus encantos...',
  'O moça, com todos seus encantos\nVenha acalmar o meus prantos\nVenha me socorrer (2x)\n\nO moça devo a muito a você\nMas tenho a certeza\nQue você vai me socorrer\n\nEu vou levar\nOferenda na encruzilhada\nUma saia rodada, pra ofertar (2x)');

addPonto('demanda',
  'Pelos erros cometidos...',
  'Pelos erros cometidos\nHá muito tempo atrás\nO pó já virou poeira\nÉ filho de João Caveira (2x)\n\nA poeira virou brasa\nNa poeira ninguém se vê\nEle é filho de Omulu\nTrabalha pra exu Caveira\nPisa na estrada que La vai poeira\nPisa na estrada que La vai poeira\nPisa na estrada que La vai poeira\nPisa na estrada que La vai poeira (2x)');

// ===== PAGE 31 =====
addPonto('cura',
  'Moça quem é você...',
  'Moça quem é você\nQue gira na encruzilhada\nQue ao romper do dia\nNa rua faz morada (2x)\n\nQuando eu caminhava\nSó e triste no cruzeiro\nEssa moça de vermelho\nSorrindo me apareceu\nCom sete rosas\nSua cabeça enfeitava\nCom marafo e cigarro\nEla gargalhava\nE sua saia rodada que girando não se vê\nSua coroa de ferro ela veio me valer\nCom seu abraço a tristeza foi sumindo\nE foi diminuindo até desaparecer\n\nBonita moça\nMoça encanta\nBonita moça que vem girando de madrugada (2x)');

addPonto('trabalho',
  'Nem se eu colhesse todas as rosas...',
  'Nem se eu colhesse todas as rosas\nQue nascem nos mais lindos jardins\nNão teria a magia\nDo perfume que você transmite em mim\nOh cigana!\nOh cigana! Con sua saia rodada\nEnfeitada de várias cores\nTrazendo seus mistérios\nQue um rainha possui\nCom todos seus esplendores (bis)');

addPonto('cura',
  'Maria Padilha fiel companheira...',
  'Maria padilha fiel companheira de todas as horas\nme leve essa dor, que no meu peito mora\neu vou seguindo, vou caminhando pelo mundo a fora\nsanto antonio de pemba, maria padilha é quem me consola');

// ===== PAGE 32 =====
addPonto('trabalho',
  'A meia noite ao cair da madrugada...',
  'A meia noite ao cair\nDa madrugada\nGalo canta é alvorada\nPia Itatuité\nNão sei de onde\nComeçou a caminhada\nEncruzada longa estrada\nVenha de onde vieram\nEle é o mago\nSenhor das oferendas\nO homem das velhas lendas\nQue faz o sangue gelar\nEle é o bruxo\nQue faz cura\nFaz feitiço\nEm macumba de catiço\nInaína mojubá.\n\nExú Marabô\nExú Marabô\nExú Marabô\nEle é lêbara, ele é larô.');

// ===== PAGE 33 =====
addPonto('trabalho',
  'É a hora, é chegada a hora...',
  'É A HORA\nÉ CHEGADA A HORA\nDE FIRMAR NOSSA PORTEIRA\nCOM A FORÇA DA FALANGE DOS CAVEIRAS [2X]\n\nVAMOS TODOS BATER PALMAS\nPARA QUANDO EXÚ CHEGAR\nQUERO VER SUA GARGALHADA\nATÉ O DIA CLAREAR\n\nELE VEM DO CEMITÉRIO\nELE VEM LÁ DA CALUNGA\nSARAVÁ JOÃO CAVEIRA\nE SEU SETE CATACUMBAS\n\nÉ A HORA\nÉ CHEGADA A HORA\nDE FIRMAR NOSSA PORTEIRA\nCOM A FORÇA DA FALANGE DOS CAVEIRAS [2X]\n\nO PRIMEIRO ENVIADO É O SEU TATA CAVEIRA\nVOU CHAMAR seu sete covas\nE TAMBÉM SETE PORTEIRAS\nTODOS ELES MENSAGEIROS\nDO NOSSO PAI OMULÚ\nPOR ISSO HOJE A NA GIRA\nVAMOS SARAVÁ EXÚ\n\nÉ A HORA\nÉ CHEGADA A HORA\nDE FIRMAR NOSSA PORTEIRA\nCOM A FORÇA DA FALANGE DOS CAVEIRAS [2X]');

// ===== PAGE 34 =====
addPonto('trabalho',
  'Era madrugada, quando uma gargalhada na encruza ecoou...',
  'Era madrugada, quando uma gargalhada na encruza ecoou\na lua brilhava, a lua iluminava, os caminhos por onde exu passou\nquando o galo canta, é hora\nsete vezes o sino bateu\ncom sua capa bem exuberante\nhomem nobre elegante\nseu 7 encruza apareceu\nfeitiços e mandingas ele é quem vai desmanchar\nele corta demanda na força do seu axé\n\n7 facas fincadas na encruza eu encontrei\nele é o seu 7 o dono da rua aonde ele é rei(2x)\n\n7 vezes no caminho, 7 vidas 1 destino\n7 amores são a historia desse exu trabalhador\ncom ele sempre ao meu lado\nsei que estarei de pé\nsalve 7 encruzilhadas\no meu amigo de fé');

addPonto('trabalho',
  'Eu vi, de preto e vermelho...',
  'Eu vi, de preto e vermelho\nwhisky charuto, nobre elegante\nna boemia, sempre bem trajado\nmulheres ao lado\nquase a todo instante\nhoje, ele é coroado\nO advogado, na linha de oxala\nE na encruza eu vou louvar\n\né doutor na quimbanda ele é rei\naue 7 encruzilhadas(2x)\n7 vezes eu amei, 7 vezes eu chorei\n7 vezes me apaixonei');

// ===== PAGE 35 =====
addPonto('trabalho',
  'Vou jogar dendê no luar...',
  'Vou jogar dendê no luar(3x)\nÉ Maria Quitéria que vem trabalhar\n\nÔh, luar(3x)\nÉ Maria Quitéria que vem trabalhar');

addPonto('trabalho',
  'Sacode o pó...',
  'Sacode o pó\nSuas mandingas são\nCercadas de mistérios\nSaravá a Pomba Gira\nQue vem lá do cemitério\n\nSe diz que faz é melhor não duvidar\nPorque a Rosa Caveira\nPromete para não faltar\n\nLevo uma rosa quando vou ao seu axé\nFalo com Rosa Caveira\nPorque nela eu tenho fé\n\nTudo o que peço nunca me deixou faltar\nEla é muito formosa Ena Ena Mojubá');

addPonto('louvacao',
  'Na família da Maria...',
  'Na família da Maria\nSó não entra quem não quer\nNa família da Maria\nSó não entra quem não quer\nÉ Maria Farrapo, Maria Quitéria, Maria Mulambo, Maria Mulher\nMaria Farrapo, Maria Padilha, Maria Mulambo, Maria Mulher');

// ===== PAGE 36 =====
addPonto('chegada',
  'Arreda homem que aí vem mulher...',
  'Arreda homem que aí vem mulher!(2x)\nEla é Maria Maria, rainha do cabaré(2x)\n\nSete porteiras veio na frente pra dizer quem ela é\nEla é Maria Padilha, rainha do cabaré(2x)');

addPonto('trabalho',
  'Vi um menino sentado na encruza...',
  'vi um menino sentado na encruza\nperguntei o que que foi, perguntei o que que faz(2x)\nEu vim aqui desmanchar feitiço\nMas pra Calunga, eu já vou voltar…..\n\nvi um menino sentado na encruza\nperguntei o que que foi, perguntei o que que faz(2x)\nEu sou Exú Mirim, e aprendi a trabalhar\nQuem me ensinou, foi Seu Tranca Ruas\nO seu feitiço, eu vou quebrar…..\n\nvi um menino sentado na encruza\nperguntei o que que foi, perguntei o que que faz(2x)\nQuero um marafo pra beber\nE um charuto pra fumar\no seu feitiço eu mandei embora\npara nunca mais voltar');

// ===== PAGE 37 =====
addPonto('louvacao',
  'É negra, é soberana e poderosa...',
  'É negra\nÉ soberana e poderosa\nÉ a mais linda das rosas\nQue encanta o jardim(2x)\n\nLá na calunga\nÉ luz que nos dá caminho\nNunca nos deixa sozinho\nSempre pronta pra nos ajudar(2x)\n\nÉ rica de energia e de beleza\nÉ fonte de alegria aonde houver tristeza\nSua missão é praticar a caridade\nDemonstrando lealdade\nTrabalhando para o bem\nAjudando a quem precisa\nE a quem não precisa também\n\nMas se você não acredita\nUm dia há de acreditar\nQuando passar pela calunga\nE Rosa Negra estiver lá(2x)\n\nIquaquá, iquaquá\nÉ Pombo-Gira Rosa Negra\nNa calunga a gargalhar\nIquaquá, iquaquá\nÉ Pombo-Gira Rosa Negra\nIna, ina, mojubá');

// ===== PAGE 38 =====
addPonto('cura',
  'Dizem que ele matou...',
  'Dizem que ele matou\nMas na verdade ele curou(2x)\n\nEle curou um cego\nEle curou um cego\nUm aleijado sarou\nUm aleijado sarou\nE uma mulher grávida\nEle amparou\n\nEssa criança cresceu\nEssa criança cresceu\nÉ seu amigo fiel\nÉ seu amigo fiel\nPerguntou o nome dele\nÉ o Malandro Miguel\n\nDizem que ele matou\nMas na verdade ele curou\nDizem que ele matou\nMas na verdade ele curou\n\nEle é um amigo\nEle é um amigo\nQue estende a mão\nEle não derruba\nQuem já está no chão\n\nDizem que ele matou\nMas na verdade ele curou\nDizem que ele matou\nMas na verdade ele curou\n\nEle joga baralho\nEle joga baralho\nEle gosta de trinca\nEle gosta de trinca\nÉ o Malandro Miguel\nMané Soares\nE Zé Pilintra');

// ===== PAGE 39 =====
addPonto('louvacao',
  'Madrugada linda, que ilumina a estrada de Maria Farrapo...',
  'Madrugada linda\nQue ilumina a estrada\nDe Maria Farrapo\n\nNoite de solidão\nCoração vazio\nAmargurado de ilusão\n\nMadrugada linda\nQue ilumina a estrada\nDe Maria Farrapo\n\nNoite de solidão\nCoração vazio\nAmargurado de ilusão\n\nAndo pelo mundo afora\nQuerendo só ser amada\nDesilusão doce senhora\nDesabrochou, rainha da madrugada\n\nEm cada copo, gargalhada\nAdeus, Maria, amargurada\nAgora mais amada\nDe alma e roupa surradas\n\nQuem foi que disse que meu trapo não é de lei\nTrapo é trapo eu sou farrapo\nEu sou mulher de um grande rei\n\nCacos e almas\nDestroços de coração\nRemendando vida a vida\nMinha sina, minha missão\n\nQuem foi que disse que meu trapo não é de lei\nTrapo é trapo eu sou farrapo\nEu sou mulher de um grande rei\n\nCacos e almas\nDestroços de coração\nRemendando vida a vida\nMinha sina, minha missão');

// ===== PAGE 40 =====
addPonto('louvacao',
  'Cálice encantado de mistérios transbordou...',
  'Cálice encantado de mistérios transbordou\nRosa Caveira é a mais bela\nNo jardim de Atotô(2x)\n\nMoça que caminha na calunga\nPor onde passa irradia a sua luz\nSabedoria do sagrado feminino\nSenhora do meu destino\nAquela que me conduz\n\nAo seu redor rosas florescem então\nNo jardim do campo santo enquanto\nFaz sua oração\n\nCálice encantado de mistérios transbordou\nRosa Caveira é a mais bela\nNo jardim de Atotô(2x)\n\nSenhora agradeço todo dia\nPor me livrar da magia\nDe quem me deseja dor\n\nE em suas mãos traz o sentido da vida\nNa caveira morre a intriga\nE na rosa renasce o amor\nDo coração tira o fel e traz o mel\nTão linda dama da noite sempre\nA ti serei fiel');

// ===== PAGE 41 =====
addPonto('trabalho',
  'Rainha das 7 encruzilhadas...',
  'Rainha das 7 encruzilhadas\nÉ pombo gira formosa\nRainha das 7 encruzilhadas\nÉ pombo gira formosa\n\nUsa uma saia encarnada\nUm dia deu-me uma rosa\nUsa uma saia encarnada\nUm dia deu-me uma rosa\n\nEla é mulher, ela tem axé\nE nela eu tenho fé\nEla é mulher, ela tem axé\nE nela eu tenho fé\n\nGira na encruzilhada\nGira gira no terreiro\nGira em Santa Catarina\nE gira lá em Juazeiro');

addPonto('louvacao',
  'Fui acusado de trair Maria Navalha...',
  'Fui acusado de trair Maria Navalha\nNuma noite em plena Lapa, com a Padilha do Cabaré\nMas, na verdade, estava no meu carteado\nMuito bem acompanhado com meus amigos de fé\nVoltei pra casa quando já era dia\nLá na rua já se ouvia: malandro traiu a mulher\n\nMas falador pode falar o que quiser\nMalandro que é Malandro respeita a mulher\nMas falador pode falar o que quiser\nSamba no fio da Navalha pra tu vê comé que é');

// ===== PAGE 42 =====
addPonto('trabalho',
  'Sou mais uma maria...',
  'sou mais uma maria\nmais a maria que voce pode ter fé\nsou mais uma maria\neu ja fui rainha, hoje sou da noite mulambo mulher\nsou do cemiterio, eu sou do lixo, sou da encruza, sou da estrada\nnão, eu nao sou sua, mas se merecer estarei contigo em sua caminhada');

// ===== PAGE 43 =====
addPonto('trabalho',
  'Laroiê, Laroiê, ela é mulher de fé...',
  'Laroiê, Laroiê, Laroiê, Ela é mulher de fé, Laroiê\nFoi na madrugada\nQue a Navalha deu a sua gargalhada\n\nEla traz uma navalha\nQue corta o mal e a injustiça\nProtegida de Zé Pilintra\nMaria Navalha não brinca\n\nCaminhou de rua em rua\nEm busca de moradia\nFoi na beira do cais\nQue conheceu a boemia\n\nEla é de laroiê\nEla é de mojubá\nEla é Maria Navalha\nQue vem aqui nos ajudar\n\nLaroiê\nLaroiê, Laroiê\nEla é mulher de fé\nLaroiê\nFoi na madrugada\nQue a Navalha deu a sua gargalhada\n\nTrabalhava na madrugada\nTrabalhava lá no cais\nMaria Navalha da Calunga\nFaz o que você não faz\n\nFoi na subida de uma serra\nQue eu a vi trabalhar\nJunto com Zé Pilintra\nPara todo mal levar\n\nEla é uma malandra de fé\nEla é uma malandra de luz\nEla é Maria Navalha\nQue não teme a mal nenhum');

// ===== PAGE 44 =====
addPonto('louvacao',
  'Da legião da justiça...',
  'Da legião da justiça\nEle me observa, do alto da sua pedra\nPesando em minha consciência\nÉ que ele se faz presença\nPara eu não errar\n\nCaminhos e escolhas confusas,\nA força da encruza vem me ajudar\n\nPalavras simples, porém verdadeiras\nEssa canção é uma oração à Exu Pedreira\nPalavras simples, porém verdadeiras\nEssa canção é gratidão à Exu Pedreira');

addPonto('louvacao',
  'Vem veludo, vem...',
  'Vem veludo, vem\nQuem caminha ao seu lado nunca vai temer ninguém (2×)\n\nLá na calunga o sino bate, anuncia o final de mais um dia\nO galo canta, ja é hora\nBate o tambor no terreiro\nO grande feiticeiro vai chegar agora\n\nO mudo falou, o surdo escutou\nQuando a gargalhada do veludo ecoou (2×)');

// ===== PAGE 45 =====
addPonto('trabalho',
  'Eu entrei lá na calunga...',
  'EU ENTREI LÁ NA CALUNGA, E PAREI LÁ NO CRUZEIRO,\nVENHO UM VENTO FORTE E LEVANTOU POEIRA,\n\nZUA ZUO, ZUA ZUEIRA,\nAQUELE VENTO ERA EXU CAVEIRA (2X)\n\nMARIMBONDO PEQUENINO, NÃO TEM MEDO DE NINGUÉM,\nELE É EXU CAVEIRA E SÓ TRABALHA PARA O BEM,\nSE VOCÊ NÃO ACREDITA É MELHOR ACREDITAR,\nELE É EXU CAVEIRA, AQUI E EM QUALQUER LUGAR,\n\nZUA ZUO, ZUA ZUEIRA,\nAQUELE VENTO ERA EXU CAVEIRA (2X)\n\nVENTO FORTE, VENTO FRACO, NA CALUNGA TEM PODER,\nESSA POEIRA É DO CAVEIRA,\nELE VEM NOS DEFENDER, (2X)\n\nZUA ZUO, ZUA ZUEIRA,\nAQUELE VENTO ERA EXU CAVEIRA (2X)');

addPonto('trabalho',
  'Escuto ao longe uma gargalhada...',
  'Escuto ao longe uma Gargalhada,\nNa madrugada o galo cantou,\nEle é o homem da Encruzilhada,\nQuem vem chegando é seu Marabô.\n\nA sua capa é que me protege,\nCom os seus olhos eu vou caminhar,\nE o feitiço que no meu caminho aparecer,\nSeu Marabô quem vai desmanchar.\n\nA lua brilha clareando a Umbanda,\nA noite fria ele vai aquecer,\nCom seu tridente ele firma seu ponto,\nSeu Marabô, Exu a Laroye,\nSeu Marabô, Exu a Laroye.');

// ===== PAGE 46 =====
addPonto('louvacao',
  'Êh Laroyê Exú, Marabô Mojubá...',
  'ÊH LAROYÊ EXÚ, ÊH LAROYÊ EXÚ, MARABÔ MOJUBÁ\nMARABÔ MOJUBÁ');

addPonto('trabalho',
  'Capa e cartola preta, anel de ouro no dedo...',
  'Capa e cartola preta, anel de ouro no dedo\nCharuto, fumaça clara, conhaque de casta rara\nÉ ele Seu Marabô\nTrabalha com mano e mana, pisa certo iao\nNão brinca com Marabô\nPisa certo iao, não brinca com Marabô\nPisa certo iao, não brinca com Marabô\n\nMarabô, futuro e presente\nMarabô, presente e passado\nMarabô, a vida da gente, em cada búzio jogado\nMarabô, futuro e presente\nMarabô, presente e passado\nMarabô, a vida da gente, em cada búzio jogado\n\nAh ha há, ele trabalha é protetor\nAh ha há, capa e bengala é Marabô\nAh ha há, ele trabalha é protetor\nAh ha há, capa e bengala é Marabô');

addPonto('trabalho',
  'Hoje vou passar no cemitério...',
  'Hoje vou passar no cemiterio\nsempre foi maior misterio\nsaber que ela mora la(2x)\ncova 66 corredor 40\npadilha levantou eu quero ver quem guenta');

// ===== PAGE 47 =====
addPonto('trabalho',
  'Onde tem almas, onde tem cruz e catatumbas...',
  'ONDE TEM ALMAS,\nONDE TEM CRUZ E CATATUMBAS\nÉ LA QUE MORA A RAINHA DA CALUNGA (X2)\nFOI OMULÚ QUE ANUNCIOU,\nFOI O CAVEIRA QUE É O DONO DA PORTEIRA,\nFOI A PADILHA, ADANA E A PUERÊ,\nFOI O SEU SETE, A MULAMBO E A MULAMBÉ\nque ANUNCIOU\nÔOOO CALUNGA!\nÔOOO CALUNGA!(X4)');

addPonto('trabalho',
  'Na sua panela de fogo...',
  'Na sua panela de fogo\nela vai trabalhar\nna sua panela de fogo\nmacumba hoje vai rolar(2x)\n\nquero ver, quero ver\na padilha mexer com dende(2x)\n\nmoço eu posso lhe dizer\no perigo que ela é\ntem encanto e tem magia\no feitiço dessa mulher\nte leva de um mundo ao outro\ncom apenas um pade\nseus inimigos tombam\nsem ao menos perceber\n\nquero ver, quero ver\na padilha mexer com dende(2x)');

addPonto('trabalho',
  'Duquesa do oriente...',
  'DUQUESA DO ORIENTE\nAMANTE DO EXU\nPRINCESA DO UNIVERSO\nRAINHA DE OMULÚ\nPROPIETARIA DO JARDIM\nAMANTE DA MADRUGADA\nPOMBAGIRA ROSA CAVEIRA\nGIRA NA LOMBA E NA ENCRUZILHADA! (X2)');

// ===== PAGE 48 =====
addPonto('trabalho',
  'Quando eu não tinha mais nada...',
  'Quando eu não tinha mais nada\nQuando eu chegava ao fim\nQuando eu não acreditava\nEu pedi meu Pai Ogum\nPra vir aqui lutar por mim\n\nOh, lua de prata\nClareia sobre mim\nEu sou filho de Ogum e não posso viver assim\n\nOh, lua de prata\nClareia sobre mim\nEu sou filho de Ogum e não posso viver assim\n\nMas foi......\n\nFoi numa noite bela\nFoi numa estrada sem fim\nFoi sobre a luz de uma vela que eu chamei Exú das Almas e ele respondeu assim\n\nOh, filho de fé\nEu sou seu protetor\nEu me chamo Tranca Rua\nFoi Ogum quem me mandou');

addPonto('trabalho',
  'Exú, Maria Padilha trabalha na encruzilhada...',
  'Exú, Maria Padilha trabalha na encruzilhada\nToma conta, presta conta ao romper da madrugada\nPomba Gira, minha senhora, que trabalha noite e dia\nÉ por isso que eu zombo com sua feitiçaria');

// Now add all pontos to data
const allPontos = [
  ...pontosByCategoria.trabalho,
  ...pontosByCategoria.demanda,
  ...pontosByCategoria.louvacao,
  ...pontosByCategoria.firmeza,
  ...pontosByCategoria.chegada,
  ...pontosByCategoria.cura,
];

data.pontos.push(...allPontos);

writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('Done!');
console.log(`Added ${subcategorias.length} subcategorias`);
console.log(`Added ${allPontos.length} pontos total:`);
console.log(`  - Trabalho: ${pontosByCategoria.trabalho.length}`);
console.log(`  - Demanda: ${pontosByCategoria.demanda.length}`);
console.log(`  - Louvação: ${pontosByCategoria.louvacao.length}`);
console.log(`  - Firmeza: ${pontosByCategoria.firmeza.length}`);
console.log(`  - Chegada: ${pontosByCategoria.chegada.length}`);
console.log(`  - Cura: ${pontosByCategoria.cura.length}`);
