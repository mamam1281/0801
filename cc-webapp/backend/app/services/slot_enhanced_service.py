import random
import uuid
import redis
from typing import List, Dict, Tuple, Any, Optional
from datetime import datetime
import json

# Redis connection - should be moved to a separate module/dependency
try:
    redis_client = redis.Redis(host='cc_redis', port=6379, db=0, decode_responses=True)
    redis_client.ping()  # Test connection
    print("Redis connection successful")
except Exception as e:
    print(f"Redis connection failed: {e}")
    # Fallback to in-memory storage for development
    redis_data = {}
    
    class MockRedis:
        def get(self, key):
            return redis_data.get(key)
            
        def set(self, key, value, ex=None):
            redis_data[key] = value
            return True
            
        def incr(self, key):
            value = int(redis_data.get(key, 0)) + 1
            redis_data[key] = str(value)
            return value
            
        def expire(self, key, time):
            # No real expiration in mock
            return True
    
    redis_client = MockRedis()
    print("Using mock Redis for development")

# Symbol definitions
SYMBOLS = {
    1: "7️⃣",  # Jackpot
    2: "🍒",  # Cherry
    3: "🍋",  # Lemon
    4: "🔔",  # Bell
    5: "💎",  # Diamond
    6: "🍇",  # Grape
    7: "🍊",  # Orange
}

# Symbol weights (probability distribution)
SYMBOL_WEIGHTS = {
    1: 1,    # 0.1% - Jackpot
    2: 150,  # 15% - Cherry
    3: 200,  # 20% - Lemon
    4: 150,  # 15% - Bell
    5: 50,   # 5% - Diamond
    6: 200,  # 20% - Grape
    7: 249   # 24.9% - Orange
}

# Win multipliers for combinations
WIN_MULTIPLIERS = {
    1: 100,  # 3x Jackpot
    5: 50,   # 3x Diamond
    4: 25,   # 3x Bell
    2: 15,   # 3x Cherry
    3: 5,    # 3x Lemon
    6: 5,    # 3x Grape
    7: 5     # 3x Orange
}

# Game configuration
MAX_DAILY_SPINS = 30

class SlotMachineEnhancedService:
    @staticmethod
    def get_remaining_spins(user_id: str) -> int:
        """Get the number of remaining spins for a user"""
        # Get from Redis if exists
        current_date = datetime.now().strftime("%Y-%m-%d")
        key = f"user:{user_id}:spins:{current_date}"
        
        spins_used = redis_client.get(key)
        if spins_used is None:
            # Reset daily spins
            redis_client.set(key, "0", ex=86400)  # Expires in 24 hours
            return MAX_DAILY_SPINS
        
        return MAX_DAILY_SPINS - int(spins_used)

    @staticmethod
    def increment_spins_used(user_id: str) -> int:
        """Increment the number of spins used by a user today and return remaining"""
        current_date = datetime.now().strftime("%Y-%m-%d")
        key = f"user:{user_id}:spins:{current_date}"
        
        # Increment spins used
        spins_used = redis_client.incr(key)
        
        # Ensure key has expiry
        redis_client.expire(key, 86400)  # 24 hours
        
        return MAX_DAILY_SPINS - int(spins_used)

    @staticmethod
    def get_streak_count(user_id: str) -> int:
        """Get the current losing streak for a user"""
        key = f"user:{user_id}:streak_count"
        streak = redis_client.get(key)
        return int(streak or 0)

    @staticmethod
    def update_streak_count(user_id: str, is_win: bool) -> int:
        """Update the streak count based on win/loss"""
        key = f"user:{user_id}:streak_count"
        
        if is_win:
            # Reset streak on win
            redis_client.set(key, "1", ex=86400)  # Expires in 24 hours
            return 1
        else:
            # Increment streak on loss
            streak = redis_client.incr(key)
            redis_client.expire(key, 86400)  # Ensure expiry
            return int(streak)

    @staticmethod
    def calculate_win_probability(streak: int, vip_mode: bool) -> float:
        """Calculate win probability based on streak and VIP status"""
        base_probability = 0.15  # 15% base win rate
        
        # VIP bonus
        if vip_mode:
            base_probability += 0.05  # +5% for VIP
        
        # Streak bonus
        if streak >= 10:
            base_probability += 0.25  # +25% after 10 consecutive losses
        elif streak >= 5:
            base_probability += 0.10  # +10% after 5 consecutive losses
        elif streak >= 3:
            base_probability += 0.05  # +5% after 3 consecutive losses
            
        return min(base_probability, 0.50)  # Cap at 50%

    @staticmethod
    def generate_symbol() -> int:
        """Generate a random symbol based on weights"""
        # Create weighted selection pool
        items = []
        for symbol, weight in SYMBOL_WEIGHTS.items():
            items.extend([symbol] * weight)
        
        return random.choice(items)

    @staticmethod
    def generate_reel() -> List[int]:
        """Generate a single reel (column) of symbols"""
        return [SlotMachineEnhancedService.generate_symbol() for _ in range(3)]

    @staticmethod
    def check_win_lines(result: List[List[int]]) -> Tuple[List[int], int]:
        """Check which lines won and calculate the multiplier"""
        win_lines = []
        total_multiplier = 0
        
        # Check horizontal rows
        for row_idx in range(3):
            row = [result[col][row_idx] for col in range(3)]
            if row[0] == row[1] == row[2]:
                win_lines.append(row_idx + 1)  # Lines are 1-indexed
                total_multiplier += WIN_MULTIPLIERS.get(row[0], 0)
        
        return win_lines, total_multiplier

    @staticmethod
    def spin(user_id: str, bet_amount: int, lines: int, vip_mode: bool) -> Dict[str, Any]:
        """Execute a slot machine spin"""
        # Check remaining spins
        remaining_spins = SlotMachineEnhancedService.get_remaining_spins(user_id)
        if remaining_spins <= 0:
            raise ValueError("Daily spin limit reached")
        
        # Validate bet amount
        if not (5000 <= bet_amount <= 10000):
            raise ValueError("Bet amount must be between 5,000 and 10,000 coins")
            
        # Get current streak and calculate win probability
        streak = SlotMachineEnhancedService.get_streak_count(user_id)
        win_probability = SlotMachineEnhancedService.calculate_win_probability(streak, vip_mode)
        
        print(f"User {user_id} - Streak: {streak}, Win probability: {win_probability}")
        
        # Generate result matrix [column][row]
        result = []
        
        # Decide if this spin is a win
        is_rigged_win = random.random() < win_probability
        
        if is_rigged_win:
            # Choose a random row to make a winning line
            win_row = random.randint(0, 2)
            
            # Choose a symbol for the winning line (weighted, but avoid jackpot most of the time)
            symbol_choices = list(WIN_MULTIPLIERS.keys())
            symbol_weights = [1 if s == 1 else 20 for s in symbol_choices]  # Make jackpot rare
            winning_symbol = random.choices(symbol_choices, weights=symbol_weights)[0]
            
            # Generate the three columns
            for col in range(3):
                column = []
                for row in range(3):
                    if row == win_row:
                        column.append(winning_symbol)  # Place winning symbol
                    else:
                        column.append(SlotMachineEnhancedService.generate_symbol())  # Random symbols
                result.append(column)
        else:
            # Generate completely random result (with losing combinations)
            result = [SlotMachineEnhancedService.generate_reel() for _ in range(3)]
            
            # Ensure it's a loss by checking and fixing any accidental winning lines
            while True:
                win_lines, _ = SlotMachineEnhancedService.check_win_lines(result)
                if not win_lines:
                    break
                    
                # Fix any accidental winning lines
                for line_idx in win_lines:
                    # Break the line by changing the middle symbol
                    row_idx = line_idx - 1
                    original = result[1][row_idx]
                    while result[1][row_idx] == original:
                        result[1][row_idx] = SlotMachineEnhancedService.generate_symbol()
        
        # Check win lines
        win_lines, multiplier = SlotMachineEnhancedService.check_win_lines(result)
        is_win = len(win_lines) > 0
        
        # Calculate win amount
        win_amount = bet_amount * multiplier if is_win else 0
        
        # Update streak
        streak = SlotMachineEnhancedService.update_streak_count(user_id, is_win)
        
        # Decrement remaining spins
        remaining_spins = SlotMachineEnhancedService.increment_spins_used(user_id)
        
        # Generate spin ID
        spin_id = f"spin_{uuid.uuid4().hex[:6]}"
        
        # Handle special events (rare random events)
        special_event = None
        if not is_win and random.random() < 0.05:  # 5% chance
            special_event = "near_miss"
            
        # Log the spin result to Redis for analytics
        spin_data = {
            "user_id": user_id,
            "bet_amount": bet_amount,
            "win_amount": win_amount,
            "is_win": is_win,
            "timestamp": datetime.now().isoformat(),
            "vip_mode": vip_mode
        }
        
        try:
            redis_client.set(f"spin:{spin_id}", json.dumps(spin_data), ex=86400*7)  # Keep for 7 days
        except Exception as e:
            print(f"Error storing spin data: {e}")
            
        return {
            "spin_id": spin_id,
            "result": result,
            "win_lines": win_lines,
            "win_amount": win_amount,
            "multiplier": multiplier,
            "remaining_spins": remaining_spins,
            "streak_count": streak,
            "special_event": special_event
        }
