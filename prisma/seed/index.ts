import { PrismaClient } from '@prisma/client';
import axios from 'axios';
const prisma = new PrismaClient();
// Sample location creation data
export const locationDummyData = [
  {
    name: 'Downtown EV Hub',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    zipCode: '94105',
    latitude: 37.7858,
    longitude: -122.3968,
    status: 'ACTIVE',
    organizationId: 'your-org-id-1',
    projectId: 'your-project-id-1',
  },
  {
    name: 'Westfield Charging Station',
    address: '845 Market Street',
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    zipCode: '94103',
    latitude: 37.7841,
    longitude: -122.4063,
    status: 'ACTIVE',
    organizationId: 'your-org-id-1',
    projectId: 'your-project-id-1',
  },
  {
    name: 'Silicon Valley Tech Park',
    address: '2550 North First Street',
    city: 'San Jose',
    state: 'California',
    country: 'USA',
    zipCode: '95131',
    latitude: 37.3801,
    longitude: -121.9293,
    status: 'ACTIVE',
    organizationId: 'your-org-id-2',
    projectId: 'your-project-id-2',
  },
  {
    name: 'East Bay Shopping Center',
    address: '5800 Shellmound Street',
    city: 'Emeryville',
    state: 'California',
    country: 'USA',
    zipCode: '94608',
    latitude: 37.8324,
    longitude: -122.2933,
    status: 'ACTIVE',
    organizationId: 'your-org-id-2',
    projectId: 'your-project-id-2',
  },
  {
    name: 'Marina District Station',
    address: '2055 Lombard Street',
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    zipCode: '94123',
    latitude: 37.8002,
    longitude: -122.4369,
    status: 'MAINTENANCE',
    organizationId: 'your-org-id-1',
    projectId: 'your-project-id-3',
  },
];
// Using axios or your preferred HTTP client
async function createLocations() {
  for (const location of locationDummyData) {
    try {
      const response = await axios.post(
        'http://localhost:3001/locations',
        location,
      );
      console.log(`Created location: ${response.data.name}`);
    } catch (error) {
      console.error(
        `Failed to create location ${location.name}:`,
        error.message,
      );
    }
  }
}

async function main() {
  // const connector1 = await prisma.connector.create({
  //   data: {
  //     connectorId: '1',
  //     name: 'Connector 1',
  //   },
  // });
  // const connector2 = await prisma.connector.create({
  //   data: {
  //     connectorId: '2',
  //     name: 'Connector 2',
  //   },
  // });
  // const user = await prisma.user.create({
  //   data: {
  //     name: 'sonu',
  //   },
  // });
  // const station = await prisma.station.create({
  //   data: {
  //     stationName: 'Station 1',
  //     userUid: user.uid,
  //   },
  // });
  // const chargePoint = await prisma.chargePoint.create({
  //   data: {
  //     id: 'EVB-P20261797',
  //     chargePointModel: 'Nissan Leaf',
  //     chargePointVendor: 'Nissan',
  //     chargeBoxSerialNumber: '',
  //     firmwareVersion: '1.2.3',
  //     iccid: '',
  //     imsi: '',
  //     meterType: '',
  //     meterSerialNumber: '',
  //     stationId: station.id,
  //   },
  //   select: {
  //     connectors: true,
  //   },
  // });

  console.log({ test: 'test' });
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
