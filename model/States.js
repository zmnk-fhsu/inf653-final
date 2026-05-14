import mongoose from 'mongoose';
const { Schema } = mongoose;

const stateSchema = new Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true
  },
  funfacts: [String]
});

export default mongoose.model('State', stateSchema);
