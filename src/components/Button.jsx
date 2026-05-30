import { forwardRef } from "react";

const Button = forwardRef(function Button(
  { children, variant = "primary", type = "button", className = "", ...rest },
  ref
) {
  const map = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };
  return (
    <button
      ref={ref}
      type={type}
      className={`${map[variant] || map.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
