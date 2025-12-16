# HealthPay Wallet Dashboard

Modern, responsive wallet dashboard built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

✅ **Real-time Updates** - WebSocket integration for live balance and transaction updates  
✅ **Multi-language** - Arabic and English with RTL support  
✅ **Responsive Design** - Mobile-first, works on all devices  
✅ **Dark Mode** - System preference detection  
✅ **Type-safe** - Full TypeScript coverage  
✅ **Performance** - Next.js 14 with App Router  

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

## Project Structure

```
wallet-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   └── dashboard/
│   │       └── page.tsx     # Dashboard page
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities
├── public/                 # Static assets
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind config
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: @healthpay/ui
- **WebSocket**: @healthpay/websocket
- **i18n**: @healthpay/i18n
- **State Management**: React hooks
- **API Client**: GraphQL + REST

## Features

### Dashboard
- Wallet balance display
- Recent transactions
- Quick actions (Send, Receive, Top-up)
- Transaction history
- Real-time updates

### Real-time Updates
- Balance changes
- New transactions
- Payment notifications
- WebSocket reconnection

### Internationalization
- Arabic (RTL)
- English (LTR)
- 200+ translation keys
- Dynamic language switching

## Development

### Adding New Pages

```tsx
// app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>
}
```

### Using Shared Components

```tsx
import { Button, Card } from '@healthpay/ui'

export default function Example() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  )
}
```

### WebSocket Integration

```tsx
import { useWebSocket } from '@healthpay/websocket'

export default function Component() {
  const { connected, subscribe } = useWebSocket()
  
  useEffect(() => {
    subscribe('wallet.credited', (data) => {
      console.log('Wallet credited:', data)
    })
  }, [])
}
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t healthpay-wallet-dashboard .
docker run -p 3000:3000 healthpay-wallet-dashboard
```

### Kubernetes

See `deployment/kubernetes/` for manifests.

## License

Proprietary - HealthPay
