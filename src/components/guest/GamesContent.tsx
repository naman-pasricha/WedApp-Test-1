'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useGuestSession } from '@/lib/guest-session/hooks';
import { Trophy, Target, HelpCircle, Clock, Camera, MessageSquare, Crown, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { Challenge, ChallengeParticipation, LeaderboardEntry } from '@/lib/games/types';

interface GamesContentProps {
  weddingSlug: string;
}

export function GamesContent({ weddingSlug }: GamesContentProps) {
  const { guest, loading: sessionLoading } = useGuestSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!guest) return;
    fetchData();
  }, [guest, weddingSlug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (guest?.sessionToken) {
        headers['x-guest-session'] = guest.sessionToken;
      }

      const response = await fetch(`/api/weddings/${weddingSlug}/games`, { headers });
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || []);
        setParticipations(data.participations || []);
      }

      // Fetch overall leaderboard
      const lbResponse = await fetch(`/api/weddings/${weddingSlug}/games/leaderboard`, { headers });
      if (lbResponse.ok) {
        const lbData = await lbResponse.json();
        setLeaderboard(lbData.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParticipation = (challengeId: string) =>
    participations.find(p => p.challenge_id === challengeId);

  const isChallengeActive = (challenge: Challenge) => {
    const now = new Date();
    const starts = new Date(challenge.starts_at);
    const ends = new Date(challenge.ends_at);
    return now >= starts && now <= ends && challenge.status === 'active';
  };

  const isChallengeUpcoming = (challenge: Challenge) => {
    const now = new Date();
    const starts = new Date(challenge.starts_at);
    return now < starts;
  };

  const isChallengeCompleted = (challenge: Challenge) => {
    const now = new Date();
    const ends = new Date(challenge.ends_at);
    return now > ends || challenge.status === 'completed';
  };

  const getChallengeStatus = (challenge: Challenge) => {
    if (isChallengeUpcoming(challenge)) return 'upcoming';
    if (isChallengeActive(challenge)) return 'active';
    return 'completed';
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (challenge: Challenge) => {
    if (!guest) return;

    const formattedAnswers = Object.entries(answers).map(([questionId, selected_option]) => ({
      question_id: questionId,
      selected_option,
    }));

    try {
      const response = await fetch(`/api/weddings/${weddingSlug}/games/${challenge.id}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-session': guest.sessionToken!,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (response.ok) {
        const data = await response.json();
        setParticipations(prev => {
          const existing = prev.find(p => p.challenge_id === challenge.id);
          if (existing) {
            return prev.map(p => p.challenge_id === challenge.id ? data.participation : p);
          }
          return [...prev, data.participation];
        });
        setShowModal(false);
        setAnswers({});
        fetchData();
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const handlePhotoSubmit = async (challenge: Challenge, photoUrl: string, targetIndex: number) => {
    if (!guest) return;

    try {
      const response = await fetch(`/api/weddings/${weddingSlug}/games/${challenge.id}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-session': guest.sessionToken!,
        },
        body: JSON.stringify({
          answers: [{ type: 'photo', photo_url: photoUrl, target_index: targetIndex }]
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to submit photo:', error);
    }
  };

  const openChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowModal(true);
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading games...</p>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Trophy className="w-16 h-16 text-[var(--color-muted-foreground)]/50 mb-4" />
        <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Join to Play</h2>
        <p className="text-[var(--color-muted-foreground)]">Sign in to participate in wedding games and challenges</p>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => getChallengeStatus(c) === 'active');
  const upcomingChallenges = challenges.filter(c => getChallengeStatus(c) === 'upcoming');
  const completedChallenges = challenges.filter(c => getChallengeStatus(c) === 'completed');

  const guestRank = leaderboard.find(l => l.guest_id === guest.guestId);

  return (
    <div className="flex flex-col h-full pb-20">
      <header className="px-4 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Games & Challenges</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Complete challenges, earn points, climb the leaderboard!
            </p>
          </div>
          {guestRank && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium">
              <Crown className="w-4 h-4" />
              Rank #{guestRank.rank} · {guestRank.total_score} pts
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('challenges')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
              activeTab === 'challenges'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            )}
          >
            Challenges {activeChallenges.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--color-primary)] text-white rounded-full">
                {activeChallenges.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
              activeTab === 'leaderboard'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            )}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--color-primary)]" />
                  Active Now
                </h2>
                <div className="space-y-3">
                  {activeChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      participation={getParticipation(challenge.id)}
                      onClick={() => openChallenge(challenge)}
                      guest={guest}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Challenges */}
            {upcomingChallenges.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                  Coming Soon
                </h2>
                <div className="space-y-3">
                  {upcomingChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      participation={getParticipation(challenge.id)}
                      disabled
                      guest={guest}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Challenges */}
            {completedChallenges.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[var(--color-primary)]" />
                  Completed
                </h2>
                <div className="space-y-3">
                  {completedChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      participation={getParticipation(challenge.id)}
                      disabled
                      guest={guest}
                    />
                  ))}
                </div>
              </section>
            )}

            {challenges.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Trophy className="w-16 h-16 text-[var(--color-muted-foreground)]/50 mb-4" />
                <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">No Games Yet</h3>
                <p className="text-[var(--color-muted-foreground)]">
                  The hosts haven't set up any challenges yet. Check back later!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="font-semibold text-[var(--color-foreground)] mb-4">Overall Leaderboard</h3>
              {leaderboard.length === 0 ? (
                <p className="text-[var(--color-muted-foreground)] text-center py-8">
                  No scores yet. Be the first to complete a challenge!
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 20).map((entry, index) => (
                    <LeaderboardRow
                      key={entry.guest_id}
                      entry={entry}
                      rank={index + 1}
                      isCurrentUser={entry.guest_id === guest.guestId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Challenge Modal */}
      {showModal && selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          participation={getParticipation(selectedChallenge.id)}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onSubmit={() => handleSubmit(selectedChallenge)}
          onPhotoSubmit={(photoUrl, targetIndex) => handlePhotoSubmit(selectedChallenge, photoUrl, targetIndex)}
          onClose={() => { setShowModal(false); setAnswers({}); }}
          guest={guest}
        />
      )}
    </div>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  participation?: ChallengeParticipation;
  onClick?: () => void;
  disabled?: boolean;
  guest: any;
}

function ChallengeCard({ challenge, participation, onClick, disabled, guest }: ChallengeCardProps) {
  const status = challenge.status === 'active' ? 'active' :
    new Date(challenge.starts_at) > new Date() ? 'upcoming' : 'completed';

  const isCompleted = participation?.completed_at !== null && participation?.completed_at !== undefined;

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo_scavenger': return <Camera className="w-5 h-5" />;
      case 'trivia': return <HelpCircle className="w-5 h-5" />;
      case 'prediction': return <Target className="w-5 h-5" />;
      case 'caption_contest': return <MessageSquare className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getStatusBadge = () => {
    if (status === 'upcoming') return (
      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
        Starts {new Date(challenge.starts_at).toLocaleDateString()}
      </span>
    );
    if (status === 'active') return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
        Active · Ends {new Date(challenge.ends_at).toLocaleDateString()}
      </span>
    );
    return (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
        Completed
      </span>
    );
  };

  return (
    <div
      className={clsx(
        'bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 transition-colors',
        onClick && !disabled ? 'hover:border-[var(--color-primary)] cursor-pointer' : 'opacity-60'
      )}
      onClick={onClick && !disabled ? onClick : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          {getIcon(challenge.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[var(--color-foreground)] truncate">{challenge.title}</h3>
            <span className="text-sm font-bold text-[var(--color-primary)]">{challenge.points} pts</span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 line-clamp-2">{challenge.description}</p>
          <div className="mt-2 flex items-center gap-2">
            {getStatusBadge()}
            {isCompleted && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {participation?.score || 0} pts earned
              </span>
            )}
          </div>
        </div>
        {onClick && !disabled && (
          <ArrowRight className="w-5 h-5 text-[var(--color-muted-foreground)] flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
  const getMedal = (rank: number) => {
    if (rank === 1) return <span className="text-yellow-500">🥇</span>;
    if (rank === 2) return <span className="text-gray-400">🥈</span>;
    if (rank === 3) return <span className="text-amber-700">🥉</span>;
    return <span className="font-medium text-[var(--color-muted-foreground)]">#{rank}</span>;
  };

  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      isCurrentUser ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20' : 'hover:bg-[var(--color-muted)]/30'
    )}>
      <div className="w-10 text-center">{getMedal(rank)}</div>
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-medium text-sm">
          {entry.guest_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className={clsx('font-medium truncate', isCurrentUser ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]')}>
            {entry.guest_name} {isCurrentUser && <span className="ml-2 text-xs text-[var(--color-primary)]">(You)</span>}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {entry.challenges_completed} challenge{entry.challenges_completed !== 1 ? 's' : ''} completed
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-[var(--color-primary)]">{entry.total_score}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">points</p>
      </div>
    </div>
  );
}

interface ChallengeModalProps {
  challenge: Challenge;
  participation?: ChallengeParticipation;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  onSubmit: () => void;
  onPhotoSubmit: (photoUrl: string, targetIndex: number) => void;
  onClose: () => void;
  guest: any;
}

function ChallengeModal({ challenge, participation, answers, onAnswerChange, onSubmit, onPhotoSubmit, onClose, guest }: ChallengeModalProps) {
  const [photoPreviews, setPhotoPreviews] = useState<Record<number, string>>({});

  if (!challenge) return null;

  const isCompleted = !!participation?.completed_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[var(--color-background)] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-background)]">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{challenge.title}</h2>
          <button onClick={onClose} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-[var(--color-muted-foreground)]">{challenge.instructions}</p>

          {challenge.type === 'trivia' && challenge.config.questions && (
            <div className="space-y-4">
              {challenge.config.questions.map((question: any) => (
                <div key={question.id} className="space-y-2">
                  <p className="font-medium text-[var(--color-foreground)]">{question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => !isCompleted && onAnswerChange(question.id, index)}
                        disabled={isCompleted}
                        className={clsx(
                          'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                          answers[question.id] === index
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {challenge.type === 'prediction' && challenge.config.prediction_options && (
            <div className="space-y-2">
              {challenge.config.prediction_options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => !isCompleted && onAnswerChange('prediction', option)}
                  disabled={isCompleted}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                    answers.prediction === option
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {challenge.type === 'photo_scavenger' && challenge.config.photo_targets && (
            <div className="space-y-4">
              {challenge.config.photo_targets.map((target: string, index: number) => {
                const existingPhoto = participation?.answers?.find((a: any): a is { type: 'photo'; photo_url: string; target_index: number } => a.type === 'photo' && a.target_index === index);
                const preview = photoPreviews[index] || existingPhoto?.photo_url;

                return (
                  <div key={index} className="space-y-2">
                    <p className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
                      {preview ? (
                        <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-muted-foreground)]">
                          {index + 1}
                        </span>
                      )}
                      {target}
                    </p>
                    {preview && (
                      <img src={preview} alt={target} className="w-full h-48 object-cover rounded-lg" />
                    )}
                    {!preview && !isCompleted && (
                      <label className="w-full block">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setPhotoPreviews(prev => ({ ...prev, [index]: url }));
                              // Auto-submit photo
                              onPhotoSubmit(url, index);
                            }
                          }}
                        />
                        <button type="button" className="w-full px-4 py-3 rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2">
                          <Camera className="w-5 h-5" />
                          Take Photo
                        </button>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {challenge.type === 'caption_contest' && (
            <div>
              {challenge.config.photo_url && (
                <img src={challenge.config.photo_url} alt="Caption contest" className="w-full h-48 object-cover rounded-lg mb-3" />
              )}
              <textarea
                value={answers.caption || ''}
                onChange={(e) => onAnswerChange('caption', e.target.value)}
                disabled={isCompleted}
                placeholder="Write your caption here..."
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none"
                rows={4}
              />
            </div>
          )}

          {!isCompleted && (
            <button
              onClick={onSubmit}
              disabled={Object.keys(answers).length === 0}
              className="w-full py-3 px-4 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/90 transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          )}

          {isCompleted && (
            <div className="text-center py-4">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <p className="font-medium text-[var(--color-foreground)]">Completed!</p>
              <p className="text-[var(--color-muted-foreground)]">You earned {participation?.score || 0} points</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}