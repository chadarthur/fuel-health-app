export interface WhoopDailyMetrics {
  id: string;
  date: string;
  recoveryScore?: number;
  hrvRmssd?: number;
  restingHr?: number;
  strainScore?: number;
  sleepScore?: number;
  sleepHours?: number;
  caloriesBurned?: number;
}

export interface WhoopCorrelationData {
  date: string;
  recoveryScore?: number;
  strainScore?: number;
  sleepScore?: number;
  hrvRmssd?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
