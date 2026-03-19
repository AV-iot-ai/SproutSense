web/src
├── main.jsx
├── App.jsx
├── api/
│   └── client.js         # Axios / fetch wrappers for /api/*
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── Shell.jsx
│   ├── bits/             # GlassIcon, cards, badges, etc.
│   └── charts/           # Recharts-based components
└── pages/
    ├── HomePage.jsx      # Landing + quick metrics
    ├── SensorsPage.jsx   # Live sensor plots via WS
    ├── AnalyticsPage.jsx # History + trends
    ├── ControlsPage.jsx  # Pump control, thresholds
    ├── InsightsPage.jsx  # AI disease & recommendations
    └── AIChatPage.jsx    # Gemini-powered chat
