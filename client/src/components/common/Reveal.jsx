export default function Reveal({ children, delay = 0, className = '' }) {
  return (
    <div className={`reveal-fade ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
