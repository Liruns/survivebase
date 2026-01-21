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

// Core Tags for data collection (English - SteamSpy API requires English tags)
// 생존 건설/크래프팅 게임에 특화된 태그
export const CORE_TAGS = [
  'Survival',
  'Open World',
  'Building',
  'Crafting',
  'Base Building',
  'Sandbox',
  'Resource Management',
] as const;

// Tag translations (English → Korean)
export const TAG_TRANSLATIONS: Record<string, string> = {
  // Core tags
  'Survival': '생존',
  'Open World': '오픈 월드',
  'Building': '건설',
  'Crafting': '크래프팅',
  'Base Building': '기지 건설',
  'Sandbox': '샌드박스',
  'Resource Management': '자원 관리',
  // Common tags
  'Action': '액션',
  'Adventure': '어드벤처',
  'Indie': '인디',
  'Simulation': '시뮬레이션',
  'Strategy': '전략',
  'RPG': 'RPG',
  'Early Access': '앞서 해보기',
  'Multiplayer': '멀티플레이어',
  'Singleplayer': '싱글 플레이어',
  'Co-op': '협동',
  'Online Co-Op': '온라인 협동',
  'PvP': 'PvP',
  'PvE': 'PvE',
  'FPS': 'FPS',
  'Third Person': '3인칭',
  'First-Person': '1인칭',
  'Zombies': '좀비',
  'Horror': '공포',
  'Exploration': '탐험',
  'Atmospheric': '분위기',
  'Sci-fi': 'SF',
  'Post-apocalyptic': '포스트 아포칼립스',
  'Automation': '자동화',
  'Management': '경영',
  'City Builder': '도시 건설',
  'Colony Sim': '식민지 시뮬레이션',
  'Farming': '농사',
  'Hunting': '사냥',
  'Fishing': '낚시',
  'Survival Horror': '서바이벌 호러',
  'Open World Survival Craft': '오픈 월드 서바이벌 크래프트',
  'Looter Shooter': '루터 슈터',
  'Shooter': '슈터',
  'Difficult': '어려움',
  'Relaxing': '힐링',
  'Casual': '캐주얼',
  'Hardcore': '하드코어',
  'Realistic': '현실적',
  'Futuristic': '미래',
  'Medieval': '중세',
  'Fantasy': '판타지',
  'Aliens': '외계인',
  'Dinosaurs': '공룡',
  'Nature': '자연',
  'Underwater': '수중',
  'Space': '우주',
  'Naval': '해양',
  'War': '전쟁',
  'Military': '밀리터리',
  'Stealth': '잠입',
  'Tower Defense': '타워 디펜스',
  'Base-Building': '기지 건설',
  'Loot': '루팅',
  'Perma Death': '영구 죽음',
  'Procedural Generation': '절차적 생성',
  'Moddable': '모드 지원',
  'Controller': '컨트롤러',
  'VR': 'VR',
  'Free to Play': '무료',
  'Massively Multiplayer': '대규모 멀티플레이어',
};

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
