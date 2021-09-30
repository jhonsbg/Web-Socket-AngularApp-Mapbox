import { SocketIoConfig } from "ngx-socket-io";

const config: SocketIoConfig = { url: 'https://web-socket-server-mapbox.herokuapp.com/', options: {} };

export const environment = {
  production: true,
  socketConfig: config
};
