# 명조 (wuwa.nebula.kim)

아카라이브 명조 채널 위키 "이정도면 잘키웠다표"를 캐릭터 카드로 보여주는 정적 사이트 (Cloudflare Workers Static Assets).

- `public/index.html` : 화면 (속성 필터 · 검색 · 카드)
- `public/data/characters.json` : 캐릭터 데이터 (위키에서 긁어 온 스냅샷)
- `public/img/` : 캐릭터 이미지 (받을 수 있을 때만)
- `scripts/scrape.mjs` : 위키를 다시 긁어서 위 두 곳을 갱신 (`node scripts/scrape.mjs`, Playwright 필요)
  - 아카라이브는 Cloudflare 봇 확인이 있어서 실제 브라우저로 열어야 함 → 서버가 자동으로 못 가져오고, 갱신은 이 스크립트를 돌려서 커밋
- `wrangler.jsonc` : Cloudflare 설정 (`npx wrangler deploy`)

맨 위 Nebula 바·테마(라이트/다크/시스템)·아이콘·썸네일은 다른 Nebula 사이트와 공용입니다 (nebula-hub 저장소).
