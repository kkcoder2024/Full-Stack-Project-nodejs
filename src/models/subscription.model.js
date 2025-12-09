import mongoose, { Schema } from "mongoose";
const subscriotionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //subscriber
      ref: "User",
    },

    channel: {
      type: Schema.Types.ObjectId, //account owner
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscriotionSchema);
