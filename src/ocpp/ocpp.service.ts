import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RPCServer, createRPCError, RPCClient } from 'ocpp-rpc';
import { PrismaService } from 'src/prisma/prisma.service';
import Redis from 'ioredis';
import { identity } from 'rxjs';

interface ConnectedClient {
  client: RPCClient;
  lastSeen: Date;
  status: string;
}

@Injectable()
export class OcppService implements OnModuleInit, OnModuleDestroy {
  private server: RPCServer;
  private clients: Map<string, ConnectedClient>;
  private redis: Redis;
  private readonly REDIS_CLIENT_PREFIX = 'ocpp:client:';
  private readonly useRedis: boolean = true;

  constructor(private readonly prisma: PrismaService) {
    // Initialize local Map for client storage
    this.clients = new Map<string, ConnectedClient>();

    // Initialize Redis if enabled
    if (this.useRedis) {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      });
    }

    this.server = new RPCServer({
      protocols: ['ocpp1.6'],
      strictMode: true,
    });

    this.setupServerHandlers();
  }

  async onModuleInit() {
    try {
      await this.server.listen(9000);
      console.log('OCPP Server listening on port 9000');
    } catch (err) {
      console.error('Failed to start OCPP server:', err);
    }
  }

  async onModuleDestroy() {
    if (this.useRedis) {
      await this.redis.quit();
    }
  }

  private setupServerHandlers() {
    this.server.auth(async (accept, reject, handshake) => {
      try {
        // Store client information
        const clientId = handshake.identity;
        const sessionId = `session_${Date.now()}_${clientId}`;
        accept({
          sessionId: sessionId,
        });
      } catch (error) {
        console.error('Auth error:', error);
        reject(401, 'Unauthorized');
      }
    });

    this.server.on('client', async (client) => {
      console.log(
        `Client ${client.identity} connected with session ${client.session.sessionId}`,
      );

      // Store client information
      await this.addClient(client.identity, client);

      // Setup disconnect handler
      client.on('disconnect', async () => {
        console.log(`Client ${client.identity} disconnected`);
        await this.removeClient(client.identity);
      });

      this.setupClientHandlers(client);
    });
  }

  private async addClient(clientId: string, client: RPCClient): Promise<void> {
    const clientInfo: ConnectedClient = {
      client,
      lastSeen: new Date(),
      status: 'Available',
    };

    if (this.useRedis) {
      await this.redis.set(
        this.REDIS_CLIENT_PREFIX + clientId,
        JSON.stringify({
          identity: client.identity,
          lastSeen: clientInfo.lastSeen,
          status: clientInfo.status,
        }),
      );
    } else {
      this.clients.set(clientId, clientInfo);
    }
  }

  private async removeClient(clientId: string): Promise<void> {
    if (this.useRedis) {
      await this.redis.del(this.REDIS_CLIENT_PREFIX + clientId);
    } else {
      this.clients.delete(clientId);
    }
  }

  private async updateClientStatus(
    clientId: string,
    status: string,
  ): Promise<void> {
    if (this.useRedis) {
      const clientData = await this.redis.get(
        this.REDIS_CLIENT_PREFIX + clientId,
      );
      if (clientData) {
        const parsedData = JSON.parse(clientData);
        parsedData.status = status;
        parsedData.lastSeen = new Date();
        await this.redis.set(
          this.REDIS_CLIENT_PREFIX + clientId,
          JSON.stringify(parsedData),
        );
      }
    } else {
      const client = this.clients.get(clientId);
      if (client) {
        client.status = status;
        client.lastSeen = new Date();
      }
    }
  }

  async getClient(clientId: string): Promise<RPCClient | null> {
    if (this.useRedis) {
      const clientData = await this.redis.get(
        this.REDIS_CLIENT_PREFIX + clientId,
      );
      if (!clientData) return null;

      const connectedClient = this.findClientBySessionId(
        JSON.parse(clientData).sessionId,
      );
      return connectedClient?.client || null;
    } else {
      return this.clients.get(clientId)?.client || null;
    }
  }

  private findClientBySessionId(sessionId: string): ConnectedClient | null {
    for (const [_, client] of this.clients) {
      if (client.client.identity === sessionId) {
        return client;
      }
    }
    return null;
  }

  async getAllClients(): Promise<string[]> {
    if (this.useRedis) {
      const keys = await this.redis.keys(this.REDIS_CLIENT_PREFIX + '*');
      return keys.map((key) => key.replace(this.REDIS_CLIENT_PREFIX, ''));
    } else {
      return Array.from(this.clients.keys());
    }
  }

  private setupClientHandlers(client: RPCClient) {
    // Core Profile
    client.handle('Authorize', async ({ params }) => {
      console.log(`Server got Authorize from ${client.identity}:`, params);
      return {
        idTagInfo: {
          status: 'Accepted',
          expiryDate: new Date(Date.now() + 86400000).toISOString(), // 24h from now
          parentIdTag: null,
        },
      };
    });

    client.handle('BootNotification', async ({ params }) => {
      console.log(
        `Server got BootNotification from ${client.identity}:`,
        params,
      );
      return {
        status: 'Accepted',
        interval: 300,
        currentTime: new Date().toISOString(),
      };
    });

    client.handle('DataTransfer', async ({ params }) => {
      console.log(`Server got DataTransfer from ${client.identity}:`, params);
      return {
        status: 'Accepted',
        data: null,
      };
    });

    client.handle('Heartbeat', async ({ params }) => {
      console.log(`Server got Heartbeat from ${client.identity}:`);
      return {
        currentTime: new Date().toISOString(),
      };
    });

    client.handle('MeterValues', async ({ params }) => {
      console.log(`Server got MeterValues from ${client.identity}:`, params);
      return {};
    });

    client.handle('StartTransaction', async ({ params }) => {
      console.log(
        `Server got StartTransaction from ${client.identity}:`,
        params,
      );
      return {
        idTagInfo: {
          status: 'Accepted',
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
          parentIdTag: null,
        },
        transactionId: Math.floor(Math.random() * 1000000),
      };
    });

    client.handle('StatusNotification', async ({ params }) => {
      console.log(
        `Server got StatusNotification from ${client.identity}:`,
        params,
      );
      return {};
    });

    client.handle('StopTransaction', async ({ params }) => {
      console.log(
        `Server got StopTransaction from ${client.identity}:`,
        params,
      );
      return {
        idTagInfo: {
          status: 'Accepted',
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
          parentIdTag: null,
        },
      };
    });

    // Firmware Management Profile
    client.handle('DiagnosticsStatusNotification', async ({ params }) => {
      console.log(
        `Server got DiagnosticsStatusNotification from ${client.identity}:`,
        params,
      );
      return {};
    });

    client.handle('FirmwareStatusNotification', async ({ params }) => {
      console.log(
        `Server got FirmwareStatusNotification from ${client.identity}:`,
        params,
      );
      return {};
    });

    // Local Auth List Management Profile
    client.handle('GetLocalListVersion', async ({ params }) => {
      console.log(
        `Server got GetLocalListVersion from ${client.identity}:`,
        params,
      );
      return {
        listVersion: 0,
      };
    });

    // Reservation Profile
    client.handle('ReserveNow', async ({ params }) => {
      console.log(`Server got ReserveNow from ${client.identity}:`, params);
      return {
        status: 'Accepted',
      };
    });

    client.handle('CancelReservation', async ({ params }) => {
      console.log(
        `Server got CancelReservation from ${client.identity}:`,
        params,
      );
      return {
        status: 'Accepted',
      };
    });

    // Smart Charging Profile
    client.handle('SetChargingProfile', async ({ params }) => {
      console.log(
        `Server got SetChargingProfile from ${client.identity}:`,
        params,
      );
      return {
        status: 'Accepted',
      };
    });

    client.handle('ClearChargingProfile', async ({ params }) => {
      console.log(
        `Server got ClearChargingProfile from ${client.identity}:`,
        params,
      );
      return {
        status: 'Accepted',
      };
    });

    client.handle('GetCompositeSchedule', async ({ params }) => {
      console.log(
        `Server got GetCompositeSchedule from ${client.identity}:`,
        params,
      );
      return {
        status: 'Accepted',
        connectorId: params.connectorId,
        scheduleStart: new Date().toISOString(),
        chargingSchedule: {
          duration: 86400,
          startSchedule: new Date().toISOString(),
          chargingRateUnit: 'A',
          chargingSchedulePeriod: [
            {
              startPeriod: 0,
              limit: 32.0,
              numberPhases: 3,
            },
          ],
        },
      };
    });

    // Remote Trigger Profile
    client.handle('TriggerMessage', async ({ params }) => {
      console.log(`Server got TriggerMessage from ${client.identity}:`, params);
      return {
        status: 'Accepted',
      };
    });
  }

  // Remote control methods
  async sendRemoteStartTransaction(
    chargePointId: string,
    idTag: string,
  ): Promise<any> {
    const client = await this.getClient(chargePointId);
    if (!client) {
      throw new Error('Charge point not connected');
    }

    try {
      const response = await client.call('RemoteStartTransaction', {
        idTag,
        connectorId: 1,
      });
      return response;
    } catch (error) {
      console.error('Remote start transaction failed:', error);
      throw error;
    }
  }

  async sendRemoteStopTransaction(
    chargePointId: string,
    transactionId: number,
  ): Promise<any> {
    const client = await this.getClient(chargePointId);
    if (!client) {
      throw new Error('Charge point not connected');
    }

    try {
      const response = await client.call('RemoteStopTransaction', {
        transactionId,
      });
      return response;
    } catch (error) {
      console.error('Remote stop transaction failed:', error);
      throw error;
    }
  }

  async resetChargePoint(
    chargePointId: string,
    type: 'Hard' | 'Soft',
  ): Promise<any> {
    const client = await this.getClient(chargePointId);
    if (!client) {
      throw new Error('Charge point not connected');
    }

    try {
      const response = await client.call('Reset', { type });
      return response;
    } catch (error) {
      console.error('Reset charge point failed:', error);
      throw error;
    }
  }

  async unlockConnector(
    chargePointId: string,
    connectorId: number,
  ): Promise<any> {
    const client = await this.getClient(chargePointId);
    if (!client) {
      throw new Error('Charge point not connected');
    }

    try {
      const response = await client.call('UnlockConnector', { connectorId });
      return response;
    } catch (error) {
      console.error('Unlock connector failed:', error);
      throw error;
    }
  }

  // Client management methods
  async getClientStatus(chargePointId: string): Promise<string | null> {
    if (this.useRedis) {
      const clientData = await this.redis.get(
        this.REDIS_CLIENT_PREFIX + chargePointId,
      );
      return clientData ? JSON.parse(clientData).status : null;
    } else {
      return this.clients.get(chargePointId)?.status || null;
    }
  }

  async getConnectedClientCount(): Promise<number> {
    if (this.useRedis) {
      const keys = await this.redis.keys(this.REDIS_CLIENT_PREFIX + '*');
      return keys.length;
    } else {
      return this.clients.size;
    }
  }
}
