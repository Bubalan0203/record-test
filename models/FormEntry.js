// models/FormEntry.js
import mongoose from "mongoose";

const formEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", unique: true, required: true }, // now holds User.uid (string)
    profilePic: { type: String, default: "" },
    step1: { type: Object, default: {} },
    step2: { type: Object, default: {} },
    step3: { type: Object, default: {} },
    step4: { type: Object, default: {} },
    step5: { type: Object, default: {} },
    step6: { type: Object, default: {} },
    step7: { type: Object, default: {} },
    step8: { type: Object, default: {} },
    isSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("FormEntry", formEntrySchema);
