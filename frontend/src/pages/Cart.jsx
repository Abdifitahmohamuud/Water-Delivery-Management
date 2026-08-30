import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/checkout", { replace: true });
  }, [navigate]);

  return <div className="p-12 text-center text-slate-500">Redirecting to Water Order Checkout...</div>;
}