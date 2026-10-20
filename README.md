# 네뷸라 · 명조 (wuwa.nebula.kim)

아카라이브 명조 채널 위키 **["이정도면 잘키웠다표"](https://arca.live/w/wutheringwaves/%EC%9D%B4%EC%A0%95%EB%8F%84%EB%A9%B4%20%EC%9E%98%ED%82%A4%EC%9B%A0%EB%8B%A4%ED%91%9C)**를 캐릭터 카드로 보여주는 사이트입니다.
Nebula 사이트 모음([nebula.kim](https://nebula.kim))의 하나로, 맨 위 전환 바·테마·알림창은 허브 저장소(`Nebula-sw/nebula-hub`)의 공용 스크립트를 씁니다.

- 서버 코드 없이 파일만 올리는 정적 사이트 (Cloudflare Workers Static Assets, 무료)
- 데이터는 위키에서 가져온 **스냅샷** (`public/data/characters.json`). 위키가 바뀌면 수집 스크립트를 다시 돌려 커밋

## 기능

- 캐릭터 카드 (45명, 위키 수정 2026-10-09 기준): 초상화, 속성, 포지션, 스킬 우선순위, 노드 옵션, 추천 무기(전무·상시·4성 표시), 에코 세트, 코스트 배치별 에코 주옵, 목표 크확·크피, 목표 스탯(공명 효율·공격력/체력·에너지 소모), 참고사항
- 속성 필터 (기류·용융·응결·전도·인멸·회절, 위키와 같은 색), 검색 (캐릭터·무기·에코 세트·포지션)
- 라이트 / 다크 / 시스템 모드 (맨 위 바의 [테마] 버튼)
- 홈 화면에 추가하면 앱처럼 열림, 카톡 공유 썸네일
- 아래쪽에 원문 위키 링크 표시

## 파일 구성

| 파일 | 역할 |
|---|---|
| `public/index.html` | 화면 전체 (필터·검색·카드 그리기) |
| `public/data/characters.json` | 캐릭터 데이터 (수집 스크립트가 만듦, 직접 고치지 않기) |
| `public/img/` | 캐릭터 초상화 (`속성-이름.webp`). 위키 이미지 주소는 기한이 있는 임시 링크라 파일로 저장 |
| `scripts/scrape.mjs` | 위키를 읽어서 위 두 곳을 갱신하는 수집 스크립트 |
| `wrangler.jsonc` | Cloudflare 설정 |
| `public/_headers` | 캐시 설정: 초상화 1년(주소에 `?v=수집시각`이 붙어서 다시 수집하면 새로 받음), 데이터 5분 |
| `public/favicon.svg`, `apple-touch-icon.png`, `icon-*.png`, `og.png`, `manifest.webmanifest` | 아이콘·썸네일·홈 화면 설정 (원본은 nebula-hub/docs/og) |

### characters.json 모양 (캐릭터 하나)

```json
{
  "name": "기염", "element": "기류", "image": "/img/기류-기염.webp",
  "position": "기류 메인 딜러", "skill": "공명 스킬, 공명 회로, 공명 해방 우선", "node": "크리티컬",
  "weapons": [{ "name": "청룡의 천장", "tag": "전무" }],
  "echoSets": [{ "name": "스쳐가는 바람", "tag": "43311" }],
  "echoMains": [{ "layout": "43311", "slots": ["크확", "기류피증\n기류피증", "기류피증\n공퍼"] }],
  "crit": [{ "layout": "43311", "text": "크확 70%\n크피 260%" }],
  "stats": [{ "label": "공명 효율", "value": "130" }],
  "notes": ["..."]
}
```

## 위키가 바뀌었을 때 갱신하기

아카라이브는 Cloudflare 봇 확인이 있어서 서버가 자동으로 가져올 수 없고, 실제 브라우저(Playwright)로 열어야 합니다.

```bash
node scripts/scrape.mjs      # characters.json + img/ 갱신
git add -A && git commit -m "명조 데이터 갱신" && git push
```

- 필요: Node 22, Playwright + Chromium
- 네트워크에서 `arca.live`(위키)와 `ac.arca.live`(이미지)에 접속할 수 있어야 함
- 이미지를 못 받은 캐릭터는 예전에 받아 둔 파일을 쓰고, 그것도 없으면 이름 첫 글자로 표시
- 위키 표 모양이 바뀌면 `scripts/scrape.mjs`의 표 읽는 부분(`page.evaluate` 안)을 고쳐야 함

Claude에게 "명조 갱신해줘"라고 하면 위 과정을 대신 해 줍니다.

## 로컬 실행 / 배포

```bash
npx wrangler dev        # http://localhost:8787
```

- 배포: `main`에 push하면 Cloudflare가 자동 배포 (Worker 이름 `wuwa`, Deploy command `npx wrangler deploy`)
- 도메인: Cloudflare → `wuwa` → Settings → Domains & Routes → Custom domain `wuwa.nebula.kim`

## 출처

데이터: 아카라이브 명조 채널 위키 "이정도면 잘키웠다표". 위키 내용을 옮겨 온 것이라 최신 내용은 원문을 확인하세요.
