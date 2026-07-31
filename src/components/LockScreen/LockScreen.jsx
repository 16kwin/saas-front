// components/LockScreen/LockScreen.jsx
import { useState } from 'react';
import { useAuth } from '../../services/AuthContext';

const LockScreen = ({ onUnlock }) => {
  const { userInfo } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError(true);
      return;
    }
    onUnlock();
  };

  return (
    <div className="flex items-center justify-center h-full bg-[#FAFBFC]">
      <div className="text-center">
        <div className="text-lg font-semibold text-[#2D4059] mb-4">
          {userInfo?.firstName || 'Пользователь'}, введите пароль
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          placeholder="Пароль"
          className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-center outline-none focus:border-[#666EFE]"
          autoFocus
        />
        {error && (
          <div className="text-red-500 text-sm mt-2">Неверный пароль</div>
        )}
      </div>
    </div>
  );
};

export default LockScreen;