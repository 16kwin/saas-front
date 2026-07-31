import { useEffect, useRef, useState } from 'react';

interface IAutoResizeText {
  text: any;
  minFontSize: any;
  normalFontSize: any;
}

// Текст, который изменяет свой размер, если не помещается в одну строку
const AutoResizeText: React.FC<IAutoResizeText> = (props: IAutoResizeText) => {
  const { text, minFontSize, normalFontSize } = props;
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(normalFontSize);

  useEffect(() => {
    try {
      const element = textRef.current;
      if (!element) return;

      let currentFontSize = normalFontSize;

      const fitsInOneLine = () => (element as any).scrollWidth <= (element as any).clientWidth;

      const adjustFont = () => {
        while (!fitsInOneLine() && currentFontSize > minFontSize) {
          currentFontSize -= 1;
          (element as any).style.fontSize = currentFontSize + 'px';
        }
        setFontSize(currentFontSize);
      };

      setTimeout(adjustFont, 0);
    } catch (error: any) {
      console.log(error);
    }
  }, [text, normalFontSize, minFontSize]);

  return (
    <p
      ref={textRef}
      style={{
        textAlign: 'center',
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: `${fontSize} px`,
      }}>
      {text}
    </p>
  );
};

export default AutoResizeText;
