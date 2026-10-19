/**
 * 아카라이브 명조 채널 위키 "이정도면 잘키웠다표"를 긁어서
 *   public/data/characters.json (캐릭터 데이터) + public/img/*.png (캐릭터 이미지) 로 저장.
 *
 * 실행: node scripts/scrape.mjs   (Playwright + Chromium 필요)
 *  - 아카라이브는 Cloudflare 봇 확인이 있어서 일반 요청(curl)으로는 안 열리고, 실제 브라우저로 열어야 함
 *  - 이미지 주소는 기한이 있는 임시 링크라 이미지는 파일로 받아 둠
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'

const URL_ = 'https://arca.live/w/wutheringwaves/%EC%9D%B4%EC%A0%95%EB%8F%84%EB%A9%B4%20%EC%9E%98%ED%82%A4%EC%9B%A0%EB%8B%A4%ED%91%9C'
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const browser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] })
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  locale: 'ko-KR',
})
const page = await ctx.newPage()
await page.goto(URL_, { timeout: 60000 })
// 봇 확인 화면이 지나가고 본문이 뜰 때까지 기다림
await page.waitForSelector('div[style*="calc(890px / 2)"]', { timeout: 60000 })

const data = await page.evaluate(() => {
  const text = (el) => (el ? el.innerText.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim() : '')
  const lines = (el) => text(el).split('\n').map((s) => s.trim()).filter(Boolean)
  // "청룡의 천장[전무], 푸른물결의 빛[상시]" → [{ name, tag }]
  const tagged = (s) =>
    s.split(/,\s*|\n/).map((x) => x.trim()).filter(Boolean).map((x) => {
      const m = x.match(/^(.*?)\s*\[([^\]]+)\]\s*$/)
      return m ? { name: m[1].trim(), tag: m[2].trim().replace(/_/g, ' ') } : { name: x, tag: '' }
    })

  const updated = (document.body.innerText.match(/최근 수정 시각:\s*([0-9-]+ [0-9:]+)/) || [])[1] || ''
  const out = []
  for (const block of document.querySelectorAll('div[style*="calc(890px / 2)"]')) {
    // 속성 = 이 블록 앞의 가장 가까운 h2 제목 (기류·용융·응결·전도·인멸·회절)
    let h = block.closest('.wiki-heading-content')?.previousElementSibling
    while (h && h.tagName !== 'H2') h = h.previousElementSibling
    const element = h ? h.querySelector('span[id]')?.id || '' : ''

    const outer = block.querySelector('table')
    const rows = [...outer.querySelectorAll(':scope > tbody > tr')]
    const name = text(rows[0].children[0])
    const img = rows[1].querySelector('img')
    const imageSrc = img ? new URL(img.getAttribute('src'), location.href).href : ''
    const c = {
      name,
      element,
      imageSrc,
      skill: text(rows[1].children[1]),
      position: text(rows[3].children[0]),
      node: text(rows[3].children[1]),
      weapons: tagged(text(rows[5])),
      echoSets: [],
      echoMains: [], // [{ layout: '43311', slots: ['크확', '기류피증\n기류피증', ...] }]
      crit: [], // [{ layout, text }]
      stats: [], // [{ label: '공명 효율', value: '130' }]
      notes: [],
    }

    const inner = rows[6]?.querySelector('table')
    const irows = inner ? [...inner.querySelectorAll(':scope > tbody > tr')] : []
    let mode = ''
    for (const tr of irows) {
      const cells = [...tr.children]
      const first = text(cells[0])
      const statTable = tr.querySelector('table')
      if (statTable) {
        // 공명 효율 / 공격력(또는 체력) / 공명 에너지 소모 : 위 줄이 이름, 아래 줄이 값
        const sr = [...statTable.querySelectorAll(':scope > tbody > tr')].map((r) => [...r.children].map(text))
        const labels = sr[0] || []
        const values = sr[1] || []
        labels.forEach((label, i) => c.stats.push({ label, value: values[i] || '' }))
        mode = ''
        continue
      }
      if (first === '에코 세트') { mode = 'sets'; continue }
      if (first === '참고사항') { mode = 'notes'; continue }
      if (/^에코\s*\n?\s*주옵$/.test(first)) { mode = 'mains'; cells.shift() }
      else if (/^크확\s*\n?\s*크피$/.test(first)) { mode = 'crit'; cells.shift() }
      const vals = cells.map(text)
      if (mode === 'sets') c.echoSets.push(...tagged(vals.join('\n')))
      else if (mode === 'mains') c.echoMains.push({ layout: vals[0], slots: vals.slice(1) })
      else if (mode === 'crit') c.crit.push({ layout: vals[0], text: vals.slice(1).join('\n') })
      else if (mode === 'notes') c.notes.push(...lines(tr))
    }
    out.push(c)
  }
  return { updated, characters: out }
})

// 이미지 받기 (같은 브라우저 세션으로 받아야 봇 확인을 안 거침)
for (const ch of data.characters) {
  if (!ch.imageSrc) continue
  const file = `${ch.element}-${ch.name}.png`.replace(/[\\/:*?"<>| ]/g, '_') // 방랑자처럼 이름이 겹치는 경우가 있어 속성을 앞에 붙임
  try {
    const res = await page.request.get(ch.imageSrc)
    if (!res.ok()) throw new Error(String(res.status()))
    fs.writeFileSync(path.join(root, 'public/img', file), await res.body())
    ch.image = `/img/${file}`
  } catch (e) {
    // 못 받으면 예전에 받아 둔 파일이 있으면 그걸 씀 (없으면 화면에서 이름 첫 글자로 대신 표시)
    console.warn('이미지 실패', ch.name, e.message.split('\n')[0])
    ch.image = fs.existsSync(path.join(root, 'public/img', file)) ? `/img/${file}` : ''
  }
  delete ch.imageSrc
}

const result = { source: URL_, wikiUpdated: data.updated, scrapedAt: new Date().toISOString(), characters: data.characters }
fs.writeFileSync(path.join(root, 'public/data/characters.json'), JSON.stringify(result, null, 1))
console.log(`캐릭터 ${data.characters.length}명 저장 (위키 수정 ${data.updated})`)
await browser.close()
