import {createContext,useContext,useEffect,useState,ReactNode,} from "react";
import { Session } from "../types/Session";
import {getSession,clearSession,} from "../storage/secureStore";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshSession = async () => {
    const storedSession =
      await getSession();
    setSession(storedSession);
  };

  useEffect(() => {

    const loadSession = async () => {
      await refreshSession();
      setLoading(false);
    };

    loadSession();

  }, []);

  const logout = async () => {
    await clearSession();
    setSession(null);
  };

  return (

    <AuthContext.Provider
      value={{
        session,
        loading,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  const context =
    useContext(AuthContext);

  if(!context){
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }
  return context;
}