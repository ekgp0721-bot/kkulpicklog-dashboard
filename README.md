# 꿀픽로그 수익화 대시보드

꿀픽로그(`@kkulpicklog`)의 콘텐츠 발행·수익·제휴 링크 현황을 한눈에 보는 대시보드입니다.
`index.html` · `styles.css` · `app.js` 는 그대로 두고 **`data.json` 만 수정해서 올리면** 사이트에 바로 반영됩니다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 뼈대 (모든 수치는 JS가 채움) |
| `styles.css` | 다크/라이트 테마, 모바일·PC 반응형 스타일 |
| `app.js` | `data.json` 을 읽어 KPI·차트·목록 렌더링, 테마/복사/체크 저장 |
| `data.json` | 숫자와 목록 전부 (여기만 고치면 됨) |

## data.json 고치는 법

- `meta.updated_at` / `meta.updated_label` — 기준일 (헤더와 푸터에 표시)
- `kpis[]` — 상단 카드. `label` / `value` / `unit` / `sub` / `tone`(gold·amber·plain)
- `coupang` — 목표 달성 링/막대. `current`, `target`, `percent`, `rows[]`
- `content_mix[]` — 콘텐츠 구성 도넛. `label`, `value`, `color`
- `platform_status[]` — 수익 채널 상태. `state_key`: `active`(가동 중) · `ready`(준비 완료)
- `contents[]` — 발행 콘텐츠 카드. `platform`, `platform_key`, `kind`, `title`, `url`
- `affiliates[]` — 제휴 링크 표. `commission` 은 숫자(%), 모르면 `null`
- `channels[]` — 채널 바로가기
- `checklist[]` — 할 일. `urgent: true` 면 '마감' 배지

`platform_key` 로 쓰는 값: `naver` `coupang` `toss` `youtube` `instagram` `threads` `tiktok` `blog`

## 배포

GitHub Pages · `main` 브랜치 루트(`/`)를 그대로 서빙합니다. 별도 빌드 과정 없음.

## 오프라인 단일 파일

`python3 ../build-single.py` 를 실행하면 CSS·JS·데이터를 모두 품은 HTML 한 장(`downloads/꿀픽로그-대시보드.html`)이 나옵니다. 파일만 열어도 대시보드가 그대로 뜨고, 외부 의존성이 없습니다.

## 개인정보

공개 저장소입니다. 실명·연락처·주소·계좌·로그인 정보는 넣지 않습니다.
공개 브랜드명과 공개된 콘텐츠 URL, 제휴 단축 링크, 집계 수치만 담습니다.
