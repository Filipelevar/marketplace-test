# Kurio — Marketplace de NFTs

Marketplace de NFTs com catálogo filtrável, detalhe com edições, carrinho, favoritos, conta do colecionador e checkout com carteira, construído sobre uma API REST e um servidor Socket.IO simulados com MSW.

- **Demonstração:** https://marketplace-test-ebon.vercel.app
- **Arquitetura e decisões:** [ARCHITECTURE.md](ARCHITECTURE.md)

## Stack

React 19 · TypeScript 6 · Vite 8 · TanStack Router · TanStack Query · Axios · Socket.IO · Tailwind CSS 4 · shadcn/ui · Zod · React Hook Form · MSW · Playwright · Lighthouse · Vercel

## Requisitos

- Node.js 24
- Yarn 4 (já versionado em `.yarn/releases`; basta ter o Corepack habilitado ou chamar `node .yarn/releases/yarn-4.18.0.cjs`)
- Docker, apenas para a regressão visual

## Como rodar

```bash
yarn install
yarn dev
```

O app abre em http://localhost:5173. Não há backend para subir: a API e o socket rodam no Service Worker do MSW, dentro do próprio navegador.

Para rodar o build de produção localmente:

```bash
yarn build
yarn preview
```

## Variáveis de ambiente

Definidas em `.env` (sem segredos, por isso versionado):

| Variável | Valor padrão | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base da API REST usada pelo Axios. |
| `VITE_SOCKET_URL` | `wss://realtime.greenmint.mock` | Endereço do Socket.IO. O MSW intercepta esse endereço; não há servidor real. |
| `VITE_ENABLE_MOCKS` | `true` | Liga o MSW. Com `false`, o app espera uma API real em `VITE_API_URL`. |

## Credenciais de teste

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana | `ana@kurio.dev` | `Kurio@2026` |
| Bruno | `bruno@kurio.dev` | `Kurio@2026` |

Também é possível criar uma conta nova em `/cadastro`. Cupons válidos: `KURIO10` e `LANCAMENTO`. `GENESIS2025` está expirado de propósito.

## Cenários de simulação

Acrescente `?cenario=<nome>` a qualquer URL para trocar o comportamento da API. A escolha fica salva no navegador e reinicia o banco simulado.

| Cenário | Comportamento |
| --- | --- |
| `padrao` | Dados completos e latência realista. |
| `vazio` | Catálogo sem NFTs. |
| `lento` | Todas as respostas levam de 2 a 4 segundos. |
| `fora-de-ordem` | Requisições seguintes respondem antes das anteriores. |
| `instavel` | Uma em cada três requisições falha com 503. |
| `offline` | Todas as requisições falham por falta de conexão. |
| `erro-servidor` | Todas as requisições respondem 500. |
| `pagamento-recusado` | Pedidos são recusados pela carteira. |
| `timeout-pedido` | A primeira resposta de cada pedido se perde depois da criação. |

`?latencia=off` desliga a latência artificial. Exemplo: `http://localhost:5173/?cenario=lento`.

Para voltar ao estado inicial, use `?cenario=padrao` ou limpe o `localStorage` do site.

## Comandos

| Comando | O que faz |
| --- | --- |
| `yarn dev` | Servidor de desenvolvimento. |
| `yarn build` | Typecheck e build de produção. |
| `yarn preview` | Serve o build de produção. |
| `yarn typecheck` | Verificação de tipos. |
| `yarn lint` | ESLint. |
| `yarn test:e2e` | Testes E2E em desktop e mobile contra o build de produção. |
| `yarn test:e2e:report` | Abre o relatório HTML do último teste. |
| `yarn test:visual` | Regressão visual dentro do Docker. |
| `yarn test:visual:update` | Regera as baselines visuais dentro do Docker. |
| `yarn lighthouse` | Lighthouse em início e detalhe, mobile e desktop, 3 execuções cada. |

Na primeira vez, instale o navegador do Playwright:

```bash
yarn playwright install chromium
```

## Testes

### E2E

```bash
yarn test:e2e
```

São 90 testes (45 cenários × desktop e Pixel 7). O Playwright faz o build e sobe o `vite preview` sozinho. Para rodar contra outra URL, por exemplo a produção:

```powershell
$env:PW_BASE_URL="https://marketplace-test-ebon.vercel.app"; yarn test:e2e
```

Contra uma URL remota, a suíte usa 2 workers, 1 retry e timeouts maiores, porque a latência é de rede real: logo após um deploy, a CDN pode demorar vários segundos para servir arquivos ainda fora do cache. Localmente continuam 4 workers, sem retry.

### Regressão visual

```bash
yarn test:visual
```

Compara início, detalhe, carrinho e pagamento em desktop (1440 × 900) e mobile (Pixel 7) com as baselines em `tests/visual/__screenshots__`. O teste roda dentro da imagem oficial `mcr.microsoft.com/playwright:v1.64.0-noble`, porque fontes e renderização mudam entre sistemas operacionais; gerar e comparar sempre no mesmo Linux mantém o resultado estável. As dependências Linux ficam num volume Docker separado e não interferem no `node_modules` local.

Depois de uma mudança visual intencional:

```bash
yarn test:visual:update
```

### Lighthouse

```bash
yarn lighthouse
```

Faz o build, sobe o preview na porta 4174 e audita `/` e `/nfts/emerald-ape-042` nos perfis mobile e desktop, 3 vezes cada, sempre com um Chrome novo. O resumo com a mediana de LCP, CLS e TBT fica em [`reports/lighthouse/summary.md`](reports/lighthouse/summary.md), junto com os relatórios HTML e JSON da execução mediana de cada combinação. As execuções individuais ficam em `reports/lighthouse/runs/` (fora do Git). A configuração está em [`lighthouse.config.mjs`](lighthouse.config.mjs). O comando termina com erro quando alguma mediana passa do orçamento, para servir de verificação.

Resultado atual (mediana):

| Página | Perfil | Performance | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- |
| Início | mobile | 70 | 5,1 s | 0,026 | 179 ms |
| Início | desktop | 97 | 1,1 s | 0,005 | 5 ms |
| Detalhe | mobile | 68 | 5,1 s | 0 | 220 ms |
| Detalhe | desktop | 97 | 1,1 s | 0 | 0 ms |

Acessibilidade, boas práticas e SEO ficam em 100 nas quatro combinações. O LCP mobile acima de 2,5 s vem principalmente da inicialização do MSW no caminho crítico, que só existe na demonstração; a análise completa está em [ARCHITECTURE.md](ARCHITECTURE.md#performance).

## Como reproduzir falhas

Os cenários acima cobrem a maior parte dos casos. Para situações pontuais, o servidor simulado expõe endpoints de controle, que também são usados pelos testes. Eles podem ser chamados pelo console do navegador com o app aberto:

```js
await fetch('/api/__dev/fail-next', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'POST', path: '/api/cart/items', status: 503 }) })
```

| Endpoint | Efeito |
| --- | --- |
| `POST /api/__dev/reset` | Reinicia o banco com `{ scenario, latency }`. |
| `POST /api/__dev/fail-next` | Faz a próxima requisição que casar com `method` e `path` falhar (`status` numérico ou `"network"`, `delayMs`, `code`, `message`). |
| `POST /api/__dev/session/expire` | Expira todas as sessões; a próxima chamada autenticada leva ao login com aviso. |
| `PATCH /api/__dev/nfts/:id` | Altera `priceEth` ou `editionAvailability` e emite `nft.updated` pelo socket. |
| `POST /api/__dev/orders/next-outcome` | Define se o próximo pedido será confirmado ou recusado. |
| `POST /api/__dev/orders/drop-next-response` | Cria o próximo pedido mas perde a resposta, para testar a idempotência. |
| `POST /api/__dev/socket/emit` | Emite um evento arbitrário pelo socket. |
| `POST /api/__dev/socket/drop` | Derruba as conexões do socket para testar a reconexão e a reconciliação. |

Exemplos de roteiro manual:

- **Preço mudou durante o checkout:** abra o diálogo de revisão do pedido e, no console, chame `PATCH /api/__dev/nfts/<id>` com um novo `priceEth`. A confirmação é bloqueada até a cotação ser atualizada.
- **Sessão expirada:** chame `POST /api/__dev/session/expire` e clique em qualquer ação autenticada.
- **Pedido sem resposta:** use `?cenario=timeout-pedido` e confirme uma compra. O cliente reenvia com a mesma `Idempotency-Key` e chega ao mesmo pedido.

## Estrutura

```
src/
├── App.tsx, main.tsx
├── assets/       imagens importadas pelo código
├── components/   componentes compartilhados (+ ui/ do shadcn)
├── enums/        listas de domínio
├── globals/      CSS global e tema
├── hooks/        hooks do TanStack Query e chaves de cache
├── mocks/        MSW: handlers, banco, fixtures, socket
├── pages/        telas e suas seções
├── routes/       rotas do TanStack Router (só configuração)
├── services/     chamadas HTTP, interceptors, socket, router e query client
├── stores/       estado fora do React (sessão, carrinho do visitante, checkout)
├── types/        contratos Zod e tipos
└── utils/        funções puras
tests/
├── e2e/          testes E2E
├── visual/       regressão visual e baselines
└── support/      helpers dos testes
```

Detalhes de cada camada em [ARCHITECTURE.md](ARCHITECTURE.md).

## Deploy

O deploy é feito na Vercel a partir da branch `main`. O `vercel.json` chama o Yarn versionado diretamente pelo Node (`node .yarn/releases/yarn-4.18.0.cjs`), reescreve todas as rotas para `index.html` (SPA) e serve o `mockServiceWorker.js` sem cache, para que uma nova versão dos mocks seja aplicada assim que publicada.
