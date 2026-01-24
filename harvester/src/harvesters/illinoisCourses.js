import {
  fullImportIllinoisCsvDataset,
  partialUpdateIllinoisCsvDataset,
} from "./connectors/IllinoisDataset.js";

export async function fullImportIllinoisCourses() {
  return fullImportIllinoisCsvDataset();
}

export async function partialUpdateIllinoisCourses() {
  return partialUpdateIllinoisCsvDataset();
}
