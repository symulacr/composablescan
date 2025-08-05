# ComposableScan

ComposableScan tracks Espresso Network mainnet in real-time. Search blocks, transactions, rollups, and namespaces. WebSocket streams provide live block data.

## Features

### Live Block Tracking
- **Stream Live Blocks**: WebSocket connects and displays new blocks
- **Search Quick**: Pattern detection returns results under one second
- **Search All**: One search bar finds blocks, transactions, rollups, and namespaces
- **Get Complete Results**: Search returns results with data previews

### Search Types
- **Find Blocks**: Enter height (`4603571`) or hash (`BLOCK~<hash>`)
- **Find Transactions**: Enter hash (`TX~<hash>`) with prefix detection
- **Find Rollups**: Search names (`MOLTEN`, `RARI`, `LogX`) with metadata
- **Find Namespaces**: Search namespace IDs with rollup data

### Interface
- **Desktop Ready**: Interface fits desktop and tablet screens
- **Smooth Animation**: Framer Motion powers transitions
- **Clear Data Display**: Design highlights blockchain data
- **Fast Loading**: API calls cache data and execute quick

### Developer Features
- **Split Components**: React components separate by function
- **Type Safety**: TypeScript prevents errors across files
- **Easy Deploy**: Config works across networks
- **Test Coverage**: Vitest tests components and functions

## Quick Start

### Requirements
- Node.js 18+ 
- npm or yarn
- Git

### Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/symulacr/composable-scan.git
   cd composable-scan
   ```

2. **Install packages**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` for custom endpoints. Defaults connect to mainnet.

4. **Start server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Go to [http://localhost:3000](http://localhost:3000)

## Config

### Environment Variables

ComposableScan reads config from environment variables. Check `env.example` for options:

```env
# Network Selection
NEXT_PUBLIC_NETWORK=mainnet

# API Endpoints  
NEXT_PUBLIC_MAINNET_API_BASE_URL=https://query.main.net.espresso.network
NEXT_PUBLIC_MAINNET_API_VERSION=v0

# WebSocket Streaming
NEXT_PUBLIC_MAINNET_WS_BASE_URL=wss://query.main.net.espresso.network

# Scan Integration
NEXT_PUBLIC_MAINNET_SCAN_BASE_URL=https://explorer.main.net.espresso.network
```

### Deploy to Production

1. **Build app**
   ```bash
   npm run build
   ```

2. **Start server**
   ```bash
   npm start
   ```

Deploy to Vercel, Netlify, or AWS:
- Set environment variables in platform config
- Configure all `NEXT_PUBLIC_*` variables
- App works with CDN deployment

## Code Structure

### Files
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes for CORS
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── search/           # Search interface
│   │   ├── searchinput.tsx
│   │   ├── searchresults.tsx
│   │   ├── searchdetails.tsx
│   │   └── livestats.tsx
│   ├── scan/            # Data display  
│   └── ui/               # UI components
├── services/             # External services
│   ├── api/              # Espresso Network APIs
│   └── websocket/        # Live streaming
├── hooks/                # React hooks
├── contexts/             # React contexts
├── types/                # TypeScript types
└── lib/                  # Utils and config
```

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict checking
- **Styling**: Tailwind CSS with shadcn/ui
- **Animation**: Framer Motion
- **State**: React hooks with Context API
- **Testing**: Vitest with React Testing Library
- **Build**: Next.js bundling

## Search Patterns

ComposableScan detects search types:

| Input Pattern | Type Found | Example |
|---------------|------------|---------|
| `1-7 digits` | Block height or namespace | `4603571` |
| `8+ digits` | Large namespace ID | `1397311310` |
| `TX~<hash>` | Transaction hash | `TX~abc123...` |
| `BLOCK~<hash>` | Block hash | `BLOCK~def456...` |
| `Base64 (44 chars)` | Transaction hash | `abc123def456...` |
| `Hex (64 chars)` | Block hash | `0x123...` |
| `Text` | Rollup name | `MOLTEN`, `RARI` |

## Development

### Run Tests
```bash
# Run unit tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Check Code
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Build for Production
```bash
# Create production build
npm run build

# Check bundle size
npm run analyze
```

## API Setup

### Espresso Network APIs
- **Query API**: `https://query.main.net.espresso.network/v0/`
- **WebSocket Stream**: `wss://query.main.net.espresso.network/v0/availability/stream/blocks/`
- **Rollup Data**: Web worker parses from official scan

### Performance
- Search waits 300ms to reduce API calls
- Cache stores repeated queries  
- WebSocket reconnects when dropped
- Filter removes large response data

## Customization

### Add New Search Types
1. Extend the `detectSearchType` function in `searchinterface.tsx`
2. Add API integration in `services/api/espressoapi.ts`
3. Create display components in `components/search/searchdetails.tsx`
4. Add TypeScript types in `types/espresso.ts`

### Change Styling
- Modify Tailwind classes in components
- Extend the theme in `tailwind.config.ts`
- Add custom CSS in `app/globals.css`
- Use shadcn/ui component variants

### Add Network Support
To add testnet or other networks:
1. Add network config in `lib/config.ts`
2. Update environment variables in `env.example`
3. Add network selection UI if needed
4. Update API endpoints and WebSocket URLs

## Troubleshooting

### Common Issues

**Search not working**
- Check network connection and API endpoints
- Verify environment variables set correctly
- Check browser console for API errors

**WebSocket connection failed**
- Check WebSocket URL access
- Check firewall settings
- Verify network supports WebSocket connections

**Build errors**
- Clear `.next` directory and `node_modules`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run type-check`

**Performance issues**
- Monitor network requests in browser dev tools  
- Check for API rate limiting
- Verify caching works correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run all tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Acknowledgments

- **Espresso Network**: Provides blockchain infrastructure and APIs
- **Next.js Team**: Creates React framework
- **Tailwind CSS**: Builds utility-first CSS framework
- **shadcn/ui**: Develops component library
- **Framer Motion**: Powers smooth animations and interactions

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/symulacr/composable-scan/issues)
- **Documentation**: [Visit our docs](https://github.com/symulacr/composable-scan/wiki)
- **Espresso Network**: [Official documentation and support](https://docs.espresso.network)

---

Built for the Espresso Network ecosystem. Developers create this for developers.