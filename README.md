# Solana Vanity Address Generator

<img width="1106" height="935" alt="image" src="https://github.com/user-attachments/assets/a1dd07f4-1100-4cd5-86f3-14f91dbfa91d" />

A modern web application for generating custom Solana addresses with specific patterns. Built with Next.js and TypeScript, this tool allows you to create vanity addresses that start with, end with, or contain specific characters.
"used this tool to create <a href="https://www.sns.id/domain/bytegen" target="_blank">**bytegen.sol**</a> wallet address -> **BYTEjknDKYUxmteFND2K1abSBJj1Ke65MQnwwZHQUYQA**
## 🚀 Features

- **Pattern Matching**: Generate addresses that start with, end with, or contain specific patterns
- **Real-time Difficulty Estimation**: See the probability and expected attempts before generating
- **Client-side Generation**: All processing happens in your browser for privacy and speed
- **Modern UI**: Beautiful, responsive interface with gradient backgrounds
- **Copy to Clipboard**: Easy copying of generated public and private keys
- **Configurable Limits**: Set maximum attempts and time limits

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Custom CSS with modern design
- **Cryptography**: Solana Web3.js for keypair generation
- **Encoding**: bs58 for Base58 encoding
- **Deployment**: Vercel-ready

## 📦 Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd vanity-address-generator
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

### Basic Usage

1. **Enter your desired pattern**:

   - **Starts With**: Address begins with specific characters (e.g., "ABC")
   - **Ends With**: Address ends with specific characters (e.g., "XYZ")
   - **Contains**: Address contains specific characters anywhere (e.g., "SOL")

2. **Set limits**:

   - **Max Attempts**: Maximum number of attempts (default: 1,000,000)
   - **Max Time**: Maximum time in seconds (default: 30)

3. **Generate**: Click "Generate Vanity Address" and wait for results

### Difficulty Examples

| Pattern           | Expected Attempts | Time Estimate  |
| ----------------- | ----------------- | -------------- |
| Starts with "A"   | ~58               | < 1 second     |
| Starts with "AB"  | ~3,364            | ~1-5 seconds   |
| Starts with "ABC" | ~195,112          | ~30-60 seconds |
| Contains "SOL"    | ~195,112          | ~30-60 seconds |

## 🔧 Configuration

### Environment Variables

No environment variables are required for basic functionality. All processing happens client-side.

### Customization

You can modify the generation logic in `lib/vanity-generator.ts`:

```typescript
// Example: Add custom pattern matching
private matchesCustomPattern(publicKey: string): boolean {
  // Add your custom logic here
  return publicKey.includes('CUSTOM');
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## 🔒 Security

- **Client-side Processing**: All keypair generation happens in your browser
- **No Server Storage**: Private keys are never sent to or stored on servers
- **Local Generation**: Your private keys stay on your device

## 📊 Performance

- **Optimized Generation**: Uses efficient algorithms for pattern matching
- **Non-blocking UI**: Generation runs in background without freezing the interface
- **Memory Efficient**: Minimal memory footprint during generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

- **Educational Purpose**: This tool is for educational and legitimate use only
- **No Guarantees**: Generation time varies based on pattern complexity
- **Security**: Always verify generated addresses before using them for transactions
- **Backup**: Keep your private keys secure and backed up

## 🆘 Troubleshooting

### Common Issues

1. **Generation takes too long**: Try simpler patterns or increase time limits
2. **App doesn't load**: Check if all dependencies are installed
3. **Copy doesn't work**: Ensure you're using a modern browser with clipboard API support

### Performance Tips

- Use shorter patterns for faster generation
- Avoid very complex patterns that might take hours
- Consider using "Contains" instead of "Starts With" for better performance

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Review the code comments for implementation details

---

**Happy Vanity Address Generation! 🎉**
