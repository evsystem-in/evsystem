import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const connector1 = await prisma.connector.create({
    data: {
      connectorId: '1',
      name: 'Connector 1',
    },
  });
  const connector2 = await prisma.connector.create({
    data: {
      connectorId: '2',
      name: 'Connector 2',
    },
  });
  const user = await prisma.user.create({
    data: {
      name: 'sonu',
    },
  });
  const station = await prisma.station.create({
    data: {
      stationName: 'Station 1',
      userUid: user.uid,
    },
  });
  const chargePoint = await prisma.chargePoint.create({
    data: {
      id: 'EVB-P20261797',
      chargePointModel: 'Nissan Leaf',
      chargePointVendor: 'Nissan',
      chargeBoxSerialNumber: '',
      firmwareVersion: '1.2.3',
      iccid: '',
      imsi: '',
      meterType: '',
      meterSerialNumber: '',
      stationId: station.id,
    },
    select: {
      connectors: true,
    },
  });

  console.log({ chargePoint });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
