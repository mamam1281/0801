// 이미지 상수 정의 - Casino-Club F2P
export const GAME_IMAGES = {
  slot: {
    thumbnail: '/images/games/slot/neon-slot-thumbnail.jpg',
    background: '/images/games/slot/slot-background.jpg',
    symbols: [
      '/images/games/slot/cherry.png',
      '/images/games/slot/diamond.png', 
      '/images/games/slot/seven.png',
      '/images/games/slot/bar.png',
      '/images/games/slot/star.png'
    ]
  },
  rps: {
    thumbnail: '/images/games/rps/rps-thumbnail.jpg',
    background: '/images/games/rps/battle-arena.jpg',
    hands: {
      rock: '/images/games/rps/rock.png',
      paper: '/images/games/rps/paper.png',
      scissors: '/images/games/rps/scissors.png'
    }
  },
  gacha: {
    thumbnail: '/images/games/gacha/gacha-thumbnail.jpg',
    background: '/images/games/gacha/mystery-bg.jpg',
    box: '/images/games/gacha/mystery-box.png',
    sparkles: '/images/games/gacha/sparkles.gif',
    items: {
      common: '/images/games/gacha/common-item.png',
      rare: '/images/games/gacha/rare-item.png',
      epic: '/images/games/gacha/epic-item.png',
      legendary: '/images/games/gacha/legendary-item.png'
    }
  },
  crash: {
    thumbnail: '/images/games/crash/crash-thumbnail.jpg',
    background: '/images/games/crash/neon-crash-bg.jpg',
    rocket: '/images/games/crash/rocket.png',
    explosion: '/images/games/crash/explosion.gif'
  }
};

export const VJ_IMAGES = {
  luna: {
    profile: '/images/avatars/vj-luna-profile.jpg',
    stream: '/images/avatars/vj-luna-streaming.jpg',
    thumbnail: '/images/avatars/vj-luna-thumb.jpg'
  },
  default: {
    user: '/images/avatars/default-user.png',
    placeholder: '/images/avatars/placeholder.jpg'
  }
};

export const UI_IMAGES = {
  icons: {
    gold: '/images/ui/gold-icon.png',
    diamond: '/images/ui/diamond-icon.png',
    heart: '/images/ui/heart-icon.png',
    star: '/images/ui/star-icon.png'
  },
  backgrounds: {
    casino: '/images/backgrounds/casino-bg.jpg',
    neonGrid: '/images/backgrounds/neon-grid.png',
    particles: '/images/backgrounds/particles.svg'
  },
  placeholders: {
    loading: '/images/placeholders/loading.gif',
    blur: '/images/placeholders/blur-placeholder.jpg',
    noImage: '/images/placeholders/no-image.png'
  }
};

// 개발용 임시 이미지 (Unsplash)
export const TEMP_IMAGES = {
  games: {
    slot: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400&h=300&fit=crop',
    rps: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
    gacha: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    crash: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?w=400&h=300&fit=crop'
  },
  vj: {
    profile: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
    stream: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?w=800&h=600&fit=crop'
  }
};
