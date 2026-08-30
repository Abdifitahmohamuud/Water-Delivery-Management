import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export const useSettings = () => {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data } = await api.get("/settings");
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    SAR: "SR",
  };

  const getCurrencySymbol = () => {
    return currencySymbols[settings?.currency] || "$";
  };

  const formatPrice = (amount) => {
    const symbol = getCurrencySymbol();
    const parsedAmount = parseFloat(amount || 0);
    return `${symbol}${parsedAmount.toFixed(2)}`;
  };

  return {
    settings,
    isLoading,
    error,
    getCurrencySymbol,
    formatPrice,
    storeName: settings?.name || "AgriConnect Market",
  };
};
