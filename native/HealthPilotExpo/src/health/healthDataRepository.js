import { healthDataSource } from "./healthDataSource";

export async function loadHealthData() {
  return healthDataSource.load();
}