import { ThemeProvider } from "next-themes";
import { FC, ReactNode } from "react";
import { SearchProvider } from "@/components/landing/SearchProvider";

interface IProviderProps {
  children: ReactNode;
}

const Provider: FC<IProviderProps> = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SearchProvider>{children}</SearchProvider>
    </ThemeProvider>
  );
};

export default Provider;
