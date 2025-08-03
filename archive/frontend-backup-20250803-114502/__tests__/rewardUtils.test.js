import { calculateReward, spinGachaClient, GACHA_ITEMS_CLIENT } from '@/utils/rewardUtils';

describe('rewardUtils', () => {
  describe('calculateReward', () => {
    let mathRandomSpy;

    beforeEach(() => {
      // Mock Math.random before each test in this suite
      mathRandomSpy = jest.spyOn(global.Math, 'random');
    });

    afterEach(() => {
      // Restore Math.random after each test
      mathRandomSpy.mockRestore();
    });

    test('should return true if Math.random result is less than probability (streak 0)', () => {
      // Probability for streak 0 = min(0.10 + 0 * 0.01, 0.40) = 0.10
      mathRandomSpy.mockReturnValue(0.05); // 0.05 < 0.10
      expect(calculateReward(0)).toBe(true);
    });

    test('should return false if Math.random result is greater than or equal to probability (streak 0)', () => {
      // Probability for streak 0 = 0.10
      mathRandomSpy.mockReturnValue(0.15); // 0.15 >= 0.10
      expect(calculateReward(0)).toBe(false);
      mathRandomSpy.mockReturnValue(0.10); // Test edge case: 0.10 is not < 0.10
      expect(calculateReward(0)).toBe(false);
    });

    test('should return false for high streak if Math.random result is high (max probability is 0.40)', () => {
      // Probability for streak 100 = min(0.10 + 100 * 0.01, 0.40) = min(1.10, 0.40) = 0.40
      mathRandomSpy.mockReturnValue(0.99); // 0.99 is not < 0.40
      expect(calculateReward(100)).toBe(false);
    });

    test('should return true for high streak if Math.random result is low (max probability is 0.40)', () => {
      // Probability for streak 100 = 0.40
      mathRandomSpy.mockReturnValue(0.39); // 0.39 < 0.40
      expect(calculateReward(100)).toBe(true);
    });

    test('should return true for medium streak (25) if Math.random is just below calculated probability (0.35)', () => {
      // Probability for streak 25 = min(0.10 + 25 * 0.01, 0.40) = min(0.35, 0.40) = 0.35
      mathRandomSpy.mockReturnValue(0.349);
      expect(calculateReward(25)).toBe(true);
    });

    test('should return false for medium streak (25) if Math.random is at or above calculated probability (0.35)', () => {
      // Probability for streak 25 = 0.35
      mathRandomSpy.mockReturnValue(0.35);
      expect(calculateReward(25)).toBe(false);
      mathRandomSpy.mockReturnValue(0.36);
      expect(calculateReward(25)).toBe(false);
    });

    test('should cap probability at 0.40 for very high streaks', () => {
        // Probability for streak 50 = min(0.10 + 50 * 0.01, 0.40) = min(0.60, 0.40) = 0.40
        mathRandomSpy.mockReturnValue(0.39); // Should be true
        expect(calculateReward(50)).toBe(true);
        mathRandomSpy.mockReturnValue(0.40); // Should be false (0.40 is not < 0.40)
        expect(calculateReward(50)).toBe(false);
    });
  });

  describe('spinGachaClient', () => {
    let mathRandomSpy;

    beforeEach(() => {
      mathRandomSpy = jest.spyOn(global.Math, 'random');
    });

    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    // Use the imported GACHA_ITEMS_CLIENT for calculating totalWeight and item properties
    const totalWeight = GACHA_ITEMS_CLIENT.reduce((sum, item) => sum + item.weight, 0);

    test('should return a COIN item based on mocked Math.random (first item)', async () => {
      // To get the first item (COIN, weight 60 in updated GACHA_ITEMS_CLIENT from subtask 14), Math.random() * totalWeight < 60
      // So Math.random() < 60 / totalWeight. (totalWeight = 100 from example)
      mathRandomSpy.mockReturnValue(0.1 / totalWeight); // A very small random number to ensure it falls in the first item
      const result = await spinGachaClient(1); // Pass dummy userId
      expect(result.type).toBe('COIN');
      expect(result.amount).toBeGreaterThanOrEqual(GACHA_ITEMS_CLIENT[0].details.value_range[0]);
      expect(result.amount).toBeLessThanOrEqual(GACHA_ITEMS_CLIENT[0].details.value_range[1]);
    });

    test('should return CONTENT_UNLOCK stage 1 (second item type, first stage)', async () => {
      // COIN weight 60. CONTENT_UNLOCK stage 1 weight 15. Total 100.
      // To get Stage 1: randomWeight should be between 60 and 60+15 = 75
      // So, Math.random() * totalWeight should be in [60, 75)
      // Math.random() should be in [60/totalWeight, 75/totalWeight)
      mathRandomSpy.mockReturnValue(65 / totalWeight);
      const result = await spinGachaClient(1);
      expect(result.type).toBe('CONTENT_UNLOCK');
      expect(result.stage).toBe(1);
    });

    test('should return a BADGE item (last item type in example)', async () => {
      // COIN (60), S1 (15), S2 (10), S3 (5). Sum of preceding = 60+15+10+5 = 90.
      // BADGE (weight 10) is after these.
      // Math.random() * totalWeight >= 90 and < 100
      // Math.random() >= 90 / totalWeight
      mathRandomSpy.mockReturnValue(95 / totalWeight);
      const result = await spinGachaClient(1);
      expect(result.type).toBe('BADGE');
      // Assuming GACHA_ITEMS_CLIENT has badge_name: "EPIC_PULL" as the last entry for BADGE type
      const badgeItem = GACHA_ITEMS_CLIENT.find(item => item.type === "BADGE" && item.details.badge_name === "EPIC_PULL");
      expect(result.badge_name).toBe(badgeItem.details.badge_name);
    });

    test('make_item for COIN should generate amount within range', () => {
        const coinTemplate = GACHA_ITEMS_CLIENT.find(item => item.type === "COIN");
        // Test multiple times due to Math.random inside make_item too
        for (let i = 0; i < 10; i++) {
            const item = coinTemplate.make_item(coinTemplate);
            expect(item.type).toBe("COIN");
            expect(item.amount).toBeGreaterThanOrEqual(coinTemplate.details.value_range[0]);
            expect(item.amount).toBeLessThanOrEqual(coinTemplate.details.value_range[1]);
        }
    });
  });
});
