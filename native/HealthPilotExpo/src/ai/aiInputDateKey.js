import { resolveLocalDateKey } from "../storage/dailyRecordModel.js";

export function resolveAiInputDateKey(now = new Date()) {
  return resolveLocalDateKey(now);
}
