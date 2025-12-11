import mongoose from "mongoose";
const subscriotionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, //subscriber
      ref: "User",
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId, //account owner
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscriotionSchema);
