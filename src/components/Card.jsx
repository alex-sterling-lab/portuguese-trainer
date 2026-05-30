export default function Card({ children, className = "", as: Tag = "div", ...rest }) {
  return (
    <Tag className={`card p-5 sm:p-6 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
