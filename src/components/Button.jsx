export default function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}) {
  const map = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };
  return (
    <button type={type} className={`${map[variant] || map.primary} ${className}`} {...rest}>
      {children}
    </button>
  );
}
