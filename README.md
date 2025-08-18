# COMPOSABLE SCAN

Real-time Espresso Network explorer with live network statistics and unified search interface.

## Features

### Real-time Network Statistics
- **Live Transactions**: TXs count updates every 5 blocks
- **Payload Data**: Total network data updated every 5 minutes
- **Success Rate**: Network success percentage updated every 5 minutes
- **Live Blocks**: Real-time block streaming via WebSocket

### Search & Discovery
- **Unified Search**: blocks, transactions, rollups, namespaces
- **Fast Pattern Detection**: <1s response time
- **Complete Data Previews**: expandable transaction lists
- **Namespace Filtering**: rollup-specific data

### Search Types
- **Blocks**: height (`4603571`) or hash (`BLOCK~<hash>`)
- **Transactions**: hash (`TX~<hash>`)
- **Rollups**: names (`MOLTEN`, `RARI`, `LogX`)
- **Namespaces**: IDs with rollup data

### Interface
- **Clean Minimal Design**: SVG icons, no emojis
- **Responsive Layout**: desktop and tablet optimized
- **Real-time Updates**: WebSocket streaming
- **Fast API Integration**: optimized endpoints
- **Comment-free Codebase**: clean production code

## Quick Start

### Requirements
- Node.js 18+ 
- npm or yarn
- Git

### Setup

1. **Clone repository**
   ```bash
   git clone git@github.com:symulacr/composable.git
   cd composable
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

### Current Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── api/rollup/        # Unified rollup API endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── search/           # Search interface
│   │   ├── input.tsx     # Search input component
│   │   ├── interface.tsx # Main search interface
│   │   ├── results.tsx   # Search results display
│   │   ├── details.tsx   # Result details modal
│   │   └── stats.tsx     # Live network statistics
│   └── ui/               # Shadcn UI components
├── services/             # External services
│   ├── api/              # Espresso Network APIs
│   │   ├── discovery.ts  # Network statistics APIs
│   │   ├── main.ts       # Core API functions
│   │   └── resolver.ts   # Rollup data resolver
│   └── ws/               # WebSocket streaming
│       └── stream.ts     # Real-time block streaming
├── hooks/                # React hooks
│   └── useNet.ts         # Network data hook
├── contexts/             # React contexts
├── types/                # TypeScript definitions
├── lib/                  # Utils and configuration
│   ├── config.ts         # Environment configuration
│   ├── rollup-parser.ts  # Rollup data parsing
│   └── utils.ts          # Utility functions
```

### Tech Stack
- **Framework**: Next.js 15.4.4 with App Router and Turbopack
- **Language**: TypeScript with strict checking
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React SVG icons
- **State**: React hooks and Context API
- **Real-time**: WebSocket streaming
- **APIs**: REST endpoints with environment configuration

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

### Build and Run
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Network Statistics APIs
The application fetches real-time network data from three endpoints:

- **Transaction Count**: `/v0/node/transactions/count` - Updates every 5 blocks
- **Payload Size**: `/v0/node/payloads/total-size` - Updates every 5 minutes  
- **Success Rate**: `/v0/status/success-rate` - Updates every 5 minutes

## API Setup

### Espresso Network APIs
- **Query API**: `https://query.main.net.espresso.network/v0/`
- **WebSocket Stream**: `wss://query.main.net.espresso.network/v0/availability/stream/blocks/`
- **Rollup Data**: Web worker parses from official scan

### Performance
- 300ms search debounce
- Query caching
- WebSocket reconnection
- Summary API endpoints
- Batch transaction processing

## Customization

### Add New Search Types
1. Extend the `detectSearchType` function in `components/search/interface.tsx`
2. Add API integration in `services/api/main.ts`
3. Create display components in `components/search/details.tsx`
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

- **GitHub Issues**: [Report bugs or request features](https://github.com/symulacr/composable/issues)
- **Espresso Network**: [Official documentation and support](http://eng-wiki.espressosys.com/main.html)

---

Built for the Espresso Network ecosystem. Developers create this for developers.
