export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_LONG_BREAK_MINUTES = 15;
export const LONG_BREAK_INTERVAL = 4; // every 4 focus sessions

export const FOCUS_DURATION_MIN = 5;
export const FOCUS_DURATION_MAX = 120;
export const BREAK_DURATION_MIN = 1;
export const BREAK_DURATION_MAX = 60;

// Use Vite proxy in dev to avoid CORS; in production, set OLLAMA_ORIGINS=* or use a reverse proxy
export const DEFAULT_OLLAMA_ENDPOINT = '/api/ollama';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
export const DEFAULT_OLLAMA_MODEL = 'llama3';

export const ACHIEVEMENT_IDS = {
  FIRST_FOCUS: 'first_focus',
  FOCUS_10: 'focus_10',
  FOCUS_100: 'focus_100',
  HOUR_1: 'hour_1',
  HOUR_10: 'hour_10',
  HOUR_100: 'hour_100',
  ALL_SUBJECTS: 'all_subjects',
  EARLY_BIRD: 'early_bird',
  NIGHT_OWL: 'night_owl',
  STREAK_7: 'streak_7',
} as const;

export const ENCOURAGEMENT_MESSAGES = {
  timerStart: [
    '准备好了吗？一起加油吧！',
    '今天也要元气满满哦~',
    '我会一直陪着你的！',
    '专注时间到，让我们开始吧！',
    '新的挑战开始了呢！',
  ],
  timerEnd: [
    '辛苦啦！做得真棒~',
    '休息一下吧，你已经很努力了！',
    '太厉害了！继续保持！',
    '又是一次完美的专注时间~',
    '奖励自己一下怎么样？',
  ],
  encourage: [
    '加油！还有一点点就完成了！',
    '不要分心哦，我在看着你呢~',
    '专注的你真的很有魅力呢！',
    '今天的努力，是明天的基石！',
    '你已经比大多数人坚持得更久了！',
    '学习让我快乐，和你一起学习更快乐~',
    '注意力集中！目标就在前方！',
    '你能行的，我相信你！',
  ],
  idle: [
    '选一个科目开始今天的学习吧~',
    '今天想学什么呢？',
    '我等你很久啦，开始学习吧！',
    '好无聊啊，来学习嘛~',
  ],
} as const;

export const SUBJECT_COLORS = [
  '#7c3aed', // purple
  '#2563eb', // blue
  '#dc2626', // red
  '#059669', // emerald
  '#d97706', // amber
  '#db2777', // pink
  '#0891b2', // cyan
  '#4f46e5', // indigo
] as const;
