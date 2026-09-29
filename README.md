# Mesa de Revisão (casca offline)

App instalável (PWA) para ler e anotar um PDF no tablet sem rede. Este repositório é público e contém
só a casca: a página, o leitor de PDF (pdf.js 3.11.174), o service worker, o manifest e os ícones.
Nenhum documento, trecho ou anotação fica aqui. O PDF, os trechos e as anotações vivem no repositório
privado `mesa-dados` e no próprio tablet (IndexedDB). O teste `tests/test_sem_conteudo.py` reprova o
repositório se aparecer um PDF, um `trechos*.json`, um `estado*.json` ou um `respostas*.json`.

Endereço: https://alvarorgo.github.io/mesa-casca/

## Roteiro para Alvaro

### Uma vez (cerca de 40 minutos, com rede)

1. **Criar o token**, de preferência no Chrome do próprio tablet (assim ele já fica copiado), logado no GitHub como `alvaroRGO`:
   1. github.com → foto no canto superior direito → **Settings** → no fim do menu da esquerda, **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
   2. **Token name**: `mesa-dados-tablet`. **Expiration**: 30 days.
   3. **Repository access**: **Only select repositories** → escolher `alvaroRGO/mesa-dados`.
   4. **Permissions** → **Repository permissions** → **Contents**: **Read and write** (Metadata fica Read-only sozinho).
   5. **Generate token** → tocar no ícone de copiar. O token aparece uma vez só; se perder, gere outro. Não mande o token por e-mail nem por chat.
2. **Ditado sem rede**: baixar o pacote de português do Brasil do teclado.
   Gboard: Configurações do Gboard → **Digitação por voz** → **Reconhecimento off-line** → **Português (Brasil)** → baixar.
   Teclado Samsung: Configurações do teclado → **Entrada de voz** → idiomas off-line → **Português (Brasil)** → baixar.
3. **Voz em inglês para «Ler»**: Configurações do Android → **Gerenciamento geral** → **Conversão de texto em voz** → engrenagem do mecanismo → **Instalar dados de voz** → **English (United States)** → baixar.
4. **Instalar o app**: Chrome → abrir `https://alvarorgo.github.io/mesa-casca/` → menu **⋮** → **Instalar app** (em algumas versões: **Adicionar à tela inicial** → **Instalar**) → confirmar. Fechar o Chrome e abrir **Mesa** pelo ícone.
5. **Carregar a tese**: na tela «Carregar tese», tocar no campo do token → colar → **Carregar tese**. Esperar «Tese carregada» (baixa cerca de 5 MB). Na primeira sincronização a Mesa vai para a página em que a leitura parou no artifact.
   Sem token: tocar **Escolher arquivos…** e selecionar `tese.pdf` e `trechos.json` (por exemplo, do OneDrive); dá para escolher um de cada vez.
6. **Conferir**: **⚙ Configuração** → «Dados deste aparelho» deve dizer «Armazenamento persistente: sim». Se disser «não», siga assim mesmo: abrir sempre pelo ícone ajuda o Android a manter os dados.
7. **Teste de 30 minutos em modo avião**: ligar o modo avião → tirar a Mesa dos apps recentes → abrir pelo ícone → navegar, grifar com a S Pen (e apagar um grifo com o botão da caneta), comentar ditando pelo teclado, registrar uma **Dúvida**, **Marcar revisada**, **Ler**. Fechar e reabrir ainda em modo avião: tudo continua lá, e a barra mostra «N por enviar · sem rede».
8. **Voltar a rede**: desligar o modo avião → abrir a Mesa → em alguns segundos a barra mostra «sincronizado às HH:MM». No GitHub, `alvaroRGO/mesa-dados` → **Commits** mostra «mesa: N itens, …».

Regra de parada: se o app não instalar ou não abrir em modo avião em 30 minutos, parar e seguir com Samsung Notes e a Mesa online. Nada se perde.

### Por sessão

1. Abrir **Mesa** pelo ícone, com ou sem rede. Ela abre na última página lida.
2. Com rede, a Mesa sincroniza sozinha ao abrir, ao voltar para ela e a cada 5 minutos. O número em **Sincronizar** é o que ainda falta subir.

### Por item

1. **Grifar**: **S Pen** ligado → arrastar a caneta sobre as linhas; um toque curto num parágrafo grifa o bloco inteiro; o botão lateral da caneta sobre um grifo o apaga. Com o dedo, use **Grifar**.
2. **Comentar**: tocar no trecho (na página ou na lista) → **Comentar** → tocar na caixa → microfone do teclado → ditar → corrigir → escolher o **Tipo** (Correção, Dúvida, Observação) → **Salvar**.
3. **Dúvida para o META**: **Dúvida** no trecho → ditar → **Salvar dúvida**. A resposta aparece embaixo da dúvida depois de uma sincronização.
4. **Página**: **Comentar a página** para figura, tabela ou diagramação; ao terminar a página, **Marcar revisada** ou **✓ e próxima**.
5. **Ouvir**: **Ler** no trecho, ou **Ler em voz** junto com **Trecho a trecho**.
6. **Traduzir**: o ícone pequeno «A 文» no fim da linha de botões do trecho (ou ao lado do trecho, no compositor) → na folha do Android, escolher **Tradutor** (Google) ou o tradutor da Samsung. Sem rede, funciona se o inglês e o português estiverem baixados no app do tradutor; sem rede e sem essa folha, a Mesa avisa para selecionar o texto e usar **Traduzir** do Android. No computador, abre o Google Tradutor numa aba nova.

### Ao terminar

1. Com rede: tocar **Sincronizar** e esperar «sincronizado às HH:MM». Se esquecer, sobe sozinho da próxima vez que a Mesa abrir com rede.
2. Sem rede: nada a fazer; a fila fica no tablet.
3. Sem token ou com o token vencido: **⚙ Configuração** → **Exportar estado.json** → compartilhar com o OneDrive. O META lê o arquivo. Para voltar a sincronizar, gere um token novo (passo 1 de «Uma vez»), cole em **⚙ Configuração** → **Salvar**.

Nunca toque em **Apagar dados locais** com itens por enviar sem antes exportar o `estado.json`: são dois toques de confirmação justamente por isso.

## O que funciona sem rede

Tudo, menos: sincronizar (a fila espera a rede), o botão **Ditar** do navegador (fica oculto sem rede; o microfone do teclado assume) e a primeira carga da tese ou de uma tiragem nova. O **Traduzir** sem rede depende do pacote de idiomas baixado no app do tradutor. Perguntar à Claude saiu do app: a **Dúvida** é respondida pelo META em `dados/respostas.json` e aparece na sincronização seguinte.

## Técnica

- `index.html`: a Mesa v2.1 com o objeto `store` sobre IndexedDB (banco `mesa`: `comentarios`, `grifos`, `revisadas`, `meta`, `assets`). Mesmos formatos de documento da v2.1, mais `atualizado_em` e `sync` ∈ {`pendente`, `enviado`, `tombstone`}. Remover grava um tombstone.
- `sync.js`: fusão por id (última escrita vence por `atualizado_em`; tombstones apagam) e um commit por sincronização em `dados/estado.json` pela API de conteúdo do GitHub; em seguida aplica `dados/respostas.json`. 409 relê e tenta de novo uma vez; erros de rede e 401 mantêm a fila. O token fica só no IndexedDB do aparelho e só vai no cabeçalho `Authorization`.
- `sw.js`: rede primeiro para o `index.html` (cópia guardada se a rede falhar ou passar de 4 s), cache primeiro para scripts e ícones; nunca intercepta outra origem (`api.github.com`, Google Fonts).
- Ícone **Traduzir** (`index.html`, bloco «traduzir»): texto do trecho (equação, tabela e figura: rótulo e legenda), até 4 500 caracteres; com toque ou Android e `navigator.share`, abre a folha de compartilhamento; senão, ou se a folha falhar ou for cancelada, abre `translate.google.com` numa aba nova (se o toque já expirou, um aviso com link pede um toque novo). Nenhuma chave de API, nenhum serviço novo.
- Recortes (`index.html`, bloco «recortes»): equação, tabela e figura saem de uma segunda renderização da página em alta resolução (3 px por ponto do PDF, mais em telas com densidade acima de 2, até 4 096 px de largura), feita uma vez por página, fora da tela, depois que a página visível termina de desenhar, e liberada ao mudar de página; até ela ficar pronta, o recorte usa provisoriamente o canvas visível. No cartão, o recorte aparece no tamanho de leitura (1,5 px CSS por ponto), com pelo menos 2 px do recorte por px CSS: mais estreito que o cartão, fica à esquerda; mais largo, reduz até caber. O canvas de cada recorte é reaproveitado enquanto a página não muda. Uma «equação» com menos de 16 caracteres só de dígitos, pontuação, parênteses e espaços (um ano, «(3.1)») é falso positivo do extrator e aparece como texto, com **Ler** e **Traduzir**.
- Leiaute: a página não rola. A barra do topo fica fixa; o quadro do PDF (`#canvaswrap`) e a lista de trechos (`#listwrap`, com o cabeçalho «Página N» e a ajuda) rolam cada um no seu quadro (`overflow-y: auto`, `overscroll-behavior: contain`), então rolar a lista não mexe no PDF e vice-versa. Largo (≥ 901 px): lado a lado, e a divisória muda a largura. Empilhado (≤ 900 px): o PDF fica em cima com a altura da divisória (`--pdfh`) e a lista embaixo com o resto. O compositor e a barra «Trecho a trecho» reservam o espaço deles embaixo (`--barpad`, `--listpad`), para o último trecho continuar alcançável. Tocar num trecho da lista centra o realce no PDF sem mexer na lista; tocar num trecho do PDF, ou avançar trecho a trecho, centra o trecho no quadro da lista; mudar de página leva os dois quadros ao topo.
- Ao publicar uma versão nova de `sync.js`, subir o `?v=` no `index.html` e no `sw.js` junto com `VERSAO`.

### Testes

```
node tests/verificar.mjs          # node --check, fusão, sync, ícone Traduzir e recortes (Node, sem rede), ausência de conteúdo
node tests/e2e_edge.mjs --base https://alvarorgo.github.io/mesa-casca/ --pdf <tese.pdf> --trechos <trechos.json> --manifest <manifest.json> --out <pasta> [--pag-equacoes N --pag-tabela N --pag-numero N]
```

O teste de ponta a ponta usa o Edge ou o Chrome sem interface: instala o service worker, carrega a tese por arquivo, reabre sem rede, grifa, comenta, marca revisada, exporta e recarrega; confere o ícone **Traduzir** em cada trecho e no compositor, com e sem folha de compartilhamento, com e sem rede (`translate.google.com` fica desviado durante o teste, então nenhum texto sai do PC); os recortes da página de equações e da tabela larga, em 1280 px e 740 px com densidade 1 e em 1280 px com densidade 2 (vindos da renderização em alta, com pelo menos 2 px por px CSS, sem passar do cartão, sem esticar, à esquerda quando mais estreitos), a «equação» só de dígitos mostrada como texto e a liberação da cópia em alta; e, em 1280 px e 740 px, a rolagem independente da lista e do PDF (roda do mouse e dedo), o trecho centrado ao tocar na lista, no PDF ou em «trecho ▶», a volta ao topo ao mudar de página, o último trecho alcançável com o compositor aberto e com a barra «Trecho a trecho», e a divisória. Os arquivos da tese entram por argumento e nunca ficam neste repositório.

Os ícones saem de `tools/gerar_icones.py` (Pillow).
