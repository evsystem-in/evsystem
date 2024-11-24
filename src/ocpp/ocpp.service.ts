import { Injectable } from '@nestjs/common';
import { RPCServer, createRPCError } from 'ocpp-rpc';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class OcppService {
  private server: RPCServer;
  constructor(private readonly prisma: PrismaService) {
    this.server = new RPCServer({
      protocols: ['ocpp1.6'], // server accepts ocpp1.6 subprotocol
      strictMode: true, // enable strict validation of requests & responses
    });

    this.server.auth(async (accept, reject, handshake) => {
      // accept the incoming client
      const response = await this.prisma.authorizeChargePoint(
        handshake.identity,
      );

      console.log(response);

      if (!response) {
        reject(401, 'reject');
        return;
      }

      accept({
        // anything passed to accept() will be attached as a 'session' property of the client.
        identity: response.chargePointModel,
        sessionId: 'XYZ123',
      });
    });

    this.server.on('client', async (client) => {
      console.log(`${client.session.sessionId} connected!`); // `XYZ123 connected!`

      // create a specific handler for handling BootNotification requests
      client.handle('BootNotification', ({ params }) => {
        console.log(
          `Server got BootNotification from ${client.identity}:`,
          params,
        );

        // respond to accept the client
        return {
          status: 'Accepted',
          interval: 300,
          currentTime: new Date().toISOString(),
        };
      });

      // create a specific handler for handling Heartbeat requests
      client.handle('Heartbeat', ({ params }) => {
        console.log(`Server got Heartbeat from ${client.identity}:`);

        // respond with the server's current time.
        return {
          currentTime: new Date().toISOString(),
        };
      });

      // create a specific handler for handling StatusNotification requests
      client.handle('StatusNotification', ({ params }) => {
        console.log(
          `Server got StatusNotification from ${client.identity}:`,
          params,
        );
        return {};
      });

      // create a wildcard handler to handle any RPC method
      client.handle(({ method, params }) => {
        // This handler will be called if the incoming method cannot be handled elsewhere.
        console.log(`Server got ${method} from ${client.identity}:`, params);

        // throw an RPC error to inform the server that we don't understand the request.
        throw createRPCError('NotImplemented');
      });
    });

    this.server
      .listen(9000)
      .then(() => {
        console.log('Server listening on port 9000');
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
