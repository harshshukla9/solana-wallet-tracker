# Solana Address Activity Monitor

A real-time Node.js application that monitors Solana wallet addresses for any activity and logs detailed information to the console. The application tracks swaps, token purchases, transfers, and provides market data.

## Features

- **Real-time Monitoring**: Monitor multiple Solana wallet addresses simultaneously
- **Transaction Analysis**: Parse and categorize different types of transactions:
  - Token swaps (Jupiter, Raydium, Orca, etc.)
  - Token purchases/sales
  - Regular transfers
  - NFT transactions
  - DeFi interactions
- **Market Data Integration**: Fetch current market cap, price, and token metadata
- **Rich Console Output**: Beautiful, colorized console output with detailed transaction information
- **WebSocket & Polling**: Dual monitoring approach for reliability
- **Persistent Storage**: Track processed transactions to avoid duplicates

## Screenshots

```
🔄 SWAP DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Address: 9WzD...AWWM
🔗 Signature: 5Q54...ge4j1
💱 Platform: Jupiter Aggregator
📊 Swap: 1.5 SOL → 45,230 BONK
💰 Value: ~$234.56 USD
📈 BONK Price: $0.0000052 | Market Cap: $340M
⏰ Time: 2024-08-03 14:30:25 UTC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solana-address-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Solana RPC Configuration
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
   
   # Optional: Enhanced RPC endpoints
   # SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_API_KEY
   # SOLANA_WS_URL=wss://rpc.helius.xyz/?api-key=YOUR_API_KEY
   
   # API Keys (optional)
   COINGECKO_API_KEY=your_coingecko_api_key_here
   JUPITER_API_URL=https://price.jup.ag/v4
   
   # Application Settings
   POLLING_INTERVAL=15000
   DEBUG=false
   LOG_LEVEL=info
   ```

4. **Start the application**
   ```bash
   npm start
   ```

## Usage

### Basic Commands

```bash
# Start monitoring
npm start

# Start with development mode (auto-restart on changes)
npm run dev

# Add an address to monitor
node src/index.js --add <address> [label]

# Remove an address from monitoring
node src/index.js --remove <address>

# List monitored addresses
node src/index.js --list

# Show help
node src/index.js --help
```

### Examples

```bash
# Add a whale address to monitor
node src/index.js --add 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM "Whale 1"

# Remove an address
node src/index.js --remove 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

# List all monitored addresses
node src/index.js --list
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `SOLANA_WS_URL` | Solana WebSocket endpoint | `wss://api.mainnet-beta.solana.com` |
| `COINGECKO_API_KEY` | CoinGecko API key (optional) | - |
| `JUPITER_API_URL` | Jupiter API endpoint | `https://price.jup.ag/v4` |
| `POLLING_INTERVAL` | Polling interval in milliseconds | `15000` |
| `DEBUG` | Enable debug mode | `false` |
| `LOG_LEVEL` | Logging level | `info` |

## Project Structure

```
solana-monitor/
├── src/
│   ├── monitors/
│   │   ├── solana-monitor.js          # Main monitoring logic
│   │   └── transaction-parser.js      # Parse different transaction types
│   ├── services/
│   │   ├── market-data-service.js     # Fetch token prices/market cap
│   │   ├── token-service.js           # Token metadata and info
│   │   └── storage-service.js         # Simple file-based storage
│   ├── utils/
│   │   ├── logger.js                  # Colored console logging
│   │   ├── formatters.js              # Format numbers, addresses, etc.
│   │   └── constants.js               # DEX program IDs, token addresses
│   ├── config/
│   │   └── config.js                  # Configuration management
│   └── index.js                       # Main entry point
├── data/
│   ├── monitored-addresses.json       # List of addresses to monitor
│   └── processed-transactions.json    # Track processed transactions
├── .env.example
├── package.json
└── README.md
```

## Features in Detail

### Transaction Types Detected

1. **Swaps**: Token swaps on major DEXs
   - Jupiter Aggregator
   - Raydium AMM/CLMM
   - Orca Whirlpool
   - Meteora
   - Serum
   - OpenBook

2. **Transfers**: Regular SOL/SPL token transfers
   - SOL transfers
   - SPL token transfers
   - Cross-program invocations

3. **DeFi Interactions**: Complex DeFi operations
   - Lending protocols
   - Yield farming
   - Liquidity provision

4. **NFT Transactions**: NFT-related activities
   - NFT purchases/sales
   - NFT transfers
   - NFT minting

### Market Data Integration

- **Jupiter API**: Primary source for Solana token prices
- **CoinGecko API**: Fallback for comprehensive market data
- **Caching**: 30-second cache to reduce API calls
- **Error Handling**: Graceful degradation when APIs are unavailable

### Console Output Features

- **Color-coded**: Different colors for different transaction types
- **Emojis**: Visual indicators for easy scanning
- **Formatted Numbers**: Proper formatting for large numbers
- **Address Truncation**: Show first 4 and last 4 characters
- **USD Values**: Real-time USD conversion
- **Market Data**: Price and market cap information

## Configuration

### RPC Endpoints

For better performance, consider using dedicated RPC providers:

- **Helius**: `https://rpc.helius.xyz/?api-key=YOUR_API_KEY`
- **QuickNode**: `https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_API_KEY/`
- **Alchemy**: `https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

### API Keys

- **CoinGecko**: Get free API key from [CoinGecko](https://www.coingecko.com/en/api)
- **Jupiter**: No API key required for basic usage

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check your RPC endpoint URL
   - Verify network connectivity
   - Try a different RPC provider

2. **Rate Limiting**
   - Use dedicated RPC providers
   - Increase polling interval
   - Add API keys for higher limits

3. **Missing Transactions**
   - Check if address is valid
   - Verify address has recent activity
   - Enable debug mode for more logs

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=true npm start
```

### Log Levels

- `info`: Standard information
- `debug`: Detailed debugging information
- `warn`: Warning messages
- `error`: Error messages

## Development

### Adding New DEX Support

1. Add program ID to `src/utils/constants.js`
2. Update transaction parser in `src/monitors/transaction-parser.js`
3. Test with sample transactions

### Adding New Token Support

1. Add token metadata to `src/utils/constants.js`
2. Update market data service if needed
3. Test price fetching

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

1. Check the troubleshooting section
2. Enable debug mode for detailed logs
3. Open an issue on GitHub

## Roadmap

- [ ] Web dashboard
- [ ] Telegram/Discord notifications
- [ ] Historical transaction analysis
- [ ] Portfolio tracking
- [ ] Advanced analytics
- [ ] Mobile app

---

**Note**: This application is for educational and monitoring purposes. Always verify transaction data independently before making financial decisions. 