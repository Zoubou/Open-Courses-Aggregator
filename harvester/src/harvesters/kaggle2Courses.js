import {
  fullImportKaggle2CsvDataset,
  partialUpdateKaggle2CsvDataset,
} from "./connectors/kaggle2CsvDataset.js";

export async function fullImportKaggle2Courses() {
  return fullImportKaggle2CsvDataset();
}

export async function partialUpdateKaggle2Courses() {
  return partialUpdateKaggle2CsvDataset();
}
