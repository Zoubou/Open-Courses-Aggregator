import {
  fullImportKaggleCombinedDataset,
  partialUpdateKaggleCombinedDataset,
} from "./connectors/kaggleCombinedDataset.js";

export async function fullImportKaggleCourses() {
  return fullImportKaggleCombinedDataset();
}

export async function partialUpdateKaggleCourses() {
  return partialUpdateKaggleCombinedDataset();
}

