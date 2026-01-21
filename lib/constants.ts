// SurviveBase - Constants

export const SITE_NAME = 'SurviveBase';
export const SITE_DESCRIPTION = '오픈월드 생존 건설 게임 큐레이션 플랫폼';

// API URLs
export const STEAMSPY_API_URL = 'https://steamspy.com/api.php';
export const STEAM_STORE_API_URL = 'https://store.steampowered.com/api';

// Rate Limits (in ms)
export const STEAMSPY_RATE_LIMIT = 1000; // 1 request per second
export const STEAM_STORE_RATE_LIMIT = 1000; // 1 request per second (순차 모드용, 폴백 시 사용)

// Steam Store 병렬 처리 설정
export const STEAM_STORE_CONCURRENCY = 3; // 동시 요청 수 (보수적)
export const STEAM_STORE_REQUEST_DELAY = 350; // 요청 시작 간 딜레이 (ms)

// Pagination
export const GAMES_PER_PAGE = 24;

// Core Tags for data collection
export const CORE_TAGS = [
  'Survival',
  'Open World',
  'Open World Survival Craft',
  'Base Building',
  'Crafting',
  'Building',
  'Sandbox',
  'Automation',
  'Resource Management',
] as const;

// Secondary Tags for filtering
export const SECONDARY_TAGS = [
  'Multiplayer',
  'Co-op',
  'Online Co-Op',
  'Singleplayer',
  'Post-apocalyptic',
  'Zombies',
  'Exploration',
  'Voxel',
  'PvP',
  'FPS',
  'Shooter',
] as const;

// Price Ranges (KRW)
export const PRICE_RANGES = {
  free: { min: 0, max: 0, label: '무료' },
  under15000: { min: 1, max: 15000, label: '~₩15,000' },
  under30000: { min: 15001, max: 30000, label: '~₩30,000' },
  over30000: { min: 30001, max: Infinity, label: '₩30,000+' },
} as const;

// Sort Options
export const SORT_OPTIONS = {
  popular: { label: '인기순', key: 'owners' },
  rating: { label: '평가순', key: 'reviews.score' },
  newest: { label: '신규발매순', key: 'releaseDate' },
  trending: { label: '신규인기순', key: 'trending' },
  rising: { label: '최근평가상승순', key: 'rising' },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  bookmarks: 'survivebase-bookmarks',
  recentGames: 'survivebase-recent',
  theme: 'survivebase-theme',
} as const;

// Limits
export const MAX_BOOKMARKS = 100;
export const MAX_RECENT_GAMES = 10;
