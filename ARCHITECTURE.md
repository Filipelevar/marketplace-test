# Arquitetura

Este documento explica como o Kurio está organizado e por que cada decisão foi tomada. O foco está nas partes em que um marketplace costuma errar: sessão, isolamento de dados entre usuários, carrinho, cache, idempotência do pedido e eventos em tempo real.

## Visão geral

```
Navegador
├── React 19 + TanStack Router (rotas por arquivo, busca validada com Zod)
├── TanStack Query (cache por usuário, cancelamento, retry seletivo)
├── Axios (instância única com interceptors de sessão e carrinho)
├── socket.io-client (eventos nft.updated e order.updated)
└── MSW (Service Worker)
    ├── handlers REST em /api/*
    ├── servidor Socket.IO simulado (@mswjs/socket.io-binding)
    └── banco simulado persistido em localStorage
```

Não existe backend real. Todo o “servidor” roda no Service Worker do MSW e se comporta como uma API de verdade: valida entrada, responde com códigos HTTP corretos, aplica regras de negócio e emite eventos pelo socket. A interface nunca simula resultado sozinha: toda mudança de estado vem de uma resposta REST ou de um evento Socket.IO.

## Estrutura de pastas

A organização é em camadas por tipo técnico:

| Pasta | Responsabilidade |
| --- | --- |
| `src/pages/<domínio>/<página>/index.tsx` | Telas. Seções da tela ficam em subpastas (`pages/home/catalog/filters`). |
| `src/components/<nome>/index.tsx` | Componentes reutilizados entre telas (`navbar`, `nft-card`, `pagination`, `inputs/form-field`). `components/ui` é o shadcn/ui. |
| `src/routes/` | Rotas do TanStack Router. Contêm só configuração: `validateSearch`, `loader`, `beforeLoad` (guard) e `head`. O componente vem de `pages/` e lê parâmetros com `getRouteApi`. |
| `src/services/<domínio>/XxxServices.ts` | Funções puras que chamam a API com Axios e devolvem `data`. Não conhecem cache nem React. |
| `src/services/interceptors`, `src/services/socket` | Interceptors HTTP, eventos de sessão, criação do socket e barramento de avisos em tempo real. |
| `src/hooks/` | Hooks do TanStack Query (`useNfts`, `useCart`, `useCheckout`…) e `queryKeys.ts` com todas as chaves de cache. |
| `src/types/<domínio>/XxxTypes.ts` | Contratos da API: schemas Zod e tipos derivados deles. São usados pelo app **e** pelo MSW, então cliente e servidor simulado nunca divergem. |
| `src/enums/` | Listas de domínio (`COLLECTIONS`, `NETWORKS`, `CATALOG_SORTS`, `WALLET_PROVIDERS`, `REALTIME_EVENTS`). Usam `as const` porque o `erasableSyntaxOnly` do TypeScript não permite `enum`. |
| `src/stores/` | Estado fora do React lido com `useSyncExternalStore`: sessão, carrinho do visitante, tentativa de checkout, status do socket. |
| `src/utils/XxxUtils.ts` | Funções puras: ETH em `BigInt`, formatação, erros da API, edições, avatar, sincronização do cache com eventos. |
| `src/mocks/` | MSW: handlers, banco simulado, fixtures, cenários e servidor Socket.IO. |

A separação entre `services` e `hooks` é intencional: o service só sabe fazer a requisição HTTP, e o hook decide cache, atualização otimista, invalidação e retry. Dá para trocar o Axios sem mexer no cache, e vice-versa.

## Contratos

Os contratos ficam em `src/types` como schemas Zod. Eles são a fonte única de verdade:

- o MSW valida o corpo das requisições com os mesmos schemas e responde `422 VALIDATION_ERROR` com `fieldErrors`;
- os formulários usam os mesmos schemas via `zodResolver`, então a mensagem de erro do cliente e do servidor é a mesma;
- os parâmetros de busca da URL (`/?collections=arte-3d,jogos&sort=preco-asc&page=2`) são validados com `catalogSearchSchema` e `nftDetailSearchSchema`. Valores inválidos são descartados, nunca quebram a página;
- eventos do socket são validados com `nftUpdatedEventSchema` e `orderUpdatedEventSchema` antes de tocar no cache.

Erros seguem um formato único (`ApiErrorBody`): `code`, `message`, `fieldErrors?` e `quote?`. Os códigos incluem `VALIDATION_ERROR`, `UNAUTHORIZED`, `SESSION_EXPIRED`, `NOT_FOUND`, `CONFLICT`, `QUOTE_CHANGED`, `IDEMPOTENCY_CONFLICT`, `WALLET_DISCONNECTED`, `WALLET_REJECTED` e `CART_EMPTY`.

Valores em ETH trafegam como string decimal e todo cálculo é feito em wei com `BigInt` (`utils/EthUtils.ts`). Nunca há soma de `number` com casas decimais.

## Sessão

- Login e cadastro em `/api/auth/*`. Senhas são guardadas no banco simulado como hash PBKDF2-SHA256 (100 mil iterações, salt por usuário) via WebCrypto.
- O servidor devolve um token Bearer com validade de 30 minutos. O cliente guarda `{ token, expiresAt }` em `localStorage` (`kurio:session`) e expõe via `useSyncExternalStore`, então todas as abas e componentes reagem à mesma fonte.
- O interceptor do Axios injeta `Authorization`. Se uma requisição autenticada voltar `401 UNAUTHORIZED` ou `SESSION_EXPIRED`, ele emite um evento de sessão expirada. O `SessionWatcher` limpa os dados privados e redireciona para `/entrar?redirect=<rota atual>&motivo=expirada`. Depois do login o usuário volta exatamente para onde estava.
- O redirect é sanitizado (`safeRedirect`): só aceita caminhos internos, nunca URLs absolutas.
- Rotas privadas ficam sob o layout `_autenticado`, cujo `beforeLoad` exige sessão.

### Isolamento entre usuários

Nenhum dado de um usuário pode aparecer para outro, nem por um instante:

- Todas as chaves de cache privadas incluem o id do usuário (`['cart', userId]`, `['favorites', userId]`, `['orders', userId, orderId]`).
- Em login, logout e expiração, `clearPrivateData` cancela e remove do cache todas as raízes privadas (`session`, `favorites`, `cart`, `orders`, `wallets`, `profile`). O estado de checkout em `sessionStorage` também é apagado.
- O servidor simulado identifica o dono de cada recurso pelo token e responde `404` para pedidos de outro usuário.
- O socket é recriado quando o token muda, e o servidor só entrega `order.updated` ao dono do pedido.

## Carrinho

- O carrinho vive no servidor simulado. O visitante recebe um id (`X-Cart-Id`, guardado em `kurio:guest-cart-id`); o usuário logado é identificado pelo token.
- No login, o carrinho do visitante é mesclado ao do usuário (`POST /api/cart/merge`) respeitando o limite de 10 unidades por item e a disponibilidade de cada edição.
- Cada mutation devolve o carrinho inteiro, que substitui o cache. Em erro, o cache é invalidado para voltar ao estado do servidor.
- Os preços do carrinho são sempre os do servidor. Se o preço ou a disponibilidade mudar (por evento ou na próxima leitura), o carrinho mostra um aviso com o valor anterior e o novo.
- Cupons (`KURIO10`, `LANCAMENTO`; `GENESIS2025` está expirado) e a taxa de rede de 0.016 ETH são calculados no servidor.

## Cache

- `staleTime` padrão de 30 s, sem refetch ao focar a janela.
- Queries não repetem erros 4xx; repetem até 2 vezes erros de rede e 5xx. Mutations não repetem, com uma exceção: a criação do pedido, que é idempotente (ver abaixo).
- O catálogo usa `keepPreviousData`: mudar filtro, ordenação ou página mantém a lista anterior visível enquanto a nova carrega. A chave inclui todos os parâmetros, e o `signal` do Axios cancela a requisição anterior. No cenário `fora-de-ordem` (respostas chegam invertidas) a tela nunca mostra uma resposta antiga.
- Favoritos usam atualização otimista com rollback e aviso em caso de falha.
- Os loaders das rotas fazem `prefetchQuery`; o detalhe do NFT e os relacionados começam a carregar no hover do link (`defaultPreload: 'intent'`).

## Checkout e idempotência

O fluxo de compra foi desenhado para nunca confirmar nada sem a resposta do servidor e nunca criar pedidos duplicados:

1. **Cotação.** Ao confirmar, o cliente pede `POST /api/checkout/quote`. O servidor congela itens, preços, cupom e taxa por 5 minutos e devolve um `quoteId`.
2. **Revisão.** O usuário vê a cotação num diálogo. Se um `nft.updated` afetar um item da cotação, o botão de confirmar é bloqueado até a cotação ser atualizada.
3. **Pedido.** `POST /api/orders` com `quoteId`, conexão da carteira e o header `Idempotency-Key`. O servidor revalida a cotação contra o estado atual: se algo mudou, responde `409 QUOTE_CHANGED` com a nova cotação, e o diálogo mostra o antes e o depois.
4. **Idempotência.** A tentativa (`quoteId`, chave, status) fica em `sessionStorage` (`kurio:checkout-attempt`) antes do envio. Repetir a requisição com a mesma chave devolve o mesmo pedido. A mesma chave com conteúdo diferente devolve `409 IDEMPOTENCY_CONFLICT`. Cliques repetidos, retry automático em erro de rede e refresh no meio do envio caem todos no mesmo pedido.
5. **Resultado.** O pedido nasce `pending`. A confirmação ou recusa chega por `order.updated` no socket. Enquanto o socket está desconectado, a página do pedido faz polling REST como fallback. Ao confirmar, só as quantidades compradas saem do carrinho e o estoque dos NFTs é invalidado.

A carteira é conectada explicitamente (`POST /api/wallets/:id/connect`) e a conexão pode ser recusada pelo provedor (`WALLET_REJECTED`) ou cair antes do pedido (`WALLET_DISCONNECTED`). O explorador de blocos exibido no pedido confirmado é simulado.

## Eventos em tempo real

O cliente usa `socket.io-client` apontando para `VITE_SOCKET_URL`. Em desenvolvimento e na demonstração, o `@mswjs/socket.io-binding` intercepta essa conexão dentro do Service Worker, então o protocolo é Socket.IO de verdade (handshake, heartbeat, namespaces), apenas sem rede.

Formato dos eventos:

```json
{
  "id": "nft:emerald-ape-042:v3",
  "type": "nft.updated",
  "resource": { "type": "nft", "id": "emerald-ape-042" },
  "version": 3,
  "occurredAt": "2026-10-14T12:00:00.000Z",
  "data": { "priceEth": "2.6", "available": 12, "editions": [{ "id": "...", "available": 4 }] }
}
```

- **Versão por recurso.** Cada NFT e cada pedido tem um `version` incremental no servidor. O `EventGate` descarta eventos repetidos (mesmo `id`) e eventos com versão menor ou igual à última aplicada. O patch no cache também compara com a versão já presente, então uma resposta REST mais nova nunca é sobrescrita por um evento antigo.
- **Aplicação no cache.** `nft.updated` atualiza catálogo, destaques, detalhe, relacionados e favoritos sem refetch. Se o NFT estiver no carrinho, o carrinho é revalidado e um aviso de preço aparece.
- **Reconciliação.** A cada conexão (inclusive a primeira e cada reconexão), o cliente invalida as queries ativas de NFTs, carrinho, pedidos e favoritos. Isso cobre eventos perdidos enquanto o socket estava fora.
- **Autenticação.** O token vai no `auth` do handshake. O socket é recriado quando o usuário muda.
- **Fallback.** Sem socket, o pedido pendente é acompanhado por polling REST a cada 1,5 s. O servidor sempre valida preço e estoque na criação do pedido, então um evento perdido nunca leva a uma compra com preço errado: ele vira `409 QUOTE_CHANGED`.

## Simulação (MSW)

- O banco simulado fica em `localStorage` (`kurio:mock-db`) com `SCHEMA_VERSION`. Mudanças de fixture invalidam o banco salvo automaticamente.
- Cenários (`?cenario=`): `padrao`, `vazio`, `lento`, `fora-de-ordem`, `instavel`, `offline`, `erro-servidor`, `pagamento-recusado`, `timeout-pedido`. `?latencia=off` desliga a latência artificial. A latência usa um gerador pseudoaleatório com semente fixa, então é reproduzível.
- Endpoints de controle em `/api/__dev/*` são usados pelos testes E2E para provocar situações difíceis de reproduzir manualmente: falhar a próxima requisição, expirar sessões, alterar preço e estoque de um NFT, definir o resultado do próximo pedido, perder a resposta de um pedido, emitir um evento ou derrubar o socket.
- Qualquer rota `/api/*` não mapeada responde `404` em JSON, para que o fallback de SPA da Vercel nunca devolva HTML a uma chamada de API.

## Testes

- **E2E (Playwright):** 90 testes em desktop e mobile (Pixel 7), contra o build de produção (`vite preview`). Cobrem catálogo, filtros na URL, detalhe, carrinho, favoritos, sessão, isolamento entre usuários, checkout, idempotência, eventos em tempo real e responsividade.
- **Regressão visual:** início, detalhe, carrinho e pagamento em desktop (1440 × 900) e mobile (Pixel 7). Cada página gera duas imagens: a viewport, como o usuário vê (com barras fixas no lugar), e a página inteira com elementos `fixed` ocultos, porque na captura de página inteira eles ficariam estampados no meio do conteúdo. As baselines são geradas na imagem Docker oficial do Playwright (`mcr.microsoft.com/playwright:v1.64.0-noble`), para não dependerem das fontes e do renderizador do sistema operacional de quem roda. Locale, fuso, latência da simulação e animações são fixados; o teste espera fontes, imagens e a conexão do socket antes de capturar.
- **Lighthouse:** início e detalhe, mobile e desktop, 3 execuções cada, com mediana de LCP, CLS e TBT. A configuração está em `lighthouse.config.mjs` e os relatórios em `reports/lighthouse/`.

## Performance

Mediana de 3 execuções (`yarn lighthouse`, build de produção, Chrome novo a cada execução):

| Página | Perfil | Performance | LCP | CLS | TBT | Acessibilidade | Boas práticas | SEO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início | mobile | 70 | 5,1 s | 0,026 | 179 ms | 100 | 100 | 100 |
| Início | desktop | 97 | 1,1 s | 0,005 | 5 ms | 100 | 100 | 100 |
| Detalhe | mobile | 68 | 5,1 s | 0 | 220 ms | 100 | 100 | 100 |
| Detalhe | desktop | 97 | 1,1 s | 0 | 0 ms | 100 | 100 | 100 |

O orçamento definido é LCP ≤ 2,5 s, CLS ≤ 0,1 e TBT ≤ 200 ms. Desktop cumpre em todas as páginas. Mobile fica acima no LCP, e o TBT do detalhe fica 20 ms acima.

**Por que o LCP mobile fica em ~5 s.** O Lighthouse mobile simula 4G lento (150 ms de RTT, ~1,5 Mbps, 562 ms de latência por requisição) e CPU 4× mais lenta. Nessas condições, o que pesa é a cadeia que precisa terminar antes do primeiro render: HTML → bundle principal → chunk do MSW (174 KB gzip, ~770 ms de execução com a CPU simulada) → registro do Service Worker → dados → imagem. O chunk do MSW é infraestrutura da demonstração: ele faz o papel do backend e não existe num deploy com API real. Sem throttling, o LCP observado nas mesmas execuções fica entre 0,84 s e 1,13 s nos quatro relatórios.

**O que foi corrigido a partir das medições:**

- *CLS de 0,229 no detalhe (desktop).* A fonte Roboto Mono era descoberta tarde (HTML → CSS → fonte) e, ao chegar, mudava a altura do texto e empurrava o rodapé. Agora a fonte tem `preload` no `index.html` e o primeiro render espera por ela (limite de 1,5 s, em paralelo com a inicialização do MSW, então não atrasa nada). O skeleton do detalhe passou a ocupar ao menos a altura da tela, para o rodapé não aparecer durante o carregamento. CLS foi a 0 e a nota de 81 para 97.
- *Cadeia de carregamento.* O `App` é importado estaticamente, então seus chunks entram no `modulepreload` do HTML em vez de serem descobertos depois.
- *Acessibilidade.* Edições esgotadas usavam `opacity-60`, que deixava o texto abaixo de 4,5:1. Foi trocado por um token de cor próprio (`--disabled-foreground`, 4,96:1).
- *SEO.* `robots.txt` não existia e o fallback de SPA devolvia HTML; agora há um arquivo real.

**Alternativa medida e descartada.** Desligar a divisão de código por rota (`autoCodeSplitting`) reduz uma etapa da cadeia e leva o LCP mobile a ~4,4 s, mas junta checkout, conta e o resto num único bundle de 239 KB gzip carregado já na Home, e o TBT sobe para ~250 ms. A divisão por rota foi mantida.

## Desvios em relação ao Figma

| Desvio | Motivo |
| --- | --- |
| Login e cadastro são páginas com fundo, não um modal sobre a Home. | Rota própria permite deep link, redirect após expiração de sessão e botão voltar previsível. O visual do modal foi mantido no desktop. |
| Lixeira do carrinho reposicionada no mobile. | Mantém a linha do item legível na largura de 390 px sem sobrepor preço e quantidade. |
| Ícones das redes sociais no footer no lugar das letras. | Reconhecimento imediato e nome acessível em cada link. |
| Sufixo `.eth` fixo no campo ENS. | O usuário digita só o nome; o formato fica explícito. |
| Botões de salvar separados para perfil e senha. | Alterar senha exige a senha atual e tem validações próprias; envios separados deixam claro qual operação falhou. |
| Campos de carteira simplificados (apelido, endereço, rede, provedor). | São os dados que o checkout realmente usa. |
| Escala tipográfica consolidada. | Tamanhos de fonte próximos do arquivo foram agrupados em poucos tokens do tema. |
| Explorador de blocos simulado. | Não há blockchain real; o botão “Ver no explorador” abre um diálogo com hash, bloco e data do pedido. |
| Reutilização das 4 artes de NFT. | O Figma traz poucas imagens; os 36 NFTs do catálogo variam nome, coleção, rede e preço. |
| Seções sem fluxo no escopo (criadores, blog, suporte etc.) levam a `/em-breve`. | Evita links mortos e deixa claro o que não faz parte da demonstração. |

## Limitações conhecidas

- **Várias abas.** O servidor simulado roda dentro de cada aba e carrega o banco do `localStorage` só ao iniciar. Um evento ou uma escrita feita numa aba não chega à outra até ela ser recarregada, e escritas simultâneas em duas abas seguem a regra “a última gravação vence”. Com um backend real esse limite não existe; a demonstração deve ser usada em uma aba por vez.
- **Handshake antes da autenticação.** O binding do MSW aceita a conexão do Socket.IO antes de o servidor simulado validar o token. Uma conexão sem sessão válida continua recebendo eventos públicos (`nft.updated`), mas nunca eventos privados (`order.updated` só vai para o dono do pedido).
- **Dados locais.** O banco simulado é por navegador. Limpar o `localStorage` ou abrir em janela anônima volta às fixtures.
