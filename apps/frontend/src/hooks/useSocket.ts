import { useEffect, useState } from "react";
import { WS_URL } from "../constants";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket(WS_URL);

    newSocket.onerror = (error) => console.log(error);

    newSocket.onopen = () => {
      setSocket(newSocket);
      console.log("WS connection opened");
    };

    newSocket.onclose = () => {
      console.log("WS connection closed");
      setSocket(null);
      // try {
      //   const newSocket = new WebSocket(WS_URL);
      //   setSocket(newSocket);
      // } catch (error) {
      //   console.log(error);
      // }
    };

    return () => newSocket.close();
  }, []);

  return socket;
};
