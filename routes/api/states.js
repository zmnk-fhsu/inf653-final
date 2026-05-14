import express from 'express';
import statesController from '../../controllers/statesController.js';

const {
  getAllStates,
  getState,
  getStateProperty,
  getRandomFunFact,
  createFunFacts,
  updateFunFact,
  deleteFunFact
} = statesController;

const router = express.Router();

router.get('/', getAllStates);

router.get('/:state/capital', getStateProperty);
router.get('/:state/nickname', getStateProperty);
router.get('/:state/population', getStateProperty);
router.get('/:state/admission', getStateProperty);

router.route('/:state/funfact')
  .get(getRandomFunFact)
  .post(createFunFacts)
  .patch(updateFunFact)
  .delete(deleteFunFact);

router.get('/:state', getState);

export default router;
