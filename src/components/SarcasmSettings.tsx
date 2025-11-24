import { updateUserProfileExtended } from '../lib/db/sasha';

export function SarcasmSettings({ userId, currentLevel, onUpdate }: { userId: string, currentLevel: string, onUpdate: (level: string) => void }) {

    const handleChange = async (level: string) => {
        await updateUserProfileExtended(userId, { sarcasm_preference: level } as any);
        onUpdate(level);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Sasha's Personality</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                    { val: 'off', label: 'Off', emoji: '😐' },
                    { val: 'low', label: 'Low', emoji: '🙂' },
                    { val: 'medium', label: 'Medium', emoji: '😏' },
                    { val: 'high', label: 'High', emoji: '😈' }
                ].map(opt => (
                    <button
                        key={opt.val}
                        onClick={() => handleChange(opt.val)}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${currentLevel === opt.val
                            ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm scale-105'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-sm font-bold">{opt.label}</span>
                    </button>
                ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 italic text-center">
                {currentLevel === 'off' && "Sasha: \"Fine. I'll be boring. Don't blame me when you're broke.\""}
                {currentLevel === 'low' && "Sasha: \"I'll be nice. But I'm still watching your wallet.\""}
                {currentLevel === 'medium' && "Sasha: \"The perfect balance of helpful and judgmental.\""}
                {currentLevel === 'high' && "Sasha: \"Prepare for emotional damage. You asked for this.\""}
            </p>
        </div>
    );
}
