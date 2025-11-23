import { ThemeProvider } from "next-themes";
import { FC, ReactNode } from "react";

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
      {children}
    </ThemeProvider>
  );
};

export default Provider;
