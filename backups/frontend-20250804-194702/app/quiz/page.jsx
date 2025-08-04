'use client';

// Placeholder QuizForm component
function QuizForm() {
  return (
    <div className="flex items-center justify-center h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
      <div className="text-center">
        <div className="text-6xl mb-4">❓</div>
        <p className="text-lg text-gray-300">퀴즈 게임 (개발중)</p>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Quiz</h1>
        <QuizForm />
      </div>
    </div>
  );
}
