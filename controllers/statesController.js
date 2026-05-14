import State from '../model/States.js';
import statesData from '../statesData.json' with { type: 'json' };
import asyncHandler from '../middleware/asyncHandler.js';

const CONTIG_FILTERS = {
  'true':  (st) => !['AK', 'HI'].includes(st.code),
  'false': (st) => ['AK', 'HI'].includes(st.code),
  'all':   () => true
};

// Merges static JSON data with MongoDB documents.
const mergeState = (jsonState, mongoDocs) => {
  const mongoMatch = mongoDocs.find(ms => ms.stateCode === jsonState.code);
  return mongoMatch ? { ...jsonState, funfacts: mongoMatch.funfacts } : jsonState;
};

// Generic GET controller for certain state properties.
const getStateProperty = asyncHandler(async (req, res) => {
  const stateCode = req.params.state?.toUpperCase();
  const state = statesData.find(st => st.code === stateCode);

  if (!state) {
    return res.status(400).json({ "message": "Invalid state abbreviation parameter" });
  }

  const path = req.path.split('/').pop().toLowerCase();
  const map = {
    'capital':    { jsonKey: 'capital_city',   resKey: 'capital' },
    'nickname':   { jsonKey: 'nickname',       resKey: 'nickname' },
    'population': { jsonKey: 'population',     resKey: 'population' },
    'admission':  { jsonKey: 'admission_date', resKey: 'admitted' },
  };
  const target = map[path];

  if (path === 'population') {
    return res.status(200).json({
      "state": state.state,
      "population": state.population.toLocaleString()
    });
  }

  res.status(200).json({
    "state": state.state,
    [target.resKey]: state[target.jsonKey]
  });
});

// GET /states/
const getAllStates = asyncHandler(async (req, res) => {
  const { contig } = req.query;
  const filterFn = CONTIG_FILTERS[contig] || CONTIG_FILTERS.all;

  const mongoStates = await State.find().lean();
  const result = statesData
    .filter(filterFn)
    .map(state => mergeState(state, mongoStates));

  res.status(200).json(result);
});

// GET /states/:state
const getState = asyncHandler(async (req, res) => {
  const stateCode = req.params.state?.toUpperCase();
  const jsonState = statesData.find(st => st.code === stateCode);

  if (!jsonState) {
    return res.status(400).json({ message: "Invalid state abbreviation parameter" });
  }

  const mongoState = await State.findOne({ stateCode }).lean();
  res.status(200).json(mergeState(jsonState, mongoState ? [mongoState] : []));
});

// GET /states/:state/funfact
const getRandomFunFact = asyncHandler(async (req, res) => {
  const stateCode = req.params.state?.toUpperCase();
  const jsonState = statesData.find(st => st.code === stateCode);

  if (!jsonState) {
    return res.status(400).json({ message: "Invalid state abbreviation parameter" });
  }

  const mongoState = await State.findOne({ stateCode }).lean();
  if (!mongoState || !mongoState.funfacts || mongoState.funfacts.length === 0) {
    return res.status(404).json({ message: `No Fun Facts found for ${jsonState.state}` });
  }

  const randomFact = mongoState.funfacts[Math.floor(Math.random() * mongoState.funfacts.length)];
  res.status(200).json({ "funfact": randomFact });
});

// POST /states/:state/funfact
const createFunFacts = asyncHandler(async (req, res) => {
  const stateCode = req.params.state?.toUpperCase();
  const { funfacts } = req.body;

  if (!funfacts) {
    return res.status(400).json({ "message": "State fun facts value required" })
  }
  if (!Array.isArray(funfacts)) {
    return res.status(400).json({ "message": "State fun facts value must be an array" });
  }

  const result = await State.findOneAndUpdate(
    { stateCode },
    { $push: { funfacts: { $each: funfacts }}},
    { upsert: true, new: true }
  );

  res.status(201).json(result);
});

// PATCH /states/:state/funfact
const updateFunFact = asyncHandler(async (req, res) => {
  const stateCode = req.params.state?.toUpperCase();
  const { index, funfact } = req.body;

  if (!index) {
    return res.status(400).json({ "message": "State fun fact index value required" });
  }
  if (!funfact) {
    return res.status(400).json({ "message": "State fun fact value required" });
  }

  const state = await State.findOne({ stateCode });
  const jsonState = statesData.find(st => st.code === stateCode);

  if (!state || !state.funfacts || state.funfacts.length === 0) {
    return res.status(404).json({ "message": `No Fun Facts found for ${jsonState.state}` });
  }
  if (!state.funfacts[index - 1]) {
    return res.status(404).json({ "message": `No Fun Fact found at that index for ${jsonState.state}`});
  }

  state.funfacts.splice(index - 1, 1, funfact);
  const result = await state.save();
  res.status(200).json(result);
});

// DELETE /states/:state/funfact
const deleteFunFact = asyncHandler(async (req, res) => {
  const stateCode = req.params.state?.toUpperCase();
  const { index } = req.body;

  if (!index) {
    return res.status(400).json({ "message": "State fun fact index value required" });
  }

  const state = await State.findOne({ stateCode });
  const jsonState = statesData.find(st => st.code === stateCode);

  if (!state || !state.funfacts || state.funfacts.length === 0) {
    return res.status(404).json({ "message": `No Fun Facts found for ${jsonState.state}` });
  }
  if (!state.funfacts[index - 1]) {
    return res.status(404).json({ "message": `No Fun Fact found at that index for ${jsonState.state}` });
  }

  state.funfacts.splice(index - 1, 1);
  const result = await state.save();
  res.status(200).json(result);
})

export default {
  getAllStates,
  getState,
  getStateProperty,
  getRandomFunFact,
  createFunFacts,
  updateFunFact,
  deleteFunFact
};
