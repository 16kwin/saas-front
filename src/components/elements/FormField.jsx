// src/components/elements/FormField.jsx
import React from 'react';

const labelStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: '#2D4059',
  display: 'block',
  marginBottom: 4,
};

const FormField = ({
  width,
  height,
  label,
  icon,
  iconActive,
  value,
  placeholder,
  active,
  locked,
  type,
  onChange,
  onClear,
  onClick,
  inputType = 'text',
  rightIcon,
  rightIconActive,
  onRightIconClick,
  selectIconWidth = 14.5,
  selectIconHeight = 18,
}) => {
  const isActive = active ?? (value.length > 0);
  const rightIconSrc = isActive && rightIconActive ? rightIconActive : rightIcon;

  const fieldStyle = {
    width,
    height,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    backgroundColor: locked ? '#F5F6FA' : '#FFFFFF',
    position: 'relative',
    boxSizing: 'border-box',
    border: locked
      ? '1px solid rgba(102, 110, 254, 0.5)'
      : isActive
      ? '1px solid #666EFE'
      : '1px solid rgba(102, 110, 254, 0.15)',
    cursor: locked ? 'not-allowed' : type === 'select' ? 'pointer' : 'default',
    opacity: locked ? 1 : undefined,
  };

  const iconSrc = isActive && iconActive ? iconActive : icon;
  const textColor = locked ? '#666EFE' : isActive ? '#666EFE' : '#A0A3BD';

  const renderContent = () => {
    switch (type) {
      case 'display':
        return (
          <span style={{ marginLeft: iconSrc ? 44 : 0, color: textColor, opacity: value ? 1 : 0.5 }}>
            {value || '—'}
          </span>
        );

      case 'input':
        return (
          <>
            {iconSrc && (
              <img src={iconSrc} alt="" style={{ width: 16, height: 16, position: 'absolute', left: 14 }} />
            )}
            <input
              type={inputType}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                marginLeft: iconSrc ? 30 : 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: textColor,
                backgroundColor: 'transparent',
              }}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={locked}
            />
            {isActive && onClear && !locked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                style={{
                  position: 'absolute',
                  right: 13,
                  width: 18,
                  height: 18,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" fill="#666EFE" fillOpacity="0.15" />
                  <path d="M6 6L12 12M12 6L6 12" stroke="#666EFE" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </>
        );

      case 'select':
        return (
          <>
            {iconSrc && (
              <img src={iconSrc} alt="" style={{ width: selectIconWidth, height: selectIconHeight, position: 'absolute', left: 15 }} />
            )}
            <span
              style={{
                marginLeft: iconSrc ? 30 : 0,
                color: textColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {value || placeholder || 'Выберите'}
            </span>
            {rightIconSrc ? (
              <img
                src={rightIconSrc}
                alt=""
                style={{ width: 18, height: 18, flexShrink: 0, cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRightIconClick?.(e);
                }}
              />
            ) : (
              <svg
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                style={{ flexShrink: 0, marginLeft: 8 }}
              >
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke={isActive ? '#666EFE' : '#A0A3BD'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </>
        );
    }
  };

  return (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <div
        style={fieldStyle}
        onClick={type === 'select' && !locked ? onClick : undefined}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default FormField;