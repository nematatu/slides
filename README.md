# amatatu slides

https://slides.amatatu.com — PDF スライド置き場。Astro + PDF.js + Cloudflare Workers。

`decks/` に PDF を置いて push すると公開される。書式は [decks/README.md](decks/README.md)。

```sh
npm install
npm run dev      # ローカル確認
npm run deploy   # 手動デプロイ
```

main への push で GitHub Actions がデプロイする (Secrets に `CLOUDFLARE_API_TOKEN` が必要)。
