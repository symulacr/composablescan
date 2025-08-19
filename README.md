# ComposableScan
Espresso Network explorer for live stats and search.

## What it does
- Live network stats: transactions, payload size, success rate, block height
- Search blocks, transactions, namespaces
- WebSocket updates; responsive UI (TypeScript/Next.js/Tailwind)
## Quick start
Node.js 18+ and npm.
1. Clone and install
   ```bash
   git clone https://github.com/symulacr/composable.git
   cd composable
   npm install
   ```
2. Set environment
   ```bash
   cp env.example .env.local
   ```
3. Run
   ```bash
   npm run dev
   ```
4. Go to `http://localhost:3000`

## Configuration
Edit `.env.local`. See `env.example` for variables and defaults.

## Search input examples
- Block height: `4603571`
- Block hash: `BLOCK~<hash>`
- Transaction hash: `TX~<hash>` or raw hash
- Large namespace ID: long number

## Deploy
Build and run:
```bash
npm run build
npm start
```
On your host, set the same `NEXT_PUBLIC_*` variables.

 

## Links
- [LICENSE](./LICENSE)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- Issues: [GitHub Issues](https://github.com/symulacr/composable/issues)
- Espresso docs: [Engineering wiki](http://eng-wiki.espressosys.com/main.html)
