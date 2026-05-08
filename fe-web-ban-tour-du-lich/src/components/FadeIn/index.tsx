import React, { useRef, useEffect, useState } from "react";

const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: nếu không có IntersectionObserver, show luôn
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          // chỉ bỏ observe cho target này (an toàn nếu có nhiều target)
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
};

export default FadeIn;