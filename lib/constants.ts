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
export const STEAM_STORE_CONCURRENCY = 2; // 동시 2개
export const STEAM_STORE_REQUEST_DELAY = 800; // 요청 간 0.8초 딜레이

// Pagination
export const GAMES_PER_PAGE = 24;

// Core Tags for data collection (한글 - Steam API cc=kr)
// 생존 건설/크래프팅 게임에 특화된 태그
export const CORE_TAGS = [
  '생존',
  '오픈 월드',
  '건설',
  '크래프팅',
  '기지 건설',
  '샌드박스',
  '자원 관리',
] as const;

// Required tags - 게임이 최소 하나 이상 가져야 포함됨
// (생존 태그만으로는 배틀로얄도 포함되므로 크래프팅/건설 태그 필수)
export const REQUIRED_TAGS = [
  '크래프팅',
  'Crafting',
  '기지 건설',
  'Base Building',
  '건설',
  'Building',
  '자원 관리',
  '자동화',
  'Automation',
] as const;

// Excluded tags - 이 태그가 있으면 제외
export const EXCLUDED_TAGS = [
  '배틀 로얄',
  'Battle Royale',
  'MOBA',
  '카드 게임',
  'Card Game',
  '스포츠',
  'Sports',
  '레이싱',
  'Racing',
  '격투',
  'Fighting',
] as const;

// Secondary Tags for filtering (한글 - Steam API cc=kr)
export const SECONDARY_TAGS = [
  '멀티플레이어',
  '협동',
  '온라인 협동',
  '싱글 플레이어',
  '좀비',
  '탐험',
  'PvP',
  'FPS',
  '액션',
  '어드벤처',
  '인디',
  'RPG',
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
export const MAX_RECENT_GAMES = 5;
