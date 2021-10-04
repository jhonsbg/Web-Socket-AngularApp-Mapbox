import { SocketIoConfig } from "ngx-socket-io";

const config: SocketIoConfig = { url: 'https://web-socket-server-mapbox.herokuapp.com', options: {} };
// const config: SocketIoConfig = { url: 'http://localhost:5000', options: {} };

export const environment = {
  production: true,
  socketConfig: config
};
