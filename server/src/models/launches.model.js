const axios = require('axios');
const launchesDb = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

async function populateLaunches() {
  console.log('Downloading launch data...');

  const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1,
          },
        },
        {
          path: 'payloads',
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log('Problem downloading laucnhes data.');
    throw new Error('Launches data download failed.');
  }

  // `data` - axios puts response body into `data`
  // `docs` - is coming from API
  const launchDocs = response.data.docs; //
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc.payloads;
    const customers = payloads.flatMap((payload) => {
      return payload.customers;
    });

    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name,
      rocket: launchDoc.rocket.name,
      launchDate: launchDoc.date_local,
      upcoming: launchDoc.upcoming,
      success: launchDoc.success,
      customers,
    };

    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  });

  if (firstLaunch) {
    console.log('Launches data already loaded.');
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDb.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDb.findOne().sort('-flightNumber'); // sort in desc order

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDb
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({ keplerName: launch.target });

  if (!planet) {
    throw new Error('No matching planet find.');
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;

  // Object.assign mutates the target object
  // no need to assign a new object to a result of Object.assign
  Object.assign(launch, {
    flightNumber: newFlightNumber,
    customers: ['Zero to Mastery', 'NASA'],
    upcoming: true,
    success: true,
  });

  await saveLaunch(launch);
}

async function abortLaunchById(launchId) {
  const aborted = await launchesDb.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    },
  );

  return aborted.modifiedCount === 1;
}

async function saveLaunch(launch) {
  await launchesDb.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    },
  );
}

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
