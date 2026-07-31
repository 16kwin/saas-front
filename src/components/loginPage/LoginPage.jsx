// components/loginPage/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import LOGO from '../../assets/LOGO.svg';
import LOGIN_IMAGE from '../../assets/Login.svg';
import EyeIconSvg from '../../assets/Eye.svg';
import EyeOffIconSvg from '../../assets/EyeOff.svg';
import EyeRedIconSvg from '../../assets/EyeRed.svg';
import EyeOffRedIconSvg from '../../assets/EyeOffRed.svg';

const LoginPage = () => {
  const { setIsAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'zadel' && password === 'awmspartners') {
      setIsAuth(true);
      setError('');
      localStorage.setItem('app_login_event', Date.now().toString());
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const isButtonActive = username.length > 0 && password.length > 0;

  const getBorderColor = (field) => {
    if (error) return '#FF3052';
    if (field === 'username' && username) return '#666EFE';
    if (field === 'password' && password) return '#666EFE';
    return 'rgba(45, 64, 89, 0.5)';
  };

  const getLegendColor = (field) => {
    if (error) return '#FF3052';
    if (field === 'username' && username) return '#666EFE';
    if (field === 'password' && password) return '#666EFE';
    return 'rgba(45, 64, 89, 0.5)';
  };

  const getEyeIcon = () => {
    if (error) return showPassword ? EyeRedIconSvg : EyeOffRedIconSvg;
    return showPassword ? EyeIconSvg : EyeOffIconSvg;
  };

  return (
    <div className="w-full h-dvh flex items-center justify-center">
      <div style={{ width: '1250px', height: '800px', backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '625px', height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', position: 'relative' }}>
          <img src={LOGO} alt="AWMS" draggable={false} style={{ width: '63px', height: '57px', pointerEvents: 'none', userSelect: 'none' }} />
          <div style={{ height: '25px', display: 'flex', alignItems: 'center', marginTop: '7px' }}>
            <h1 style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '3.15px', fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0 }}>ЭМУЛЯТОР</h1>
          </div>
          <div style={{ width: '211px', height: '2px', marginTop: '7px', background: 'linear-gradient(to right, rgba(45,64,89,0) 0%, #2D4059 50%, rgba(45,64,89,0) 100%)' }} />
          <div style={{ height: '21px', display: 'flex', alignItems: 'center', marginTop: '7px' }}>
            <p style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '0.17px', fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0 }}>СИСТЕМА БРОКЕРСКИХ ОПЕРАЦИЙ</p>
          </div>
          <div style={{ marginTop: '75px', width: '100%', paddingLeft: '113px' }}>
            <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
              <h2 style={{ fontSize: '29px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0 }}>Авторизация</h2>
            </div>
            <div style={{ height: '24px', display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0.16px', fontFamily: 'Inter, sans-serif', color: '#2D4059', margin: 0, opacity: 0.5 }}>Войдите в учетную запись для продолжения работы</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ marginTop: '36px', width: '399px' }}>
            <div style={{ marginBottom: '30px', position: 'relative' }}>
              <fieldset style={{ width: '399px', height: '59px', borderColor: getBorderColor('username'), borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid', padding: 0, display: 'flex', alignItems: 'center', margin: 0, position: 'relative', boxSizing: 'border-box' }}>
                <legend style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', width: '48px', height: '21px', lineHeight: '21px', color: getLegendColor('username'), padding: '0 4px', marginLeft: '12px', position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)', backgroundColor: '#FFFFFF' }}>Логин</legend>
                <input
                  style={{ fontSize: '17px', fontWeight: 400, fontFamily: 'Inter, sans-serif', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#2D4059', paddingLeft: '16px', paddingRight: '16px', width: '100%', height: '100%', borderRadius: '8px' }}
                  name="username"
                  autoComplete="username"
                  placeholder="Введите логин"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                />
              </fieldset>
            </div>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <fieldset style={{ width: '399px', height: '59px', borderColor: getBorderColor('password'), borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid', padding: 0, display: 'flex', alignItems: 'center', margin: 0, position: 'relative', boxSizing: 'border-box' }}>
                <legend style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', width: '57px', height: '21px', lineHeight: '21px', color: getLegendColor('password'), padding: '0 4px', marginLeft: '12px', position: 'absolute', top: 0, left: 0, transform: 'translateY(-50%)', backgroundColor: '#FFFFFF' }}>Пароль</legend>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                  <input
                    style={{ fontSize: '17px', fontWeight: 400, fontFamily: 'Inter, sans-serif', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#2D4059', paddingLeft: '16px', paddingRight: '8px', flex: 1, height: '100%', borderRadius: '8px' }}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Введите пароль"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '16px' }}>
                    <img src={getEyeIcon()} alt="" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
              </fieldset>
            </div>
            <div style={{ height: '18px', marginBottom: '47px' }} />
            <button type="submit" disabled={!isButtonActive}
              style={{ width: '399px', height: '59px', borderRadius: '10px', border: 'none', backgroundColor: '#666EFE', opacity: isButtonActive ? 1 : 0.5, cursor: isButtonActive ? 'pointer' : 'not-allowed', fontSize: '17px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
              Войти
            </button>
            {error && <p style={{ fontSize: '15px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#FF3052', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
          </form>
        </div>
        <div style={{ width: '625px', height: '800px', overflow: 'hidden' }}>
          <img src={LOGIN_IMAGE} alt="Login" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;