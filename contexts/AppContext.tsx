import { ContextProviderProps, ContextProviderValue } from "@/types/context";
import { createContext, useEffect, useState } from "react";

import { Image } from "@/types/image";
import { User } from "@/types/user";
import { toast } from "sonner";

export const AppContext = createContext({} as ContextProviderValue);

export const AppContextProvider = ({ children }: ContextProviderProps) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [images, setImages] = useState<Image[] | null>(null);

  const fetchUserInfo = async function () {
    try {
      const uri = "/api/get-user-info";
      const params = {};

      const resp = await fetch(uri, {
        method: "POST",
        body: JSON.stringify(params),
      });

      if (resp.ok) {
        const res = await resp.json();
        if (res.data) {
          setUser(res.data);
          return;
        }
      }

      setUser(null);
    } catch (e) {
      setUser(null);

      console.log("get user info failed: ", e);
      toast.error("get user info failed");
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <AppContext.Provider value={{ user, fetchUserInfo, images, setImages }}>
      {children}
    </AppContext.Provider>
  );
};
