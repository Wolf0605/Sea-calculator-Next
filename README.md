# 🌊 Ocean Calculator

바다 테마의 iOS 스타일 계산기 웹앱입니다.
Next.js로 제작되어 PC, 모바일 브라우저 어디서든 사용할 수 있습니다.

## ✨ 주요 기능

- **사칙연산** — 덧셈, 뺄셈, 곱셈, 나눗셈
- **iOS 스타일 레이아웃** — AC / ±  / % / 소수점 지원
- **🐬 돌고래 퀴즈 모드** — 우상단 🐬 아이콘 탭 → 수학 퀴즈 패널 슬라이드
- **🫧 기포 배경 애니메이션** — 20개 버블이 랜덤하게 상승
- **🔊 버튼별 효과음** — 숫자 / 기능 / 연산자 / = 각각 다른 소리
- **🎉 퀴즈 정답/오답 효과음** — 정답은 밝은 3연음, 오답은 거친 하강음
- **🌊 바다 앰비언트 배경음** — 페이지 로드 시 자동 재생

## 🛠 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Web Audio API** — 효과음 및 앰비언트 사운드
- **CSS Animations** — 기포 애니메이션, 퀴즈 패널 슬라이드

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `localhost:3000` 접속

## 📦 배포

Vercel을 통해 배포되어 있습니다.

🔗 **라이브 URL:** https://sea-calculator-app.vercel.app

## 📁 프로젝트 구조

```
sea-calculator-next/
├── app/
│   ├── layout.tsx     # 레이아웃 및 메타데이터
│   ├── globals.css    # 전역 스타일 및 키프레임 애니메이션
│   └── page.tsx       # 메인 계산기 컴포넌트
└── public/
    └── dolphin.png    # 퀴즈 패널 돌고래 이미지
```

## 🔄 마이그레이션

기존 React Native (Expo) 앱에서 Next.js 웹앱으로 마이그레이션되었습니다.

| 항목 | 기존 (Expo) | 현재 (Next.js) |
|------|------------|----------------|
| 플랫폼 | iOS / Android 앱 | 웹 브라우저 |
| 배경 그라디언트 | expo-linear-gradient | CSS linear-gradient |
| 애니메이션 | React Native Animated | CSS @keyframes |
| 사운드 | expo-av + .wav 파일 | Web Audio API |
| 배포 | Expo Go (테스트용) | Vercel (공개 URL) |
