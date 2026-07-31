// components/AccountPage/AccountPage.jsx
import { useAuth } from '../../services/AuthContext';

const AccountPage = () => {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#2D4059] mb-8">Аккаунт</h1>
        <button
          onClick={logout}
          className="px-6 py-2 bg-[#666EFE] text-white rounded-lg font-medium hover:bg-[#5558E0] transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};

export default AccountPage;