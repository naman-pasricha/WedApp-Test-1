// Games & Challenges Types
export type ChallengeType =
  | 'photo_scavenger'  // Take photos of specific things
  | 'trivia'           // Multiple choice questions about the couple
  | 'prediction'       // Predict outcomes (first dance song, etc.)
  | 'caption_contest'; // Write captions for photos

export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'hidden';

export interface Challenge {
  id: string;
  wedding_id: string;
  type: ChallengeType;
  title: string;
  description: string;
  instructions: string;
  points: number;
  starts_at: string;
  ends_at: string;
  status: ChallengeStatus;
  display_order: number;
  config: ChallengeConfig;
  created_at: string;
  updated_at: string;
}

export interface ChallengeConfig {
  // Photo scavenger hunt
  photo_targets?: string[]; // List of things to photograph

  // Trivia
  questions?: TriviaQuestion[];

  // Prediction
  prediction_options?: string[];
  correct_answer?: string;

  // Caption contest
  photo_url?: string;
  voting_enabled?: boolean;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number; // Index of correct option
  points: number;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  guest_id: string;
  guest_name: string;
  answers: ChallengeAnswer[];
  score: number;
  completed_at: string | null;
  created_at: string;
}

export type ChallengeAnswer =
  | { type: 'photo'; photo_url: string; target_index: number }
  | { type: 'trivia'; question_id: string; selected_option: number; correct: boolean; points: number }
  | { type: 'prediction'; selected_option: string }
  | { type: 'caption'; caption: string; votes: number };

export interface LeaderboardEntry {
  guest_id: string;
  guest_name: string;
  total_score: number;
  challenges_completed: number;
  rank: number;
  avatar_url?: string;
}

export interface GameSettings {
  wedding_id: string;
  enabled: boolean;
  auto_start: boolean;
  show_leaderboard: boolean;
  prizes?: Prize[];
}

export interface Prize {
  id: string;
  rank: number;
  name: string;
  description: string;
}